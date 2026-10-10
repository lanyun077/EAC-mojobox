import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import yauzl from 'yauzl'
import semver from 'semver'
import { assertHttps } from './preview-images.mjs'

const ajv = new Ajv({ allErrors: true })
addFormats(ajv)
const checkManifest = ajv.compile(JSON.parse(await readFile(new URL('../vendor/eac/feature-pack-pack.schema.json', import.meta.url))))
const checkRecord = ajv.compile(JSON.parse(await readFile(new URL('../schemas/intake.schema.json', import.meta.url))))
const legacyArchives = JSON.parse(await readFile(new URL('../policies/intake-legacy.json', import.meta.url)))
export const digest = bytes => createHash('sha256').update(bytes).digest('hex')

export function validateRecord(record) {
  if (!checkRecord(record)) throw new Error(`Invalid intake record: ${ajv.errorsText(checkRecord.errors)}`)
  const sources = [record.source, record.appearance?.loader?.source, ...(record.links || []).map(link => link.url),
    ...[...(record.previews || []), ...(record.appearance?.previews || [])].filter(url => !url.startsWith('previews/'))].filter(Boolean)
  for (const source of sources) {
    assertHttps(source)
  }
}

// Read bytes once: the bytes inspected are exactly those copied to the download directory.
export async function inspectFeaturePack(bytes, expectedDigest) {
  if (bytes.length > 2 * 1024 * 1024) throw new Error('Archive exceeds 2 MiB intake limit')
  const sha256 = digest(bytes)
  if (expectedDigest && sha256 !== expectedDigest) throw new Error('Archive SHA-256 mismatch')
  const zip = await promisify(yauzl.fromBuffer)(bytes, { lazyEntries: true, autoClose: false, strictFileNames: true })
  const files = new Map()
  try {
    await new Promise((accept, reject) => {
      zip.once('error', reject)
      zip.once('end', accept)
      zip.on('entry', entry => {
        const name = entry.fileName
        const kind = (entry.externalFileAttributes >>> 16) & 0o170000
        // MVP accepts only a thin function manifest and optional root icon; no payload execution/extraction.
        if (!['pack.json', 'icon.png'].includes(name)) return reject(new Error(`Unsupported archive path: ${name}`))
        if (files.has(name)) return reject(new Error(`Duplicate archive entry: ${name}`))
        if (kind && kind !== 0o100000) return reject(new Error(`Not a regular file: ${name}`))
        if (entry.generalPurposeBitFlag & 1) return reject(new Error('Encrypted entries are unsupported'))
        if (entry.uncompressedSize > (name === 'pack.json' ? 1024 * 1024 : 512 * 1024)) return reject(new Error(`Entry too large: ${name}`))
        files.set(name, entry)
        zip.readEntry()
      })
      zip.readEntry()
    })
    if (!files.has('pack.json')) throw new Error('Missing root pack.json')
    const contents = new Map()
    for (const [name, entry] of files) {
      const stream = await promisify(zip.openReadStream.bind(zip))(entry)
      const chunks = []
      let size = 0
      for await (const chunk of stream) {
        size += chunk.length
        if (size > entry.uncompressedSize) throw new Error(`Entry size mismatch: ${name}`)
        chunks.push(chunk)
      }
      contents.set(name, Buffer.concat(chunks))
    }
    const manifest = JSON.parse(contents.get('pack.json').toString('utf8'))
    if (!checkManifest(manifest)) throw new Error(`Invalid Feature Pack: ${ajv.errorsText(checkManifest.errors)}`)
    if (manifest.overrides?.length || manifest.presets?.length || manifest.skills?.length) throw new Error('MVP accepts thin function packs without overrides, presets or skills')
    if (!manifest.plugins?.length) throw new Error('Function pack must declare at least one plugin')
    if (manifest['x-eac'] && (manifest['x-eac'].status !== 'publishable' || manifest['x-eac'].conflictsPending)) throw new Error('Draft or unresolved conflicts cannot be admitted')
    const refs = new Set()
    for (const { ref, version } of manifest.plugins) {
      if (!/^(?:builtin:[A-Za-z0-9][A-Za-z0-9._-]*|github:[A-Za-z0-9][A-Za-z0-9._-]*\/[A-Za-z0-9][A-Za-z0-9._-]*|(?:@[a-z0-9-]+\/)?[a-z0-9][a-z0-9._-]*)$/.test(ref)) throw new Error(`Unsupported plugin reference: ${ref}`)
      if (refs.has(ref)) throw new Error(`Duplicate plugin reference: ${ref}`)
      refs.add(ref)
      if (!ref.startsWith('builtin:') || version !== undefined) {
        const parsed = semver.parse(version)
        const exact = parsed && parsed.version + (parsed.build.length ? `+${parsed.build.join('.')}` : '')
        if (!exact || exact !== version) throw new Error(`Plugin must declare an exact SemVer version: ${ref}`)
      }
    }
    const range = manifest.requires?.dsh
    const legacy = range === undefined && legacyArchives.some(entry => entry.id === manifest.id && entry.version === manifest.version && entry.sha256 === sha256)
    if (range === undefined && !legacy) throw new Error('Mojobox intake requires requires.dsh; unknown compatibility belongs in candidates')
    if (range !== undefined && (!range.trim() || range.split('||').some(group => !group.trim()) || semver.validRange(range) === null)) throw new Error('requires.dsh must be a valid non-empty SemVer range')
    const versionDeclarations = { policy: 'mojobox-intake-v1', kernel: legacy ? 'legacy-undeclared' : 'declared', plugins: 'exact-external', comparison: 'not-performed' }
    const warnings = legacy ? ['Historical archive has no requires.dsh; compatibility is unknown. This exception applies only to these exact archive bytes.'] : []
    if (manifest.icon && manifest.icon !== 'icon.png') throw new Error('MVP icon must be root icon.png')
    if (Boolean(manifest.icon) !== files.has('icon.png')) throw new Error('Icon declaration and archive differ')
    if (contents.has('icon.png') && !contents.get('icon.png').subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error('Invalid PNG signature')
    return { format: 'eac-feature-pack-v1', manifest, sha256, size: bytes.length,
      checks: ['manifest-schema', 'archive-layout', 'archive-sha256', 'manifest-plugin-versions', ...(legacy ? [] : ['manifest-requires-range'])],
      versionDeclarations, warnings,
      runtime: 'not-tested', references: 'not-resolved' }
  } finally { zip.close() }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [, , file, expected] = process.argv
    if (!file || process.argv.length > 4 || (expected && !/^[a-f0-9]{64}$/.test(expected))) throw new Error('Usage: npm run inspect:feature-pack -- <archive> [sha256]')
    console.log(JSON.stringify(await inspectFeaturePack(await readFile(file), expected), null, 2))
  } catch (error) { console.error(error.message); process.exitCode = 1 }
}
