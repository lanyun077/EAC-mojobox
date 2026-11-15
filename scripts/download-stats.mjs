import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resourceHistory } from './contributors.mjs'

const exec = promisify(execFile)
const day = 86400000

export async function catalogTimes(root, catalog) {
  const items = []
  for (const [kind, resources] of [['pack', catalog.packs], ['plugin', catalog.plugins]]) {
    for (const resource of resources) {
      const { id, version } = resource.metadata || resource
      const path = `catalog/${kind === 'pack' ? 'feature-packs' : 'plugin-listings'}/${id}.json`
      const { events } = await resourceHistory(root, path)
      const date = async event => event ? (await exec('git', ['show', '-s', '--format=%cI', event.commit], { cwd: root })).stdout.trim() : null
      items.push({ kind, resource_id: id, version, first_seen_at: await date(events[0]),
        version_seen_at: events.at(-1)?.version === version ? await date(events.at(-1)) : null })
    }
  }
  return items
}

export function addSnapshot(snapshots, counts, at) {
  if (!Number.isFinite(Date.parse(at)) || counts.some(item => !Number.isSafeInteger(item.asset_id) || !Number.isSafeInteger(item.count) || item.count < 0)) throw new Error('Invalid download snapshot')
  const previous = snapshots.at(-1)
  if (previous && Date.parse(at) < Date.parse(previous.at)) throw new Error('Download snapshot moved backwards')
  for (const item of counts) {
    const before = previous?.counts.find(old => old.asset_id === item.asset_id)
    if (before && item.count < before.count) throw new Error(`Download count moved backwards: ${item.asset_id}`)
  }
  // Retain the first daily baseline; extra builds refresh today's latest sample.
  const today = at.slice(0, 10)
  const history = snapshots.filter((sample, index) => sample.at.slice(0, 10) !== today || index === snapshots.findIndex(entry => entry.at.slice(0, 10) === today))
  if (history.at(-1)?.at === at) history.pop()
  return [...history, { at, counts }]
}

export function rankings(times, mappings, snapshots, { stale = false } = {}) {
  const current = snapshots.at(-1)
  const end = Date.parse(current?.at)
  // An approximately seven-day window; do not invent daily samples after an outage.
  const baseline = snapshots.filter(sample => end - Date.parse(sample.at) >= 7 * day && end - Date.parse(sample.at) <= 8 * day).at(-1)
  const items = times.map(item => {
    const assets = mappings.filter(asset => asset.resource_id === item.resource_id)
    const latest = assets.find(asset => asset.version === item.version)
    const total = sample => assets.reduce((sum, asset) => {
      const count = sample?.counts.find(row => row.asset_id === asset.asset_id)?.count
      // A newly published version had zero downloads before it existed.
      if (count === undefined && sample === current) return NaN
      return sum + (count ?? 0)
    }, 0)
    const all = item.kind === 'pack' && latest && current ? total(current) : NaN
    const week = Number.isFinite(all) && baseline ? all - total(baseline) : NaN
    return { ...item, downloads_all: Number.isSafeInteger(all) ? all : null, downloads_7d: Number.isSafeInteger(week) && week >= 0 ? week : null }
  })
  return { format: 'mojobox-rankings-v1', data_as_of: current?.at || null, window_start: baseline?.at || null,
    stale, source: 'github-release-assets', items }
}
