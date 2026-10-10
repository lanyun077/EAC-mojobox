import { createHash } from 'node:crypto'
import { lstat, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { assertHttps, inspectPreviewImages, publishPreviewImages, verifyPreviewImages } from './preview-images.mjs'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const packageFiles = ['manifest.json', 'prompt.md', 'README.md']
const ajv = new Ajv2020({ allErrors: true })
addFormats(ajv)
const checkManifest = ajv.compile(JSON.parse(await readFile(new URL('../schemas/skin-prompt-package.schema.json', import.meta.url))))

export const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`

function validatePackageSource(source) {
  if (!source || Object.keys(source).some(key => !['repository', 'revision', 'path'].includes(key))) throw new Error('Invalid skin package source')
  assertHttps(source.repository, 'Skin package source repository')
  if (!/^[0-9a-f]{40}$/.test(source.revision)) throw new Error('Invalid skin package source revision')
  if (typeof source.path !== 'string' || !/^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/.test(source.path) || source.path.split('/').some(part => ['.', '..'].includes(part))) throw new Error('Invalid skin package source path')
}

export async function inspectSkinPromptPackage(directory, expectedFiles) {
  if (!(await lstat(directory)).isDirectory()) throw new Error('Skin package must be a regular directory')
  for (const name of packageFiles) {
    const stat = await lstat(join(directory, name))
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1024 * 1024) throw new Error(`Skin package file must be regular and at most 1 MiB: ${name}`)
  }
  const manifestBytes = await readFile(join(directory, 'manifest.json'))
  const promptBytes = await readFile(join(directory, 'prompt.md'))
  const readmeBytes = await readFile(join(directory, 'README.md'))
  const manifest = JSON.parse(manifestBytes.toString('utf8'))
  if (!checkManifest(manifest)) throw new Error(`Invalid skin prompt package: ${ajv.errorsText(checkManifest.errors)}`)
  if (manifest.id !== basename(directory)) throw new Error(`Skin package directory must equal id: ${manifest.id}`)
  if (manifest.prompt !== 'prompt.md') throw new Error(`Skin package prompt must be prompt.md: ${manifest.id}`)
  const files = { manifest: digest(manifestBytes), prompt: digest(promptBytes), readme: digest(readmeBytes) }
  if (expectedFiles) {
    for (const name of packageFiles) {
      const key = name === 'manifest.json' ? 'manifest' : name.replace('.md', '')
      if (files[key] !== expectedFiles[key]) throw new Error(`Skin package ${manifest.id} ${key} digest mismatch`)
    }
  }
  return { format: 'dsh-skin-prompt-package-v1', manifest, files }
}

export async function collectSkinPromptPackages(root = rootDir) {
  const sourceDir = join(root, 'catalog/skin-prompt-packages')
  let source
  try {
    source = JSON.parse(await readFile(join(sourceDir, 'source.json'), 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') {
      let entries = []
      try { entries = await readdir(sourceDir, { withFileTypes: true }) }
      catch (directoryError) { if (directoryError.code !== 'ENOENT') throw directoryError }
      if (entries.some(entry => entry.isDirectory() || entry.isSymbolicLink())) throw new Error('Skin prompt directories require source.json')
      return { source: null, packages: [] }
    }
    throw error
  }
  if (source.format !== 'dsh-skin-prompt-source-v1') throw new Error('Invalid skin prompt source format')
  assertHttps(source.repository, 'Skin prompt source repository')
  if (!/^[0-9a-f]{40}$/.test(source.revision)) throw new Error('Invalid skin prompt source revision')
  if (source.schemaPath !== 'skin-prompts/schema/manifest.schema.json') throw new Error('Unexpected skin prompt schema path')
  const schemaBytes = await readFile(join(root, 'schemas/skin-prompt-package.schema.json'))
  if (digest(schemaBytes) !== source.schemaDigest) throw new Error('Skin prompt schema digest mismatch')
  if (!Array.isArray(source.packages) || !source.packages.length) throw new Error('No skin prompt packages declared')
  let origins = {}
  try { origins = JSON.parse(await readFile(join(sourceDir, 'origins.json'), 'utf8')) }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  for (const [id, origin] of Object.entries(origins)) {
    if (!source.packages.some(entry => entry.id === id)) throw new Error(`Unknown skin origin: ${id}`)
    assertHttps(origin.repository, 'Skin origin repository')
    assertHttps(origin.projectUrl, 'Skin origin project')
    if (!Array.isArray(origin.previews) || !Array.isArray(origin.evidence) || !origin.evidence.length) throw new Error(`Missing skin origin references: ${id}`)
    for (const url of origin.evidence) assertHttps(url, 'Skin origin reference')
    for (const preview of origin.previews) {
      if (!preview || typeof preview !== 'object' || typeof preview.label !== 'string' || !preview.label.trim() || preview.label.length > 80) throw new Error(`Invalid skin preview label: ${id}`)
    }
  }
  const declared = new Set()
  const packages = []
  for (const entry of source.packages) {
    if (!entry || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id) || entry.path !== `packages/${entry.id}` || declared.has(entry.id)) throw new Error(`Invalid or duplicate skin package record: ${entry?.id || 'unknown'}`)
    declared.add(entry.id)
    if (!entry.files || !['manifest', 'prompt', 'readme'].every(key => /^sha256:[0-9a-f]{64}$/.test(entry.files[key]))) throw new Error(`Missing skin package file digests: ${entry.id}`)
    const packageSource = entry.source ?? { repository: source.repository, revision: source.revision, path: `skin-prompts/${entry.path}` }
    validatePackageSource(packageSource)
    const directory = join(sourceDir, entry.id)
    const inspected = await inspectSkinPromptPackage(directory, entry.files)
    const previewImages = await inspectPreviewImages(root, entry.id, origins[entry.id]?.previews)
    packages.push({ ...inspected, source: packageSource, path: entry.path, origin: origins[entry.id], previewImages })
  }
  const directories = (await readdir(sourceDir, { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name).sort()
  if (JSON.stringify(directories) !== JSON.stringify([...declared].sort())) throw new Error('Undeclared skin prompt package directory')
  return { source, packages }
}

export async function buildSkinPromptCatalog(root = rootDir, output = join(root, 'site/public/generated')) {
  const { source, packages } = await collectSkinPromptPackages(root)
  const skinOutput = join(output, 'skin-packages')
  await mkdir(skinOutput, { recursive: true })
  const entries = []
  for (const item of packages) {
    const manifest = item.manifest
    const target = join(skinOutput, manifest.id)
    const previews = await publishPreviewImages(item.previewImages, output)
    await mkdir(target, { recursive: true })
    for (const name of packageFiles) await writeFile(join(target, name), await readFile(join(root, 'catalog/skin-prompt-packages', manifest.id, name)))
    entries.push({
      format: item.format,
      metadata: { id: manifest.id, name: manifest.name, nameEn: manifest.nameEn || '', description: manifest.description || '', tags: manifest.tags || [], category: 'appearance' },
      author: manifest.author,
      source: item.source,
      origin: item.origin ? { ...item.origin, previews: previews.previews } : undefined,
      previewFiles: previews.previewFiles,
      sources: manifest.sources,
      references: manifest.references,
      license: manifest.references.license.spdx,
      target: manifest.target,
      themes: manifest.target.themes,
      requiredPromptSections: manifest.requiredPromptSections,
      files: item.files,
      manifestUrl: `generated/skin-packages/${manifest.id}/manifest.json`,
      promptUrl: `generated/skin-packages/${manifest.id}/prompt.md`,
      readmeUrl: `generated/skin-packages/${manifest.id}/README.md`,
      runtime: 'not-applicable',
      installable: false
    })
  }
  const catalog = { apiVersion: 'catalog.mojobox.dev/v1alpha1', format: 'dsh-skin-prompt-catalog-v1', source, packages: entries }
  await writeFile(join(output, 'skin-catalog.json'), JSON.stringify(catalog, null, 2) + '\n')
  return catalog
}

export async function verifySkinPromptCatalog(directory) {
  let catalog
  try {
    catalog = JSON.parse(await readFile(join(directory, 'generated/skin-catalog.json'), 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return { verified: 0 }
    throw error
  }
  if (catalog.format !== 'dsh-skin-prompt-catalog-v1' || !Array.isArray(catalog.packages)) throw new Error('Expected skin prompt catalog')
  for (const entry of catalog.packages) {
    const id = entry.metadata?.id
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || entry.manifestUrl !== `generated/skin-packages/${id}/manifest.json` || entry.promptUrl !== `generated/skin-packages/${id}/prompt.md` || entry.readmeUrl !== `generated/skin-packages/${id}/README.md`) throw new Error('Skin prompt download path mismatch')
    if (entry.installable !== false || entry.runtime !== 'not-applicable') throw new Error('Skin prompt runtime claim mismatch')
    await inspectSkinPromptPackage(join(directory, `generated/skin-packages/${id}`), entry.files)
    await verifyPreviewImages(directory, id, entry.origin?.previews, entry.previewFiles)
  }
  return { verified: catalog.packages.length }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length > 2) throw new Error('Usage: node scripts/skin-prompt-package.mjs')
    const catalog = await buildSkinPromptCatalog()
    console.log(`Validated and collected ${catalog.packages.length} skin prompt packages.`)
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
