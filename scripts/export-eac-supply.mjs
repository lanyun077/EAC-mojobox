import { execFile } from 'node:child_process'
import { lstat, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { buildCatalog } from './build-catalog.mjs'
import { collectSkinPromptPackages } from './skin-prompt-package.mjs'
import { digest, inspectFeaturePack, validateRecord } from './feature-pack.mjs'
import { assertHttps, inspectPreviewImages } from './preview-images.mjs'
import { jsonBytes, mergeSupplyHistory, validateReceipt } from './eac-supply.mjs'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const run = promisify(execFile)
const load = async path => JSON.parse(await readFile(path, 'utf8'))

export async function committedSource(root) {
  const status = await run('git', ['status', '--porcelain', '--untracked-files=normal'], { cwd: root })
  if (status.stdout.trim()) throw new Error('Formal export requires a clean committed worktree; use --draft for local review')
  return (await run('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout.trim()
}

function baseUrl(value) {
  assertHttps(value, 'Supply base URL')
  const url = new URL(value)
  if (url.hash || url.search || !url.pathname.endsWith('/')) throw new Error('Supply base URL requires trailing slash, no query or fragment')
  return url
}

const source = (url, revision) => ({ url, commit: /^[0-9a-f]{40}$/.test(revision || '') ? revision : null,
  ...(revision && !/^[0-9a-f]{40}$/.test(revision) ? { reference: revision } : {}) })

export async function collectSupply(root, { publicUrl, sequence, pilot = false }) {
  const publicBase = baseUrl(publicUrl)
  // Reuse intake checks without replacing website output or executing plugins.
  await buildCatalog(root, { checkOnly: true })
  const files = new Map()
  const items = []
  const warnings = []
  const policy = await load(join(root, 'distribution.json'))
  if (!Array.isArray(policy.packCategories)) throw new Error('Invalid public distribution policy')
  const selection = await load(join(root, 'policies/eac-supply-selection.json'))
  if (!selection || Object.keys(selection).sort().join(',') !== 'materialVersions,plugins' || !Array.isArray(selection.plugins) ||
      !selection.materialVersions || typeof selection.materialVersions !== 'object' || Array.isArray(selection.materialVersions)) throw new Error('Invalid EAC supply selection')
  const selected = new Set()
  for (const entry of selection.plugins) {
    if (!entry || Object.keys(entry).sort().join(',') !== 'id,type' || !/^[a-z0-9][a-z0-9._-]{2,63}$/.test(entry.id) ||
        !['plugin', 'skin'].includes(entry.type) || selected.has(entry.id)) throw new Error('Invalid or duplicate selected plugin')
    selected.add(entry.id)
    const record = await load(join(root, 'catalog/plugins', `${entry.id}.json`))
    if (record.id !== entry.id || !record.source?.repository) throw new Error('Selected plugin identity/source mismatch')
    items.push({ type: entry.type, packageName: record.name, version: record.version, name: record.name,
      summary: record.description || record.name, source: source(record.source.repository, record.source.revision),
      status: 'active', runtime: 'not-tested', requiresDsh: null, compatibilityBasis: 'unknown',
      ...(record.license ? { license: record.license } : {}),
      ...(entry.type === 'skin' ? { appearance: { loadingMode: 'unknown', skinIds: [], skinIdsKnown: false, conflicts: [], conflictsKnown: false, previews: [] } } : {}) })
    warnings.push({ packageName: record.name, reason: 'Source listing only: artifact size, package bytes, compatibility and authorization have not been checked by this exporter.' })
  }
  const skins = await collectSkinPromptPackages(root)
  for (const id of Object.keys(selection.materialVersions)) {
    if (!skins.packages.some(item => item.manifest.id === id)) throw new Error(`Material version references unknown package: ${id}`)
  }
  for (const { manifest, source: origin } of skins.packages) {
    if (pilot && manifest.id !== 'blue-fantasy') continue
    items.push({ type: 'material', packageName: `dev.dsh-eac.skin-prompt.${manifest.id}`,
      version: selection.materialVersions[manifest.id], name: manifest.name, summary: manifest.description || manifest.name,
      source: source(`${origin.repository}/tree/${origin.revision}/${origin.path}`, origin.revision),
      status: 'active', runtime: 'not-tested', installable: false })
  }
  if (!pilot) {
    for (const name of (await readdir(join(root, 'catalog/feature-packs'))).filter(name => name.endsWith('.json')).sort()) {
      const record = await load(join(root, 'catalog/feature-packs', name))
      validateRecord(record)
      if (record.category === 'workflow' || !policy.packCategories.includes(record.category)) {
        warnings.push({ packageName: record.id, reason: `Category excluded by supply mapping/public distribution policy: ${record.category}` })
        continue
      }
      const filename = `${record.id}-${record.version}.dshpack`
      const bytes = await readFile(join(root, 'artifacts', filename))
      const report = await inspectFeaturePack(bytes, record.sha256)
      const manifest = report.manifest
      if (manifest.id !== record.id || manifest.version !== record.version) throw new Error('Supply archive identity mismatch')
      const relative = `batches/${sequence}/downloads/${filename}`
      files.set(relative, bytes)
      const range = manifest.requires?.dsh ?? null
      const item = { type: record.category === 'appearance' ? 'appearance-pack' : 'function-pack',
        packageName: record.id, version: record.version, name: manifest.name, summary: manifest.description || manifest.name,
        source: source(record.source), status: 'active', runtime: 'not-tested', requiresDsh: range,
        compatibilityBasis: range === null ? 'unknown' : 'author-declared',
        ...(range === null ? {} : { compatibilityReference: new URL(relative, publicBase).href }),
        license: record.license,
        artifact: { format: 'eac-feature-pack-v1', downloadUrl: new URL(relative, publicBase).href, sha256: report.sha256, size: report.size },
        components: manifest.plugins.map(component => ({ id: component.ref, ...component })),
        execution: { coverage: 'unknown', edges: [] } }
      if (record.appearance) {
        const inspected = await inspectPreviewImages(root, record.id, record.previews ?? record.appearance.previews ?? [])
        const previews = inspected.map(preview => {
          if (!preview.file) return typeof preview.preview === 'string' ? preview.preview : preview.preview.url
          const path = `batches/${sequence}/${preview.file.url.slice('generated/'.length)}`
          files.set(path, preview.bytes)
          return new URL(path, publicBase).href
        })
        item.appearance = { loadingMode: record.appearance.loader ? 'loader-based' : 'unknown',
          ...(record.appearance.loader ? { loader: record.appearance.loader } : {}),
          skinIds: record.appearance.skinIds || [], skinIdsKnown: Boolean(record.appearance.skinIds?.length),
          conflicts: [...new Set(record.appearance.conflicts || [])], conflictsKnown: false, previews }
      }
      items.push(item)
    }
  }
  return { items, files, warnings }
}

export async function prepareSupply(root, options) {
  const { sequence, revision, generatedAt, publicUrl, sourceCommit, previous, withdrawals = [], pilot = false, draft = false } = options
  const publicBase = baseUrl(publicUrl)
  let old
  let publications = []
  if (previous) {
    const receipt = await load(join(previous, 'supply-receipt.json'))
    old = validateReceipt(receipt, await readFile(join(previous, `batches/${receipt.sequence}/supply.json`)))
    const state = await load(join(previous, 'export-state.json'))
    publications = state.publications
    if (!Array.isArray(publications) || publications.length !== old.sequence || new Set(publications.map(entry => entry.revision)).size !== publications.length || publications.some((entry, index) =>
      entry.sequence !== index + 1 || typeof entry.revision !== 'string' || !/^[0-9a-f]{64}$/.test(entry.sha256)) ||
      publications.at(-1).sha256 !== receipt.sha256 || publications.at(-1).revision !== old.revision) throw new Error('Invalid previous publication history')
  }
  if (!Number.isSafeInteger(sequence) || sequence !== (old?.sequence || 0) + 1 || publications.some(entry => entry.revision === revision)) {
    throw new Error('Expected next sequence and unused revision; supply history is required after sequence 1')
  }
  const collected = await collectSupply(root, { publicUrl, sequence, pilot })
  const document = mergeSupplyHistory({ schemaVersion: 'supply.eac/v1', sourceId: 'dsh-eac.mojobox', sequence, revision, generatedAt,
    items: collected.items }, old, withdrawals)
  const bytes = jsonBytes(document)
  const files = collected.files
  files.set(`batches/${sequence}/supply.json`, bytes)
  const report = { draft, pilot, items: document.items.length, counts: {}, warnings: collected.warnings,
    runtime: 'not-tested', references: 'not-resolved', publicUrl: publicBase.href }
  for (const item of document.items) report.counts[item.type] = (report.counts[item.type] || 0) + 1
  files.set('export-report.json', jsonBytes(report))
  if (!draft) {
    const receipt = { schemaVersion: 'supply-receipt.eac/v1', sourceId: document.sourceId, sequence, revision, sourceCommit,
      catalogUrl: new URL(`batches/${sequence}/supply.json`, publicBase).href, sha256: digest(bytes), size: bytes.length }
    validateReceipt(receipt, bytes)
    files.set('supply-receipt.json', jsonBytes(receipt))
    files.set('export-state.json', jsonBytes({ publications: [...publications, { sequence, revision, sha256: receipt.sha256 }] }))
  }
  return { document, files, report }
}

export async function writeSupply(output, files) {
  for (const relative of files.keys()) {
    if (typeof relative !== 'string' || !/^[A-Za-z0-9._+/-]+$/.test(relative) || relative.startsWith('/') || relative.split('/').some(part => !part || ['.', '..'].includes(part))) {
      throw new Error('Invalid supply output path')
    }
  }
  // A new staging directory is renamed only after every file has been written; never overwrite a batch.
  const staging = `${output}.staging`
  try { await lstat(output); throw new Error('Supply output already exists; use a new output directory') }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  await mkdir(dirname(output), { recursive: true })
  await mkdir(staging)
  try {
    for (const [relative, bytes] of files) {
      const target = join(staging, relative)
      await mkdir(dirname(target), { recursive: true })
      await writeFile(target, bytes, { flag: 'wx' })
    }
    await rename(staging, output)
  } catch (error) {
    await rm(staging, { recursive: true, force: true })
    throw error
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2)
    const options = {}
    for (let i = 0; i < args.length; i++) {
      const name = args[i]
      if (['--draft', '--pilot', '--first-release'].includes(name)) {
        if (options[name]) throw new Error(`Duplicate argument: ${name}`)
        options[name] = true
      } else {
        if (!['--public-url', '--sequence', '--revision', '--generated-at', '--output', '--previous', '--withdrawals'].includes(name) || options[name] !== undefined || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Invalid argument: ${name}`)
        options[name] = args[++i]
      }
    }
    if (!options['--output'] || !options['--public-url'] || !options['--sequence'] || !options['--revision'] || !options['--generated-at']) {
      throw new Error('Usage: npm run export:eac -- --draft --public-url <https-url/> --sequence <n> --revision <id> --generated-at <UTC> --output <new-directory> [--pilot] [--previous <prior-directory>] [--withdrawals <json-file>]')
    }
    const output = resolve(options['--output'])
    if (!output.startsWith(join(rootDir, '.cache') + '\\') && !output.startsWith(join(rootDir, '.cache') + '/')) throw new Error('Supply output must be a new directory inside repository .cache')
    if (options['--previous'] && resolve(options['--previous']) === output) throw new Error('Previous supply must not be overwritten')
    let sourceCommit
    if (!options['--draft']) {
      if (!options['--previous'] && !options['--first-release']) throw new Error('Formal export requires --previous, or explicit --first-release for initial publication')
      if (options['--previous'] && options['--first-release']) throw new Error('--first-release cannot be combined with --previous')
      sourceCommit = await committedSource(rootDir)
    }
    const result = await prepareSupply(rootDir, { publicUrl: options['--public-url'], sequence: Number(options['--sequence']),
      revision: options['--revision'], generatedAt: options['--generated-at'], sourceCommit,
      draft: Boolean(options['--draft']), pilot: Boolean(options['--pilot']), previous: options['--previous'] && resolve(options['--previous']),
      withdrawals: options['--withdrawals'] ? await load(resolve(options['--withdrawals'])) : [] })
    if (!options['--draft'] && await committedSource(rootDir) !== sourceCommit) throw new Error('Source commit changed during export')
    await writeSupply(output, result.files)
    console.log(JSON.stringify({ output, ...result.report }, null, 2))
  } catch (error) { console.error(error.message); process.exitCode = 1 }
}
