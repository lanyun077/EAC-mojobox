import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import semver from 'semver'
import { readFile } from 'node:fs/promises'
import { digest } from './feature-pack.mjs'
import { assertHttps } from './preview-images.mjs'

const ajv = new Ajv({ allErrors: true })
addFormats(ajv)
const checkSupply = ajv.compile(JSON.parse(await readFile(new URL('../schemas/eac-supply.schema.json', import.meta.url))))
const checkReceipt = ajv.compile(JSON.parse(await readFile(new URL('../schemas/eac-supply-receipt.schema.json', import.meta.url))))
export const itemKey = item => `${item.packageName}@${item.version}`
export const jsonBytes = value => Buffer.from(JSON.stringify(value, null, 2) + '\n')

function exactVersion(value) {
  const parsed = semver.parse(value)
  return parsed && parsed.version + (parsed.build.length ? `+${parsed.build.join('.')}` : '') === value
}

function checkUrls(value) {
  if (!value || typeof value !== 'object') return
  for (const [key, field] of Object.entries(value)) {
    if (['url', 'downloadUrl', 'catalogUrl', 'compatibilityReference', 'conflictsReference'].includes(key) ||
        (key === 'reference' && typeof field === 'string' && field.startsWith('https:')) ||
        (key === 'source' && typeof field === 'string')) {
      assertHttps(field)
      if (new URL(field).hash) throw new Error('Supply URLs must not contain fragments')
    } else if (key === 'previews') {
      for (const url of field) {
        assertHttps(url)
        if (new URL(url).hash) throw new Error('Supply URLs must not contain fragments')
      }
    } else checkUrls(field)
  }
}

export function validateSupply(document) {
  if (!checkSupply(document)) throw new Error(`Invalid EAC supply: ${ajv.errorsText(checkSupply.errors)}`)
  if (jsonBytes(document).length > 8 * 1024 * 1024) throw new Error('Supply exceeds 8 MiB')
  checkUrls(document)
  const items = new Map()
  for (const item of document.items) {
    if (!exactVersion(item.version)) throw new Error(`Supply requires exact SemVer: ${itemKey(item)}`)
    if (items.has(itemKey(item))) throw new Error(`Duplicate supply item: ${itemKey(item)}`)
    items.set(itemKey(item), item)
    if (item.type !== 'material') {
      const range = item.requiresDsh
      if (range === null ? item.compatibilityBasis !== 'unknown' || item.compatibilityReference !== undefined
        : item.compatibilityBasis === 'unknown' || !item.compatibilityReference || !range.trim() ||
          range.split('||').some(group => !group.trim()) || semver.validRange(range) === null) {
        throw new Error(`Invalid compatibility declaration: ${itemKey(item)}`)
      }
    }
  }
  for (const item of document.items.filter(item => item.components)) {
    const ids = new Set(item.components.map(component => component.id))
    if (ids.size !== item.components.length || new Set(item.components.map(component => component.ref)).size !== ids.size) {
      throw new Error(`Duplicate supply component: ${itemKey(item)}`)
    }
    const adjacency = new Map([...ids].map(id => [id, []]))
    for (const component of item.components) {
      if (component.version !== undefined && (!component.version.trim() || component.version.split('||').some(group => !group.trim()) || semver.validRange(component.version) === null)) {
        throw new Error('Invalid component version constraint')
      }
      if (!component.resolved) continue
      const target = items.get(itemKey(component.resolved))
      if (!exactVersion(component.resolved.version) || !target || !['plugin', 'skin'].includes(target.type) ||
          !target.artifact || target.artifact.sha256 !== component.resolved.sha256 ||
          (component.version && !semver.satisfies(target.version, component.version))) throw new Error('Invalid resolved component binding')
    }
    for (const edge of item.execution.edges) {
      if (!ids.has(edge.prerequisiteId) || !ids.has(edge.consumerId)) throw new Error('Execution edge references missing component')
      adjacency.get(edge.prerequisiteId).push(edge.consumerId)
    }
    const visited = new Set()
    const visiting = new Set()
    function visit(id) {
      if (visiting.has(id)) throw new Error('Execution graph contains a cycle')
      if (visited.has(id)) return
      visiting.add(id)
      for (const next of adjacency.get(id)) visit(next)
      visiting.delete(id)
      visited.add(id)
    }
    for (const id of ids) visit(id)
  }
  return document
}

export function validateReceipt(receipt, bytes) {
  if (!checkReceipt(receipt)) throw new Error(`Invalid supply receipt: ${ajv.errorsText(checkReceipt.errors)}`)
  checkUrls(receipt)
  if (bytes.length > 8 * 1024 * 1024 || bytes.length !== receipt.size || digest(bytes) !== receipt.sha256) throw new Error('Supply receipt digest/size mismatch')
  const document = validateSupply(JSON.parse(bytes.toString('utf8')))
  for (const key of ['sourceId', 'sequence', 'revision']) {
    if (document[key] !== receipt[key]) throw new Error(`Supply receipt identity mismatch: ${key}`)
  }
  return document
}

export function mergeSupplyHistory(document, previous, withdrawals = []) {
  validateSupply(document)
  if (previous) {
    validateSupply(previous)
    if (document.sourceId !== previous.sourceId || document.sequence <= previous.sequence || document.revision === previous.revision) {
      throw new Error('Supply source/sequence/revision must advance')
    }
  }
  const items = new Map(document.items.map(item => [itemKey(item), structuredClone(item)]))
  const names = new Set(document.items.map(item => item.packageName))
  const reasons = new Map()
  for (const withdrawal of withdrawals) {
    if (!withdrawal || Object.keys(withdrawal).sort().join(',') !== 'packageName,reason,version' ||
        typeof withdrawal.reason !== 'string' || !withdrawal.reason.trim() || reasons.has(itemKey(withdrawal))) throw new Error('Invalid withdrawal request')
    reasons.set(itemKey(withdrawal), withdrawal.reason)
  }
  for (const old of previous?.items || []) {
    const current = items.get(itemKey(old))
    if (old.artifact && current && (!current.artifact || old.artifact.sha256 !== current.artifact.sha256 || old.artifact.size !== current.artifact.size || old.artifact.format !== current.artifact.format)) {
      throw new Error(`Same-version artifact bytes changed: ${itemKey(old)}`)
    }
    if (current && old.type !== current.type) throw new Error(`Same-version item type changed: ${itemKey(old)}`)
    if (current && old.type === 'material' && JSON.stringify(old.source) !== JSON.stringify(current.source)) {
      throw new Error(`Material source changed without version upgrade: ${itemKey(old)}`)
    }
    if (!current && old.status === 'active' && !names.has(old.packageName) && !reasons.has(itemKey(old))) {
      throw new Error(`Missing prior item requires explicit withdrawal: ${itemKey(old)}`)
    }
    if (!current || old.status === 'withdrawn') items.set(itemKey(old), structuredClone(old))
  }
  for (const [key, reason] of reasons) {
    const item = items.get(key)
    if (!item) throw new Error(`Withdrawal references unknown item: ${key}`)
    item.status = 'withdrawn'
    item.withdrawnReason = reason
  }
  return validateSupply({ ...document, items: [...items.values()].sort((a, b) => itemKey(a).localeCompare(itemKey(b), 'en')) })
}
