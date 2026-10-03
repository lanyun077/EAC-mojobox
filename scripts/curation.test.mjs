import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
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

test('essentials remain minimal and the lighter suite is a subset of the expanded toolbox', () => {
  const byId = new Map(packs.map(pack => [pack.id, pack]))
  const essentials = byId.get('dev.dsh-eac.essentials')
  const lite = byId.get('dev.dsh-eac.suite-lite')
  const toolbox = byId.get('dev.dsh-eac.power-toolbox')
  assert.equal(essentials.plugins.length, 4)
  assert.equal(lite.plugins.length, 7)
  assert.equal(toolbox.plugins.length, 12)
  for (const [smaller, larger] of [[essentials, lite], [lite, toolbox]]) {
    for (const plugin of smaller.plugins) {
      assert.ok(larger.plugins.some(item => item.ref === plugin.ref && item.version === plugin.version))
    }
  }
  assert.ok(!lite.plugins.some(item => item.ref === 'dsh-univer-office' || item.ref === 'meow-smooth' || item.ref === 'dsh-vision-router'))
  const office = byId.get('dev.dsh-eac.office-base')
  assert.ok(office.plugins.some(item => item.ref === 'dsh-univer-office'))
})
