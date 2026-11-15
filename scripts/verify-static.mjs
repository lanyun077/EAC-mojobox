import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { hash, releaseBytes, releaseUrl } from './release-assets.mjs'

export async function verifyStatic(directory, origin, fetcher = fetch) {
  const url = new URL(origin)
  if (url.protocol !== 'https:' || url.origin !== origin || url.username || url.password) throw new Error('Expected HTTPS site origin without path')
  const get = async path => {
    const response = await fetcher(`${origin}/${path}?verify=${Date.now()}`, { redirect: 'error', signal: AbortSignal.timeout(20000), headers: { 'Cache-Control': 'no-cache' } })
    if (!response.ok) throw new Error(`Static verification ${path}: HTTP ${response.status}`)
    return Buffer.from(await response.arrayBuffer())
  }
  const marker = await readFile(join(directory, 'generated/release.json'))
  const checkMarker = async () => { if (hash(await get('generated/release.json')) !== hash(marker)) throw new Error('Production release marker mismatch') }
  await checkMarker()
  for (const [name, expected] of Object.entries(JSON.parse(marker).files)) {
    if (hash(await readFile(join(directory, 'generated', name))) !== expected || hash(await get(`generated/${name}`)) !== expected) throw new Error(`Production metadata mismatch: ${name}`)
  }
  const html = await readFile(join(directory, 'index.html'))
  if (hash(await get('')) !== hash(html)) throw new Error('Production homepage mismatch')
  for (const match of html.toString('utf8').matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)="([^"]+)"/g)) {
    const resource = new URL(match[1], origin)
    if (resource.origin !== origin) throw new Error('Unexpected external entry asset')
    const path = resource.pathname.slice(1)
    if (hash(await get(path)) !== hash(await readFile(join(directory, path)))) throw new Error('Production entry asset mismatch')
  }
  const catalog = JSON.parse(await readFile(join(directory, 'generated/catalog.json'), 'utf8'))
  for (const pack of catalog.packs) {
    if (pack.archiveUrl !== releaseUrl(pack.metadata.id, pack.metadata.version)) throw new Error('Production pack is not on official Releases')
    const bytes = await releaseBytes(pack.archiveUrl, pack.archiveSize, fetcher)
    if (bytes.length !== pack.archiveSize || `sha256:${hash(bytes)}` !== pack.archiveDigest) throw new Error('Production pack digest mismatch')
  }
  for (const plugin of catalog.plugins.filter(item => item.archiveUrl)) {
    if (hash(await get(plugin.archiveUrl)) !== hash(await readFile(join(directory, plugin.archiveUrl)))) throw new Error('Production plugin download mismatch')
  }
  await checkMarker()
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await verifyStatic(resolve(process.argv[2] || 'dist'), process.env.SITE_ORIGIN); console.log('Production static release verified.') }
  catch (error) { console.error(error.message); process.exitCode = 1 }
}
