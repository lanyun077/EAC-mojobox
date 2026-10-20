import Ajv from 'ajv'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const ajv = new Ajv({ allErrors: true })
const readJson = async url => JSON.parse(await readFile(url, 'utf8'))
const checkGroups = ajv.compile(await readJson(new URL('../schemas/catalog-tag-groups.schema.json', import.meta.url)))
const checkEntries = ajv.compile(await readJson(new URL('../schemas/website-tags.schema.json', import.meta.url)))
export const tagGroups = await readJson(new URL('../policies/catalog-tags.json', import.meta.url))

export function validateTagGroups(groups) {
  if (!checkGroups(groups)) throw new Error(`Invalid official tag groups: ${ajv.errorsText(checkGroups.errors)}`)
  const ids = new Set(['all', 'unclassified'])
  for (const tags of Object.values(groups)) {
    for (const tag of tags) {
      if (ids.has(tag.id)) throw new Error(`Duplicate or reserved official tag: ${tag.id}`)
      ids.add(tag.id)
    }
  }
  return groups
}
validateTagGroups(tagGroups)

export function validateWebsiteTags(document, resources) {
  if (!checkEntries(document)) throw new Error(`Invalid website tags: ${ajv.errorsText(checkEntries.errors)}`)
  const entries = new Map()
  for (const entry of document.entries) {
    const key = `${entry.type}:${entry.id}`
    if (entries.has(key)) throw new Error(`Duplicate website tags: ${key}`)
    const resource = resources.find(item => item.type === entry.type && item.id === entry.id)
    if (!resource) throw new Error(`Unknown website tag resource: ${key}`)
    const group = resource.category === 'appearance' ? 'skins' : 'packs'
    for (const tag of entry.officialTags || []) {
      if (!tagGroups[group].some(item => item.id === tag)) throw new Error(`Unknown official tag for ${group}: ${tag}`)
    }
    entries.set(key, { officialTags: entry.officialTags || [], customTags: entry.customTags || [] })
  }
  return entries
}

export async function collectWebsiteTags(root, resources) {
  let document
  try { document = await readJson(join(root, 'catalog/website-tags.json')) }
  catch (error) {
    if (error.code !== 'ENOENT') throw error
    document = { entries: [] }
  }
  return validateWebsiteTags(document, resources)
}
