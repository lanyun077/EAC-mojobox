import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { test } from 'node:test'
import { collectContributors, githubReader, repository, resourceHistory } from './contributors.mjs'

const exec = promisify(execFile)
const id = 'example.pack'
const path = `catalog/feature-packs/${id}.json`
const catalog = version => ({ packs: [{ metadata: { id, version } }] })

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'mojobox-contributors-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const git = async (...args) => (await exec('git', args, { cwd: root })).stdout.trim()
  await git('init', '-b', 'main')
  await git('config', 'user.name', 'Test')
  await git('config', 'user.email', 'test@example.invalid')
  await git('commit', '--allow-empty', '-m', 'baseline')
  const baseline = await git('rev-parse', 'HEAD')
  await mkdir(join(root, 'catalog/feature-packs'), { recursive: true })
  const commit = async (version, note = '') => {
    await writeFile(join(root, path), JSON.stringify({ id, version, note }))
    await git('add', path)
    await git('commit', '-m', 'resource change')
    return git('rev-parse', 'HEAD')
  }
  const pr = (number, base, merge, user = { id: number, login: `author-${number}` }) => ({ number, base: { repo: { full_name: repository }, ref: 'main', sha: base }, merge_commit_sha: merge, merged_at: '2026-11-13T00:00:00Z', user })
  return { root, git, baseline, commit, pr }
}

test('version transitions retain original contributor, ignore copy edits and credit rollback PR', async t => {
  const f = await fixture(t)
  const first = await f.commit('1.0.0')
  await f.commit('1.0.0', 'description only')
  const updateBase = await f.git('rev-parse', 'HEAD')
  const update = await f.commit('2.0.0')
  const rollback = await f.commit('1.0.0')
  const prs = { [first]: [f.pr(1, f.baseline, first)], [update]: [f.pr(2, updateBase, update)], [rollback]: [f.pr(3, update, rollback)] }
  const readGitHub = async key => key.endsWith('/files') ? [{ filename: path, status: 'modified' }] : prs[key.split('/')[1]] || []
  const result = await collectContributors(f.root, catalog('1.0.0'), { readGitHub })
  assert.equal(result.items[0].first_submission.github_user_id, 1)
  assert.equal(result.items[0].version_submission.github_user_id, 3)
  assert.equal((await resourceHistory(f.root, path)).events.length, 3)
  assert.deepEqual(await collectContributors(f.root, catalog('1.0.0'), { readGitHub }), result)
  await assert.rejects(collectContributors(f.root, catalog('3.0.0'), { readGitHub }), /does not match/)
})

for (const mode of ['merge', 'squash', 'rebase']) {
  test(`${mode} publication reads the PR author rather than merge or commit author`, async t => {
    const f = await fixture(t)
    await f.git('checkout', '-b', 'submission')
    const introduced = await f.commit('1.0.0')
    const tip = await f.commit('1.0.0', 'extra PR copy edit')
    await f.git('checkout', 'main')
    if (mode === 'merge') await f.git('merge', '--no-ff', 'submission', '-m', 'merge PR')
    if (mode === 'squash') { await f.git('merge', '--squash', 'submission'); await f.git('commit', '-m', 'squash PR') }
    if (mode === 'rebase') await f.git('merge', '--ff-only', 'submission')
    const merged = await f.git('rev-parse', 'HEAD')
    const readGitHub = async key => key.endsWith('/files') ? [{ filename: path, status: 'added' }] :
      [merged, introduced, tip].includes(key.split('/')[1]) ? [f.pr(12, f.baseline, merged, { id: 456, login: 'submitter' })] : []
    const result = await collectContributors(f.root, catalog('1.0.0'), { readGitHub })
    assert.equal(result.items[0].first_submission.github_login, 'submitter')
    assert.equal(result.items[0].first_submission.pr_number, 12)
  })
}

test('direct pushes, offline builds, missing accounts and ambiguous associations never guess an identity', async t => {
  const f = await fixture(t)
  const first = await f.commit('1.0.0')
  const offline = await collectContributors(f.root, catalog('1.0.0'))
  assert.equal(offline.items[0].first_reason, 'not-collected')
  const direct = await collectContributors(f.root, catalog('1.0.0'), { readGitHub: async () => [] })
  assert.equal(direct.items[0].first_reason, 'direct-or-unrecorded')
  const ambiguous = await collectContributors(f.root, catalog('1.0.0'), { readGitHub: async key => key.endsWith('/files') ? [{ filename: path, status: 'added' }] : [f.pr(1, f.baseline, first), f.pr(2, f.baseline, first)] })
  assert.equal(ambiguous.items[0].first_reason, 'ambiguous')
  assert.equal(ambiguous.items[0].first_submission, null)
  for (const user of [null, { id: 10137, login: 'ghost' }]) {
    const deleted = await collectContributors(f.root, catalog('1.0.0'), { readGitHub: async key => key.endsWith('/files') ? [{ filename: path, status: 'added' }] : [f.pr(1, f.baseline, first, user)] })
    assert.equal(deleted.items[0].first_submission, null)
  }
  await assert.rejects(collectContributors(f.root, catalog('1.0.0'), { readGitHub: async () => { throw new Error('rate limited') } }), /rate limited/)
})

test('GitHub list reader paginates and fails closed on API errors', async () => {
  const paths = []
  const read = githubReader('test-token', async (url, options) => {
    paths.push(url)
    assert.equal(options.redirect, 'error')
    return { ok: true, json: async () => paths.length === 1 ? Array(100).fill({ number: 1 }) : [{ number: 2 }] }
  })
  assert.equal((await read('commits/' + 'a'.repeat(40) + '/pulls')).length, 101)
  assert.match(paths[1], /page=2/)
  await assert.rejects(githubReader('', async () => ({ ok: false, status: 403 }))('pulls/1/files'), /HTTP 403/)
})

test('one merged PR attributes every introduced pack and reuses its GitHub response', async t => {
  const f = await fixture(t)
  await writeFile(join(f.root, path), JSON.stringify({ id, version: '1.0.0' }))
  const second = 'example.second'
  const secondPath = `catalog/feature-packs/${second}.json`
  await writeFile(join(f.root, secondPath), JSON.stringify({ id: second, version: '1.0.0' }))
  await f.git('add', '.')
  await f.git('commit', '-m', 'submit two packs')
  const commit = await f.git('rev-parse', 'HEAD')
  let requests = 0
  const result = await collectContributors(f.root, { packs: [...catalog('1.0.0').packs, { metadata: { id: second, version: '1.0.0' } }] }, {
    readGitHub: async key => { requests++; return key.endsWith('/files') ? [{ filename: path, status: 'added' }, { filename: secondPath, status: 'added' }] : [f.pr(7, f.baseline, commit)] }
  })
  assert.equal(result.items.length, 2)
  assert.ok(result.items.every(item => item.first_submission.pr_number === 7))
  assert.equal(requests, 2)
})

test('rebuilding an old commit does not attribute it to a later associated PR', async t => {
  const f = await fixture(t)
  const first = await f.commit('1.0.0')
  const future = await f.commit('2.0.0')
  const result = await collectContributors(f.root, catalog('1.0.0'), { head: first,
    readGitHub: async key => key.endsWith('/files') ? [{ filename: path, status: 'modified' }] : [f.pr(1, f.baseline, first), f.pr(2, first, future)] })
  assert.equal(result.items[0].first_submission.pr_number, 1)
})
