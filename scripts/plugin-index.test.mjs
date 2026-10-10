import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { digest } from './feature-pack.mjs'
import { collectPluginListings, pluginFilename } from './plugin-listing.mjs'
import { pluginIndexPath, publishPluginIndex, validatePluginIndex, verifyPluginIndex } from './plugin-index.mjs'

const fixture = JSON.parse(await readFile(new URL('../fixtures/plugin-index/valid.json', import.meta.url)))
const invalid = JSON.parse(await readFile(new URL('../fixtures/plugin-index/invalid-source-download.json', import.meta.url)))
const jsonBytes = value => Buffer.from(JSON.stringify(value, null, 2) + '\n')
const revise = document => ({ ...document, revision: `sha256:${digest(jsonBytes(document.plugins))}` })

test('plugin API rejects install claims, invalid provenance, duplicate identities and corrupted revisions', () => {
  validatePluginIndex(fixture)
  assert.throws(() => validatePluginIndex(revise(invalid)), /Source-only/)
  for (const mutate of [d => { d.plugins[0].runtime = 'tested' }, d => { d.sourceId = 'another.source' },
    d => { d.schemaVersion = 'plugins.mojobox.dev/v2' }, d => { d.plugins[0].listing.compatibility.dsh = '*' },
    d => { d.plugins.push(structuredClone(d.plugins[0])) }, d => { d.plugins[0].listing.summary = 'changed' }]) {
    const document = structuredClone(fixture)
    mutate(document)
    assert.throws(() => validatePluginIndex(document))
  }
  assert.throws(() => validatePluginIndex({ ...fixture, demo: true }), /Demo/)
  validatePluginIndex({ ...fixture, demo: true }, { allowDemo: true })
})

test('plugin API preserves conflict states and limitations and pins exact report and download bytes', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'mojobox-plugin-api-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const output = join(directory, 'generated')
  const bytes = Buffer.from('fixture download bytes')
  const listing = { ...structuredClone(fixture.plugins[0].listing), license: 'MIT', limitations: ['External service required'],
    artifact: { format: 'npm-tgz', url: 'https://example.org/tools.tgz', sha256: digest(bytes), size: bytes.length } }
  const report = { runtime: 'not-tested', dependencies: 'not-resolved', packageMetadata: { engines: { node: '>=22' } } }
  const source = { ...structuredClone(fixture.plugins[0].listing), id: 'org.example.source', packageName: '@example/source', conflicts: [] }
  const input = [{ record: listing, bytes, report }, { record: source }]
  for (const folder of ['downloads', 'plugins', 'reports']) await mkdir(join(output, folder), { recursive: true })
  await writeFile(join(output, 'downloads', 'org.example.tools-1.0.0.tgz'), bytes)
  await writeFile(join(output, 'reports', 'org.example.tools.plugin.json'), jsonBytes(report))
  for (const record of [listing, source]) await writeFile(join(output, 'plugins', `${record.id}.json`), jsonBytes(record))
  const document = await publishPluginIndex(output, input)
  assert.deepEqual(document.plugins.map(item => item.listing.conflicts), [[], null])
  assert.deepEqual(document.plugins[1].listing.limitations, listing.limitations)
  assert.equal(document.plugins[0].download, null)
  const original = await readFile(join(directory, pluginIndexPath))
  await publishPluginIndex(output, input.toReversed())
  assert.deepEqual(await readFile(join(directory, pluginIndexPath)), original)
  const catalog = { demo: false, plugins: [listing, source] }
  await verifyPluginIndex(directory, catalog)
  for (const base of ['https://example.org/', 'https://example.org/EAC-mojobox/']) {
    const endpoint = new URL(pluginIndexPath, base)
    const download = new URL(document.plugins[1].download.url, endpoint)
    assert.equal(download.href, new URL('generated/downloads/org.example.tools-1.0.0.tgz', base).href)
  }
  for (const patch of [{ url: 'https://evil.example/tools.tgz' }, { url: '../../downloads/other.tgz' }, { sha256: '0'.repeat(64) }, { size: bytes.length + 1 }]) {
    const changed = structuredClone(document)
    Object.assign(changed.plugins[1].download, patch)
    assert.throws(() => validatePluginIndex(revise(changed)))
  }
  await writeFile(join(output, 'reports', 'org.example.tools.plugin.json'), 'tampered')
  await assert.rejects(verifyPluginIndex(directory, catalog), /digest\/size/)
})

test('production plugin API matches real intake and is rebuilt deterministically without network or runtime execution', async t => {
  t.mock.method(globalThis, 'fetch', () => { throw new Error('No network allowed') })
  const root = fileURLToPath(new URL('../', import.meta.url))
  const directory = await mkdtemp(join(tmpdir(), 'mojobox-real-plugin-api-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const records = await collectPluginListings(root)
  for (const folder of ['downloads', 'plugins', 'reports']) await mkdir(join(directory, 'generated', folder), { recursive: true })
  for (const { record, bytes, report } of records) {
    await writeFile(join(directory, 'generated/plugins', `${record.id}.json`), jsonBytes(record))
    if (bytes) await writeFile(join(directory, 'generated/downloads', pluginFilename(record)), bytes)
    if (report) await writeFile(join(directory, 'generated/reports', `${record.id}.plugin.json`), jsonBytes(report))
  }
  await publishPluginIndex(join(directory, 'generated'), records)
  const output = join(directory, pluginIndexPath)
  const bytes = await readFile(output)
  const document = await verifyPluginIndex(directory, { demo: false, plugins: records.map(item => item.record) })
  assert.equal(document.plugins.length, records.length)
  assert.ok(document.plugins.some(item => item.download))
  assert.ok(document.plugins.some(item => item.download === null))
  await publishPluginIndex(join(directory, 'generated'), records.toReversed())
  assert.deepEqual(await readFile(output), bytes)
  assert.deepEqual(await readFile(join(directory, 'generated/api/v1/schemas/plugin-index.schema.json')), await readFile(new URL('../schemas/plugin-index.schema.json', import.meta.url)))
  const unsorted = structuredClone(document)
  unsorted.plugins.reverse()
  assert.throws(() => validatePluginIndex(revise(unsorted)), /unique and sorted/)
  const duplicate = structuredClone(document)
  duplicate.plugins.push(structuredClone(duplicate.plugins[0]))
  assert.throws(() => validatePluginIndex(revise(duplicate)), /unique and sorted/)
})
