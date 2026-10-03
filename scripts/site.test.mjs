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

test('intake groups appearance archives and prompt material under skins and counts each once', () => {
  const site = loadSite('/', mixedIntake)
  site.run('state.tab = "home"; render()')
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
  assert.doesNotMatch(site.app.innerHTML, /data-select="dev.aio.function"|外观包/)
  assert.ok(site.app.innerHTML.includes(`href="/${skinArchive.archiveUrl}" download`))
  assert.ok(site.app.innerHTML.includes(`href="/${skinPackage.promptUrl}" download`))
  assert.match(site.app.innerHTML, /下载皮肤包/)
  assert.match(site.app.innerHTML, /不可直接安装/)
})

test('skin search covers both formats without inheriting functional category filters', () => {
  const site = loadSite('/', mixedIntake)
  site.run('state.tab = "skins"; state.category = "function"; render()')
  for (const query of ['Example Skin', 'dev.example.skin', 'ui-skin-loader', 'bodyAttr:theme']) {
    site.run(`state.query = ${JSON.stringify(query)}; render()`)
    assert.match(site.app.innerHTML, /data-select="dev.example.skin"/)
    assert.doesNotMatch(site.app.innerHTML, /data-select="maid-atelier"/)
  }
  for (const query of ['Abyssal Maid Atelier', 'Prompt 资料', 'maid']) {
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

for (const base of ['/', '/dsh-mojobox/']) {
  test(`intake catalog renders downloads and truthful check scope at ${base}`, () => {
    const site = loadSite(base, { mode: 'intake', demo: true, plugins: [], packs: [intakePack] })
    site.run('state.selected = catalog.packs[0].metadata.id; render()')
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
  site.run('state.selected = "missing"; render()')
  assert.match(site.app.innerHTML, /暂无正式收录/)
  assert.match(site.app.innerHTML, /未找到此整合包/)
  assert.doesNotMatch(site.app.innerHTML, /测试演示|href="\/generated\/downloads/)
})

test('intake escapes developer/component fields and blocks unsafe source links', () => {
  const pack = { ...intakePack, author: '<img src=x>', source: 'javascript:alert(1)', components: [{ ref: '<script>bad</script>' }] }
  const site = loadSite('/', { mode: 'intake', plugins: [], packs: [pack] })
  site.run('state.selected = catalog.packs[0].metadata.id; render()')
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
