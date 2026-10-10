import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { digest } from './feature-pack.mjs'
import { pluginFilename, validatePluginListing } from './plugin-listing.mjs'

const ajv = new Ajv({ allErrors: true })
addFormats(ajv)
const listingSchema = await readFile(new URL('../schemas/plugin-listing.schema.json', import.meta.url))
const indexSchema = await readFile(new URL('../schemas/plugin-index.schema.json', import.meta.url))
ajv.addSchema(JSON.parse(listingSchema), 'plugin-listing.schema.json')
const check = ajv.compile(JSON.parse(indexSchema))
const jsonBytes = value => Buffer.from(JSON.stringify(value, null, 2) + '\n')
export const pluginIndexPath = 'generated/api/v1/plugins.json'
const revisionFor = plugins => `sha256:${digest(jsonBytes(plugins))}`

export function validatePluginIndex(document, { allowDemo = false } = {}) {
  if (!check(document)) throw new Error(`Invalid plugin index: ${ajv.errorsText(check.errors)}`)
  if (document.demo && !allowDemo) throw new Error('Demo plugin index cannot be published')
  if (document.revision !== revisionFor(document.plugins)) throw new Error('Plugin index revision mismatch')
  const ids = new Set()
  const packages = new Set()
  let previous = ''
  for (const item of document.plugins) {
    const record = validatePluginListing(item.listing)
    if (ids.has(record.id) || packages.has(record.packageName) || record.id <= previous) throw new Error('Plugin index identities must be unique and sorted')
    ids.add(record.id)
    packages.add(record.packageName)
    previous = record.id
    if (record.artifact) {
      if (item.checks !== 'artifact-checked' || item.download?.url !== `../../downloads/${pluginFilename(record)}` ||
          item.download.sha256 !== record.artifact.sha256 || item.download.size !== record.artifact.size ||
          item.report?.url !== `../../reports/${record.id}.plugin.json`) throw new Error('Plugin index download/report mismatch')
    } else if (item.checks !== 'metadata-only' || item.download !== null || item.report !== null) {
      throw new Error('Source-only plugin cannot claim a download or report')
    }
  }
  return document
}

export async function publishPluginIndex(output, pluginListings, { demo = false } = {}) {
  const plugins = pluginListings.map(({ record, bytes, report }) => ({ listing: record,
    checks: bytes ? 'artifact-checked' : 'metadata-only', runtime: 'not-tested', dependencies: 'not-resolved',
    download: bytes ? { url: `../../downloads/${pluginFilename(record)}`, sha256: record.artifact.sha256, size: bytes.length } : null,
    report: report ? { url: `../../reports/${record.id}.plugin.json`, sha256: digest(jsonBytes(report)), size: jsonBytes(report).length } : null }))
    .sort((a, b) => a.listing.id < b.listing.id ? -1 : a.listing.id > b.listing.id ? 1 : 0)
  const document = validatePluginIndex({ schemaVersion: 'plugins.mojobox.dev/v1', sourceId: 'dsh-eac.mojobox',
    revision: revisionFor(plugins), demo, plugins }, { allowDemo: true })
  await mkdir(join(output, 'api/v1'), { recursive: true })
  await writeFile(join(output, 'api/v1/plugins.json'), jsonBytes(document))
  await mkdir(join(output, 'api/v1/schemas'), { recursive: true })
  await writeFile(join(output, 'api/v1/schemas/plugin-index.schema.json'), indexSchema)
  await writeFile(join(output, 'api/v1/schemas/plugin-listing.schema.json'), listingSchema)
  return document
}

export async function verifyPluginIndex(directory, catalog, { allowDemo = false } = {}) {
  const document = validatePluginIndex(JSON.parse(await readFile(join(directory, pluginIndexPath), 'utf8')), { allowDemo })
  if (document.demo !== Boolean(catalog.demo) || document.plugins.length !== (catalog.plugins || []).length) throw new Error('Plugin index/catalog mismatch')
  for (const item of document.plugins) {
    const record = JSON.parse(await readFile(join(directory, 'generated/plugins', `${item.listing.id}.json`), 'utf8'))
    if (JSON.stringify(record) !== JSON.stringify(item.listing) || !catalog.plugins.some(plugin => plugin.id === record.id)) throw new Error('Plugin index listing mismatch')
    for (const file of [item.download, item.report].filter(Boolean)) {
      const bytes = await readFile(join(directory, 'generated', file.url.slice('../../'.length)))
      if (bytes.length !== file.size || digest(bytes) !== file.sha256) throw new Error('Plugin index file digest/size mismatch')
    }
  }
  return document
}
