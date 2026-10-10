import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { test } from 'node:test'
import tar from 'tar-stream'
import { digest } from './feature-pack.mjs'
import { collectPluginListings, inspectPluginArtifact, pluginFilename, validatePluginListing } from './plugin-listing.mjs'
import { buildCatalog } from './build-catalog.mjs'
import { verifyDownloads } from './verify-downloads.mjs'

const valid = JSON.parse(await readFile(new URL('../fixtures/plugin-listings/valid.json', import.meta.url)))
const invalid = JSON.parse(await readFile(new URL('../fixtures/plugin-listings/invalid-compatibility.json', import.meta.url)))
const pkg = { name: valid.packageName, version: valid.version, license: 'MIT', dsh: { bundle: { patch: './cordis.patch.yml' } }, dependencies: { 'example-dependency': '^1.0.0' } }
async function archive(value = pkg, extras = []) {
  const pack = tar.pack()
  const chunks = []
  pack.on('data', chunk => chunks.push(chunk))
  const done = new Promise((accept, reject) => { pack.on('end', accept); pack.on('error', reject) })
  pack.entry({ name: 'package/package.json' }, JSON.stringify(value))
  pack.entry({ name: 'package/cordis.patch.yml' }, '- insert: []')
  for (const entry of extras) pack.entry(entry, entry.type === 'file' ? 'test' : undefined)
  pack.finalize()
  await done
  return gzipSync(Buffer.concat(chunks))
}
const recordFor = bytes => ({ ...structuredClone(valid), license: 'MIT', artifact: { format: 'npm-tgz', url: 'https://example.org/tools-1.0.0.tgz', size: bytes.length, sha256: digest(bytes) } })

test('minimal listing accepts unknown compatibility, license and conflicts without inventing runtime facts', () => {
  assert.equal(validatePluginListing(structuredClone(valid)).conflicts, null)
  assert.throws(() => validatePluginListing(invalid), /compatibility/)
  for (const mutate of [r => { r.version = 'latest' }, r => { r.version = 'v1.0.0' }, r => { r.version = '1.0.0-01' },
    r => { r.source.url = 'https://user:secret@example.org' }, r => { r.source.url = 'http://example.org' },
    r => { r.runtime = 'tested' }, r => { r.format = 'mojobox-skill-listing-v1' }, r => { delete r.conflicts }]) {
    const record = structuredClone(valid)
    mutate(record)
    assert.throws(() => validatePluginListing(record))
  }
  validatePluginListing({ ...valid, version: '1.0.0+build.1', conflicts: [] })
})

test('author compatibility needs a real range and reference; known conflicts remain distinct from unknown', () => {
  const record = { ...valid, compatibility: { dsh: '>=0.2.0-rc.2 <0.3.0', basis: 'author-declared', reference: 'https://example.org/requirements' }, conflicts: ['Same registration ID as example/other; see upstream issue 12.'] }
  validatePluginListing(record)
  for (const patch of [{ dsh: '*' }, { dsh: 'latest' }, { dsh: '>=1.0.0 ||' }, { dsh: null }, { reference: undefined }]) {
    assert.throws(() => validatePluginListing({ ...record, compatibility: { ...record.compatibility, ...patch } }))
  }
})

test('artifact bytes, package identity, license and author declaration are independently checked', async t => {
  t.mock.method(globalThis, 'fetch', () => { throw new Error('No network allowed') })
  const bytes = await archive()
  const record = recordFor(bytes)
  const report = await inspectPluginArtifact(bytes, record)
  assert.equal(report.runtime, 'not-tested')
  assert.equal(report.dependencies, 'not-resolved')
  assert.deepEqual(report.packageMetadata.dependencies, pkg.dependencies)
  await assert.rejects(inspectPluginArtifact(Buffer.from('wrong'), record), /digest\/size/)
  await assert.rejects(inspectPluginArtifact(bytes, { ...record, packageName: 'other' }), /identity/)
  await assert.rejects(inspectPluginArtifact(bytes, { ...record, license: 'Apache-2.0' }), /license/)
  assert.throws(() => validatePluginListing({ ...record, license: null }), /license/)
  const declared = { ...record, compatibility: { dsh: '>=0.2.0-rc.2 <0.3.0', basis: 'author-declared', reference: valid.source.url } }
  await assert.rejects(inspectPluginArtifact(bytes, declared), /Compatibility differs/)
  for (const value of [{ ...pkg, dsh: undefined }, { ...pkg, version: '2.0.0' }]) {
    const changed = await archive(value)
    await assert.rejects(inspectPluginArtifact(changed, recordFor(changed)), /mismatch/)
  }
})

test('tar traversal, duplicate entries and links are rejected without extraction', async () => {
  for (const entry of [{ name: 'package/../escape', type: 'file' }, { name: 'package/package.json', type: 'file' },
    { name: 'package/link', type: 'symlink', linkname: '../../escape' }, { name: 'package/link', type: 'link', linkname: 'package/package.json' }]) {
    const bytes = await archive(pkg, [entry])
    await assert.rejects(inspectPluginArtifact(bytes, recordFor(bytes)), /Unsafe or duplicate/)
  }
  const truncated = gzipSync(Buffer.from('not tar'))
  await assert.rejects(inspectPluginArtifact(truncated, recordFor(truncated)))
})

test('oversized metadata and decompression output are rejected with no dangling stream errors', async () => {
  const bytes = await archive({ ...pkg, unused: 'x'.repeat(1024 * 1024) })
  await assert.rejects(inspectPluginArtifact(bytes, recordFor(bytes)), /metadata entry/)
  const inflated = gzipSync(Buffer.alloc(33 * 1024 * 1024))
  await assert.rejects(inspectPluginArtifact(inflated, recordFor(inflated)), /larger|length|size/i)
  const invalid = Buffer.from('not gzip')
  await assert.rejects(inspectPluginArtifact(invalid, recordFor(invalid)))
})

test('linked artifact parent is rejected before reading bytes outside the intake directory', async t => {
  const root = await mkdtemp(join(tmpdir(), 'mojobox-plugin-linked-parent-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(join(root, 'catalog/plugin-listings'), { recursive: true })
  await mkdir(join(root, 'artifacts'))
  await mkdir(join(root, 'other'))
  const bytes = await archive()
  const record = recordFor(bytes)
  await writeFile(join(root, 'catalog/plugin-listings', `${record.id}.json`), JSON.stringify(record))
  await writeFile(join(root, 'other', pluginFilename(record)), bytes)
  await symlink(join(root, 'other'), join(root, 'artifacts/plugins'), process.platform === 'win32' ? 'junction' : 'dir')
  await assert.rejects(collectPluginListings(root), /parent must not be a link/)
})

test('plugin intake publishes unchanged downloads, source-only cards and an empty skill collection', async t => {
  const root = await mkdtemp(join(tmpdir(), 'mojobox-plugin-listing-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(join(root, 'catalog/plugin-listings'), { recursive: true })
  await mkdir(join(root, 'catalog/feature-packs'))
  await mkdir(join(root, 'artifacts/plugins'), { recursive: true })
  const bytes = await archive()
  const record = recordFor(bytes)
  const path = join(root, 'catalog/plugin-listings', `${record.id}.json`)
  await writeFile(path, JSON.stringify(record))
  await writeFile(join(root, 'artifacts/plugins', pluginFilename(record)), bytes)
  const sourceOnly = { ...valid, id: 'org.example.source', packageName: '@example/source' }
  await writeFile(join(root, 'catalog/plugin-listings', `${sourceOnly.id}.json`), JSON.stringify(sourceOnly))
  const catalog = await buildCatalog(root)
  assert.equal(catalog.plugins.length, 2)
  assert.deepEqual(catalog.skills, [])
  const published = catalog.plugins.find(plugin => plugin.artifact)
  assert.deepEqual(await readFile(join(root, 'site/public', published.archiveUrl)), bytes)
  assert.equal(catalog.plugins.find(plugin => !plugin.artifact).archiveUrl, undefined)
  assert.equal((await verifyDownloads(join(root, 'site/public'))).verified, 1)
  const original = await readFile(join(root, 'site/public/generated/catalog.json'))
  await writeFile(path, JSON.stringify({ ...record, artifact: { ...record.artifact, sha256: '0'.repeat(64) } }))
  await assert.rejects(buildCatalog(root), /digest\/size/)
  assert.deepEqual(await readFile(join(root, 'site/public/generated/catalog.json')), original)
  await writeFile(path, JSON.stringify(record))
  await writeFile(join(root, 'site/public', published.archiveUrl), 'tampered')
  await assert.rejects(verifyDownloads(join(root, 'site/public')), /digest\/size/)
})

test('listing filenames and package names are unique; absent collections are supported', async t => {
  const root = await mkdtemp(join(tmpdir(), 'mojobox-plugin-identities-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  assert.deepEqual(await collectPluginListings(root), [])
  await mkdir(join(root, 'catalog/plugin-listings'), { recursive: true })
  const path = join(root, 'catalog/plugin-listings', `${valid.id}.json`)
  await writeFile(path, JSON.stringify(valid))
  await writeFile(join(root, 'catalog/plugin-listings/org.example.other.json'), JSON.stringify({ ...valid, id: 'org.example.other' }))
  await assert.rejects(collectPluginListings(root), /Duplicate plugin/)
  await writeFile(path, JSON.stringify({ ...valid, id: 'org.example.changed' }))
  await assert.rejects(collectPluginListings(root), /filename/)
})
