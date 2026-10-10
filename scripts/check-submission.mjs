import { execFile } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const exec = promisify(execFile)
const rootDir = fileURLToPath(new URL('../', import.meta.url))

export async function checkSubmissionChanges(changes, readAtRevision) {
  for (const { status, path } of changes) {
    if (status !== 'D' && /^(?:dist|dist-demo|\.cache|node_modules|site\/public\/generated)\//.test(path)) throw new Error(`Generated files must not be submitted: ${path}`)
    if (/^artifacts\/.*\.dshpack$/.test(path) && status !== 'A') throw new Error(`Published archive is immutable; add a new version instead: ${path}`)
    if (/^artifacts\/plugins\/.*\.tgz$/.test(path) && status !== 'A') throw new Error(`Published plugin artifact is immutable: ${path}`)
    if (/^catalog\/plugin-listings\/[^/]+\.json$/.test(path) && status === 'M') {
      const before = JSON.parse(await readAtRevision('base', path))
      const after = JSON.parse(await readAtRevision('head', path))
      if (before.id !== after.id || before.packageName !== after.packageName) throw new Error(`Stable plugin identity must not change: ${path}`)
      if (before.version === after.version && before.artifact && (!after.artifact || before.artifact.sha256 !== after.artifact.sha256 || before.artifact.size !== after.artifact.size || before.artifact.format !== after.artifact.format)) throw new Error(`Changed plugin artifact requires a new version: ${path}`)
    }
    if (/^catalog\/feature-packs\/[^/]+\.json$/.test(path) && status === 'M') {
      const before = JSON.parse(await readAtRevision('base', path))
      const after = JSON.parse(await readAtRevision('head', path))
      if (before.id !== after.id) throw new Error(`Stable pack id must not change: ${path}`)
      if (before.version === after.version && before.sha256 !== after.sha256) throw new Error(`Changed archive bytes require a new version: ${path}`)
    }
    if (path === 'catalog/skin-prompt-packages/source.json' && status === 'M') {
      const before = JSON.parse(await readAtRevision('base', path))
      const after = JSON.parse(await readAtRevision('head', path))
      for (const entry of after.packages) {
        const old = before.packages.find(item => item.id === entry.id)
        if (!old || ['manifest', 'prompt', 'readme'].every(key => old.files?.[key] === entry.files?.[key])) continue
        const oldSource = old.source ?? before
        const newSource = entry.source ?? after
        if (oldSource.repository === newSource.repository && oldSource.revision === newSource.revision) throw new Error(`Changed skin prompt files require an updated source commit: ${entry.id}`)
      }
    }
  }
}

export async function checkSubmission(base, root = rootDir) {
  const git = async args => (await exec('git', args, { cwd: root, maxBuffer: 10 * 1024 * 1024 })).stdout
  const commit = (await git(['rev-parse', '--verify', '--end-of-options', `${base}^{commit}`])).trim()
  const ancestor = (await git(['merge-base', commit, 'HEAD'])).trim()
  const tokens = (await git(['diff', '--no-renames', '--name-status', '-z', ancestor, 'HEAD'])).split('\0').filter(Boolean)
  const changes = []
  for (let index = 0; index < tokens.length; index += 2) changes.push({ status: tokens[index], path: tokens[index + 1] })
  await checkSubmissionChanges(changes, (revision, path) => git(['show', `${revision === 'base' ? ancestor : 'HEAD'}:${path}`]))
  return { checked: changes.length, base: ancestor }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const base = process.argv[2] || process.env.SUBMISSION_BASE_REF
    if (!base || process.argv.length > 3) throw new Error('Usage: npm run check:submission -- <base-ref> (checks committed changes only)')
    console.log(await checkSubmission(base))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
