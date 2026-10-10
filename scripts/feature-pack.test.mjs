import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { ZipArchive } from 'archiver'
import { digest, inspectFeaturePack, validateRecord } from './feature-pack.mjs'
import { buildCatalog } from './build-catalog.mjs'
import { verifyDownloads } from './verify-downloads.mjs'
import { createServer } from 'node:http'

const manifest = JSON.parse(await readFile(new URL('../fixtures/intake/valid.json', import.meta.url)))
const duplicate = JSON.parse(await readFile(new URL('../fixtures/intake/invalid-duplicate.json', import.meta.url)))
const presentation = JSON.parse(await readFile(new URL('../fixtures/intake/record-with-presentation.json', import.meta.url)))
const invalidPreview = JSON.parse(await readFile(new URL('../fixtures/intake/invalid-record-preview.json', import.meta.url)))
async function archive(value = manifest, extras = []) {
  const zip = new ZipArchive({ zlib: { level: 9 } })
  const chunks = []
  const done = new Promise((accept, reject) => {
    zip.on('data', chunk => chunks.push(chunk))
    zip.on('end', () => accept(Buffer.concat(chunks)))
    zip.on('error', reject)
  })
  for (const [name, bytes, options = {}] of [['pack.json', JSON.stringify(value)], ...extras]) {
    zip.append(bytes, { name, date: new Date('1980-01-01T00:00:00Z'), mode: 0o644, ...options })
  }
  await zip.finalize()
  return done
}
const recordFor = bytes => ({ format: 'eac-feature-pack-v1', id: manifest.id, version: manifest.version,
  category: 'function', source: 'https://example.org/test-only-release', author: manifest.author, license: manifest.license, sha256: digest(bytes) })

test('valid thin archive is checked offline without claiming resolved sources or runtime success', async t => {
  t.mock.method(globalThis, 'fetch', () => { throw new Error('No network allowed') })
  const bytes = await archive()
  const report = await inspectFeaturePack(bytes, digest(bytes))
  assert.deepEqual(report.manifest, manifest)
  assert.equal(report.runtime, 'not-tested')
  assert.equal(report.references, 'not-resolved')
  assert.deepEqual(report.versionDeclarations, { policy: 'mojobox-intake-v1', kernel: 'declared', plugins: 'exact-external', comparison: 'not-performed' })
  assert.ok(report.checks.includes('manifest-requires-range'))
  assert.ok(report.checks.includes('manifest-plugin-versions'))
  assert.deepEqual(report.warnings, [])
  assert.equal(report.size, bytes.length)
  validateRecord(recordFor(bytes))
  await assert.rejects(inspectFeaturePack(bytes, '0'.repeat(64)), /SHA-256 mismatch/)
})

test('intake requires valid kernel declarations and exact external plugin versions', async () => {
  for (const [file, error] of [
    ['invalid-missing-requires.json', /intake requires requires.dsh/],
    ['invalid-requires-range.json', /valid non-empty SemVer range/],
    ['invalid-missing-plugin-version.json', /exact SemVer version/],
    ['invalid-plugin-version-range.json', /exact SemVer version/]
  ]) {
    const value = JSON.parse(await readFile(new URL(`../fixtures/intake/${file}`, import.meta.url)))
    await assert.rejects(inspectFeaturePack(await archive(value)), error)
  }
  for (const dsh of [' ', 'latest', '>=0.2.0 ||', '|| 0.2.0', '>=0.2.0-01', '0.02.0']) {
    await assert.rejects(inspectFeaturePack(await archive({ ...manifest, requires: { dsh } })), /SemVer range/)
  }
  await assert.rejects(inspectFeaturePack(await archive({ ...manifest, requires: {} })), /intake requires requires.dsh/)
  for (const ref of ['@example/test-only', 'github:example/skins']) {
    for (const version of [undefined, '', 'latest', '*', '^1.0.0', '~1.0.0', '>=1.0.0', '1.0', 'v1.0.0', '01.0.0', '1.0.0-01']) {
      await assert.rejects(inspectFeaturePack(await archive({ ...manifest, plugins: [{ ref, version }] })), /exact SemVer version/)
    }
  }
})

test('kernel range syntax is checked without filtering for the builder kernel', async t => {
  t.mock.method(globalThis, 'fetch', () => { throw new Error('No network allowed') })
  for (const dsh of ['>=0.1.7-rc.2 <0.1.8', '>=0.2.0-rc.2 <0.3.0-0', '^0.2.0', '~0.2.0', '0.2', '0', '0.2.0 || 1.0.0', '*']) {
    const report = await inspectFeaturePack(await archive({ ...manifest, requires: { dsh } }))
    assert.equal(report.manifest.requires.dsh, dsh)
    assert.equal(report.versionDeclarations.comparison, 'not-performed')
    assert.equal(report.runtime, 'not-tested')
  }
  for (const version of ['1.0.0-rc.2', '1.0.0+build.1']) {
    await inspectFeaturePack(await archive({ ...manifest, plugins: [{ ref: '@example/test-only', version }] }))
  }
  const builtin = await inspectFeaturePack(await archive({ ...manifest, plugins: [{ ref: 'builtin:dsh-terminal' }] }))
  assert.equal(builtin.versionDeclarations.plugins, 'exact-external')
  await assert.rejects(inspectFeaturePack(await archive({ ...manifest, plugins: [{ ref: 'builtin:dsh-terminal', version: '*' }] })), /exact SemVer version/)
})

test('historical kernel exceptions match exact identities and bytes, not categories or future versions', async () => {
  const legacy = JSON.parse(await readFile(new URL('../policies/intake-legacy.json', import.meta.url)))
  assert.equal(legacy.length, 8)
  assert.equal(new Set(legacy.map(entry => entry.id)).size, legacy.length)
  for (const entry of legacy) {
    assert.match(entry.sha256, /^[a-f0-9]{64}$/)
    const bytes = await readFile(new URL(`../artifacts/${entry.id}-${entry.version}.dshpack`, import.meta.url))
    const report = await inspectFeaturePack(bytes, entry.sha256)
    assert.equal(report.versionDeclarations.kernel, 'legacy-undeclared')
    assert.equal(report.manifest.requires, undefined)
    assert.equal(report.versionDeclarations.comparison, 'not-performed')
    assert.equal(report.warnings.length, 1)
    assert.ok(!report.checks.includes('manifest-requires-range'))
    assert.ok(report.checks.includes('manifest-plugin-versions'))
    for (const change of [{ description: 'changed bytes' }, { version: '0.1.1' }, { id: 'dev.example.new-skin' }]) {
      await assert.rejects(inspectFeaturePack(await archive({ ...report.manifest, ...change })), /intake requires requires.dsh/)
    }
  }
})

test('invalid version submissions fail before replacing any generated output', async t => {
  const root = await mkdtemp(join(tmpdir(), 'mojobox-version-intake-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(join(root, 'catalog/feature-packs'), { recursive: true })
  await mkdir(join(root, 'artifacts'))
  const recordPath = join(root, 'catalog/feature-packs', `${manifest.id}.json`)
  const artifactPath = join(root, 'artifacts', `${manifest.id}-${manifest.version}.dshpack`)
  const bytes = await archive()
  await writeFile(recordPath, JSON.stringify(recordFor(bytes)))
  await writeFile(artifactPath, bytes)
  const catalog = await buildCatalog(root)
  assert.deepEqual(catalog.packs[0].requires, manifest.requires)
  assert.deepEqual(catalog.packs[0].components, manifest.plugins)
  assert.equal(catalog.packs[0].versionDeclarations.kernel, 'declared')
  const catalogPath = join(root, 'site/public/generated/catalog.json')
  const before = await readFile(catalogPath)
  for (const file of ['invalid-missing-requires.json', 'invalid-requires-range.json', 'invalid-missing-plugin-version.json', 'invalid-plugin-version-range.json']) {
    const invalid = JSON.parse(await readFile(new URL(`../fixtures/intake/${file}`, import.meta.url)))
    const invalidBytes = await archive(invalid)
    await writeFile(recordPath, JSON.stringify(recordFor(invalidBytes)))
    await writeFile(artifactPath, invalidBytes)
    await assert.rejects(buildCatalog(root, { checkOnly: true }), /requires.dsh|SemVer/)
    await assert.rejects(buildCatalog(root), /requires.dsh|SemVer/)
    assert.deepEqual(await readFile(catalogPath), before)
    assert.deepEqual(await readFile(join(root, 'site/public', catalog.packs[0].archiveUrl)), bytes)
  }
})

test('invalid schema, duplicate refs, draft and unsupported payload are rejected', async () => {
  for (const [value, error] of [
    [{ ...manifest, formatVersion: 2 }, /Invalid Feature Pack/],
    [duplicate, /Duplicate plugin/],
    [{ ...manifest, plugins: [] }, /at least one/],
    [{ ...manifest, plugins: [{ ref: 'file:local.tgz' }] }, /Unsupported plugin reference/],
    [{ ...manifest, overrides: ['config'] }, /without overrides/],
    [{ ...manifest, skills: [{ id: 'test' }] }, /without overrides/],
    [{ ...manifest, 'x-eac': { status: 'draft', intendedPluginIds: [], conflictsPending: false } }, /Draft/]
  ]) await assert.rejects(inspectFeaturePack(await archive(value)), error)
})

test('unexpected files, duplicate entries, symlinks, missing icons and size limits are rejected', async () => {
  for (const [value, extras, error] of [
    [manifest, [['payload/skills/test/SKILL.md', 'test']], /Unsupported archive path/],
    [manifest, [['pack.json', '{}']], /Duplicate archive/],
    [manifest, [['icon.png', 'target', { type: 'symlink', linkname: 'target' }]], /Not a regular file/],
    [{ ...manifest, icon: 'icon.png' }, [], /Icon declaration/],
    [{ ...manifest, icon: 'icon.png' }, [['icon.png', 'not a PNG']], /PNG signature/],
    [manifest, [['icon.png', Buffer.alloc(512 * 1024 + 1)]], /Entry too large/]
  ]) await assert.rejects(inspectFeaturePack(await archive(value, extras)), error)
  await assert.rejects(inspectFeaturePack(Buffer.from('not a zip')))
  await assert.rejects(inspectFeaturePack(Buffer.alloc(2 * 1024 * 1024 + 1)), /Archive exceeds/)
})

test('intake metadata rejects unsupported formats, unsafe sources and fabricated digests', () => {
  const record = recordFor(Buffer.from('test'))
  for (const mutation of [{ format: 'unknown' }, { source: 'javascript:alert(1)' },
    { source: 'https://user:secret@example.org/file' }, { sha256: 'fake' }, { id: '../escape' },
    { category: 'full-environment' }, { category: undefined }]) {
    assert.throws(() => validateRecord({ ...record, ...mutation }))
  }
})

test('appearance intake records preserve loader metadata and reject it for other categories', () => {
  const record = { ...recordFor(Buffer.from('test')), category: 'appearance', appearance: {
    kind: 'skin',
    loader: { id: '@dsh-eac/ui-skin-loader', version: '1.1.0', source: 'https://github.com/DSH-EAC/dsh-ui-skin-loader' },
    skinIds: ['maid-atelier'], conflicts: ['bodyAttr:theme'], previews: ['https://example.org/preview.png']
  } }
  validateRecord(record)
  assert.throws(() => validateRecord({ ...record, category: 'function' }))
  assert.throws(() => validateRecord({ ...record, category: 'appearance', appearance: { loader: { id: 'loader', source: 'javascript:bad' } } }))
  assert.throws(() => validateRecord({ ...record, appearance: { ...record.appearance, loader: { ...record.appearance.loader, source: 'https://user:secret@example.org/loader' } } }))
})

test('author presentation fields are optional and reject invalid tags, links and previews', () => {
  validateRecord(presentation)
  validateRecord(recordFor(Buffer.from('test')))
  assert.throws(() => validateRecord(invalidPreview))
  for (const change of [
    { tags: ['same', 'same'] }, { tags: [' '] }, { tags: ['x'.repeat(33)] }, { tags: Array.from({ length: 13 }, (_, i) => String(i)) },
    { introduction: ' ' }, { introduction: 'x'.repeat(6001) },
    { links: [{ label: 'Author', url: 'javascript:alert(1)' }] },
    { links: [{ label: 'Author', url: 'https://user:secret@example.org/repo' }] },
    { previews: ['data:image/png;base64,invalid'] }
  ]) assert.throws(() => validateRecord({ ...presentation, ...change }))
})

test('external author fields and uploaded previews enter the catalog without archive changes', async t => {
  const root = await mkdtemp(join(tmpdir(), 'mojobox-author-presentation-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  t.mock.method(globalThis, 'fetch', () => { throw new Error('Submission checks must be offline') })
  await mkdir(join(root, 'catalog/feature-packs'), { recursive: true })
  await mkdir(join(root, `catalog/previews/${manifest.id}`), { recursive: true })
  await mkdir(join(root, 'artifacts'))
  const bytes = await archive()
  const record = { ...presentation, sha256: digest(bytes) }
  await writeFile(join(root, 'catalog/feature-packs', `${record.id}.json`), JSON.stringify(record))
  await writeFile(join(root, 'artifacts', `${record.id}-${record.version}.dshpack`), bytes)
  const preview = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  await writeFile(join(root, 'catalog', record.previews[0]), preview)
  assert.deepEqual(await buildCatalog(root, { checkOnly: true }), { checked: 1 })
  const { packs } = await buildCatalog(root)
  assert.deepEqual(packs[0].metadata.tags, record.tags)
  assert.equal(packs[0].metadata.introduction, record.introduction)
  assert.deepEqual(packs[0].links, record.links)
  assert.deepEqual(packs[0].previews, record.previews.map(url => `generated/${url}`))
  assert.deepEqual(await readFile(join(root, 'site/public', packs[0].archiveUrl)), bytes)
  assert.deepEqual(await verifyDownloads(join(root, 'site/public')), { verified: 1, skinPackages: 0 })
  const before = await readFile(join(root, 'site/public/generated/catalog.json'))
  await writeFile(join(root, 'catalog', record.previews[0]), 'not an image')
  await assert.rejects(buildCatalog(root), /signature/)
  assert.deepEqual(await readFile(join(root, 'site/public/generated/catalog.json')), before)
  await writeFile(join(root, 'artifacts', `${record.id}-${record.version}.dshpack`), Buffer.alloc(2 * 1024 * 1024 + 1))
  await assert.rejects(buildCatalog(root), /regular file of at most 2 MiB/)
  assert.deepEqual(await readFile(join(root, 'site/public/generated/catalog.json')), before)
})

test('traversal names in ZIP metadata are rejected without extracting files', async () => {
  const bytes = await archive()
  const malicious = Buffer.from(bytes)
  // Both local and central-directory names have the same byte length.
  let offset = 0
  while ((offset = malicious.indexOf(Buffer.from('pack.json'), offset)) !== -1) {
    malicious.write('../x.json', offset)
    offset += 9
  }
  await assert.rejects(inspectFeaturePack(malicious), /invalid relative path|Unsupported archive path/)
})

test('catalog exposes deduplicated component repositories without replacing the pack publication source', async t => {
  const root = await mkdtemp(join(tmpdir(), 'mojobox-origins-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(join(root, 'catalog/feature-packs'), { recursive: true })
  await mkdir(join(root, 'artifacts'))
  await mkdir(join(root, 'authoring'))
  const value = { ...manifest, plugins: [{ ref: '@example/skin', version: '1.0.0' }, { ref: 'github:example/skins', version: '1.0.0' }, { ref: '@example/unknown', version: '1.0.0' }] }
  const bytes = await archive(value)
  const record = recordFor(bytes)
  await writeFile(join(root, 'catalog/feature-packs', `${manifest.id}.json`), JSON.stringify(record))
  await writeFile(join(root, 'artifacts', `${manifest.id}-${manifest.version}.dshpack`), bytes)
  await writeFile(join(root, 'authoring/upstream-snapshot.json'), JSON.stringify({ components: [
    { repository: 'https://github.com/example/no-package' },
    { package: { name: '@example/skin' }, repository: 'https://github.com/example/skins' }
  ] }))
  const { packs } = await buildCatalog(root)
  assert.deepEqual(packs[0].links, [{ label: '原项目 · skins', url: 'https://github.com/example/skins' }])
  assert.equal(packs[0].source, record.source)
  assert.deepEqual(await readFile(join(root, 'site/public', packs[0].archiveUrl)), bytes)
})

test('contributed archive is copied byte-for-byte; mismatch fails before replacing catalog; removal clears downloads', async t => {
  const root = await mkdtemp(join(tmpdir(), 'mojobox-intake-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(join(root, 'catalog/feature-packs'), { recursive: true })
  await mkdir(join(root, 'artifacts'))
  const bytes = await archive()
  const record = recordFor(bytes)
  const recordPath = join(root, 'catalog/feature-packs', `${manifest.id}.json`)
  const artifactPath = join(root, 'artifacts', `${manifest.id}-${manifest.version}.dshpack`)
  await writeFile(recordPath, JSON.stringify(record))
  await writeFile(artifactPath, bytes)
  assert.deepEqual(await buildCatalog(root, { checkOnly: true }), { checked: 1 })
  await assert.rejects(readFile(join(root, 'site/public/generated/catalog.json')), { code: 'ENOENT' })
  const result = await buildCatalog(root)
  assert.equal(result.packs.length, 1)
  assert.equal(result.packs[0].metadata.category, 'function')
  await writeFile(recordPath, JSON.stringify({ ...record, category: 'appearance', appearance: {
    kind: 'skin', loader: { id: '@example/loader', version: '1.0.0', source: 'https://example.org/loader' }, skinIds: ['test-skin']
  } }))
  const appearanceCatalog = await buildCatalog(root)
  assert.equal(appearanceCatalog.packs[0].metadata.category, 'appearance')
  assert.equal(appearanceCatalog.packs[0].appearance.loader.id, '@example/loader')
  await writeFile(recordPath, JSON.stringify(record))
  await buildCatalog(root)
  const downloaded = await readFile(join(root, 'site/public', result.packs[0].archiveUrl))
  assert.deepEqual(downloaded, bytes)
  assert.equal(result.packs[0].archiveDigest, `sha256:${digest(downloaded)}`)
  assert.deepEqual(await buildCatalog(root), result)
  const publicDir = join(root, 'site/public')
  assert.deepEqual(await verifyDownloads(publicDir), { verified: 1, skinPackages: 0 })
  await mkdir(join(publicDir, 'assets'))
  await writeFile(join(publicDir, 'assets/site.js'), 'export {}')
  await writeFile(join(publicDir, 'assets/site.css'), 'body {}')
  const entryHtml = base => `<script type="module" src="${base}assets/site.js"></script><link rel="stylesheet" href="${base}assets/site.css">`
  await writeFile(join(publicDir, 'index.html'), entryHtml('/dsh-mojobox/'))
  await assert.rejects(verifyDownloads(publicDir, { basePath: '/EAC-mojobox/' }), /outside deployment base/)
  for (const basePath of ['/', '/EAC-mojobox/']) {
    await writeFile(join(publicDir, 'index.html'), entryHtml(basePath))
    assert.deepEqual(await verifyDownloads(publicDir, { basePath }), { verified: 1, skinPackages: 0 })
  }
  await rm(join(publicDir, 'assets/site.js'))
  await assert.rejects(verifyDownloads(publicDir, { basePath: '/EAC-mojobox/' }), { code: 'ENOENT' })
  const catalogPath = join(publicDir, 'generated/catalog.json')
  const changed = structuredClone(result)
  changed.packs[0].components[0].version = '9.9.9'
  await writeFile(catalogPath, JSON.stringify(changed))
  await assert.rejects(verifyDownloads(publicDir), /Catalog display differs/)
  for (const field of ['versionDeclarations', 'warnings']) {
    const altered = structuredClone(result)
    altered.packs[0][field] = field === 'warnings' ? ['fabricated warning'] : { kernel: 'compatible' }
    await writeFile(catalogPath, JSON.stringify(altered))
    await assert.rejects(verifyDownloads(publicDir), /Catalog display differs/)
  }
  await buildCatalog(root)
  await rm(join(publicDir, result.packs[0].archiveUrl))
  await assert.rejects(verifyDownloads(publicDir), { code: 'ENOENT' })
  await buildCatalog(root)
  const server = createServer((request, response) => {
    if (request.url !== `/dsh-mojobox/${result.packs[0].archiveUrl}`) { response.writeHead(404).end(); return }
    response.end(downloaded)
  })
  await new Promise(accept => server.listen(0, '127.0.0.1', accept))
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/dsh-mojobox/${result.packs[0].archiveUrl}`)
    assert.equal(response.status, 200)
    assert.equal(digest(Buffer.from(await response.arrayBuffer())), record.sha256)
  } finally { await new Promise(accept => server.close(accept)) }
  await buildCatalog(root, { demo: true })
  await assert.rejects(verifyDownloads(publicDir), /cannot be published/)
  assert.deepEqual(await verifyDownloads(publicDir, { allowDemo: true }), { verified: 1, skinPackages: 0 })
  await writeFile(join(publicDir, result.packs[0].reportUrl), '{}')
  await assert.rejects(verifyDownloads(publicDir, { allowDemo: true }), /report\/manifest mismatch/)
  await buildCatalog(root)
  const before = await readFile(join(root, 'site/public/generated/catalog.json'))
  await writeFile(artifactPath, await archive({ ...manifest, version: '2.0.0' }))
  await assert.rejects(buildCatalog(root), /SHA-256 mismatch/)
  await writeFile(recordPath, JSON.stringify({ ...record, sha256: digest(await readFile(artifactPath)) }))
  await assert.rejects(buildCatalog(root), /identity mismatch/)
  assert.deepEqual(await readFile(join(root, 'site/public/generated/catalog.json')), before)
  await rm(recordPath)
  assert.equal((await buildCatalog(root)).packs.length, 0)
  await assert.rejects(readFile(join(root, 'site/public', result.packs[0].archiveUrl)), { code: 'ENOENT' })
})
