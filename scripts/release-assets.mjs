import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { repository } from './contributors.mjs'

export const hash = bytes => createHash('sha256').update(bytes).digest('hex')
export const releaseTag = (id, version) => `pack-${id}-v${version}`
export const releaseUrl = (id, version) => `https://github.com/${repository}/releases/download/${encodeURIComponent(releaseTag(id, version))}/${encodeURIComponent(`${id}-${version}.dshpack`)}`

export function githubClient(token, fetcher = fetch) {
  const request = async (path, { method = 'GET', body, upload = false, missing = false } = {}) => {
    const response = await fetcher(`https://${upload ? 'uploads' : 'api'}.github.com/repos/${repository}/${path}`, {
      method, redirect: 'error', signal: AbortSignal.timeout(60000),
      headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { 'Content-Type': upload ? 'application/zip' : 'application/json' } : {}) },
      ...(body ? { body: upload ? body : JSON.stringify(body) } : {})
    })
    if (missing && response.status === 404) return null
    if (!response.ok) throw new Error(`GitHub ${method} ${path.split('?')[0]}: HTTP ${response.status}`)
    return response.json()
  }
  request.list = async path => {
    const all = []
    for (let page = 1; ; page++) {
      const items = await request(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`)
      if (!Array.isArray(items)) throw new Error('Invalid GitHub paginated response')
      all.push(...items)
      if (items.length < 100) return all
    }
  }
  return request
}

// No credential is sent to a release download or its signed CDN redirect.
export async function releaseBytes(url, limit, fetcher = fetch) {
  const first = new URL(url)
  if (first.origin !== 'https://github.com' || !first.pathname.startsWith(`/${repository}/releases/download/`) || first.search || first.hash || first.username || first.password) throw new Error('Invalid official release URL')
  let target = first
  const signal = AbortSignal.timeout(60000)
  for (let hop = 0; hop <= 3; hop++) {
    const response = await fetcher(target, { redirect: 'manual', signal })
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      await response.body?.cancel()
      const location = response.headers.get('location')
      if (!location) throw new Error('Missing release redirect location')
      const next = new URL(location, target)
      if (next.protocol !== 'https:' || next.port || next.username || next.password || next.hash || next.hostname !== 'release-assets.githubusercontent.com') throw new Error('Untrusted release redirect')
      target = next
      continue
    }
    if (!response.ok) throw new Error(`Release download failed: HTTP ${response.status}`)
    if (Number(response.headers.get('content-length')) > limit) { await response.body?.cancel(); throw new Error('Release exceeds size limit') }
    const chunks = []
    let size = 0
    for await (const chunk of response.body ?? []) {
      size += chunk.length
      if (size > limit) throw new Error('Release exceeds size limit')
      chunks.push(Buffer.from(chunk))
    }
    return Buffer.concat(chunks)
  }
  throw new Error('Too many release redirects')
}

export async function publishPacks(catalog, directory, history, api, { commit, download = releaseBytes } = {}) {
  const mappings = [...history]
  for (const pack of catalog.packs) {
    const { id, version } = pack.metadata
    const filename = `${id}-${version}.dshpack`
    const bytes = await readFile(join(directory, 'generated/downloads', filename))
    if (bytes.length !== pack.archiveSize || `sha256:${hash(bytes)}` !== pack.archiveDigest) throw new Error(`Local release digest mismatch: ${id}`)
    const old = mappings.find(item => item.resource_id === id && item.version === version)
    if (old && (old.sha256 !== hash(bytes) || old.size !== bytes.length)) throw new Error(`Release version changed: ${id}@${version}`)
    const tag = releaseTag(id, version)
    let release = await api(`releases/tags/${encodeURIComponent(tag)}`, { missing: true })
    if (!release) {
      // Tag lookup only promises published releases; resume a draft left by an
      // interrupted upload through the authenticated releases listing.
      const drafts = (await api.list('releases')).filter(item => item.tag_name === tag)
      if (drafts.length > 1) throw new Error(`Duplicate release tag: ${tag}`)
      release = drafts[0]
    }
    if (!release) {
      if (old) throw new Error(`Registered release disappeared: ${id}@${version}`)
      release = await api('releases', { method: 'POST', body: { tag_name: tag, target_commitish: commit,
        name: `${pack.metadata.name} ${version}`, body: `Mojobox 原始整合包附件\n\nSHA-256: ${hash(bytes)}`,
        draft: true, prerelease: false, make_latest: 'false' } })
    }
    if (!Number.isSafeInteger(release.id) || release.tag_name !== tag || release.prerelease || (old && release.id !== old.release_id)) throw new Error(`Release identity mismatch: ${tag}`)
    const assets = (await api.list(`releases/${release.id}/assets`)).filter(asset => asset.name === filename)
    if (assets.length > 1 || (!assets.length && old)) throw new Error(`Registered release attachment missing or duplicated: ${filename}`)
    const asset = assets[0] || await api(`releases/${release.id}/assets?name=${encodeURIComponent(filename)}`, { method: 'POST', body: bytes, upload: true })
    if (!Number.isSafeInteger(asset.id) || asset.state !== 'uploaded' || asset.name !== filename || asset.size !== bytes.length ||
        (asset.digest && asset.digest !== `sha256:${hash(bytes)}`) || (old && asset.id !== old.asset_id)) throw new Error(`Release attachment identity mismatch: ${filename}`)
    if (release.draft) await api(`releases/${release.id}`, { method: 'PATCH', body: { draft: false, make_latest: 'false' } })
    const url = releaseUrl(id, version)
    const remote = await download(url, bytes.length)
    if (remote.length !== bytes.length || hash(remote) !== hash(bytes)) throw new Error(`Published release digest mismatch: ${filename}`)
    const mapping = { resource_id: id, version, tag, release_id: release.id, asset_id: asset.id, filename, size: bytes.length, sha256: hash(bytes), url }
    if (old) mappings[mappings.indexOf(old)] = mapping
    else mappings.push(mapping)
    pack.archiveUrl = url
  }
  return mappings
}

export async function sampleDownloads(mappings, api) {
  const counts = []
  for (const mapping of mappings) {
    const asset = await api(`releases/assets/${mapping.asset_id}`)
    if (asset.id !== mapping.asset_id || asset.name !== mapping.filename || asset.size !== mapping.size || asset.state !== 'uploaded' ||
        (asset.digest && asset.digest !== `sha256:${mapping.sha256}`) || !Number.isSafeInteger(asset.download_count) || asset.download_count < 0) throw new Error(`Invalid release download counter: ${mapping.filename}`)
    counts.push({ asset_id: asset.id, count: asset.download_count })
  }
  return counts
}
