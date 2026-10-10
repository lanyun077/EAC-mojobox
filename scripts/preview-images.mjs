import { createHash } from 'node:crypto'
import { lstat, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const maxSize = 2 * 1024 * 1024
const filenamePattern = /^[a-z0-9][a-z0-9._-]*\.(png|jpe?g|webp)$/
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`

export function assertHttps(value, field = 'Source URL') {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`${field} must be an HTTPS URL without credentials`)
}

function localPath(value, id, prefix) {
  const start = `${prefix}/${id}/`
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(id) || !value.startsWith(start) || !filenamePattern.test(value.slice(start.length))) {
    throw new Error(`Invalid local preview path: ${value}`)
  }
  return value
}

async function readImage(root, path) {
  let current = root
  for (const part of path.split('/')) {
    current = join(current, part)
    const stat = await lstat(current)
    if (stat.isSymbolicLink()) throw new Error(`Preview path must not contain symlinks: ${path}`)
    if (current === join(root, path) && (!stat.isFile() || stat.size > maxSize)) throw new Error(`Preview must be a regular file of at most 2 MiB: ${path}`)
  }
  const bytes = await readFile(current)
  const extension = path.split('.').pop()
  const valid = extension === 'png' ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : ['jpg', 'jpeg'].includes(extension) ? bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
      : bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP'
  if (bytes.length > maxSize || !valid) throw new Error(`Invalid preview image signature or size: ${path}`)
  return bytes
}

export async function inspectPreviewImages(root, id, previews = []) {
  if (!Array.isArray(previews) || previews.length > 16) throw new Error('Previews must be an array of at most 16 images')
  const inspected = []
  const seen = new Set()
  for (const preview of previews) {
    const url = typeof preview === 'string' ? preview : preview?.url
    if (typeof url !== 'string' || !url || seen.has(url)) throw new Error('Invalid or duplicate preview URL')
    seen.add(url)
    if (!url.startsWith('previews/')) {
      assertHttps(url, 'Preview URL')
      inspected.push({ preview })
      continue
    }
    localPath(url, id, 'previews')
    const bytes = await readImage(root, `catalog/${url}`)
    const publishedUrl = `generated/${url}`
    inspected.push({
      preview: typeof preview === 'string' ? publishedUrl : { ...preview, url: publishedUrl },
      file: { url: publishedUrl, sha256: digest(bytes), size: bytes.length }, bytes
    })
  }
  return inspected
}

export async function publishPreviewImages(inspected, output) {
  for (const item of inspected) {
    if (!item.file) continue
    const target = join(output, item.file.url.slice('generated/'.length))
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, item.bytes)
  }
  return { previews: inspected.map(item => item.preview), previewFiles: inspected.filter(item => item.file).map(item => item.file) }
}

export async function verifyPreviewImages(directory, id, previews = [], files = []) {
  if (!Array.isArray(previews) || previews.length > 16 || !Array.isArray(files)) throw new Error('Invalid published previews')
  const localUrls = new Set()
  for (const preview of previews) {
    const url = typeof preview === 'string' ? preview : preview?.url
    if (typeof url !== 'string') throw new Error('Invalid preview URL')
    if (url.startsWith('generated/previews/')) localUrls.add(localPath(url, id, 'generated/previews'))
    else assertHttps(url, 'Preview URL')
  }
  if (files.length !== localUrls.size || new Set(files.map(file => file.url)).size !== files.length) throw new Error('Preview file declarations differ from displayed previews')
  for (const file of files) {
    if (!localUrls.has(file.url)) throw new Error('Unexpected preview file declaration')
    const bytes = await readImage(directory, file.url)
    if (digest(bytes) !== file.sha256 || bytes.length !== file.size) throw new Error('Preview file digest or size mismatch')
  }
}
