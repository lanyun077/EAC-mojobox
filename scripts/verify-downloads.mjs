import { readFile, readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { inspectFeaturePack } from './feature-pack.mjs'
import { verifySkinPromptCatalog } from './skin-prompt-package.mjs'
import { verifyPreviewImages } from './preview-images.mjs'
import { inspectPluginArtifact, pluginFilename, validatePluginListing } from './plugin-listing.mjs'
import { verifyPluginIndex } from './plugin-index.mjs'

export async function verifyDownloads(directory, { allowDemo = false, basePath } = {}) {
  if (basePath !== undefined) {
    if (!basePath.startsWith('/') || !basePath.endsWith('/')) throw new Error('Expected absolute deployment base path with trailing slash')
    const html = await readFile(join(directory, 'index.html'), 'utf8')
    // Vite emits double-quoted script and link URLs in the built entry page.
    const resources = [...html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)="([^"]+)"/g)].map(match => match[1])
    if (!resources.some(resource => resource.endsWith('.js'))) throw new Error('Missing site entry script')
    for (const resource of resources) {
      const url = new URL(resource, 'https://mojobox.invalid')
      if (url.origin !== 'https://mojobox.invalid' || !url.pathname.startsWith(basePath)) throw new Error(`Site resource outside deployment base: ${resource}`)
      await readFile(join(directory, url.pathname.slice(basePath.length)))
    }
  }
  const catalog = JSON.parse(await readFile(join(directory, 'generated/catalog.json'), 'utf8'))
  if (catalog.mode !== 'intake' || !Array.isArray(catalog.packs)) throw new Error('Expected intake catalog')
  if (catalog.demo && !allowDemo) throw new Error('Test demo cannot be published')
  const files = []
  for (const plugin of catalog.plugins || []) {
    if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(plugin.id)) throw new Error('Invalid plugin download identity')
    const listingUrl = `generated/plugins/${plugin.id}.json`
    if (plugin.listingUrl !== listingUrl || plugin.runtime !== 'not-tested') throw new Error('Plugin listing path/runtime mismatch')
    const record = validatePluginListing(JSON.parse(await readFile(join(directory, listingUrl), 'utf8')))
    for (const key of Object.keys(record)) {
      if (JSON.stringify(record[key]) !== JSON.stringify(plugin[key])) throw new Error('Plugin display differs from listing')
    }
    if (record.artifact) {
      const filename = pluginFilename(record)
      if (plugin.archiveUrl !== `generated/downloads/${filename}` || plugin.reportUrl !== `generated/reports/${record.id}.plugin.json` || plugin.checks !== 'artifact-checked') throw new Error('Plugin download path/check mismatch')
      const report = await inspectPluginArtifact(await readFile(join(directory, plugin.archiveUrl)), record)
      const stored = JSON.parse(await readFile(join(directory, plugin.reportUrl), 'utf8'))
      if (JSON.stringify(report) !== JSON.stringify(stored) || JSON.stringify(report.packageMetadata) !== JSON.stringify(plugin.packageMetadata)) throw new Error('Plugin download report mismatch')
      files.push(filename)
    } else if (plugin.archiveUrl || plugin.reportUrl || plugin.checks !== 'metadata-only') throw new Error('Source-only plugin cannot claim a download')
  }
  for (const pack of catalog.packs) {
    const { id, version } = pack.metadata
    if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(id) || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) throw new Error('Invalid download identity')
    if (!['function', 'appearance', 'workflow'].includes(pack.metadata.category)) throw new Error('Invalid download category')
    if (pack.metadata.category === 'appearance' && !pack.appearance) throw new Error('Appearance metadata is missing')
    const filename = `${id}-${version}.dshpack`
    if (pack.archiveUrl !== `generated/downloads/${filename}` || pack.packUrl !== `generated/packs/${id}.json` || pack.reportUrl !== `generated/reports/${id}.json`) throw new Error('Download path mismatch')
    if (!/^sha256:[a-f0-9]{64}$/.test(pack.archiveDigest)) throw new Error('Missing download digest')
    const bytes = await readFile(join(directory, pack.archiveUrl))
    const report = await inspectFeaturePack(bytes, pack.archiveDigest.slice(7))
    if (report.manifest.id !== id || report.manifest.version !== version || report.size !== pack.archiveSize) throw new Error('Download metadata mismatch')
    const m = report.manifest
    if (pack.format !== report.format || pack.metadata.name !== m.name || pack.metadata.description !== (m.description || '') ||
        JSON.stringify(pack.components) !== JSON.stringify(m.plugins) || JSON.stringify(pack.requires) !== JSON.stringify(m.requires || {}) ||
        JSON.stringify(pack.checks) !== JSON.stringify(report.checks) || JSON.stringify(pack.versionDeclarations) !== JSON.stringify(report.versionDeclarations) ||
        JSON.stringify(pack.warnings) !== JSON.stringify(report.warnings) || pack.runtime !== report.runtime) throw new Error('Catalog display differs from inspected archive')
    const storedReport = JSON.parse(await readFile(join(directory, pack.reportUrl), 'utf8'))
    const storedManifest = JSON.parse(await readFile(join(directory, pack.packUrl), 'utf8'))
    if (JSON.stringify(report) !== JSON.stringify(storedReport) || JSON.stringify(report.manifest) !== JSON.stringify(storedManifest)) throw new Error('Download report/manifest mismatch')
    files.push(filename)
    await verifyPreviewImages(directory, id, pack.previews ?? pack.appearance?.previews ?? [], pack.previewFiles)
  }
  if (JSON.stringify((await readdir(join(directory, 'generated/downloads'))).sort()) !== JSON.stringify(files.sort())) throw new Error('Unexpected or duplicate download entries')
  await verifyPluginIndex(directory, catalog, { allowDemo })
  const skinVerification = await verifySkinPromptCatalog(directory)
  return { verified: files.length, skinPackages: skinVerification.verified }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  if (args.length > 2 || (args[1] && args[1] !== '--allow-demo')) throw new Error('Usage: npm run verify:downloads -- [dist] [--allow-demo]')
  console.log(await verifyDownloads(resolve(args[0] || 'dist'), { allowDemo: args[1] === '--allow-demo', basePath: process.env.BASE_PATH || '/' }))
}
