import { execFile } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const exec = promisify(execFile)
const rootDir = fileURLToPath(new URL('../', import.meta.url))
export const repository = 'lanyun077/EAC-mojobox'

// Follow the published branch, so a merge has one resource transition. Rebase
// commits are matched to the merged PR through GitHub's commit associations.
export async function resourceHistory(root, path, head = 'HEAD') {
  const git = async args => (await exec('git', args, { cwd: root, maxBuffer: 16 * 1024 * 1024 })).stdout.trim()
  const commits = (await git(['log', '--first-parent', '--reverse', '--format=%H', head, '--', path])).split('\n').filter(Boolean)
  const events = []
  let previous
  for (const commit of commits) {
    if (!await git(['ls-tree', commit, '--', path])) continue
    const record = JSON.parse(await git(['show', `${commit}:${path}`]))
    if (record.version !== previous) events.push({ commit, version: record.version, id: record.id, path })
    previous = record.version
  }
  return { git, events }
}

export function githubReader(token, fetcher = fetch) {
  return async path => {
    const items = []
    for (let page = 1; ; page++) {
      const response = await fetcher(`https://api.github.com/repos/${repository}/${path}?per_page=100&page=${page}`, {
        headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        signal: AbortSignal.timeout(15000), redirect: 'error'
      })
      if (!response.ok) throw new Error(`GitHub contributor lookup failed: HTTP ${response.status}`)
      const value = await response.json()
      if (!Array.isArray(value)) throw new Error('Invalid GitHub list response')
      items.push(...value)
      if (value.length < 100) return items
    }
  }
}

export async function collectContributors(root, catalog, { readGitHub, head = 'HEAD' } = {}) {
  const git = async args => (await exec('git', args, { cwd: root, maxBuffer: 16 * 1024 * 1024 })).stdout.trim()
  const commit = await git(['rev-parse', '--verify', `${head}^{commit}`])
  if (readGitHub && await git(['rev-parse', '--is-shallow-repository']) === 'true') throw new Error('Contributor collection requires full Git history')
  const requests = new Map()
  const read = path => {
    if (!requests.has(path)) requests.set(path, readGitHub(path))
    return requests.get(path)
  }
  const attribution = async (event, history) => {
    const candidates = []
    for (const pr of await read(`commits/${event.commit}/pulls`)) {
      if (!pr.merged_at || pr.base?.repo?.full_name !== repository || pr.base.ref !== 'main') continue
      if (!Number.isSafeInteger(pr.number) || pr.number < 1 || !/^[a-f0-9]{40}$/.test(pr.merge_commit_sha) || !/^[a-f0-9]{40}$/.test(pr.base.sha)) throw new Error('Invalid GitHub PR identity')
      if (!(await read(`pulls/${pr.number}/files`)).some(file => file.filename === event.path && file.status !== 'removed')) continue
      // Verify actual version changes instead of trusting a PR title or body.
      try { await history.git(['merge-base', '--is-ancestor', pr.merge_commit_sha, commit]) }
      catch (error) { if (error.code === 1) continue; throw error }
      const after = JSON.parse(await history.git(['show', `${pr.merge_commit_sha}:${event.path}`]))
      const before = await history.git(['ls-tree', pr.base.sha, '--', event.path])
      const old = before ? JSON.parse(await history.git(['show', `${pr.base.sha}:${event.path}`])) : null
      if (after.id !== event.id || after.version !== event.version || old?.version === after.version) continue
      if (!pr.user || pr.user.login === 'ghost') continue
      if (!Number.isSafeInteger(pr.user.id) || pr.user.id < 1 || !/^[a-z0-9](?:[a-z0-9-]{0,38})$/i.test(pr.user.login) || !Number.isFinite(Date.parse(pr.merged_at))) throw new Error('Invalid GitHub contributor identity')
      candidates.push({ github_user_id: pr.user.id, github_login: pr.user.login, pr_number: pr.number, merged_at: pr.merged_at })
    }
    return candidates.length === 1 ? { value: candidates[0], reason: null } : { value: null, reason: candidates.length ? 'ambiguous' : 'direct-or-unrecorded' }
  }
  const items = []
  for (const pack of catalog.packs) {
    const { id, version } = pack.metadata
    const item = { kind: 'pack', resource_id: id, version, first_submission: null, version_submission: null, first_reason: 'not-collected', version_reason: 'not-collected' }
    if (readGitHub) {
      const history = await resourceHistory(root, `catalog/feature-packs/${id}.json`, commit)
      const first = history.events[0]
      const current = history.events.at(-1)
      if (!current || current.version !== version || current.id !== id) throw new Error(`Catalog does not match committed contributor history: ${id}`)
      const initial = await attribution(first, history)
      const latest = first === current ? initial : await attribution(current, history)
      Object.assign(item, { first_submission: initial.value, first_reason: initial.reason, version_submission: latest.value, version_reason: latest.reason })
    }
    items.push(item)
  }
  return { format: 'mojobox-contributors-v1', repository, git_commit: commit, items: items.sort((a, b) => a.resource_id.localeCompare(b.resource_id)) }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2)
    const online = args.includes('--github')
    const directory = args.find(arg => !arg.startsWith('--')) || 'dist/generated'
    if (args.some(arg => arg.startsWith('--') && arg !== '--github')) throw new Error('Usage: node scripts/contributors.mjs [generated-directory] [--github]')
    const catalog = JSON.parse(await readFile(resolve(rootDir, directory, 'catalog.json'), 'utf8'))
    const result = await collectContributors(rootDir, catalog, { readGitHub: online ? githubReader(process.env.GITHUB_TOKEN) : undefined })
    await writeFile(resolve(rootDir, directory, 'contributors.json'), JSON.stringify(result, null, 2) + '\n')
    console.log(`Collected contributor records for ${result.items.length} packs (${online ? 'GitHub verified' : 'offline'}).`)
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
