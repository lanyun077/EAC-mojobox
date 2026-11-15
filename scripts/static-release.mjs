import { readFile, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectContributors, githubReader, repository } from './contributors.mjs'
import { catalogTimes, addSnapshot, rankings } from './download-stats.mjs'
import { githubClient, publishPacks, sampleDownloads, releaseUrl, hash } from './release-assets.mjs'
import { verifyDownloads } from './verify-downloads.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const json = value => JSON.stringify(value, null, 2) + '\n'
const branch = 'metrics-data'

export async function readHistory(api) {
  const ref = await api(`git/ref/heads/${branch}`, { missing: true })
  if (!ref) return { parent: null, state: { format: 'mojobox-download-history-v1', releases: [], snapshots: [] } }
  const commit = await api(`git/commits/${ref.object.sha}`)
  const tree = await api(`git/trees/${commit.tree.sha}`)
  const entry = tree.tree.find(item => item.path === 'history.json' && item.type === 'blob')
  if (!entry) throw new Error('Saved download history is missing')
  const file = await api(`git/blobs/${entry.sha}`)
  const state = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'))
  if (state.format !== 'mojobox-download-history-v1' || !Array.isArray(state.releases) || !Array.isArray(state.snapshots)) throw new Error('Invalid saved download history')
  for (const item of state.releases) {
    if (!Number.isSafeInteger(item.asset_id) || !Number.isSafeInteger(item.release_id) || item.url !== releaseUrl(item.resource_id, item.version) || !/^[a-f0-9]{64}$/.test(item.sha256)) throw new Error('Invalid saved release mapping')
  }
  let previous = []
  for (const snapshot of state.snapshots) previous = addSnapshot(previous, snapshot.counts, snapshot.at)
  return { parent: ref.object.sha, state }
}

export async function saveHistory(api, state, parent) {
  const tree = await api('git/trees', { method: 'POST', body: { tree: [{ path: 'history.json', mode: '100644', type: 'blob', content: json(state) }] } })
  const commit = await api('git/commits', { method: 'POST', body: { message: '更新整合包下载快照', tree: tree.sha, parents: parent ? [parent] : [] } })
  if (parent) await api(`git/refs/heads/${branch}`, { method: 'PATCH', body: { sha: commit.sha, force: false } })
  else await api('git/refs', { method: 'POST', body: { ref: `refs/heads/${branch}`, sha: commit.sha } })
}

export async function prepareStatic(directory, { api, token, commit, at = new Date().toISOString() } = {}) {
  await verifyDownloads(directory, { basePath: '/' })
  const file = join(directory, 'generated/catalog.json')
  const catalog = JSON.parse(await readFile(file, 'utf8'))
  const contributors = await collectContributors(root, catalog, { readGitHub: githubReader(token) })
  const saved = await readHistory(api)
  const mappings = await publishPacks(catalog, directory, saved.state.releases, api, { commit })
  const times = await catalogTimes(root, catalog)
  let snapshots = saved.state.snapshots
  let stale = false
  try {
    snapshots = addSnapshot(snapshots, await sampleDownloads(mappings, api), at)
  } catch (error) {
    stale = true
    console.warn(`::warning::Download statistics unchanged: ${error.message}`)
  }
  // Persist release identities even if statistics are unavailable. A non-fast-forward
  // update fails instead of overwriting a concurrent history writer.
  try {
    await saveHistory(api, { ...saved.state, releases: mappings, snapshots }, saved.parent)
  } catch (error) {
    // New attachment identities must be durable before a new catalog goes live.
    if (JSON.stringify(mappings) !== JSON.stringify(saved.state.releases)) throw error
    snapshots = saved.state.snapshots
    stale = true
    console.warn(`::warning::Download history unchanged: ${error.message}`)
  }
  await writeFile(file, json(catalog))
  await writeFile(join(directory, 'generated/contributors.json'), json(contributors))
  await writeFile(join(directory, 'generated/release-assets.json'), json({ format: 'mojobox-release-assets-v1', repository, items: mappings }))
  await writeFile(join(directory, 'generated/rankings.json'), json(rankings(times, mappings, snapshots, { stale })))
  await verifyDownloads(directory, { basePath: '/' })
  const names = ['catalog.json', 'contributors.json', 'release-assets.json', 'rankings.json']
  const digests = Object.fromEntries(await Promise.all(names.map(async name => [name, hash(await readFile(join(directory, 'generated', name)))])))
  await writeFile(join(directory, 'generated/release.json'), json({ format: 'mojobox-static-release-v2', git_commit: commit, files: digests }))
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (!process.env.GITHUB_TOKEN || !/^[a-f0-9]{40}$/.test(process.env.MOJOBOX_SOURCE_COMMIT || '')) throw new Error('Trusted release requires GITHUB_TOKEN and MOJOBOX_SOURCE_COMMIT')
    if (process.env.GITHUB_ACTIONS !== 'true' || process.env.GITHUB_REPOSITORY !== repository || process.env.GITHUB_REF !== 'refs/heads/main') throw new Error('Publication is restricted to the official main workflow')
    await prepareStatic(resolve(process.argv[2] || 'dist'), { api: githubClient(process.env.GITHUB_TOKEN), token: process.env.GITHUB_TOKEN, commit: process.env.MOJOBOX_SOURCE_COMMIT })
  } catch (error) { console.error(error.message); process.exitCode = 1 }
}
