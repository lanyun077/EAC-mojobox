import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { releaseUrl, publishPacks, releaseBytes, githubClient, sampleDownloads, hash } from './release-assets.mjs'
import { addSnapshot, rankings } from './download-stats.mjs'
import { readHistory, saveHistory } from './static-release.mjs'
import { verifyStatic } from './verify-static.mjs'

test('release downloads follow only HTTPS GitHub asset redirects without forwarding credentials', async () => {
  const calls = []
  const bytes = Buffer.from('raw pack')
  const url = releaseUrl('org.example.pack', '1.0.0+build')
  const fetcher = async (target, options) => {
    calls.push({ target: String(target), options })
    return calls.length === 1 ? new Response(null, { status: 302, headers: { location: 'https://release-assets.githubusercontent.com/asset?sig=signed' } }) : new Response(bytes)
  }
  assert.deepEqual(await releaseBytes(url, bytes.length, fetcher), bytes)
  assert.equal(calls.length, 2)
  assert.ok(calls.every(call => !call.options.headers))
  for (const location of ['http://release-assets.githubusercontent.com/asset', 'https://evil.example/a', 'https://name:secret@release-assets.githubusercontent.com/a', 'http://127.0.0.1/a']) {
    await assert.rejects(releaseBytes(url, 100, async () => new Response(null, { status: 302, headers: { location } })), /Untrusted/)
  }
  await assert.rejects(releaseBytes(url, 1, async () => new Response(bytes)), /size limit/)
  await assert.rejects(releaseBytes(url, 100, async () => new Response(null, { status: 302, headers: { location: 'https://release-assets.githubusercontent.com/a' } })), /Too many/)
})

test('GitHub collection reads every page and does not treat denied access as an empty list', async () => {
  const urls = []
  const api = githubClient('test-token', async (url, options) => {
    urls.push(url)
    assert.equal(options.redirect, 'error')
    assert.equal(options.headers.Authorization, 'Bearer test-token')
    return Response.json(url.endsWith('page=1') ? Array(100).fill({ id: 1 }) : [{ id: 2 }])
  })
  assert.equal((await api.list('releases')).length, 101)
  assert.equal(urls.length, 2)
  await assert.rejects(githubClient('', async () => new Response(null, { status: 403 })).list('releases'), /HTTP 403/)
})

async function publishing(t) {
  const directory = await mkdtemp(join(tmpdir(), 'mojobox-release-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  await mkdir(join(directory, 'generated/downloads'), { recursive: true })
  const bytes = Buffer.from('unchanged author archive')
  await writeFile(join(directory, 'generated/downloads/org.example.pack-1.0.0.dshpack'), bytes)
  const catalog = { packs: [{ metadata: { id: 'org.example.pack', version: '1.0.0', name: 'Example' }, archiveSize: bytes.length, archiveDigest: `sha256:${hash(bytes)}` }] }
  const state = { release: null, assets: [], created: 0, uploaded: 0 }
  const api = async (path, options = {}) => {
    if (path.startsWith('releases/tags/')) return state.release
    if (path === 'releases') { state.created++; return state.release = { id: 1, tag_name: options.body.tag_name, draft: true, prerelease: false } }
    if (path.startsWith('releases/1/assets?')) {
      state.uploaded++
      const asset = { id: 2, state: 'uploaded', name: 'org.example.pack-1.0.0.dshpack', size: bytes.length, digest: `sha256:${hash(bytes)}`, download_count: 5 }
      state.assets.push(asset); return asset
    }
    if (path === 'releases/1') { state.release.draft = false; return state.release }
    if (path === 'releases/assets/2') return state.assets[0]
    throw new Error(`Unexpected request: ${path}`)
  }
  api.list = async path => path === 'releases' ? state.release ? [state.release] : [] : state.assets
  return { directory, bytes, catalog, state, api, options: { commit: 'a'.repeat(40), download: async () => bytes } }
}

test('release publication resumes after upload failure without replacing or duplicating the attachment', async t => {
  const env = await publishing(t)
  await assert.rejects(publishPacks(env.catalog, env.directory, [], env.api, { ...env.options, download: async () => { throw new Error('offline') } }), /offline/)
  const mappings = await publishPacks(env.catalog, env.directory, [], env.api, env.options)
  await publishPacks(env.catalog, env.directory, mappings, env.api, env.options)
  assert.equal(env.state.created, 1)
  assert.equal(env.state.uploaded, 1)
  assert.equal(env.catalog.packs[0].archiveUrl, releaseUrl('org.example.pack', '1.0.0'))
  assert.deepEqual(await sampleDownloads(mappings, env.api), [{ asset_id: 2, count: 5 }])
  env.state.assets[0].id = 3
  await assert.rejects(publishPacks(env.catalog, env.directory, mappings, env.api, env.options), /identity mismatch/)
  env.state.assets = []
  await assert.rejects(publishPacks(env.catalog, env.directory, mappings, env.api, env.options), /missing/)
})

test('same-version bytes and corrupted remote attachments stop publication', async t => {
  const env = await publishing(t)
  const mappings = await publishPacks(env.catalog, env.directory, [], env.api, env.options)
  await assert.rejects(publishPacks(env.catalog, env.directory, [{ ...mappings[0], sha256: 'b'.repeat(64) }], env.api, env.options), /version changed/)
  await assert.rejects(publishPacks(env.catalog, env.directory, mappings, env.api, { ...env.options, download: async () => Buffer.from('bad') }), /digest mismatch/)
})

test('publication resumes a draft when tag lookup cannot find unpublished releases', async t => {
  const env = await publishing(t)
  const api = async (path, options) => {
    if (path.startsWith('releases/tags/') && env.state.release?.draft) return null
    if (path.startsWith('releases/1/assets?') && !env.state.uploaded) {
      env.state.uploaded++
      throw new Error('upload interrupted')
    }
    return env.api(path, options)
  }
  api.list = env.api.list
  await assert.rejects(publishPacks(env.catalog, env.directory, [], api, env.options), /upload interrupted/)
  await publishPacks(env.catalog, env.directory, [], api, env.options)
  assert.equal(env.state.created, 1)
  assert.equal(env.state.assets.length, 1)
  assert.equal(env.state.release.draft, false)
})

const mappings = [{ resource_id: 'pack', version: '1.0.0', asset_id: 1 }]
const times = [{ kind: 'pack', resource_id: 'pack', version: '1.0.0', first_seen_at: null, version_seen_at: null }]
const sample = (at, count) => ({ at, counts: [{ asset_id: 1, count }] })

test('weekly downloads use retained baselines, combine versions and never invent missing days', () => {
  const snapshots = [sample('2026-11-01T03:00:00Z', 10), sample('2026-11-08T03:30:00Z', 28)]
  const result = rankings(times, mappings, snapshots)
  assert.equal(result.items[0].downloads_7d, 18)
  assert.equal(result.items[0].downloads_all, 28)
  assert.equal(rankings(times, mappings, snapshots.slice(1)).items[0].downloads_7d, null)
  assert.equal(rankings(times, mappings, [snapshots[0], sample('2026-11-12T03:00:00Z', 30)]).items[0].downloads_7d, null)
  const twoVersions = [...mappings, { resource_id: 'pack', version: '2.0.0', asset_id: 2 }]
  snapshots[1].counts.push({ asset_id: 2, count: 7 })
  assert.equal(rankings([{ ...times[0], version: '2.0.0' }], twoVersions, snapshots).items[0].downloads_7d, 25)
  assert.equal(rankings(times, twoVersions, snapshots.slice(0, 1), { stale: true }).items[0].downloads_all, null)
})

test('new samples retain the first daily baseline and reject reset counters', () => {
  let history = addSnapshot([], sample('2026-11-01T01:00:00Z', 10).counts, '2026-11-01T01:00:00Z')
  history = addSnapshot(history, sample('', 12).counts, '2026-11-01T02:00:00Z')
  history = addSnapshot(history, sample('', 20).counts, '2026-11-01T03:00:00Z')
  assert.deepEqual(history.map(item => item.counts[0].count), [10, 20])
  assert.throws(() => addSnapshot(history, sample('', 0).counts, '2026-11-02T03:00:00Z'), /backwards/)
  assert.throws(() => addSnapshot(history, sample('', 20).counts, '2026-10-01T03:00:00Z'), /backwards/)
  const plugin = rankings([{ ...times[0], kind: 'plugin' }], mappings, history).items[0]
  assert.equal(plugin.downloads_all, null)
})

test('history gets an independent root commit and later updates cannot force-overwrite a concurrent writer', async () => {
  const calls = []
  const api = async (path, options = {}) => { calls.push({ path, ...options }); return { sha: 'a'.repeat(40) } }
  await saveHistory(api, { format: 'mojobox-download-history-v1', releases: [], snapshots: [] }, null)
  assert.deepEqual(calls[1].body.parents, [])
  assert.equal(calls[2].body.ref, 'refs/heads/metrics-data')
  calls.length = 0
  await saveHistory(api, {}, 'b'.repeat(40))
  assert.deepEqual(calls[1].body.parents, ['b'.repeat(40)])
  assert.equal(calls[2].body.force, false)
  assert.equal((await readHistory(async () => null)).state.snapshots.length, 0)
  await assert.rejects(readHistory(async () => { throw new Error('HTTP 403') }), /403/)
})

test('history reads an immutable commit tree and refuses missing or corrupted saved data', async () => {
  const state = { format: 'mojobox-download-history-v1', releases: [], snapshots: [sample('2026-11-01T03:00:00Z', 10)] }
  const calls = []
  const api = async path => {
    calls.push(path)
    if (path === 'git/ref/heads/metrics-data') return { object: { sha: 'saved-commit' } }
    if (path === 'git/commits/saved-commit') return { tree: { sha: 'saved-tree' } }
    if (path === 'git/trees/saved-tree') return { tree: [{ path: 'history.json', type: 'blob', sha: 'saved-blob' }] }
    if (path === 'git/blobs/saved-blob') return { content: Buffer.from(JSON.stringify(state)).toString('base64') }
    throw new Error(`Unexpected request: ${path}`)
  }
  assert.deepEqual(await readHistory(api), { parent: 'saved-commit', state })
  assert.deepEqual(calls, ['git/ref/heads/metrics-data', 'git/commits/saved-commit', 'git/trees/saved-tree', 'git/blobs/saved-blob'])
  await assert.rejects(readHistory(path => path === 'git/trees/saved-tree' ? { tree: [] } : api(path)), /missing/)
  state.format = 'unknown'
  await assert.rejects(readHistory(api), /Invalid saved/)
  state.format = 'mojobox-download-history-v1'
  state.snapshots.push(sample('2026-11-02T03:00:00Z', 1))
  await assert.rejects(readHistory(api), /backwards/)
})

test('production verification detects mixed releases, changed metadata, entry assets and downloads', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'mojobox-production-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  await mkdir(join(directory, 'generated'), { recursive: true })
  const pack = Buffer.from('original pack')
  const plugin = Buffer.from('original plugin')
  const catalog = { packs: [{ metadata: { id: 'org.example.pack', version: '1.0.0' }, archiveUrl: releaseUrl('org.example.pack', '1.0.0'), archiveSize: pack.length, archiveDigest: `sha256:${hash(pack)}` }], plugins: [{ archiveUrl: 'plugin.tgz' }] }
  const files = { 'index.html': '<html><script src="/entry.js"></script><link href="/style.css" rel="stylesheet"></html>', 'entry.js': '/* app */', 'style.css': 'body {}', 'plugin.tgz': plugin, 'generated/catalog.json': JSON.stringify(catalog), 'generated/rankings.json': '{}' }
  files['generated/release.json'] = JSON.stringify({ files: Object.fromEntries(['catalog.json', 'rankings.json'].map(name => [name, hash(files[`generated/${name}`])])) })
  for (const [name, bytes] of Object.entries(files)) await writeFile(join(directory, name), bytes)
  let changed = null
  let markers = 0
  const fetcher = async target => {
    const url = new URL(target)
    if (url.hostname === 'github.com') return new Response(changed === 'pack' ? Buffer.from('corrupt') : pack)
    const path = url.pathname.slice(1) || 'index.html'
    if (path === 'generated/release.json') markers++
    const bytes = changed === path || changed === 'mixed-release' && path === 'generated/release.json' && markers > 1 ? 'changed' : files[path]
    return new Response(bytes, { status: bytes === undefined ? 404 : 200 })
  }
  await verifyStatic(directory, 'https://mojobox.cn', fetcher)
  for (const [path, message] of [['generated/rankings.json', /metadata mismatch/], ['entry.js', /entry asset mismatch/], ['plugin.tgz', /plugin download mismatch/], ['pack', /pack digest mismatch/], ['mixed-release', /marker mismatch/]]) {
    changed = path
    markers = 0
    await assert.rejects(verifyStatic(directory, 'https://mojobox.cn', fetcher), message)
  }
})
