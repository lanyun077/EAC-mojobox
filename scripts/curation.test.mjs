import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { test } from 'node:test'

const readJson = async path => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'))
const review = await readJson('authoring/suite-curation.json')
const sources = await readJson('authoring/curation-sources.json')
const original = (await Promise.all(['eac', 'aio', 'skins'].map(name =>
  readJson(`candidates/integration-suites/dsh-plugin-suite-0.1.7/${name}.json`)))).flat()
const originalById = new Map(original.map(item => [item.id, item]))
const sourceByRef = new Map(sources.components.map(item => [item.ref, item]))
const packs = await Promise.all(review.packs.map(id => readJson(`authoring/packs/${id}.json`)))

test('suite review accounts for every original component exactly once', () => {
  assert.equal(originalById.size, 69)
  assert.equal(new Set(review.decisions.map(item => item.id)).size, review.decisions.length)
  assert.deepEqual(new Set(review.decisions.map(item => item.id)), new Set(originalById.keys()))
  assert.deepEqual(new Set(sources.registry.map(item => item.name)), new Set(original.map(item => item.name)))
  for (const decision of review.decisions) {
    assert.ok(['exclude', 'replace', 'defer', 'defer-to-skins', 'upgrade', 'retain'].includes(decision.action))
    assert.ok(decision.reason.trim())
    if (decision.replacement) assert.ok(sourceByRef.has(decision.replacement), decision.id)
  }
})

test('curated packs use the reviewed identities and one version across all categories', () => {
  assert.equal(sourceByRef.size, sources.components.length)
  assert.equal(new Set(review.packs).size, review.packs.length)
  const used = new Set()
  for (const pack of packs) {
    assert.equal(pack.requires.dsh, review.targetDsh)
    for (const plugin of pack.plugins) {
      const source = sourceByRef.get(plugin.ref)
      assert.ok(source, `${pack.id}: unreviewed source ${plugin.ref}`)
      assert.equal(plugin.version, source.version, `${pack.id}: stale or unreviewed version`)
      assert.equal(source.package.name, source.name)
      assert.equal(source.package.version, source.version)
      assert.equal(source.dshPeerCheck.runtimeVersion, review.targetDsh)
      assert.deepEqual(source.dshPeerCheck.mismatches, {})
      assert.equal(source.artifact.identityVerified, true)
      assert.equal(source.artifact.integrityVerified, true)
      assert.match(source.artifact.sha256, /^[a-f0-9]{64}$/)
      assert.equal(source.runtime, 'not-tested')
      if (plugin.ref.startsWith('github:')) assert.equal(source.github.revisionPinnedByPack, false)
      used.add(plugin.ref)
    }
  }
  assert.deepEqual(used, new Set(sourceByRef.keys()))
})

test('excluded components and exclusive implementations cannot reenter a curated combination', () => {
  const rejected = new Set(review.decisions.filter(item => ['exclude', 'defer', 'defer-to-skins'].includes(item.action))
    .map(item => originalById.get(item.id).name))
  for (const pack of packs) {
    const refs = new Set(pack.plugins.map(item => item.ref))
    for (const ref of refs) assert.ok(!rejected.has(sourceByRef.get(ref).name), `${pack.id}: excluded ${ref}`)
    for (const group of review.exclusiveGroups) {
      const selected = group.refs.filter(ref => refs.has(ref))
      assert.ok(selected.length <= 1, `${pack.id}: ${group.reason}`)
      if (!selected.length) continue
      for (const other of group.refs.filter(ref => ref !== selected[0])) {
        const identity = sourceByRef.get(other)?.name || other
        assert.ok(pack.conflicts.includes(identity), `${pack.id}: missing combination restriction ${identity}`)
      }
    }
  }
})

test('six distinct functional scenarios retain the daily suite and expanded toolbox', () => {
  const byId = new Map(packs.map(pack => [pack.id, pack]))
  const lite = byId.get('dev.dsh-eac.suite-lite')
  const toolbox = byId.get('dev.dsh-eac.power-toolbox')
  assert.deepEqual(new Set(byId.keys()), new Set([
    'dev.dsh-eac.suite-lite', 'dev.dsh-eac.power-toolbox', 'dev.dsh-eac.office-base',
    'dev.dsh-eac.prompt-memory', 'dev.dsh-eac.mobile-tools', 'dev.dsh-eac.conversation-migration'
  ]))
  assert.equal(lite.plugins.length, 6)
  assert.equal(toolbox.plugins.length, 11)
  for (const plugin of lite.plugins) {
    assert.ok(toolbox.plugins.some(item => item.ref === plugin.ref && item.version === plugin.version))
  }
  assert.ok(!lite.plugins.some(item => item.ref === 'dsh-univer-office' || item.ref === 'meow-smooth' || item.ref === 'dsh-vision-router'))
  const office = byId.get('dev.dsh-eac.office-base')
  assert.ok(office.plugins.some(item => item.ref === 'dsh-univer-office'))
})

test('active authoring and catalog agree while retired packs retain their original records', async () => {
  const files = async path => (await readdir(new URL(`../${path}`, import.meta.url))).filter(name => name.endsWith('.json'))
  const active = await files('authoring/packs')
  assert.deepEqual(new Set(active), new Set(await files('catalog/feature-packs')))
  assert.equal(active.length, 11)
  const update = await readJson('authoring/catalog-update-20261121.json')
  const sourceByRef = new Map(update.components.map(source => [source.ref, source]))
  for (const file of active) {
    const pack = await readJson(`authoring/packs/${file}`)
    const record = await readJson(`catalog/feature-packs/${file}`)
    assert.equal(pack.requires.dsh, review.targetDsh)
    for (const plugin of pack.plugins) assert.equal(plugin.version, sourceByRef.get(plugin.ref)?.version)
    for (const description of [pack.description, record.introduction, record.appearance?.notes].filter(Boolean)) {
      assert.doesNotMatch(description, /不(?:含|包含|提供|支持|与|和|跟|涉及|代表|属于|负责)|无关|不能|并非|不是|未(?:测试|实测|验证|验收)/)
    }
  }
  assert.equal(review.retiredPacks.length, 7)
  for (const retired of review.retiredPacks) {
    assert.ok(!active.includes(`${retired.id}.json`))
    assert.ok(active.includes(`${retired.replacement}.json`))
    const manifest = await readJson(`authoring/archive/20261121/packs/${retired.id}.json`)
    const record = await readJson(`authoring/archive/20261121/records/${retired.id}.json`)
    assert.equal(manifest.id, retired.id)
    assert.equal(manifest.version, retired.version)
    assert.equal(record.version, retired.version)
  }
})

test('active authored packs match intake records, omit retired sources and offer distinct combinations', async () => {
  const authored = await Promise.all((await readdir(new URL('../authoring/packs/', import.meta.url)))
    .filter(file => file.endsWith('.json')).map(file => readJson(`authoring/packs/${file}`)))
  const records = await Promise.all((await readdir(new URL('../catalog/feature-packs/', import.meta.url)))
    .filter(file => file.endsWith('.json')).map(file => readJson(`catalog/feature-packs/${file}`)))
  assert.deepEqual(new Set(authored.map(pack => pack.id)), new Set(records.map(record => record.id)))
  assert.deepEqual(new Set(authored.filter(pack => records.find(record => record.id === pack.id).category === 'function')
    .map(pack => pack.id)), new Set(review.packs))
  const retired = new Set(['@vlln/dsh-navbar', 'dsh-dream-skin', 'open-sea-skin', 'github:ymh0000123/dsh-theme-endfield'])
  const combinations = new Set()
  for (const pack of authored) {
    assert.ok(pack.plugins.every(plugin => !retired.has(plugin.ref)), `${pack.id}: retired source`)
    const signature = JSON.stringify([pack.requires, pack.plugins.map(plugin => `${plugin.ref}@${plugin.version}`).sort()])
    assert.ok(!combinations.has(signature), `${pack.id}: duplicate combination`)
    combinations.add(signature)
  }
  const listings = await readdir(new URL('../catalog/plugin-listings/', import.meta.url))
  assert.ok(!listings.includes('dev.vlln.dsh-navbar.json'))
})
