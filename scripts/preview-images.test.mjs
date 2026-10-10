import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { inspectPreviewImages, publishPreviewImages, verifyPreviewImages } from './preview-images.mjs'

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aH1sAAAAASUVORK5CYII=', 'base64')
const previewPath = 'previews/org.example.tools/overview.png'

test('uploaded preview bytes and digests survive publication; remote URLs are not fetched', async t => {
  const root = await mkdtemp(join(tmpdir(), 'mojobox-previews-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  t.mock.method(globalThis, 'fetch', () => { throw new Error('Preview checks must not access the network') })
  await mkdir(join(root, 'catalog/previews/org.example.tools'), { recursive: true })
  await writeFile(join(root, 'catalog', previewPath), png)
  const inputs = [previewPath, { label: 'Dark', url: 'https://example.org/dark.webp' }]
  const images = await inspectPreviewImages(root, 'org.example.tools', inputs)
  const output = join(root, 'generated')
  const result = await publishPreviewImages(images, output)
  assert.deepEqual(result.previews, [`generated/${previewPath}`, inputs[1]])
  assert.equal(result.previewFiles.length, 1)
  assert.equal(result.previewFiles[0].size, png.length)
  assert.deepEqual(await readFile(join(root, result.previewFiles[0].url)), png)
  await verifyPreviewImages(root, 'org.example.tools', result.previews, result.previewFiles)
  await assert.rejects(verifyPreviewImages(root, 'org.example.tools', result.previews, []), /declarations differ/)
  await assert.rejects(verifyPreviewImages(root, 'org.example.tools', [], result.previewFiles), /declarations differ/)
  await writeFile(join(root, result.previewFiles[0].url), Buffer.concat([png, Buffer.from('changed')]))
  await assert.rejects(verifyPreviewImages(root, 'org.example.tools', result.previews, result.previewFiles), /digest or size mismatch/)
})

test('preview validation rejects unsafe paths, credentials, mismatched signatures, missing and oversized files', async t => {
  const root = await mkdtemp(join(tmpdir(), 'mojobox-preview-invalid-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  for (const value of ['javascript:alert(1)', 'https://user:secret@example.org/file.png', 'http://example.org/file.png',
    'previews/org.example.tools/../other.png', 'previews/another-id/overview.png', 'previews/org.example.tools/image.svg',
    'previews/org.example.tools/..png', 'previews/org.example.tools/overview.png?secret', 'previews/org.example.tools/UPPER.png']) {
    await assert.rejects(inspectPreviewImages(root, 'org.example.tools', [value]))
  }
  await assert.rejects(inspectPreviewImages(root, 'org.example.tools', Array(17).fill('https://example.org/a.png')), /at most 16/)
  await assert.rejects(inspectPreviewImages(root, 'org.example.tools', [previewPath, previewPath]), /ENOENT|duplicate/)
  await mkdir(join(root, 'catalog/previews/org.example.tools'), { recursive: true })
  await assert.rejects(inspectPreviewImages(root, 'org.example.tools', [previewPath]), { code: 'ENOENT' })
  await writeFile(join(root, 'catalog', previewPath), '<svg>not a PNG</svg>')
  await assert.rejects(inspectPreviewImages(root, 'org.example.tools', [previewPath]), /signature/)
  await writeFile(join(root, 'catalog', previewPath), png)
  await assert.rejects(inspectPreviewImages(root, 'org.example.tools', [previewPath, previewPath]), /duplicate/)
  await writeFile(join(root, 'catalog', previewPath), Buffer.alloc(2 * 1024 * 1024 + 1))
  await assert.rejects(inspectPreviewImages(root, 'org.example.tools', [previewPath]), /2 MiB/)
})

test('preview validation rejects symbolic image files', async t => {
  const root = await mkdtemp(join(tmpdir(), 'mojobox-preview-symlink-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(join(root, 'catalog/previews/org.example.tools'), { recursive: true })
  await writeFile(join(root, 'original.png'), png)
  try { await symlink(join(root, 'original.png'), join(root, 'catalog', previewPath)) }
  catch (error) { if (['EPERM', 'EACCES'].includes(error.code)) return t.skip('Symbolic links are unavailable'); throw error }
  await assert.rejects(inspectPreviewImages(root, 'org.example.tools', [previewPath]), /symlinks/)
})

test('preview validation rejects a linked parent directory', async t => {
  const root = await mkdtemp(join(tmpdir(), 'mojobox-preview-parent-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(join(root, 'catalog/previews'), { recursive: true })
  await writeFile(join(root, 'original.png'), png)
  await symlink(root, join(root, 'catalog/previews/org.example.tools'), process.platform === 'win32' ? 'junction' : 'dir')
  await assert.rejects(inspectPreviewImages(root, 'org.example.tools', ['previews/org.example.tools/original.png']), /symlinks/)
})
