import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { promisify } from 'node:util'
import { checkSubmission, checkSubmissionChanges } from './check-submission.mjs'

const recordPath = 'catalog/feature-packs/org.example.tools.json'
const record = { id: 'org.example.tools', version: '1.0.0', sha256: 'a'.repeat(64) }
const change = (path, status = 'M') => [{ status, path }]
const versions = (before, after) => async revision => JSON.stringify(revision === 'base' ? before : after)

test('submission gate permits new archives and display-only changes but rejects history rewrites and generated files', async () => {
  await checkSubmissionChanges(change('artifacts/org.example.tools-2.0.0.dshpack', 'A'))
  await checkSubmissionChanges(change(recordPath), versions(record, { ...record, tags: ['tools'] }))
  await checkSubmissionChanges(change(recordPath), versions(record, { ...record, version: '2.0.0', sha256: 'b'.repeat(64) }))
  await assert.rejects(checkSubmissionChanges(change(recordPath), versions(record, { ...record, sha256: 'b'.repeat(64) })), /new version/)
  await assert.rejects(checkSubmissionChanges(change(recordPath), versions(record, { ...record, id: 'another-id' })), /Stable pack id/)
  for (const status of ['M', 'D', 'T']) {
    await assert.rejects(checkSubmissionChanges(change('artifacts/org.example.tools-1.0.0.dshpack', status)), /immutable/)
  }
  for (const path of ['dist/index.html', 'dist-demo/index.html', '.cache/token.json', 'site/public/generated/catalog.json', 'node_modules/pkg/index.js']) {
    await assert.rejects(checkSubmissionChanges(change(path, 'A')), /Generated files/)
  }
  await checkSubmissionChanges(change('site/public/generated/old.json', 'D'))
})

test('changed prompt bytes require a fresh source commit, including per-author repositories', async () => {
  const before = { repository: 'https://github.com/example/skins', revision: 'a'.repeat(40), packages: [
    { id: 'test-skin', files: { manifest: 'old', prompt: 'old', readme: 'old' } }
  ] }
  const after = structuredClone(before)
  after.packages[0].files.prompt = 'new'
  const path = 'catalog/skin-prompt-packages/source.json'
  await assert.rejects(checkSubmissionChanges(change(path), versions(before, after)), /updated source commit/)
  after.packages[0].source = { repository: before.repository, revision: 'b'.repeat(40), path: 'packages/test-skin' }
  await checkSubmissionChanges(change(path), versions(before, after))
  const externalBefore = structuredClone(after)
  const externalAfter = structuredClone(after)
  externalAfter.packages[0].files.readme = 'new'
  await assert.rejects(checkSubmissionChanges(change(path), versions(externalBefore, externalAfter)), /updated source commit/)
  externalAfter.packages[0].source.revision = 'c'.repeat(40)
  await checkSubmissionChanges(change(path), versions(externalBefore, externalAfter))
  const reordered = structuredClone(before)
  reordered.packages[0].files = { readme: 'old', prompt: 'old', manifest: 'old' }
  await checkSubmissionChanges(change(path), versions(before, reordered))
})

test('plugin submission preserves published bytes and stable package identity', async () => {
  const path = 'catalog/plugin-listings/org.example.tools.json'
  const before = { id: 'org.example.tools', packageName: '@example/tools', version: '1.0.0', artifact: { format: 'npm-tgz', sha256: 'a'.repeat(64), size: 12 } }
  await checkSubmissionChanges(change(path), versions(before, { ...before, summary: 'Updated text' }))
  for (const artifact of [undefined, { ...before.artifact, size: 13 }, { ...before.artifact, sha256: 'b'.repeat(64) }]) {
    await assert.rejects(checkSubmissionChanges(change(path), versions(before, { ...before, artifact })), /new version/)
  }
  await assert.rejects(checkSubmissionChanges(change(path), versions(before, { ...before, packageName: '@other/tools' })), /Stable plugin/)
  await checkSubmissionChanges(change('artifacts/plugins/org.example.tools-2.0.0.tgz', 'A'))
  for (const status of ['M', 'D', 'T']) await assert.rejects(checkSubmissionChanges(change('artifacts/plugins/org.example.tools-1.0.0.tgz', status)), /immutable/)
})

test('Git integration checks committed changes against the merge base and rejects renamed archives', async t => {
  const root = await mkdtemp(join(tmpdir(), 'mojobox-submission-git-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const exec = promisify(execFile)
  const git = async args => (await exec('git', args, { cwd: root })).stdout.trim()
  const commit = async message => {
    await git(['add', '.'])
    await git(['-c', 'user.name=Submission tests', '-c', 'user.email=tests@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-m', message])
  }
  await git(['init'])
  await mkdir(join(root, 'artifacts'))
  await writeFile(join(root, 'artifacts/test-1.0.0.dshpack'), 'synthetic archive')
  await commit('baseline')
  const base = await git(['rev-parse', 'HEAD'])
  await writeFile(join(root, 'artifacts/test-2.0.0.dshpack'), 'synthetic new version')
  await commit('new archive')
  assert.deepEqual(await checkSubmission(base, root), { checked: 1, base })
  await git(['mv', 'artifacts/test-1.0.0.dshpack', 'artifacts/renamed-1.0.0.dshpack'])
  await commit('rename old archive')
  await assert.rejects(checkSubmission(base, root), /immutable/)
})
