import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import semver from 'semver'
import tar from 'tar-stream'
import { gunzipSync } from 'node:zlib'
import { lstat, readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { digest } from './feature-pack.mjs'
import { assertHttps } from './preview-images.mjs'

const ajv = new Ajv({ allErrors: true })
addFormats(ajv)
const check = ajv.compile(JSON.parse(await readFile(new URL('../schemas/plugin-listing.schema.json', import.meta.url))))

export function validatePluginListing(record) {
  if (!check(record)) throw new Error(`Invalid plugin listing: ${ajv.errorsText(check.errors)}`)
  const parsed = semver.parse(record.version)
  if (!parsed || parsed.version + (parsed.build.length ? `+${parsed.build.join('.')}` : '') !== record.version) throw new Error('Plugin listing requires exact SemVer')
  for (const url of [record.source.url, record.source.repository, record.compatibility.reference, record.artifact?.url, ...(record.links || []).map(link => link.url)].filter(Boolean)) assertHttps(url)
  const { dsh, basis, reference } = record.compatibility
  if (dsh === null ? basis !== 'unknown' || reference !== undefined : basis !== 'author-declared' || !reference ||
      !dsh.trim() || dsh.split('||').some(group => !group.trim()) || semver.validRange(dsh) === null || semver.validRange(dsh) === '*') throw new Error('Invalid plugin compatibility declaration')
  if (record.artifact && !record.license) throw new Error('Plugin downloads require a declared license and manual redistribution review')
  return record
}

export const pluginFilename = record => `${record.id}-${record.version}.tgz`

export async function inspectPluginArtifact(bytes, record) {
  validatePluginListing(record)
  if (!record.artifact || bytes.length !== record.artifact.size || digest(bytes) !== record.artifact.sha256) throw new Error('Plugin artifact digest/size mismatch')
  // Read bounded tar data in memory, never extract files or execute package scripts.
  const unpacked = gunzipSync(bytes, { maxOutputLength: 32 * 1024 * 1024 })
  const extract = tar.extract()
  const paths = new Set()
  let pkg
  extract.on('entry', (header, stream, next) => {
    stream.on('error', error => extract.destroy(error))
    const path = header.name.replace(/\/$/, '')
    if (!(path.startsWith('package/') || (path === 'package' && header.type === 'directory')) || path.includes('\\') || path.split('/').some(part => ['', '.', '..'].includes(part)) ||
        !['file', 'directory'].includes(header.type) || paths.has(path) || paths.size >= 10000) {
      stream.resume()
      extract.destroy(new Error('Unsafe or duplicate plugin tar entry'))
      return
    }
    paths.add(path)
    if (path === 'package/package.json' && (header.type !== 'file' || header.size > 1024 * 1024)) {
      stream.resume()
      extract.destroy(new Error('Invalid plugin package metadata entry'))
      return
    }
    const chunks = []
    stream.on('data', chunk => { if (path === 'package/package.json') chunks.push(chunk) })
    stream.on('end', () => {
      try {
        if (path === 'package/package.json') pkg = JSON.parse(Buffer.concat(chunks).toString('utf8'))
        next()
      } catch (error) { extract.destroy(error) }
    })
  })
  const done = new Promise((accept, reject) => { extract.on('finish', accept); extract.on('error', reject) })
  extract.end(unpacked)
  await done
  if (!pkg || pkg.name !== record.packageName || pkg.version !== record.version || pkg.license !== record.license || !pkg.dsh?.bundle) throw new Error('Plugin package identity/license/bundle mismatch')
  if (record.compatibility.basis === 'author-declared' && pkg.dsh?.compatibility?.dsh !== record.compatibility.dsh) throw new Error('Compatibility differs from package declaration')
  return { format: record.artifact.format, sha256: digest(bytes), size: bytes.length, packageName: pkg.name, version: pkg.version,
    runtime: 'not-tested', dependencies: 'not-resolved', packageMetadata: {
      ...(pkg.engines ? { engines: pkg.engines } : {}), ...(pkg.peerDependencies ? { peerDependencies: pkg.peerDependencies } : {}),
      ...(pkg.dependencies ? { dependencies: pkg.dependencies } : {}), dsh: pkg.dsh
    } }
}

export async function collectPluginListings(root) {
  let entries
  try { entries = await readdir(join(root, 'catalog/plugin-listings')) }
  catch (error) { if (error.code === 'ENOENT') return []; throw error }
  const result = []
  const identities = new Set()
  for (const name of entries.filter(name => name.endsWith('.json')).sort()) {
    const record = validatePluginListing(JSON.parse(await readFile(join(root, 'catalog/plugin-listings', name), 'utf8')))
    if (name !== `${record.id}.json`) throw new Error('Plugin listing filename must match id')
    if (identities.has(record.packageName)) throw new Error('Duplicate plugin package name')
    identities.add(record.packageName)
    let bytes, report
    if (record.artifact) {
      for (const directory of ['artifacts', 'artifacts/plugins']) {
        const parent = await lstat(join(root, directory))
        if (!parent.isDirectory() || parent.isSymbolicLink()) throw new Error('Plugin artifact parent must not be a link')
      }
      const file = join(root, 'artifacts/plugins', pluginFilename(record))
      const stat = await lstat(file)
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 8 * 1024 * 1024) throw new Error('Plugin artifact must be a regular file of at most 8 MiB')
      bytes = await readFile(file)
      report = await inspectPluginArtifact(bytes, record)
    }
    result.push({ record, bytes, report })
  }
  return result
}
