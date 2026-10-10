import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const asPosix = value => value.replaceAll('\\', '/')
const load = async path => JSON.parse(await readFile(join(root, path), 'utf8'))
const digestFile = async path => `sha256:${createHash('sha256').update(await readFile(join(root, path))).digest('hex')}`

async function jsonFiles(directory) {
  const entries = await readdir(join(root, directory), { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await jsonFiles(path))
    else if (entry.name.endsWith('.json')) files.push(asPosix(path))
  }
  return files.sort()
}

const schemas = {
  pack: await load('schemas/pack.schema.json'),
  lock: await load('schemas/pack-lock.schema.json'),
  evidence: await load('schemas/evidence.schema.json'),
  plugin: await load('vendor/dsh-std/dsh-plugin-0.15.schema.json'),
  packageMetadata: await load('schemas/official-package-metadata.schema.json')
}

const ajv = new Ajv2020({ allErrors: true, strict: true })
addFormats(ajv)
const validators = Object.fromEntries(Object.entries(schemas).map(([name, schema]) => [name, ajv.compile(schema)]))

function validatorFor(value) {
  if (value.$schema === schemas.pack.$id) return validators.pack
  if (value.$schema === schemas.lock.$id) return validators.lock
  if (value.$schema === schemas.evidence.$id) return validators.evidence
  if (value.manifestVersion === '0.15') return validators.plugin
  throw new Error(`Unknown schema for ${JSON.stringify(value).slice(0, 120)}`)
}

function describeErrors(validate) {
  return ajv.errorsText(validate.errors, { separator: '\n  ' })
}

async function validateDocuments() {
  // Developer archives use the independent intake checker in npm test.
  const catalogFiles = (await jsonFiles('catalog')).filter(path => !path.startsWith('catalog/feature-packs/') && !path.startsWith('catalog/skin-prompt-packages/') && !path.startsWith('catalog/plugin-listings/'))
  const validFixtures = await jsonFiles('fixtures/valid')
  const invalidFixtures = await jsonFiles('fixtures/invalid')

  for (const path of [...catalogFiles, ...validFixtures]) {
    const value = await load(path)
    const validate = validatorFor(value)
    if (!validate(value)) throw new Error(`${path} is invalid:\n  ${describeErrors(validate)}`)
    if (value['x-mojobox-package'] && !validators.packageMetadata(value['x-mojobox-package'])) {
      throw new Error(`${path} has invalid official package metadata:\n  ${describeErrors(validators.packageMetadata)}`)
    }
  }

  for (const path of invalidFixtures) {
    const value = await load(path)
    const validate = validatorFor(value)
    const packageMetadataValid = !value['x-mojobox-package'] || validators.packageMetadata(value['x-mojobox-package'])
    if (validate(value) && packageMetadataValid) throw new Error(`${path} must be rejected`)
  }

  return { catalogFiles, validFixtures, invalidFixtures }
}

async function validateMultiHostEvidence() {
  const paths = [
    'fixtures/valid/multi-host/eac.json',
    'fixtures/valid/multi-host/tui.json'
  ]
  const records = await Promise.all(paths.map(load))
  const subjectKey = record => [record.subject.id, record.subject.version, record.subject.artifactDigest, record.manifestDigest].join('|')
  if (new Set(records.map(subjectKey)).size !== 1) throw new Error('Multi-host fixtures must reference the same exact artifact and Manifest')
  if (new Set(records.map(record => record.issuer)).size !== records.length) throw new Error('Multi-host fixtures require independent issuers')
  if (new Set(records.map(record => record.host.id)).size !== records.length) throw new Error('Multi-host fixtures require distinct hosts')

  const revisions = await load('spec-revisions.json')
  const legacyAdmission = revisions.legacyTuiAdmission
  const sharedFixtures = legacyAdmission.sharedFixtures
  if (!Array.isArray(sharedFixtures) || sharedFixtures.length === 0) throw new Error('Shared Community fixtures are not pinned')

  const profile = await load('profiles/eac-admission-0.1.json')
  if (profile.apiVersion !== 'admission.mojobox.dev/v1alpha1' || profile.kind !== 'AdmissionProfile') {
    throw new Error('Invalid EAC Admission Profile')
  }
  const eac = records.find(record => record.host.id === profile.host.id)
  if (!eac || eac.specifications.admissionProfile !== `${profile.metadata.id}/${profile.metadata.version}`) {
    throw new Error('EAC evidence does not reference the pinned Admission Profile')
  }
  if (profile.dshStdRevision !== revisions.dshStd.revision || eac.specifications.dshStdRevision !== profile.dshStdRevision) {
    throw new Error('EAC evidence does not use the Mojobox dsh-std baseline')
  }
  if (profile.references.revision !== legacyAdmission.revision
    || profile.references.profile !== legacyAdmission.profile
    || profile.references.dshStdRevision !== legacyAdmission.dshStdRevision) {
    throw new Error('EAC Admission Profile reference does not match the legacy TUI admission snapshot')
  }
  const eacChecks = new Set(eac.checks.filter(check => check.result === 'pass').map(check => check.id))
  for (const id of profile.levels.Negotiated.requiredChecks) {
    if (!eacChecks.has(id)) throw new Error(`EAC evidence is missing admission check ${id}`)
  }

  const descriptor = await load('profiles/eac-host-descriptor-0.1.json')
  if (descriptor.apiVersion !== 'host.mojobox.dev/v1alpha1'
    || descriptor.host.id !== eac.host.id
    || descriptor.host.name !== eac.host.name
    || descriptor.host.version !== eac.host.version
    || eac.host.adapterVersion !== descriptor.host.version
    || descriptor.runtime.dshVersion !== eac.host.dshVersion
    || `${descriptor.runtime.platform}-${descriptor.runtime.arch}` !== eac.host.runtime) {
    throw new Error('EAC Host Descriptor does not match its evidence')
  }
  if (eac.hostDescriptorDigest !== await digestFile('profiles/eac-host-descriptor-0.1.json')) {
    throw new Error('EAC Host Descriptor digest mismatch')
  }
  if (eac.suite.digest !== await digestFile('profiles/eac-admission-0.1.json')) {
    throw new Error('EAC Admission Profile suite digest mismatch')
  }

  const tui = records.find(record => record.host.id === 'dsh-tui')
  const tuiRevision = revisions.dshTui.legacyEvidence
  if (!tui
    || tui.specifications.admissionProfile !== tuiRevision.profile
    || tui.specifications.dshStdRevision !== tuiRevision.dshStdRevision
    || tuiRevision.ecosystemSpecRevision !== legacyAdmission.revision
    || tuiRevision.profile !== legacyAdmission.profile
    || tuiRevision.dshStdRevision !== legacyAdmission.dshStdRevision
    || tui.host.adapterVersion !== tuiRevision.version) {
    throw new Error('TUI evidence does not match its pinned adapter and specification revisions')
  }
  if (tui.hostDescriptorDigest !== legacyAdmission.tuiHostDescriptor.digest
    || tui.suite.id !== legacyAdmission.suite.id
    || tui.suite.version !== legacyAdmission.suite.version
    || tui.suite.digest !== legacyAdmission.suite.digest) {
    throw new Error('TUI evidence does not match pinned upstream evidence inputs')
  }

  for (const fixture of sharedFixtures) {
    const digest = `sha256:${fixture.sha256}`
    if (records.some(record => record.manifestDigest !== digest)) {
      throw new Error(`Multi-host evidence does not bind shared fixture ${fixture.path}`)
    }
    if (!eacChecks.has(fixture.eacCheck)) throw new Error(`EAC evidence does not map shared fixture ${fixture.path}`)
    if (!tui.checks.some(check => check.id === fixture.sourceRequirement && check.result === 'pass')) {
      throw new Error(`TUI evidence is missing upstream requirement ${fixture.sourceRequirement}`)
    }
  }
}

async function validateCatalog() {
  const pluginPaths = await jsonFiles('catalog/plugins')

  const plugins = new Map()
  for (const path of pluginPaths) {
    const manifest = await load(path)
    if (plugins.has(manifest.id)) throw new Error(`Duplicate plugin id: ${manifest.id}`)
    if (basename(path) !== `${manifest.id}.json`) throw new Error(`${path} filename must match plugin id`)
    plugins.set(manifest.id, { manifest, path })
  }

  const packPaths = (await jsonFiles('catalog/packs')).filter(path => path.endsWith('.pack.json'))
  const lockPaths = (await jsonFiles('catalog/packs')).filter(path => path.endsWith('.lock.json'))
  if (lockPaths.length !== packPaths.length) throw new Error('Every maintained Pack requires a matching Lock')

  const packIds = new Set()
  for (const packPath of packPaths) {
    const lockPath = packPath.replace('.pack.json', '.lock.json')
    const pack = await load(packPath)
    const lock = await load(lockPath)
    if (basename(packPath) !== `${pack.metadata.id}.pack.json`) throw new Error(`${packPath} filename must match Pack id`)
    if (packIds.has(pack.metadata.id)) throw new Error(`Duplicate Pack id: ${pack.metadata.id}`)
    packIds.add(pack.metadata.id)
    const expectedPack = `${pack.metadata.id}@${pack.metadata.version}`
    if (lock.pack !== expectedPack) throw new Error(`${lockPath} locks ${lock.pack}, expected ${expectedPack}`)

    const packComponents = new Map(pack.components.map(component => [component.id, component]))
    if (packComponents.size !== pack.components.length) throw new Error(`${packPath} contains duplicate components`)
    if (lock.components.length !== packComponents.size) throw new Error(`${lockPath} component count differs from its Pack`)
    if (new Set(lock.components.map(component => component.id)).size !== lock.components.length) {
      throw new Error(`${lockPath} contains duplicate components`)
    }

    for (const component of lock.components) {
      const declared = packComponents.get(component.id)
      if (!declared || declared.version !== component.version) throw new Error(`${lockPath} does not match ${component.id} in its Pack`)
      const plugin = plugins.get(component.id)
      if (!plugin) throw new Error(`${lockPath} references unknown plugin ${component.id}`)
      if (plugin.path !== component.manifest) throw new Error(`${lockPath} points ${component.id} at the wrong Manifest`)
      if (plugin.manifest.version !== component.version) throw new Error(`${component.id} version differs between Manifest and Lock`)
      if (await digestFile(plugin.path) !== component.manifestDigest) throw new Error(`${component.id} Manifest digest mismatch`)
      if (plugin.manifest.artifact?.digest !== component.artifactDigest) throw new Error(`${component.id} artifact digest mismatch`)
      if (component.source !== `npm:${plugin.manifest.name}@${component.version}`) throw new Error(`${component.id} source is not exact`)
    }
  }

  const revisions = await load('spec-revisions.json')
  const vendoredRevision = (await readFile(join(root, 'vendor/dsh-std/REVISION'), 'utf8')).trim()
  if (revisions.dshStd.revision !== vendoredRevision) throw new Error('Vendored dsh-std revision does not match spec-revisions.json')
  for (const { manifest } of plugins.values()) {
    if (!manifest.$schema.includes(vendoredRevision)) throw new Error(`${manifest.id} does not pin the vendored dsh-std revision`)
  }

  const evidencePaths = await jsonFiles('catalog/evidence')
  // A historical result binds the suite that ran, not today's validator bytes.
  const suites = await load('evidence-suites.json')
  const suiteKeys = new Set()
  for (const suite of suites) {
    const key = `${suite.id}@${suite.version}`
    if (suiteKeys.has(key) || !/^sha256:[a-f0-9]{64}$/.test(suite.digest)
      || !/^https:\/\/github\.com\/[^/]+\/[^/]+\/blob\/[a-f0-9]{40}\/.+/.test(suite.source)) {
      throw new Error(`Invalid or duplicate evidence suite: ${key}`)
    }
    suiteKeys.add(key)
  }
  for (const path of evidencePaths) {
    const evidence = await load(path)
    const plugin = plugins.get(evidence.subject.id)
    if (!plugin) throw new Error(`${path} references unknown subject ${evidence.subject.id}`)
    const suite = suites.find(item => item.id === evidence.suite.id && item.version === evidence.suite.version)
    if (!suite || suite.digest !== evidence.suite.digest) throw new Error(`${path} suite digest mismatch`)
    // Old versions stay as historical records; the builder excludes them from current claims.
    if (evidence.subject.version !== plugin.manifest.version) continue
    if (evidence.subject.artifactDigest !== plugin.manifest.artifact?.digest) throw new Error(`${path} artifact digest mismatch`)
    if (evidence.manifestDigest !== await digestFile(plugin.path)) throw new Error(`${path} Manifest digest mismatch`)
    if (evidence.specifications.dshStdRevision !== vendoredRevision) throw new Error(`${path} dsh-std revision mismatch`)
  }

  return { plugins: pluginPaths.length, packs: packPaths.length, locks: lockPaths.length, evidence: evidencePaths.length }
}

const documents = await validateDocuments()
await validateMultiHostEvidence()
const catalog = await validateCatalog()
console.log(`Validated ${catalog.plugins} plugins, ${catalog.packs} Packs, ${catalog.locks} Locks, ${catalog.evidence} evidence records, ${documents.validFixtures.length} valid fixtures, and ${documents.invalidFixtures.length} invalid fixtures.`)
