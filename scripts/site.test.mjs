import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import vm from 'node:vm'

const source = await readFile(new URL('../site/src/main.js', import.meta.url), 'utf8')
const readJson = async path => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'))
const pack = await readJson('catalog/packs/dev.aio.function.pack.json')
const lock = await readJson('catalog/packs/dev.aio.function.lock.json')
const manifest = await readJson(lock.components[0].manifest)
const plugin = { ...manifest, evidence: [], manifestUrl: `generated/manifests/${manifest.id}.json` }
const archiveDigest = `sha256:${'a'.repeat(64)}`
const samplePack = {
  ...pack, lock, archiveDigest, archiveSize: 12345,
  archiveUrl: 'generated/downloads/sample.dshpack',
  packUrl: 'generated/packs/sample.pack.json',
  lockUrl: 'generated/packs/sample.lock.json'
}
const catalog = {
  plugins: [plugin], packs: [samplePack],
  specifications: { dshStd: { manifestVersion: '0.15', revision: 'a'.repeat(40) } }
}

// Exercise real rendering functions without a browser, network, or generated site.
// Only module imports and automatic startup are replaced; this does not test layout.
function loadSite(base = '/', data = catalog) {
  const app = { innerHTML: '', className: '' }
  const context = vm.createContext({
    URL, basePath: base, inputCatalog: structuredClone(data), location: { hash: '' },
    createIcons() {},
    document: {
      querySelector: selector => selector === '#app' ? app : null,
      querySelectorAll: () => []
    }
  })
  const script = source
    .replace(/^import \{[\s\S]*?from 'lucide'\r?\n/, '')
    .replace("import './styles.css'", '')
    .replace(/const iconSet = \{[\s\S]*?\n\}/, 'const iconSet = {}')
    .replace('import.meta.env.BASE_URL', 'basePath')
    .replace(/start\(\)\.catch\([\s\S]*$/, '')
  vm.runInContext(`${script}\ncatalog = inputCatalog`, context)
  return { app, run: script => vm.runInContext(script, context) }
}

test('failed, revoked and expired evidence cannot promote the passing level', () => {
  const site = loadSite()
  site.run(`globalThis.records = [
    { evidenceLevel: 'Parsed', result: 'pass', revoked: false },
    { evidenceLevel: 'Tested', result: 'fail', revoked: false },
    { evidenceLevel: 'Attested', result: 'pass', revoked: true },
    { evidenceLevel: 'Observed', result: 'pass', revoked: false, expiresAt: '2000-01-01T00:00:00Z' }
  ]`)
  assert.equal(site.run('highestEvidence(records)'), 'Parsed')
  assert.equal(site.run('highestEvidence(records.slice(1))'), 'Declared')
  assert.equal(site.run('evidenceStatus(records[1])'), '失败')
  assert.equal(site.run('evidenceStatus(records[2])'), '已撤回')
  assert.equal(site.run('evidenceStatus(records[3])'), '已过期')
  assert.equal(site.run('highestEvidence([{evidenceLevel: "Tested", result: "pass", revoked: false}])'), 'Tested')
})

test('pack search includes description and renders an explicit empty result', () => {
  const site = loadSite()
  site.run('state.tab = "packs"; state.query = catalog.packs[0].metadata.description; render()')
  assert.match(site.app.innerHTML, /data-select="dev.aio.function"/)
  site.run('state.query = "does-not-exist-92371"; render()')
  assert.match(site.app.innerHTML, /没有匹配项/)
  assert.doesNotMatch(site.app.innerHTML, /data-select=/)
  site.run('state.query = ""; render()')
  assert.match(site.app.innerHTML, /data-select="dev.aio.function"/)
  assert.doesNotMatch(site.app.innerHTML, /<option value="appearance"/)
})

for (const base of ['/', '/dsh-mojobox/']) {
  test(`downloads retain deployment base ${base}, hashes and exact components`, () => {
    const site = loadSite(base)
    const html = site.run('packDetail(catalog.packs[0])')
    for (const path of [samplePack.archiveUrl, samplePack.packUrl, samplePack.lockUrl]) {
      assert.ok(html.includes(`href="${base}${path}" download`))
    }
    assert.ok(html.includes(`data-copy="${archiveDigest}"`))
    assert.match(html, /12,345 字节/)
    for (const component of lock.components) {
      assert.ok(html.includes(component.source))
      assert.ok(html.includes(`data-open-plugin="${component.id}"`))
    }
    assert.match(html, /host.snapshot/)
    assert.match(html, /win32 \/ x64/)
    assert.doesNotMatch(html, /dsh-eac:\/\//)
    const pluginHtml = site.run('pluginDetail(catalog.plugins[0])')
    assert.ok(pluginHtml.includes(`href="${base}${plugin.manifestUrl}" download`))
  })
}

test('catalog text is escaped rather than rendered as active markup', () => {
  const data = structuredClone(catalog)
  data.packs[0].metadata.description = '<img src=x onerror="alert(1)">'
  const site = loadSite('/', data)
  const html = site.run('packDetail(catalog.packs[0])')
  assert.ok(html.includes('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'))
  assert.doesNotMatch(html, /<img src=x/)
})

const intakePack = { ...samplePack, format: 'eac-feature-pack-v1', author: 'Test developer', license: 'MIT',
  source: 'https://example.org/release', reportUrl: 'generated/reports/sample.json',
  requires: { dsh: '>=0.1.7' }, components: [{ ref: '@example/test-only', version: '1.0.0' }] }
const skinPackage = {
  format: 'dsh-skin-prompt-package-v1',
  metadata: { id: 'maid-atelier', name: '深海女仆工坊', nameEn: 'Abyssal Maid Atelier', description: 'Prompt 资料', tags: ['maid'], category: 'appearance' },
  author: 'Small-tailqwq', license: 'CC-BY-NC-SA-4.0', source: { repository: 'https://github.com/example/skins', revision: 'b'.repeat(40) },
  target: { surface: 'dsh-client-web-ui' }, themes: ['light', 'dark'], requiredPromptSections: ['设计目标'],
  files: { manifest: `sha256:${'a'.repeat(64)}`, prompt: `sha256:${'b'.repeat(64)}`, readme: `sha256:${'c'.repeat(64)}` },
  manifestUrl: 'generated/skin-packages/maid-atelier/manifest.json', promptUrl: 'generated/skin-packages/maid-atelier/prompt.md', readmeUrl: 'generated/skin-packages/maid-atelier/README.md', runtime: 'not-applicable', installable: false
}

const skinArchive = { ...intakePack, metadata: { ...intakePack.metadata, id: 'dev.example.skin', name: 'Example Skin', category: 'appearance' },
  archiveUrl: 'generated/downloads/example-skin.dshpack', packUrl: 'generated/packs/example-skin.pack.json', reportUrl: 'generated/reports/example-skin.json', appearance: {
    kind: 'skin', loader: { id: '@dsh-eac/ui-skin-loader', version: '1.1.0', source: 'https://github.com/DSH-EAC/dsh-ui-skin-loader' },
    skinIds: ['maid-atelier'], conflicts: ['bodyAttr:theme'], previews: ['https://example.org/preview.png']
  } }
const mixedIntake = { mode: 'intake', demo: false, plugins: [], packs: [intakePack, skinArchive], skinPackages: [skinPackage] }

for (const base of ['/', '/EAC-mojobox/']) {
  test(`guide routes and published API links retain deployment base ${base}`, () => {
    const site = loadSite(base, mixedIntake)
    site.run('location.hash = "#/home"; applyHash(); render()')
    for (const route of ['plugins', 'contribute', 'source']) assert.ok(site.app.innerHTML.includes(`href="#/${route}"`))
    site.run('location.hash = "#/contribute"; applyHash(); render()')
    for (const type of ['plugin', 'pack', 'skin', 'prompt']) {
      assert.ok(site.app.innerHTML.includes(`href="#/contribute/${type}"`))
      site.run(`location.hash = "#/contribute/${type}"; applyHash(); render()`)
      assert.equal(site.run('state.tab'), 'contribute')
      assert.ok(site.app.innerHTML.includes(`href="#/contribute/${type}" aria-current="page"`))
      assert.ok(site.app.innerHTML.includes(`href="https://github.com/DSH-EAC/EAC-mojobox/blob/main/docs/community-submissions.md#${type}"`))
      assert.doesNotMatch(site.app.innerHTML, /data-select=|type="file"/)
    }
    site.run('location.hash = "#/contribute/%3Cscript%3E"; applyHash(); render()')
    assert.doesNotMatch(site.app.innerHTML, /<script>/)
    site.run('location.hash = "#/source"; applyHash(); render()')
    for (const path of ['plugins.json', 'schemas/plugin-index.schema.json', 'schemas/plugin-listing.schema.json']) {
      assert.ok(site.app.innerHTML.includes(`href="${base}generated/api/v1/${path}"`))
    }
    assert.ok(site.app.innerHTML.includes(`href="${base}generated/catalog.json"`))
    for (const [route, types] of [['plugins', ['plugin']], ['packs', ['pack']], ['skins', ['skin', 'prompt']]]) {
      site.run(`location.hash = "#/${route}"; applyHash(); render()`)
      for (const type of types) assert.ok(site.app.innerHTML.includes(`href="#/contribute/${type}"`))
    }
  })
}

const listing = { format: 'mojobox-plugin-listing-v1', id: 'org.example.tools', packageName: '@example/tools',
  name: 'Example tools', version: '1.0.0', summary: 'Mobile layout tools', license: 'MIT', maintainedBy: 'registry-maintained',
  source: { url: 'https://example.org/releases/1.0.0' }, compatibility: { dsh: null, basis: 'unknown' }, conflicts: null,
  limitations: ['Network access requires consent.'], artifact: { size: 12, sha256: 'a'.repeat(64) },
  archiveUrl: 'generated/downloads/org.example.tools-1.0.0.tgz', listingUrl: 'generated/plugins/org.example.tools.json',
  reportUrl: 'generated/reports/org.example.tools.plugin.json' }

for (const base of ['/', '/EAC-mojobox/']) {
  test(`plugin intake keeps exact downloads, unknown conflicts and isolated skill routes at ${base}`, () => {
    const data = { ...mixedIntake, plugins: [listing, { ...listing, id: 'org.example.source', artifact: undefined, archiveUrl: undefined, reportUrl: undefined }] }
    const site = loadSite(base, data)
    site.run('location.hash = "#/plugins/org.example.tools"; applyHash(); render()')
    for (const path of [listing.archiveUrl, listing.listingUrl, listing.reportUrl]) assert.ok(site.app.innerHTML.includes(`href="${base}${path}" download`))
    assert.match(site.app.innerHTML, /已知冲突尚未确认|宿主未测试|Mojobox 代录|内核兼容/)
    assert.doesNotMatch(site.app.innerHTML, /运行已验证|直接安装|Manifest/)
    site.run('state.selected = null; state.query = "Mobile layout"; render()')
    assert.equal((site.app.innerHTML.match(/class="pack-card plugin-card"/g) || []).length, 2)
    site.run('state.availability = "published"; render()')
    assert.equal((site.app.innerHTML.match(/class="pack-card plugin-card"/g) || []).length, 1)
    site.run('state.availability = "unpublished"; render()')
    assert.doesNotMatch(site.app.innerHTML, /下载原始插件/)
    site.run('location.hash = "#/skills"; applyHash(); render()')
    assert.match(site.app.innerHTML, /暂无 Skill 收录/)
    assert.doesNotMatch(site.app.innerHTML, /generated\/downloads|data-select=|<input type="search"/)
    site.run('state.tab = "home"; render()')
    assert.match(site.app.innerHTML, /<strong>5<\/strong><span>正式收录/)
  })
}

test('plugin listing text is escaped, missing routes stay missing and empty conflicts do not claim safety', () => {
  const data = { ...mixedIntake, plugins: [{ ...listing, summary: '<img src=x>', limitations: ['<script>bad</script>'], conflicts: [] }] }
  const site = loadSite('/', data)
  site.run('state.tab = "plugins"; state.selected = "org.example.tools"; render()')
  assert.match(site.app.innerHTML, /&lt;img src=x&gt;|提交方未报告已知冲突/)
  assert.doesNotMatch(site.app.innerHTML, /<script>bad|<img src=x/)
  site.run('state.selected = "not-present"; render()')
  assert.match(site.app.innerHTML, /未找到此插件/)
  assert.doesNotMatch(site.app.innerHTML, /generated\/downloads/)
})

test('version declarations distinguish syntax checks from historical unknown compatibility', () => {
  const data = structuredClone(mixedIntake)
  data.packs[0].checks = ['manifest-requires-range', 'manifest-plugin-versions']
  data.packs[0].versionDeclarations = { kernel: 'declared', comparison: 'not-performed' }
  data.packs[1].requires = {}
  data.packs[1].checks = ['manifest-plugin-versions']
  data.packs[1].versionDeclarations = { kernel: 'legacy-undeclared', comparison: 'not-performed' }
  const site = loadSite('/', data)
  const declared = site.run('intakeDetail(catalog.packs[0])')
  assert.match(declared, /内核范围语法<\/dt><dd>已检验/)
  assert.match(declared, /精确版本（不代表来源已锁定）/)
  assert.match(declared, /未执行，由下游宿主判断/)
  const historical = site.run('intakeDetail(catalog.packs[1])')
  assert.match(historical, /历史包未声明（兼容未知）/)
  assert.match(historical, /历史包未声明，不计为通过/)
  assert.doesNotMatch(historical, /内核范围语法<\/dt><dd>已检验/)
})

test('intake groups appearance archives and prompt material under skins and counts each once', () => {
  const site = loadSite('/', mixedIntake)
  site.run('state.tab = "home"; render()')
  assert.match(site.app.innerHTML, /href="#\/contribute"/)
  assert.match(site.app.innerHTML, /<strong>3<\/strong><span>正式收录<\/span>/)
  assert.match(site.app.innerHTML, /<strong>1<\/strong><span>功能包<\/span>/)
  assert.match(site.app.innerHTML, /<strong>2<\/strong><span>皮肤包<\/span>/)
  assert.match(site.app.innerHTML, /entry-count">1<small>项/)
  assert.match(site.app.innerHTML, /entry-count">2<small>项/)
  site.run('state.tab = "packs"; render()')
  assert.match(site.app.innerHTML, /data-select="dev.aio.function"/)
  assert.doesNotMatch(site.app.innerHTML, /data-select="dev.example.skin"|data-select="maid-atelier"|option value="appearance"/)
  site.run('state.tab = "skins"; render()')
  assert.match(site.app.innerHTML, /data-select="dev.example.skin"/)
  assert.match(site.app.innerHTML, /data-select="maid-atelier"/)
  assert.doesNotMatch(site.app.innerHTML, /data-select="dev.aio.function"/)
  assert.match(site.app.innerHTML, /skin-gallery/)
  assert.match(site.app.innerHTML, /href="#\/skins\/dev.example.skin"/)
  assert.match(site.app.innerHTML, /href="#\/skins\/maid-atelier"/)
  assert.match(site.app.innerHTML, /皮肤归档 · 宿主未测试/)
  assert.match(site.app.innerHTML, /设计资料 · 浅色、深色主题/)
})

test('skin search covers both formats without inheriting functional category filters', () => {
  const site = loadSite('/', mixedIntake)
  site.run('state.tab = "skins"; state.category = "function"; render()')
  for (const query of ['Example Skin', 'dev.example.skin', 'ui-skin-loader', 'bodyAttr:theme']) {
    site.run(`state.query = ${JSON.stringify(query)}; render()`)
    assert.match(site.app.innerHTML, /data-select="dev.example.skin"/)
    assert.doesNotMatch(site.app.innerHTML, /data-select="maid-atelier"/)
  }
  for (const query of ['Abyssal Maid Atelier', 'Prompt 资料', 'maid', '女仆', '浅色', '深色']) {
    site.run(`state.query = ${JSON.stringify(query)}; render()`)
    assert.match(site.app.innerHTML, /data-select="maid-atelier"/)
  }
  site.run('state.query = "does-not-exist"; render()')
  assert.match(site.app.innerHTML, /没有匹配项/)
  assert.doesNotMatch(site.app.innerHTML, /data-select=/)
})

for (const base of ['/', '/dsh-mojobox/']) {
  test(`skin archive routes retain downloads and loader declarations at ${base}`, () => {
    const site = loadSite(base, mixedIntake)
    for (const tab of ['skins', 'packs']) {
      site.run(`location.hash = "#/${tab}/dev.example.skin"; applyHash(); render()`)
      assert.equal(site.run('state.tab'), 'skins')
      assert.match(site.app.innerHTML, /返回皮肤包列表/)
      assert.match(site.app.innerHTML, /皮肤包声明/)
      assert.match(site.app.innerHTML, /ui-skin-loader/)
      assert.match(site.app.innerHTML, /maid-atelier/)
      assert.match(site.app.innerHTML, /宿主未测试/)
      assert.match(site.app.innerHTML, /由下游 loader 或宿主负责/)
      assert.match(site.app.innerHTML, /下载皮肤包/)
      assert.doesNotMatch(site.app.innerHTML, /option value="appearance"|SKIN PROMPT PACKAGE/)
      for (const path of [skinArchive.archiveUrl, skinArchive.packUrl, skinArchive.reportUrl]) assert.ok(site.app.innerHTML.includes(`href="${base}${path}" download`))
      assert.ok(site.app.innerHTML.includes(skinArchive.archiveDigest))
    }
  })
}

test('empty intake messages reflect the current collection rather than the source arrays', () => {
  const site = loadSite('/', { ...mixedIntake, packs: [skinArchive], skinPackages: [] })
  site.run('state.tab = "packs"; render()')
  assert.match(site.app.innerHTML, /暂无正式收录内容/)
  assert.doesNotMatch(site.app.innerHTML, /没有匹配项/)
  site.run('state.tab = "skins"; state.query = "does-not-exist"; render()')
  assert.match(site.app.innerHTML, /没有匹配项/)
  assert.doesNotMatch(site.app.innerHTML, /暂无正式收录内容/)
})

test('skin prompt packages render as source material and retain deployment base', () => {
  const site = loadSite('/dsh-mojobox/', { mode: 'intake', demo: false, plugins: [], packs: [], skinPackages: [skinPackage] })
  site.run('state.tab = "skins"; state.selected = "maid-atelier"; render()')
  for (const path of [skinPackage.manifestUrl, skinPackage.promptUrl, skinPackage.readmeUrl]) assert.ok(site.app.innerHTML.includes(`href="/dsh-mojobox/${path}" download`))
  assert.match(site.app.innerHTML, /不可直接安装/)
  assert.match(site.app.innerHTML, /SKIN PROMPT PACKAGE/)
  assert.match(site.app.innerHTML, /来源已固定/)
  assert.match(site.app.innerHTML, /目标宿主或 loader/)
})

test('detail summaries place downloads, declared support, tags and original sources before contents', () => {
  const site = loadSite('/EAC-mojobox/', mixedIntake)
  const html = site.run('intakeDetail(catalog.packs[0])')
  const contents = html.indexOf('class="detail-columns"')
  for (const marker of ['下载整合包', '声明支持版本', 'tag-list', '本包发布来源']) assert.ok(html.indexOf(marker) < contents)
  assert.equal(html.split(intakePack.metadata.description).length - 1, 1)
  const skin = site.run('intakeDetail(catalog.packs[1])')
  assert.ok(skin.indexOf('aria-label="皮肤预览"') < skin.indexOf('class="detail-columns"'))
  assert.match(skin, /<img src="https:\/\/example.org\/preview.png"/)
  assert.match(skin, /宿主未测试/)
})

test('prompt details distinguish original projects from fixed prompt provenance and reject unsafe previews', () => {
  const data = structuredClone(mixedIntake)
  data.skinPackages[0].origin = {
    repository: 'https://github.com/Small-tailqwq/dsh-deep-whale', projectUrl: 'https://github.com/Small-tailqwq/dsh-deep-whale',
    previews: [{ url: 'https://example.org/light.webp', label: '浅色' }, { url: 'javascript:alert(1)', label: 'unsafe' }], notes: '上游预览'
  }
  const site = loadSite('/EAC-mojobox/', data)
  const html = site.run('skinDetail(catalog.skinPackages[0])')
  assert.match(html, /Small-tailqwq\/dsh-deep-whale/)
  assert.match(html, /skin-prompts\/packages\/maid-atelier/)
  assert.match(html, /Prompt 资料来源/)
  assert.ok(html.indexOf('原项目') < html.indexOf('资料溯源'))
  assert.ok(html.indexOf('<img') < html.indexOf('class="detail-columns"'))
  assert.doesNotMatch(html, /javascript:|src="\/EAC-mojobox\/\.\.\//)
  assert.match(html, /不可直接安装/)
  assert.match(html, /<span class="tag">女仆<\/span>/)
  assert.match(html, /<dd>浅色、深色<\/dd>/)
  assert.doesNotMatch(html, /<span class="tag">maid<\/span>|<dd>light、dark<\/dd>/)
  assert.match(site.run('skinRow(catalog.skinPackages[0])'), /浅色、深色主题/)
})

test('skin gallery uses verified covers from both formats and handles missing or unsafe URLs', () => {
  const data = structuredClone(mixedIntake)
  data.skinPackages[0].origin = { previews: [
    { url: 'javascript:alert(1)' }, { url: 'https://example.org/light.webp' }
  ] }
  const site = loadSite('/', data)
  const archive = site.run('skinRow(catalog.packs[1])')
  assert.match(archive, /src="https:\/\/example.org\/preview.png"/)
  const prompt = site.run('skinRow(catalog.skinPackages[0])')
  assert.match(prompt, /src="https:\/\/example.org\/light.webp"/)
  assert.match(prompt, /Abyssal Maid Atelier/)
  assert.ok(prompt.indexOf('<img') < prompt.indexOf('skin-card-name'))
  assert.doesNotMatch(prompt, /javascript:|generated\/downloads|download/)
  site.run('catalog.skinPackages[0].origin.previews = [{ url: "data:text/html,unsafe" }]; catalog.skinPackages[0].metadata.name = "<script>unsafe</script>"')
  const missing = site.run('skinRow(catalog.skinPackages[0])')
  assert.match(missing, /skin-cover preview-unavailable/)
  assert.match(missing, /暂无预览/)
  assert.match(missing, /&lt;script&gt;unsafe&lt;\/script&gt;/)
  assert.doesNotMatch(missing, /<img|data:text|<script>/)
})

for (const base of ['/', '/dsh-mojobox/']) {
  test(`author tags, introduction, local previews and independent prompt links render at ${base}`, () => {
    const data = structuredClone(mixedIntake)
    data.packs[0].metadata.tags = ['external-author-tag']
    data.packs[0].metadata.introduction = '<script>author text</script>'
    data.packs[0].links = [{ label: '作者仓库', url: 'https://github.com/example/author' }]
    data.packs[0].previews = ['generated/previews/dev.aio.function/overview.png']
    data.packs[1].previews = ['generated/previews/dev.example.skin/overview.webp']
    data.skinPackages[0].source.path = 'designs/maid-atelier'
    const site = loadSite(base, data)
    const detail = site.run('intakeDetail(catalog.packs[0])')
    assert.match(detail, /external-author-tag|详细介绍|功能预览/)
    assert.ok(detail.includes(`src="${base}generated/previews/dev.aio.function/overview.png"`))
    assert.match(detail, /&lt;script&gt;author text&lt;\/script&gt;/)
    assert.doesNotMatch(detail, /<script>/)
    assert.match(detail, /https:\/\/github.com\/example\/author/)
    assert.ok(site.run('skinRow(catalog.packs[1])').includes(`src="${base}generated/previews/dev.example.skin/overview.webp"`))
    assert.match(site.run('sourcePackageUrl(catalog.skinPackages[0])'), /designs\/maid-atelier$/)
    site.run('state.tab = "packs"; state.query = "external-author-tag"; render()')
    assert.match(site.app.innerHTML, /data-select="dev.aio.function"/)
    for (const url of ['generated/previews/id/../private.png', 'generated/previews/id/file.svg', '//example.org/image.png']) assert.equal(site.run(`safePreviewUrl(${JSON.stringify(url)})`), '#')
  })
}

for (const base of ['/', '/dsh-mojobox/']) {
  test(`intake catalog renders downloads and truthful check scope at ${base}`, () => {
    const site = loadSite(base, { mode: 'intake', demo: true, plugins: [], packs: [intakePack] })
    site.run('state.tab = "packs"; state.selected = catalog.packs[0].metadata.id; render()')
    const html = site.app.innerHTML
    for (const path of [intakePack.archiveUrl, intakePack.packUrl, intakePack.reportUrl]) assert.ok(html.includes(`href="${base}${path}" download`))
    assert.match(html, /测试演示/)
    assert.match(html, /宿主运行尚未测试/)
    assert.match(html, /Test developer/)
    assert.match(html, /@example\/test-only/)
    assert.doesNotMatch(html, />Lock<|data-open-plugin|有效通过等级/)
    site.run('state.query = "does-not-exist"; render()')
    assert.match(site.app.innerHTML, /没有匹配项/)
  })
}

test('empty production intake and missing selection render without legacy specifications', () => {
  const site = loadSite('/', { mode: 'intake', demo: false, plugins: [], packs: [] })
  site.run('state.tab = "packs"; state.selected = "missing"; render()')
  assert.match(site.app.innerHTML, /暂无正式收录/)
  assert.match(site.app.innerHTML, /未找到此整合包/)
  assert.doesNotMatch(site.app.innerHTML, /测试演示|href="\/generated\/downloads/)
})

test('intake escapes developer/component fields and blocks unsafe source links', () => {
  const pack = { ...intakePack, author: '<img src=x>', source: 'javascript:alert(1)', components: [{ ref: '<script>bad</script>' }] }
  const site = loadSite('/', { mode: 'intake', plugins: [], packs: [pack] })
  site.run('state.tab = "packs"; state.selected = catalog.packs[0].metadata.id; render()')
  assert.match(site.app.innerHTML, /&lt;img src=x&gt;/)
  assert.doesNotMatch(site.app.innerHTML, /javascript:|<script>bad/)
})

test('HTTP, malformed JSON and invalid catalog failures show a load error instead of downloads', async () => {
  for (const response of [
    '({ok:false,status:503})',
    '({ok:true,json:async()=>{throw new Error("Invalid JSON <script>")}})',
    '({ok:true,json:async()=>({packs:null})})'
  ]) {
    const site = loadSite()
    await site.run(`globalThis.fetch = async () => ${response}; start().catch(showLoadError)`)
    assert.equal(site.app.className, 'app-error')
    assert.match(site.app.innerHTML, /目录载入失败/)
    assert.doesNotMatch(site.app.innerHTML, /<script>| download/)
  }
})

test('search preserves the edit caret and waits for IME composition', () => {
  const site = loadSite()
  site.run(`
    globalThis.handlers = {}; globalThis.renders = 0;
    globalThis.search = { value: '中文测试', selectionStart: 2, addEventListener: (name, fn) => handlers[name] = fn,
      focus() {}, setSelectionRange(start, end) { this.range = [start,end] } };
    document.querySelector = selector => selector === '.search-field input' ? search : null;
    render = () => { renders++ }; bindEvents();
    handlers.input({target:search,isComposing:true});
  `)
  assert.equal(site.run('renders'), 0)
  site.run('handlers.compositionend({target:search});')
  assert.equal(site.run('renders'), 1)
  assert.equal(site.run('JSON.stringify(search.range)'), '[2,2]')
})

test('clipboard denial offers a manual digest instead of an unhandled rejection', async () => {
  const site = loadSite()
  site.run(`
    globalThis.handler = null;
    globalThis.button = { dataset: {copy:'digest'}, previousElementSibling:{style:{}},
      setAttribute(name,value) {this[name]=value}, addEventListener(name,fn) {handler=fn} };
    document.querySelectorAll = selector => selector === '[data-copy]' ? [button] : [];
    globalThis.navigator = {clipboard:{writeText:async()=>{throw new Error('Denied')}}};
    bindEvents();
  `)
  await site.run('handler()')
  assert.equal(site.run('button.title'), '复制失败，请手动选择摘要')
  assert.equal(site.run('button.previousElementSibling.style.whiteSpace'), 'normal')
})
