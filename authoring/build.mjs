import { readFile, readdir, writeFile } from 'node:fs/promises'
import { ZipArchive } from 'archiver'
import { inspectFeaturePack, validateRecord } from '../scripts/feature-pack.mjs'

const root = new URL('../', import.meta.url)
const checkOnly = process.argv[2] === '--check'
if (process.argv.length > 3 || (process.argv[2] && !checkOnly)) {
  throw new Error('Usage: node authoring/build.mjs [--check]')
}

const outputs = []
for (const file of (await readdir(new URL('authoring/packs/', root))).filter(name => name.endsWith('.json')).sort()) {
  const manifestBytes = await readFile(new URL(`authoring/packs/${file}`, root))
  const zip = new ZipArchive({ zlib: { level: 9 } })
  const chunks = []
  const done = new Promise((accept, reject) => {
    zip.on('data', chunk => chunks.push(chunk))
    zip.on('end', () => accept(Buffer.concat(chunks)))
    zip.on('error', reject)
  })
  zip.append(manifestBytes, { name: 'pack.json', date: new Date('1980-01-01T00:00:00Z'), mode: 0o644 })
  await zip.finalize()
  const bytes = await done
  const report = await inspectFeaturePack(bytes)
  const m = report.manifest
  if (file !== `${m.id}.json`) throw new Error(`Manifest filename must equal id: ${file}`)
  const archive = new URL(`artifacts/${m.id}-${m.version}.dshpack`, root)
  const existing = await readFile(archive).catch(error => {
    if (error.code !== 'ENOENT') throw error
  })
  if (existing && !existing.equals(bytes)) throw new Error(`Existing archive differs; increment the pack version: ${m.id}`)
  if (checkOnly) {
    if (!existing) throw new Error(`Missing archive: ${m.id}`)
    const record = JSON.parse(await readFile(new URL(`catalog/feature-packs/${m.id}.json`, root)))
    validateRecord(record)
    if (record.id !== m.id || record.version !== m.version || record.sha256 !== report.sha256 || record.author !== m.author || record.license !== m.license) {
      throw new Error(`Intake record differs from authored pack: ${m.id}`)
    }
  }
  outputs.push({ archive, bytes, existing, id: m.id, sha256: report.sha256 })
}

// Validate the whole batch before creating any archive; released bytes are never overwritten.
for (const output of outputs) {
  if (!checkOnly && !output.existing) await writeFile(output.archive, output.bytes, { flag: 'wx' })
  console.log(`${output.id} ${output.sha256}`)
}
