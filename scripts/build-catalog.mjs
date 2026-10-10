import { lstat, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inspectFeaturePack, validateRecord } from './feature-pack.mjs'
import { buildSkinPromptCatalog, collectSkinPromptPackages } from './skin-prompt-package.mjs'
import { inspectPreviewImages, publishPreviewImages } from './preview-images.mjs'
import { collectPluginListings, pluginFilename } from './plugin-listing.mjs'
import { publishPluginIndex } from './plugin-index.mjs'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export async function buildCatalog(root = rootDir, { checkOnly = false, demo = false } = {}) {
  const skinSource = await collectSkinPromptPackages(root)
  const pluginListings = await collectPluginListings(root)
  let upstreamComponents = []
  try { upstreamComponents = JSON.parse(await readFile(join(root, 'authoring/upstream-snapshot.json'), 'utf8')).components }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  const recordsDir = join(root, 'catalog/feature-packs')
  const entries = (await readdir(recordsDir)).filter(name => name.endsWith('.json')).sort()
  const admitted = []
  const ids = new Set()
  for (const entry of entries) {
    const record = JSON.parse(await readFile(join(recordsDir, entry), 'utf8'))
    validateRecord(record)
    if (entry !== `${record.id}.json`) throw new Error(`Record filename must equal id: ${entry}`)
    if (ids.has(record.id)) throw new Error(`Duplicate pack id: ${record.id}`)
    ids.add(record.id)
    const filename = `${record.id}-${record.version}.dshpack`
    const stat = await lstat(join(root, 'artifacts', filename))
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 2 * 1024 * 1024) throw new Error(`Archive must be a regular file of at most 2 MiB: ${filename}`)
    const bytes = await readFile(join(root, 'artifacts', filename))
    const report = await inspectFeaturePack(bytes, record.sha256)
    const m = report.manifest
    if (m.id !== record.id || m.version !== record.version) throw new Error(`Archive identity mismatch: ${record.id}`)
    if ((m.author && m.author !== record.author) || (m.license && m.license !== record.license)) throw new Error(`Author/license mismatch: ${record.id}`)
    const previewImages = await inspectPreviewImages(root, record.id, record.previews ?? record.appearance?.previews ?? [])
    // Check even superseded legacy previews rather than ignoring invalid author input.
    if (record.previews && record.appearance?.previews) await inspectPreviewImages(root, record.id, record.appearance.previews)
    admitted.push({ record, report, bytes, filename, previewImages })
  }
  if (checkOnly) return { checked: admitted.length }
  // Validate the entire intake before replacing any generated output.
  const output = join(root, 'site/public/generated')
  await rm(output, { recursive: true, force: true })
  await mkdir(join(output, 'downloads'), { recursive: true })
  await mkdir(join(output, 'reports'), { recursive: true })
  await mkdir(join(output, 'packs'), { recursive: true })
  const skinCatalog = await buildSkinPromptCatalog(root, output)
  const plugins = []
  for (const { record, bytes, report } of pluginListings) {
    const listingUrl = `generated/plugins/${record.id}.json`
    await mkdir(join(output, 'plugins'), { recursive: true })
    await writeFile(join(output, 'plugins', `${record.id}.json`), JSON.stringify(record, null, 2) + '\n')
    if (bytes) await writeFile(join(output, 'downloads', pluginFilename(record)), bytes)
    plugins.push({ ...record, maintainedBy: record.maintainedBy || 'registry-maintained', listingUrl,
      runtime: 'not-tested', checks: bytes ? 'artifact-checked' : 'metadata-only',
      ...(bytes ? { archiveUrl: `generated/downloads/${pluginFilename(record)}`, reportUrl: `generated/reports/${record.id}.plugin.json`, packageMetadata: report.packageMetadata } : {}) })
    if (report) await writeFile(join(output, 'reports', `${record.id}.plugin.json`), JSON.stringify(report, null, 2) + '\n')
  }
  const packs = []
  for (const { record, report, bytes, filename, previewImages } of admitted) {
    const m = report.manifest
    const packUrl = `generated/packs/${record.id}.json`
    const reportUrl = `generated/reports/${record.id}.json`
    const repositories = [...new Set(m.plugins.map(component => component.ref.startsWith('github:') ? `https://github.com/${component.ref.slice(7)}` : upstreamComponents.find(item => item.package?.name === component.ref)?.repository).filter(Boolean))]
    const previews = await publishPreviewImages(previewImages, output)
    await writeFile(join(output, 'downloads', filename), bytes)
    await writeFile(join(output, 'packs', `${record.id}.json`), JSON.stringify(m, null, 2) + '\n')
    await writeFile(join(output, 'reports', `${record.id}.json`), JSON.stringify(report, null, 2) + '\n')
    packs.push({ format: record.format, metadata: { id: m.id, version: m.version, name: m.name, description: m.description || '', category: record.category,
      ...(record.tags ? { tags: record.tags } : {}), ...(record.introduction ? { introduction: record.introduction } : {}) },
      author: record.author, license: record.license, source: record.source, requires: m.requires || {},
      components: m.plugins, appearance: record.appearance, ...previews,
      links: [...(record.links || []), ...repositories.filter(url => !record.links?.some(link => link.url === url)).map(url => ({ label: `原项目 · ${url.split('/').pop()}`, url }))], archiveUrl: `generated/downloads/${filename}`, archiveSize: report.size,
      archiveDigest: `sha256:${report.sha256}`, packUrl, reportUrl, checks: report.checks, versionDeclarations: report.versionDeclarations, warnings: report.warnings, runtime: report.runtime })
  }
  const catalog = { apiVersion: 'catalog.mojobox.dev/v1alpha1', mode: 'intake', demo, plugins, skills: [], packs, skinPackages: skinCatalog.packages, skinSource: skinSource.source || null }
  await publishPluginIndex(output, pluginListings, { demo })
  await writeFile(join(output, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n')
  console.log(`Validated and collected ${packs.length} developer archives.`)
  return catalog
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length > 3 || (process.argv[2] && process.argv[2] !== '--check')) throw new Error('Usage: node scripts/build-catalog.mjs [--check]')
  console.log(await buildCatalog(rootDir, { checkOnly: process.argv[2] === '--check' }))
}
