import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { test } from 'node:test'
import { digest } from './feature-pack.mjs'
import { itemKey, jsonBytes, mergeSupplyHistory, validateReceipt, validateSupply } from './eac-supply.mjs'
import { collectSupply, committedSource, prepareSupply, writeSupply } from './export-eac-supply.mjs'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const fixture = JSON.parse(await readFile(new URL('../fixtures/eac-supply/valid.json', import.meta.url)))
const invalidMaterial = JSON.parse(await readFile(new URL('../fixtures/eac-supply/invalid-material.json', import.meta.url)))
const fresh = () => structuredClone(fixture)
const newer = () => ({ ...fresh(), sequence: 2, revision: 'test-2' })
const options = { publicUrl: 'https://example.org/mojobox/supply/', sequence: 1, revision: 'test-1',
  generatedAt: '2026-10-04T12:00:00Z', sourceCommit: '1'.repeat(40), pilot: true }
const artifact = { format: 'npm-tgz', downloadUrl: 'https://example.org/plugin.tgz', sha256: 'a'.repeat(64), size: 10 }
const packFor = plugin => ({ type: 'function-pack', packageName: 'org.example.tools', version: '1.0.0', name: 'Test tools', summary: 'Test only',
  source: plugin.source, status: 'active', runtime: 'not-tested', requiresDsh: null, compatibilityBasis: 'unknown',
  components: [{ id: 'one', ref: plugin.packageName, version: '1.0.0', required: true,
    resolved: { packageName: plugin.packageName, version: plugin.version, sha256: plugin.artifact.sha256 } }],
  execution: { coverage: 'complete', reference: 'https://example.org/execution', edges: [] } })

test('supply fixtures accept source listings and reject installable materials', () => {
  validateSupply(fresh())
  assert.throws(() => validateSupply(invalidMaterial), /Invalid EAC supply/)
  const document = fresh()
  document.items[0] = { ...document.items[0], type: 'material', installable: false }
  delete document.items[0].requiresDsh
  delete document.items[0].compatibilityBasis
  validateSupply(document)
  document.items[0].artifact = artifact
  assert.throws(() => validateSupply(document), /Invalid EAC supply/)
})

test('supply rejects unknown fields, duplicate identities, fake runtime and non-exact versions', () => {
  for (const change of [item => { item.version = 'latest' }, item => { item.version = 'v1.0.0' },
    item => { item.version = '1.0.0-01' }, item => { item.runtime = 'verified' }, item => { item.type = 'skill' },
    item => { item.installable = true }, item => { item.marketScore = 100 }]) {
    const document = fresh()
    change(document.items[0])
    assert.throws(() => validateSupply(document))
  }
  const document = fresh()
  document.items.push(structuredClone(document.items[0]))
  assert.throws(() => validateSupply(document), /Duplicate supply item/)
  document.items = [document.items[0]]
  document.items[0].version = '1.0.0+build.1'
  validateSupply(document)
})

test('compatibility remains unknown or exact RC2 without any host matching', () => {
  const document = fresh()
  const item = document.items[0]
  item.requiresDsh = '0.2.0-rc.2'
  assert.throws(() => validateSupply(document), /compatibility/)
  item.compatibilityBasis = 'author-declared'
  item.compatibilityReference = 'https://example.org/requirements'
  validateSupply(document)
  for (const range of ['latest', '>=0.1.0 <0.1.8.0', '>=1.0.0 ||', ' ']) {
    item.requiresDsh = range
    assert.throws(() => validateSupply(document), /compatibility/)
  }
})

test('artifact format, size, digest and HTTPS URLs are constrained', () => {
  for (const patch of [{ size: 0 }, { size: 1.5 }, { sha256: `sha256:${artifact.sha256}` }, { format: 'eac-feature-pack-v1' },
    { downloadUrl: 'http://example.org/plugin.tgz' }, { downloadUrl: 'https://user:secret@example.org/plugin.tgz' },
    { downloadUrl: 'https://example.org/plugin.tgz#fragment' }]) {
    const document = fresh()
    document.items[0].artifact = { ...artifact, ...patch }
    assert.throws(() => validateSupply(document))
  }
  const document = fresh()
  document.items[0].source.url = 'https://user:secret@example.org/source'
  assert.throws(() => validateSupply(document), /credentials/)
})

test('skin supports standalone loading and unknown conflicts without inventing a loader', () => {
  const document = fresh()
  const item = document.items[0]
  item.type = 'skin'
  item.appearance = { loadingMode: 'standalone-plugin', skinIds: [], skinIdsKnown: false,
    conflicts: [], conflictsKnown: false, previews: [] }
  validateSupply(document)
  item.appearance.loadingMode = 'loader-based'
  assert.throws(() => validateSupply(document), /Invalid EAC supply/)
  item.appearance.loader = { id: '@example/loader' }
  validateSupply(document)
  item.appearance.conflictsKnown = true
  assert.throws(() => validateSupply(document), /Invalid EAC supply/)
})

test('complete empty graph is valid but missing references and broken bindings fail', () => {
  const document = fresh()
  document.items[0].artifact = artifact
  document.items.push(packFor(document.items[0]))
  validateSupply(document)
  const pack = document.items[1]
  pack.components[0].resolved.sha256 = 'b'.repeat(64)
  assert.throws(() => validateSupply(document), /binding/)
  pack.components[0].resolved.sha256 = artifact.sha256
  pack.execution.edges = [{ prerequisiteId: 'missing', consumerId: 'one', milestone: 'installed' }]
  assert.throws(() => validateSupply(document), /missing component/)
  pack.execution.edges[0].prerequisiteId = 'one'
  assert.throws(() => validateSupply(document), /cycle/)
  pack.execution.edges = []
  delete pack.execution.reference
  assert.throws(() => validateSupply(document), /Invalid EAC supply/)
})

test('receipt binds exact bytes, identity and digest rather than reserialized JSON', () => {
  const bytes = jsonBytes(fresh())
  const receipt = { schemaVersion: 'supply-receipt.eac/v1', sourceId: fixture.sourceId, sequence: 1,
    revision: fixture.revision, sourceCommit: '1'.repeat(40), catalogUrl: 'https://example.org/1/supply.json', sha256: digest(bytes), size: bytes.length }
  validateReceipt(receipt, bytes)
  assert.throws(() => validateReceipt(receipt, Buffer.concat([bytes, Buffer.from('\n')])), /digest\/size/)
  assert.throws(() => validateReceipt({ ...receipt, sequence: 2 }, bytes), /identity/)
  assert.throws(() => validateReceipt({ ...receipt, sha256: 'b'.repeat(64) }, bytes), /digest\/size/)
})

test('history rejects rollback, changed bytes, silent deletion and unknown withdrawals', () => {
  const old = fresh()
  assert.throws(() => mergeSupplyHistory(old, old), /advance/)
  assert.throws(() => mergeSupplyHistory({ ...newer(), sourceId: 'another.source' }, old), /advance/)
  assert.throws(() => mergeSupplyHistory({ ...newer(), items: [] }, old), /explicit withdrawal/)
  assert.throws(() => mergeSupplyHistory(newer(), old, [{ packageName: 'missing', version: '1.0.0', reason: 'test' }]), /unknown/)
  old.items[0].artifact = artifact
  const next = newer()
  next.items[0].artifact = { ...artifact, sha256: 'b'.repeat(64) }
  assert.throws(() => mergeSupplyHistory(next, old), /bytes changed/)
})

test('history preserves older versions and withdrawal tombstones without reactivation', () => {
  const old = fresh()
  const next = newer()
  next.items[0].version = '2.0.0'
  const merged = mergeSupplyHistory(next, old)
  assert.equal(merged.items.length, 2)
  const withdrawal = { packageName: old.items[0].packageName, version: old.items[0].version, reason: 'Author withdrew this version' }
  const withdrawn = mergeSupplyHistory({ ...newer(), items: [] }, old, [withdrawal])
  assert.equal(withdrawn.items[0].status, 'withdrawn')
  const third = mergeSupplyHistory({ ...fresh(), sequence: 3, revision: 'test-3' }, withdrawn)
  assert.equal(third.items[0].status, 'withdrawn')
  assert.equal(third.items[0].withdrawnReason, withdrawal.reason)
})

test('material updates require a new record version and withdrawn components remain traceable', () => {
  const old = fresh()
  old.items[0] = { ...old.items[0], type: 'material', installable: false }
  delete old.items[0].requiresDsh
  delete old.items[0].compatibilityBasis
  const next = structuredClone(old)
  next.sequence = 2
  next.revision = 'test-2'
  next.items[0].source.commit = 'a'.repeat(40)
  assert.throws(() => mergeSupplyHistory(next, old), /Material source changed/)
  next.items[0].version = '2.0.0'
  assert.equal(mergeSupplyHistory(next, old).items.length, 2)
  const document = fresh()
  document.items[0].artifact = artifact
  document.items.push(packFor(document.items[0]))
  const withdrawn = mergeSupplyHistory({ ...document, sequence: 2, revision: 'test-2' }, document,
    [{ packageName: document.items[0].packageName, version: '1.0.0', reason: 'Test withdrawal' }])
  assert.equal(withdrawn.items.find(item => item.type === 'plugin').status, 'withdrawn')
  assert.ok(withdrawn.items.find(item => item.components).components[0].resolved)
})

test('real pilot exports two records offline and draft has no publication receipt', async t => {
  t.mock.method(globalThis, 'fetch', () => { throw new Error('Network forbidden') })
  const siteBefore = await readFile(join(root, 'site/public/generated/catalog.json')).catch(error => {
    if (error.code !== 'ENOENT') throw error
    return null
  })
  const result = await prepareSupply(root, { ...options, draft: true })
  assert.deepEqual(result.report.counts, { plugin: 1, material: 1 })
  assert.equal(result.files.has('supply-receipt.json'), false)
  const plugin = result.document.items.find(item => item.type === 'plugin')
  assert.equal(plugin.packageName, 'dsh-better-sidebar')
  assert.equal(plugin.version, '0.12.2')
  assert.equal(plugin.artifact, undefined)
  const material = result.document.items.find(item => item.type === 'material')
  assert.match(material.source.url, /bcb2ecaf318f60df2ff86e5214d646a785ccabc9\/skin-prompts\/packages\/blue-fantasy$/)
  assert.equal(material.installable, false)
  assert.equal(material.artifact, undefined)
  const siteAfter = await readFile(join(root, 'site/public/generated/catalog.json')).catch(error => {
    if (error.code !== 'ENOENT') throw error
    return null
  })
  assert.deepEqual(siteAfter, siteBefore)
})

test('appearance export copies local previews and preserves unknown compatibility without changing production policy', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'mojobox-supply-appearance-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  for (const path of ['catalog/feature-packs', 'artifacts', 'policies']) await mkdir(join(directory, path), { recursive: true })
  const record = JSON.parse(await readFile(join(root, 'catalog/feature-packs/dev.dsh-eac.skin-bloom.json')))
  record.appearance = { kind: 'skin', loader: { id: '@example/loader', version: '^1.0.0', source: 'https://example.org/loader' },
    skinIds: ['example-skin'], conflicts: ['other-theme'], previews: [`previews/${record.id}/cover.png`] }
  await mkdir(join(directory, `catalog/previews/${record.id}`), { recursive: true })
  const image = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  await writeFile(join(directory, `catalog/previews/${record.id}/cover.png`), image)
  await writeFile(join(directory, 'distribution.json'), jsonBytes({ packCategories: ['appearance'] }))
  await writeFile(join(directory, 'policies/eac-supply-selection.json'), jsonBytes({ plugins: [], materialVersions: {} }))
  await writeFile(join(directory, `catalog/feature-packs/${record.id}.json`), jsonBytes(record))
  const filename = `${record.id}-${record.version}.dshpack`
  await writeFile(join(directory, 'artifacts', filename), await readFile(join(root, 'artifacts', filename)))
  const result = await prepareSupply(directory, { ...options, pilot: false, draft: true })
  const item = result.document.items[0]
  assert.equal(item.type, 'appearance-pack')
  assert.equal(item.requiresDsh, null)
  assert.equal(item.compatibilityBasis, 'unknown')
  assert.equal(item.appearance.loadingMode, 'loader-based')
  assert.deepEqual(item.appearance.skinIds, ['example-skin'])
  assert.equal(item.appearance.conflictsKnown, false)
  const path = `batches/1/previews/${record.id}/cover.png`
  assert.equal(item.appearance.previews[0], new URL(path, options.publicUrl).href)
  assert.deepEqual(result.files.get(path), image)
})

test('full export preserves archive bytes, exact versions and distribution policy', async () => {
  const result = await prepareSupply(root, { ...options, pilot: false, draft: true })
  const policy = JSON.parse(await readFile(join(root, 'distribution.json')))
  for (const item of result.document.items.filter(item => item.components)) {
    const category = item.type === 'appearance-pack' ? 'appearance' : 'function'
    assert.ok(policy.packCategories.includes(category))
    const bytes = result.files.get(`batches/1/downloads/${item.packageName}-${item.version}.dshpack`)
    const original = await readFile(join(root, 'artifacts', `${item.packageName}-${item.version}.dshpack`))
    assert.deepEqual(bytes, original)
    assert.equal(digest(bytes), item.artifact.sha256)
    assert.equal(bytes.length, item.artifact.size)
    assert.equal(item.execution.coverage, 'unknown')
    assert.ok(item.components.every(component => !component.resolved && !('required' in component)))
  }
  const second = await prepareSupply(root, { ...options, pilot: false, draft: true })
  assert.deepEqual([...result.files], [...second.files])
})

test('formal bundles retain publication ledger and reject missing history or reused revision', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'mojobox-supply-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const first = await prepareSupply(root, options)
  const previous = join(directory, 'first')
  await writeSupply(previous, first.files)
  validateReceipt(JSON.parse(await readFile(join(previous, 'supply-receipt.json'))), first.files.get('batches/1/supply.json'))
  const second = await prepareSupply(root, { ...options, sequence: 2, revision: 'test-2', previous })
  assert.equal(second.document.items.length, first.document.items.length)
  await assert.rejects(prepareSupply(root, { ...options, sequence: 2, revision: 'test-2' }), /history/)
  await assert.rejects(prepareSupply(root, { ...options, sequence: 2, previous }), /unused revision/)
  await assert.rejects(writeSupply(previous, first.files), /already exists/)
  assert.deepEqual(await readFile(join(previous, 'batches/1/supply.json')), first.files.get('batches/1/supply.json'))
  await assert.rejects(writeSupply(join(directory, 'bad'), new Map([['../escape.json', Buffer.from('{}')]])), /output path/)
})

test('formal export requires a clean committed worktree, tested in an isolated repository', async t => {
  const run = promisify(execFile)
  const directory = await mkdtemp(join(tmpdir(), 'mojobox-supply-git-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  await run('git', ['init'], { cwd: directory })
  await writeFile(join(directory, 'source.json'), '{}\n')
  await assert.rejects(committedSource(directory), /clean committed worktree/)
  await run('git', ['add', 'source.json'], { cwd: directory })
  await run('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.org', '-c', 'commit.gpgsign=false', 'commit', '-m', 'test fixture'], { cwd: directory })
  assert.match(await committedSource(directory), /^[a-f0-9]{40}$/)
})

test('supply URL and identity checks reject unsafe base paths before writing', async () => {
  for (const publicUrl of ['http://example.org/', 'https://example.org/no-slash', 'https://example.org/?token=secret', 'https://user:secret@example.org/']) {
    await assert.rejects(collectSupply(root, { publicUrl, sequence: 1 }), /HTTPS|trailing slash/)
  }
  assert.equal(itemKey(fixture.items[0]), '@example/test-only@1.0.0')
})
