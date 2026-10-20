import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { collectWebsiteTags, tagGroups, validateTagGroups, validateWebsiteTags } from './catalog-tags.mjs'

const root = new URL('../', import.meta.url)
const json = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'))
const resources = [
  { type: 'pack', id: 'org.example.tools', category: 'function' },
  { type: 'skin-prompt', id: 'example-skin', category: 'appearance' }
]
const invalidFixtures = await Promise.all(['invalid-group', 'invalid-fields'].map(name => json(`fixtures/catalog-tags/${name}.json`)))

test('official groups stay broad, bounded and independent of author keywords', async () => {
  assert.equal(tagGroups.packs.length, 7)
  assert.equal(tagGroups.skins.length, 8)
  assert.equal(validateTagGroups(tagGroups), tagGroups)
  const document = await json('fixtures/catalog-tags/valid.json')
  const entries = validateWebsiteTags(document, resources)
  assert.deepEqual(entries.get('pack:org.example.tools').officialTags, ['development'])
  assert.deepEqual(entries.get('skin-prompt:example-skin').officialTags, [])
  assert.deepEqual(entries.get('skin-prompt:example-skin').customTags, ['anime', '初音未来'])
  assert.equal(validateWebsiteTags({ entries: [] }, resources).size, 0)
  for (const id of ['miku', 'maid', 'blue', 'xp', 'session-manager']) {
    assert.ok(!Object.values(tagGroups).flat().some(tag => tag.id === id))
  }
  for (const id of ['all', 'unclassified', 'general']) {
    const invalid = structuredClone(tagGroups)
    invalid.skins[0].id = id
    assert.throws(() => validateTagGroups(invalid), /Duplicate or reserved/)
  }
  assert.throws(() => validateTagGroups({ ...tagGroups, skins: [...tagGroups.skins, tagGroups.skins[0]] }), /Invalid official/)
})

test('website tags reject unsupported groups, claims, duplicates, missing resources and unbounded keywords', () => {
  for (const fixture of invalidFixtures) assert.throws(() => validateWebsiteTags(fixture, resources))
  const entry = { type: 'pack', id: 'org.example.tools', officialTags: ['development'] }
  for (const invalid of [
    { ...entry, officialTags: ['miku'] },
    { ...entry, officialTags: ['development', 'development'] },
    { ...entry, officialTags: ['general', 'development', 'office', 'research'] },
    { ...entry, id: 'missing' },
    { ...entry, customTags: [' '] },
    { ...entry, customTags: ['x'.repeat(33)] },
    { ...entry, customTags: Array.from({ length: 13 }, (_, i) => `tag-${i}`) },
    { ...entry, officialTags: [] },
    { ...entry, type: 'plugin' }
  ]) assert.throws(() => validateWebsiteTags({ entries: [invalid] }, resources))
  assert.throws(() => validateWebsiteTags({ entries: [entry, entry] }, resources), /Duplicate website/)
})

test('production labels reference real resources and retain reviewed examples without requiring every submission to be classified', async () => {
  const records = await Promise.all((await readdir(new URL('catalog/feature-packs/', root)))
    .filter(file => file.endsWith('.json')).map(file => json(`catalog/feature-packs/${file}`)))
  const source = await json('catalog/skin-prompt-packages/source.json')
  const all = [...records.map(record => ({ type: 'pack', id: record.id, category: record.category })),
    ...source.packages.map(entry => ({ type: 'skin-prompt', id: entry.id, category: 'appearance' }))]
  const entries = await collectWebsiteTags(fileURLToPath(root), all)
  const document = await json('catalog/website-tags.json')
  assert.equal(entries.size, document.entries.length)
  assert.deepEqual(entries.get('skin-prompt:blue-fantasy').officialTags, ['nature'])
  assert.deepEqual(entries.get('pack:dev.dsh-eac.skin-bloom').officialTags, ['generic'])
  assert.deepEqual(entries.get('skin-prompt:ths').officialTags, ['interface'])
})
