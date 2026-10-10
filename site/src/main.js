import {
  Archive,
  ArrowUpRight,
  Box,
  Boxes,
  CheckCircle2,
  Clipboard,
  Code2,
  Database,
  Download,
  ExternalLink,
  FileJson,
  FileText,
  Filter,
  Image,
  Info,
  PackageCheck,
  Search,
  ShieldCheck,
  TriangleAlert,
  createIcons
} from 'lucide'
import './styles.css'

const iconSet = {
  Archive,
  ArrowUpRight,
  Box,
  Boxes,
  CheckCircle2,
  Clipboard,
  Code2,
  Database,
  Download,
  ExternalLink,
  FileJson,
  FileText,
  Filter,
  Image,
  Info,
  PackageCheck,
  Search,
  ShieldCheck,
  TriangleAlert
}

const app = document.querySelector('#app')
const base = import.meta.env.BASE_URL
const levelOrder = ['Declared', 'Parsed', 'Negotiated', 'Tested', 'Observed', 'Attested']
const state = { tab: 'plugins', query: '', availability: 'all', evidence: 'all', host: 'all', category: 'all', selected: null }
let catalog

const categoryLabels = {
  function: '功能包',
  appearance: '皮肤包',
  workflow: '工作流包'
}

const tagLabels = {
  '2008': '2008 年风格', anime: '动漫', art: '艺术', blue: '蓝色', chinese: '中式',
  'crystal-blue': '水晶蓝', dragon: '龙', dreamskin: '梦幻皮肤', 'dual-theme': '双主题',
  game: '游戏', glass: '玻璃质感', goddess: '女神', 'great-wall': '长城', 'ice-blue': '冰蓝',
  idol: '偶像', indigo: '靛蓝', 'ink-wash': '水墨', live: '动态', longbridge: '长桥',
  loong: '中国龙', luna: '月光界面', maid: '女仆', miku: '初音未来', minecraft: '我的世界',
  music: '音乐', navy: '海军蓝', nostalgia: '怀旧', ocean: '海洋', ornate: '华丽装饰',
  panorama: '全景', pixel: '像素', qq: 'QQ 风格', red: '红色', retro: '复古', skybox: '天空盒',
  'start-button': '开始按钮', stock: '股票', terminal: '终端', ticker: '行情', trading: '交易',
  translucent: '半透明', vocaloid: '虚拟歌手', voxel: '体素', waveform: '波形',
  whale: '鲸鱼', windows: '视窗系统', xp: '经典 XP',
  genui: '生成式界面', modsearch: '模型搜索', visualize: '可视化', 'agent-teams': '智能体团队',
  catppuccin: '四色主题', 'client-ui-skin-deep-whale-manager': '鲸鱼娘管理器',
  'client-ui-skin-maid-atelier': '女仆工坊', 'client-ui-skin-orca-link': '虎鲸链路',
  navbar: '导航栏', 'browser-skill-dsh-plugin': '浏览器工具', 'better-sidebar': '增强侧栏',
  'bloom-theme': '花开主题', 'chat-import': '会话导入', context: '上下文观测',
  'dream-skin': '梦幻皮肤', 'opencode-palette': '开放代码配色', 'plugin-wallpaper-engine': '动态壁纸',
  'session-manager': '会话管理', 'soul-md': '长期记忆', 'undo-savepoint': '快照恢复',
  'univer-office': '办公套件', 'vision-router': '视觉路由', dshmarket: '插件市场',
  'project-memory': '项目记忆', 'theme-endfield': '终末地主题', 'meow-smooth': '平滑滚动',
  'open-sea-skin': '开放海洋主题'
}

function tagLabel(tag) {
  const key = String(tag).toLowerCase()
  return Object.hasOwn(tagLabels, key) ? tagLabels[key] : tag
}

function contentTags(pack) {
  return Array.isArray(pack.metadata.tags) ? pack.metadata.tags : (pack.components || []).map(component => (component.ref || component.id || '').split('/').pop().replace(/^dsh-/, ''))
}

function formatThemes(themes) {
  return (themes || []).map(theme => theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : theme).join('、') || '未声明'
}

const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const assetUrl = path => `${base}${path}`
const shortDigest = digest => digest ? `${digest.slice(0, 15)}…${digest.slice(-8)}` : '未发布'
const evidenceStatus = record => record.revoked ? '已撤回' : record.expiresAt && Date.parse(record.expiresAt) <= Date.now() ? '已过期' : record.result === 'pass' ? '通过' : '失败'
const highestEvidence = records => records.reduce((highest, record) => {
  if (evidenceStatus(record) !== '通过') return highest
  return levelOrder.indexOf(record.evidenceLevel) > levelOrder.indexOf(highest) ? record.evidenceLevel : highest
}, 'Declared')

function safeExternalUrl(value) {
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '#'
  } catch {
    return '#'
  }
}

function renderTags(tags, fallback = '未声明') {
  const values = [...new Set((Array.isArray(tags) ? tags : []).filter(Boolean).map(tagLabel))]
  return values.length ? `<div class="tag-list">${values.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>` : `<p class="empty-inline">${fallback}</p>`
}

function renderRelatedLinks(links) {
  const values = (Array.isArray(links) ? links : []).filter(link => link && link.url)
  return values.length ? `<div class="related-links">${values.map(link => {
    const url = safeExternalUrl(link.url)
    return url === '#' ? `<span class="related-link is-unavailable">${escapeHtml(link.label || '相关链接')}<small>链接未声明</small></span>` : `<a class="related-link" href="${escapeHtml(url)}" target="_blank" rel="noreferrer"><span>${escapeHtml(link.label || '相关链接')}</span><i data-lucide="external-link"></i></a>`
  }).join('')}</div>` : '<p class="empty-inline">未声明相关链接</p>'
}

function formatPlatforms(requires) {
  return requires?.platforms?.map(item => `${item.os}${item.arch?.length ? ` / ${item.arch.join(', ')}` : ''}`).join('、') || '未声明（不代表跨平台实测）'
}

function sourcePackageUrl(pack) {
  const repository = safeExternalUrl(pack.source?.repository)
  const path = pack.source?.path || `skin-prompts/packages/${pack.metadata.id}`
  return repository !== '#' && pack.source?.revision ? `${repository.replace(/\/$/, '')}/tree/${encodeURIComponent(pack.source.revision)}/${path.split('/').map(encodeURIComponent).join('/')}` : repository
}

function safePreviewUrl(value) {
  if (typeof value === 'string' && /^generated\/previews\/[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*\.(png|jpe?g|webp)$/.test(value)) return assetUrl(value)
  return safeExternalUrl(value)
}

function renderPreviews(previews, name, note = '', title = '皮肤预览') {
  const images = (Array.isArray(previews) ? previews : []).map((preview, index) => ({
    url: safePreviewUrl(typeof preview === 'string' ? preview : preview.url),
    label: typeof preview === 'string' ? `预览 ${index + 1}` : preview.label || `预览 ${index + 1}`
  })).filter(preview => preview.url !== '#')
  return `<section class="detail-preview-section" aria-label="${escapeHtml(title)}"><h3>${escapeHtml(title)}</h3>${note ? `<p class="section-note">${escapeHtml(note)}</p>` : ''}${images.length ? `<div class="detail-previews">${images.map((preview, index) => `<figure><a href="${escapeHtml(preview.url)}" target="_blank" rel="noreferrer"><img src="${escapeHtml(preview.url)}" alt="${escapeHtml(name)} · ${escapeHtml(preview.label)}" ${index ? 'loading="lazy"' : 'loading="eager"'} decoding="async" referrerpolicy="no-referrer" /></a><figcaption>${escapeHtml(preview.label)} <a href="${escapeHtml(preview.url)}" target="_blank" rel="noreferrer">查看原图 <i data-lucide="external-link"></i></a></figcaption></figure>`).join('')}</div>` : '<p class="empty-inline">暂无已核实的预览图片</p>'}</section>`
}

function componentSourceUrl(ref) {
  if (ref?.startsWith('github:')) return safeExternalUrl(`https://github.com/${ref.slice(7)}`)
  if (!ref || ref.startsWith('builtin:')) return '#'
  return `https://www.npmjs.com/package/${ref.split('/').map(encodeURIComponent).join('/')}`
}

function refreshIcons() {
  createIcons({ icons: iconSet, attrs: { 'aria-hidden': 'true', width: 18, height: 18 } })
}

function initials(name) {
  return name.split(/[-_.]/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase()
}

function statusBadge(plugin) {
  if (!plugin.artifact) return '<span class="badge badge-warning">未发布</span>'
  const level = highestEvidence(plugin.evidence)
  return `<span class="badge badge-${level.toLowerCase()}">${escapeHtml(level)}</span>`
}

function intakeCollections() {
  return {
    packs: catalog.packs.filter(pack => pack.metadata.category !== 'appearance'),
    skins: [...catalog.packs.filter(pack => pack.metadata.category === 'appearance'), ...(catalog.skinPackages || [])]
  }
}

function filteredItems() {
  const query = state.query.trim().toLowerCase()
  if (state.tab === 'plugins') {
    if (catalog.mode === 'intake') return catalog.plugins.filter(plugin =>
      (!query || `${plugin.name} ${plugin.id} ${plugin.packageName} ${plugin.summary} ${(plugin.limitations || []).join(' ')}`.toLowerCase().includes(query)) &&
      (state.availability === 'all' || (state.availability === 'published') === Boolean(plugin.archiveUrl)))
    return catalog.plugins.filter(plugin => {
      const matchesQuery = !query || `${plugin.name} ${plugin.id}`.toLowerCase().includes(query)
      const matchesAvailability = state.availability === 'all' || (state.availability === 'published') === Boolean(plugin.artifact)
      const level = highestEvidence(plugin.evidence)
      const matchesEvidence = state.evidence === 'all' || level.toLowerCase() === state.evidence
      const matchesHost = state.host === 'all' || plugin.evidence.some(record => record.host?.id === state.host)
      return matchesQuery && matchesAvailability && matchesEvidence && matchesHost
    })
  }
  if (state.tab === 'skills') return []
  const { packs, skins } = catalog.mode === 'intake' ? intakeCollections() : { packs: catalog.packs, skins: catalog.skinPackages || [] }
  if (state.tab === 'skins') return skins.filter(pack => {
    const appearanceText = pack.appearance ? JSON.stringify(pack.appearance) : ''
    const matchesQuery = !query || `${pack.metadata.name} ${pack.metadata.nameEn || ''} ${pack.metadata.id} ${pack.metadata.description} ${contentTags(pack).join(' ')} ${contentTags(pack).map(tagLabel).join(' ')} ${formatThemes(pack.themes)} ${appearanceText}`.toLowerCase().includes(query)
    return matchesQuery
  })
  return packs.filter(pack => {
    const appearanceText = pack.appearance ? JSON.stringify(pack.appearance) : ''
    const matchesQuery = !query || `${pack.metadata.name} ${pack.metadata.id} ${pack.metadata.description} ${contentTags(pack).join(' ')} ${contentTags(pack).map(tagLabel).join(' ')} ${appearanceText}`.toLowerCase().includes(query)
    const matchesCategory = state.category === 'all' || pack.metadata.category === state.category
    return matchesQuery && matchesCategory
  })
}

function pluginRow(plugin) {
  if (plugin.format === 'mojobox-plugin-listing-v1') return `
    <article class="pack-card plugin-card">
      <button class="pack-select" data-select="${escapeHtml(plugin.id)}" type="button">
        <span class="card-topline"><span class="item-mark"><i data-lucide="box"></i></span><span class="version">v${escapeHtml(plugin.version)}</span></span>
        <strong class="card-title">${escapeHtml(plugin.name)}</strong>
        <span class="card-author">${escapeHtml(plugin.author || '作者未核实')} · ${escapeHtml(plugin.packageName)}</span>
        <span class="card-description">${escapeHtml(plugin.summary)}</span>
        <span class="card-status"><span class="badge badge-parsed">${plugin.archiveUrl ? '原始文件已核验' : '仅来源收录'}</span><span class="badge badge-warning">宿主未测试</span></span>
        <span class="plugin-compatibility">${escapeHtml(plugin.compatibility.dsh ? `作者声明：${plugin.compatibility.dsh}` : '内核兼容未知')}</span>
        <span class="card-inspect">查看详情 <i data-lucide="arrow-up-right"></i></span>
      </button>
      <div class="card-actions">${plugin.archiveUrl ? `<a href="${assetUrl(plugin.archiveUrl)}" download><i data-lucide="download"></i>下载原始插件</a>` : '<span>暂无已核验下载</span>'}<a href="${escapeHtml(safeExternalUrl(plugin.source.url))}" target="_blank" rel="noreferrer">来源 <i data-lucide="external-link"></i></a></div>
    </article>`
  return `
    <button class="item-row ${state.selected === plugin.id ? 'is-selected' : ''}" data-select="${escapeHtml(plugin.id)}" type="button">
      <span class="item-mark">${escapeHtml(initials(plugin.name))}</span>
      <span class="item-copy">
        <span class="item-title-line"><strong>${escapeHtml(plugin.name)}</strong><span class="version">v${escapeHtml(plugin.version)}</span></span>
        <span class="item-id">${escapeHtml(plugin.id)}</span>
      </span>
      <span class="item-status">${statusBadge(plugin)}</span>
    </button>`
}

function packRow(pack) {
  if (pack.format === 'eac-feature-pack-v1') return `
    <article class="pack-card ${state.selected === pack.metadata.id ? 'is-selected' : ''}">
      <button class="pack-select" data-select="${escapeHtml(pack.metadata.id)}" aria-pressed="${state.selected === pack.metadata.id}" type="button">
        <span class="card-topline"><span class="item-mark pack-mark"><i data-lucide="boxes"></i></span><span class="version">v${escapeHtml(pack.metadata.version)}</span></span>
        <strong class="card-title">${escapeHtml(pack.metadata.name)}</strong>
        <span class="card-author">${escapeHtml(pack.author)} · ${escapeHtml(categoryLabels[pack.metadata.category] || '未分类')} · ${pack.components.length} 个组件</span>
        <span class="card-description">${escapeHtml(pack.metadata.description || '开发者未提供功能简介。')}</span>
        <span class="card-status"><span class="badge badge-lock">${escapeHtml(categoryLabels[pack.metadata.category] || '未分类')}</span><span class="badge badge-parsed">结构已检验</span><span class="badge badge-warning">宿主未测试</span></span>
        <span class="card-inspect">查看详情 <i data-lucide="arrow-up-right"></i></span>
      </button>
      <div class="card-actions"><a href="${assetUrl(pack.archiveUrl)}" download><i data-lucide="download"></i>${pack.metadata.category === 'appearance' ? '下载皮肤包' : '下载整合包'}</a>${catalog.demo ? '<span>测试样本</span>' : `<a href="${escapeHtml(safeExternalUrl(pack.source))}" target="_blank" rel="noreferrer">来源 <i data-lucide="external-link"></i></a>`}</div>
    </article>`
  return `
    <button class="item-row ${state.selected === pack.metadata.id ? 'is-selected' : ''}" data-select="${escapeHtml(pack.metadata.id)}" type="button">
      <span class="item-mark pack-mark"><i data-lucide="boxes"></i></span>
      <span class="item-copy">
        <span class="item-title-line"><strong>${escapeHtml(pack.metadata.name)}</strong><span class="version">v${escapeHtml(pack.metadata.version)}</span></span>
        <span class="item-id">${pack.components.length} 个组件 · ${escapeHtml(pack.metadata.id)}</span>
      </span>
      <span class="item-status"><span class="badge badge-lock">${escapeHtml(categoryLabels[pack.metadata.category] || '未分类')}</span></span>
    </button>`
}

function skinRow(pack) {
  const isArchive = pack.format === 'eac-feature-pack-v1'
  const previews = isArchive ? pack.previews ?? pack.appearance?.previews : pack.origin?.previews
  const previewUrl = (Array.isArray(previews) ? previews : []).map(preview => safePreviewUrl(typeof preview === 'string' ? preview : preview?.url)).find(url => url !== '#')
  const subtitle = pack.metadata.nameEn || pack.author || '未声明作者'
  const scope = isArchive ? '皮肤归档 · 宿主未测试' : `设计资料 · ${formatThemes(pack.themes)}主题`
  return `
    <article class="skin-card">
      <a class="skin-select" href="#/skins/${encodeURIComponent(pack.metadata.id)}" data-select="${escapeHtml(pack.metadata.id)}" aria-label="查看${escapeHtml(pack.metadata.name)}详情">
        <span class="skin-cover${previewUrl ? '' : ' preview-unavailable'}">
          ${previewUrl ? `<img src="${escapeHtml(previewUrl)}" alt="${escapeHtml(pack.metadata.name)}预览" loading="lazy" decoding="async" referrerpolicy="no-referrer" />` : ''}
          <span class="skin-cover-empty"><i data-lucide="image"></i><span>${previewUrl ? '预览暂不可用' : '暂无预览'}</span></span>
          <span class="skin-cover-info" title="${escapeHtml(isArchive ? '皮肤归档：结构已检验，宿主未测试。' : 'AI 设计资料：不可直接安装。上游预览可能与历史 Prompt 不同。')}"><i data-lucide="info"></i></span>
        </span>
        <span class="skin-card-copy">
          <strong class="skin-card-name" title="${escapeHtml(pack.metadata.name)}">${escapeHtml(pack.metadata.name)}</strong>
          <span class="skin-card-subtitle" title="${escapeHtml(subtitle)}">${escapeHtml(subtitle)}</span>
          <span class="skin-card-scope">${escapeHtml(scope)}</span>
        </span>
      </a>
    </article>`
}

function pluginDetail(plugin) {
  if (plugin.format === 'mojobox-plugin-listing-v1') return pluginListingDetail(plugin)
  const evidenceLevel = highestEvidence(plugin.evidence)
  const sourceUrl = safeExternalUrl(plugin.source?.repository)
  const maintenance = plugin.maintenance?.source === 'registry-maintained'
  return `
    <div class="detail-heading">
      <span class="detail-mark">${escapeHtml(initials(plugin.name))}</span>
      <div><span class="eyebrow">PLUGIN</span><h2>${escapeHtml(plugin.name)}</h2><p>${escapeHtml(plugin.id)}</p></div>
    </div>
    <div class="detail-actions">
      <a class="command primary" href="${assetUrl(plugin.manifestUrl)}" download><i data-lucide="download"></i>Manifest</a>
      <a class="icon-command" href="${sourceUrl}" target="_blank" rel="noreferrer" title="打开源码" aria-label="打开源码"><i data-lucide="external-link"></i></a>
    </div>
    <section class="detail-section">
      <h3>发布信息</h3>
      <dl class="facts">
        <div><dt>版本</dt><dd>${escapeHtml(plugin.version)}</dd></div>
        <div><dt>许可证</dt><dd>${escapeHtml(plugin.license || '未声明')}</dd></div>
        <div><dt>来源</dt><dd>${maintenance ? '目录维护' : '作者声明'}</dd></div>
        <div><dt>Revision</dt><dd class="mono">${escapeHtml(plugin.source?.revision || '未声明')}</dd></div>
      </dl>
    </section>
    <section class="detail-section">
      <h3>产物</h3>
      ${plugin.artifact ? `
        <div class="digest-line"><code>${escapeHtml(plugin.artifact.digest)}</code><button class="copy-button" data-copy="${escapeHtml(plugin.artifact.digest)}" type="button" title="复制哈希" aria-label="复制哈希"><i data-lucide="clipboard"></i></button></div>
        <p class="section-note"><i data-lucide="package-check"></i>精确 npm tarball，SHA-256 已记录</p>` : `
        <p class="notice warning"><i data-lucide="triangle-alert"></i>尚无可下载产物，不会进入 Pack Lock。</p>`}
    </section>
    ${plugin.packageMetadata ? `
    <section class="detail-section">
      <h3>官方 Package Manifest 投影</h3>
      <dl class="facts">
        <div><dt>Manifest 版本</dt><dd>${escapeHtml(plugin.packageMetadata.dsh?.manifestVersion || '未声明')}</dd></div>
        <div><dt>DSH Engine</dt><dd>${escapeHtml(plugin.packageMetadata.engines?.dsh || '未声明')}</dd></div>
        <div><dt>Client 平台</dt><dd>${escapeHtml(plugin.packageMetadata.dsh?.client?.platform || '未声明')}</dd></div>
      </dl>
    </section>` : ''}
    <section class="detail-section">
      <div class="section-title"><h3>验证记录</h3><span class="badge badge-${evidenceLevel.toLowerCase()}">${escapeHtml(evidenceLevel)}</span></div>
      <p class="section-note">徽标仅统计仍有效的通过记录。Declared / Parsed 不代表宿主运行兼容。</p>
      ${plugin.evidence.length ? plugin.evidence.map(record => `
        <div class="evidence-row ${evidenceStatus(record) === '通过' ? '' : 'evidence-warning'}">
          <i data-lucide="${evidenceStatus(record) === '通过' ? 'shield-check' : 'triangle-alert'}"></i>
          <div>
            <strong>${escapeHtml(record.host ? `${record.host.name} ${record.host.version}` : '目录解析')} · ${escapeHtml(record.evidenceLevel)} · ${escapeHtml(record.result)} · ${evidenceStatus(record)}</strong>
            <span>${escapeHtml(record.issuer)} · ${escapeHtml(record.host?.runtime || '不限定宿主')} · ${escapeHtml(record.specifications.admissionProfile || '通用范围')}</span>
            <span>记录时间：${escapeHtml(record.testedAt)}${record.expiresAt ? ` · 到期：${escapeHtml(record.expiresAt)}` : ''}</span>
            <span>${escapeHtml(record.checks.map(check => `${check.id}:${check.result}`).join(' · '))}</span>
          </div>
        </div>`).join('') : '<p class="empty-inline">暂无可复验证据</p>'}
    </section>`
}

function pluginListingDetail(plugin) {
  const metadata = plugin.packageMetadata || {}
  const dependencyText = entries => Object.entries(entries || {}).map(([name, version]) => `${name}: ${version}`).join('\n') || '未声明'
  return `
    <div class="detail-heading"><span class="detail-mark"><i data-lucide="box"></i></span><div><span class="eyebrow">PLUGIN · v${escapeHtml(plugin.version)}</span><h2>${escapeHtml(plugin.name)}</h2><p>${escapeHtml(plugin.packageName)} · ${escapeHtml(plugin.license || '许可未知')}</p></div></div>
    <p class="detail-description">${escapeHtml(plugin.summary)}</p>
    <div class="detail-actions action-grid">${plugin.archiveUrl ? `<a class="command primary" href="${assetUrl(plugin.archiveUrl)}" download><i data-lucide="download"></i>下载原始插件</a>` : ''}<a class="command" href="${assetUrl(plugin.listingUrl)}" download><i data-lucide="file-json"></i>收录信息</a>${plugin.reportUrl ? `<a class="command" href="${assetUrl(plugin.reportUrl)}" download><i data-lucide="package-check"></i>检验报告</a>` : ''}</div>
    <dl class="facts detail-summary-facts"><div><dt>内核兼容</dt><dd>${escapeHtml(plugin.compatibility.dsh || '未知')}</dd></div><div><dt>声明依据</dt><dd>${plugin.compatibility.basis === 'author-declared' ? '作者声明，非本项目实测' : '未声明'}</dd></div><div><dt>作者 / 目录维护</dt><dd>${escapeHtml(plugin.author || '未核实')} / ${plugin.maintainedBy === 'author' ? '作者提交' : 'Mojobox 代录'}</dd></div><div><dt>原始文件</dt><dd>${plugin.artifact ? `${plugin.artifact.size.toLocaleString('zh-CN')} 字节 · npm-tgz` : '暂无已核验下载'}</dd></div></dl>
    ${renderRelatedLinks([{ label: '正式发行来源', url: plugin.source.url }, ...(plugin.source.repository ? [{ label: '作者仓库', url: plugin.source.repository }] : []), ...(plugin.compatibility.reference ? [{ label: '兼容声明依据', url: plugin.compatibility.reference }] : []), ...(plugin.links || [])])}
    <div class="trust-strip"><span class="trust-item trust-positive"><i data-lucide="package-check"></i>${plugin.archiveUrl ? '原始文件已核验' : '信息已收录'}</span><span class="trust-item"><i data-lucide="info"></i>依赖未解析</span><span class="trust-item trust-warning"><i data-lucide="triangle-alert"></i>宿主未测试</span></div>
    <section class="detail-section"><h3>冲突与使用边界</h3><p class="detail-copy">${escapeHtml(plugin.conflicts === null ? '已知冲突尚未确认，不代表没有冲突。' : plugin.conflicts.length ? plugin.conflicts.join('\n') : '提交方未报告已知冲突，不代表已经完成共存验证。')}</p>${(plugin.limitations || []).map(note => `<p class="detail-copy">${escapeHtml(note)}</p>`).join('')}</section>
    <details class="detail-section prompt-accordion"><summary><strong>原始包依赖声明</strong></summary><dl class="facts"><div><dt>运行环境</dt><dd class="plugin-metadata">${escapeHtml(dependencyText(metadata.engines))}</dd></div><div><dt>Peer 依赖</dt><dd class="plugin-metadata">${escapeHtml(dependencyText(metadata.peerDependencies))}</dd></div><div><dt>软件依赖</dt><dd class="plugin-metadata">${escapeHtml(dependencyText(metadata.dependencies))}</dd></div></dl></details>
    ${plugin.artifact ? `<details class="detail-section prompt-accordion"><summary><strong>下载校验 · SHA-256</strong></summary><div class="digest-line"><code>${escapeHtml(plugin.artifact.sha256)}</code><button class="copy-button" data-copy="${escapeHtml(plugin.artifact.sha256)}" title="复制 SHA-256" aria-label="复制 SHA-256" type="button"><i data-lucide="clipboard"></i></button></div></details>` : ''}
    <section class="detail-section"><h3>来源与检验范围</h3><dl class="facts"><div><dt>目录 ID</dt><dd>${escapeHtml(plugin.id)}</dd></div><div><dt>发行关联 commit</dt><dd class="mono">${escapeHtml(plugin.source.commit || '发布方未提供，不推测源码提交')}</dd></div><div><dt>运行检验</dt><dd>未安装、未执行插件或脚本；结构检查不等于安全认证。安装与启停由下游宿主决定。</dd></div></dl></section>`
}

function packDetail(pack) {
  if (pack.format === 'eac-feature-pack-v1') return intakeDetail(pack)
  const platforms = pack.requires?.platforms?.map(item => `${item.os}${item.arch?.length ? ` / ${item.arch.join(', ')}` : ''}`).join('、') || '未限制（不代表跨平台实测）'
  return `
    <div class="detail-heading">
      <span class="detail-mark pack-detail-mark"><i data-lucide="boxes"></i></span>
      <div><span class="eyebrow">PACK</span><h2>${escapeHtml(pack.metadata.name)}</h2><p>${escapeHtml(pack.metadata.id)}</p></div>
    </div>
    <p class="detail-description">${escapeHtml(pack.metadata.description)}</p>
    <div class="detail-actions action-grid">
      <a class="command primary" href="${assetUrl(pack.archiveUrl)}" download><i data-lucide="archive"></i>.dshpack</a>
      <a class="command" href="${assetUrl(pack.packUrl)}" download><i data-lucide="file-json"></i>Manifest</a>
      <a class="command" href="${assetUrl(pack.lockUrl)}" download><i data-lucide="database"></i>Lock</a>
    </div>
    <p class="notice">请先确认宿主支持 Mojobox 格式及本包要求；当前生产包尚未完成运行验收。归档包含锁定组件，不保证其全部依赖可离线安装。</p>
    <section class="detail-section">
      <h3>下载校验</h3>
      <dl class="facts"><div><dt>文件大小</dt><dd>${Number.isInteger(pack.archiveSize) ? `${pack.archiveSize.toLocaleString('zh-CN')} 字节` : '未提供'}</dd></div></dl>
      ${pack.archiveDigest ? `<div class="digest-line"><code title="${escapeHtml(pack.archiveDigest)}">${escapeHtml(pack.archiveDigest)}</code><button class="copy-button" data-copy="${escapeHtml(pack.archiveDigest)}" type="button" title="复制归档 SHA-256" aria-label="复制归档 SHA-256"><i data-lucide="clipboard"></i></button></div>` : '<p class="section-note">此目录未提供归档摘要。</p>'}
    </section>
    <section class="detail-section">
      <h3>组件</h3>
      <div class="component-list">
        ${pack.lock.components.map(component => `
          <button type="button" data-open-plugin="${escapeHtml(component.id)}">
            <span><strong>${escapeHtml(component.id)}</strong><small>v${escapeHtml(component.version)} · ${pack.components.find(item => item.id === component.id).required ? '必需' : '可选'}</small><small>${escapeHtml(component.source)}</small></span>
            <code title="${escapeHtml(component.artifactDigest)}">${escapeHtml(shortDigest(component.artifactDigest))}</code>
          </button>`).join('')}
      </div>
    </section>
    <section class="detail-section">
      <h3>适用范围</h3>
      <dl class="facts">
        <div><dt>分类</dt><dd>${escapeHtml(categoryLabels[pack.metadata.category] || '未分类')}</dd></div>
        <div><dt>平台</dt><dd>${escapeHtml(platforms)}</dd></div>
        <div><dt>安装能力</dt><dd>${escapeHtml(pack.requires?.hostCapabilities?.join('、') || '无额外要求')}</dd></div>
        <div><dt>锁定状态</dt><dd>精确版本与 SHA-256</dd></div>
      </dl>
      <p class="section-note">以上为包作者声明的条件，精确锁定不代表宿主实测通过。</p>
    </section>`
}

function intakeDetail(pack) {
  const metadata = pack.metadata || {}
  const appearance = pack.metadata.category === 'appearance' ? pack.appearance || {} : null
  const loader = appearance?.loader
  const components = Array.isArray(pack.components) ? pack.components : []
  const tags = [...contentTags(pack), categoryLabels[metadata.category] || '未分类']
  const relatedLinks = [
    loader?.source ? { label: '加载器来源', url: loader.source } : null,
    pack.authorRepository ? { label: '作者仓库', url: pack.authorRepository } : null,
    pack.source ? { label: catalog.demo ? '测试来源占位' : '本包发布来源', url: pack.source } : null,
    ...(Array.isArray(pack.links) ? pack.links : [])
  ].filter(Boolean)
  const appearanceSection = appearance ? `
    <section class="detail-section"><h3>皮肤包声明</h3><dl class="facts">
      <div><dt>外观类型</dt><dd>${escapeHtml(appearance.kind || '未声明')}</dd></div>
      <div><dt>皮肤 ID</dt><dd>${escapeHtml(appearance.skinIds?.join('、') || '未声明')}</dd></div>
      <div><dt>加载器依赖</dt><dd>${loader ? `${escapeHtml(loader.id)}${loader.version ? ` @ ${escapeHtml(loader.version)}` : ''}` : '未声明'}</dd></div>
      <div><dt>已知冲突</dt><dd>${escapeHtml(appearance.conflicts?.join('、') || '未声明')}</dd></div>
      ${loader?.source ? `<div><dt>加载器来源</dt><dd><a href="${escapeHtml(safeExternalUrl(loader.source))}" target="_blank" rel="noreferrer">打开来源</a></dd></div>` : ''}
    </dl>${appearance.notes ? `<p class="section-note">${escapeHtml(appearance.notes)}</p>` : ''}<p class="section-note">加载器安装、发现、加载、切换与运行兼容由下游 loader 或宿主负责。</p></section>` : ''
  return `
    <div class="detail-heading"><span class="detail-mark pack-detail-mark"><i data-lucide="boxes"></i></span>
      <div><span class="eyebrow">FEATURE PACK · v${escapeHtml(metadata.version)}</span><h2>${escapeHtml(metadata.name)}</h2><p>${escapeHtml(pack.author)} · ${escapeHtml(pack.license)} · ${escapeHtml(metadata.id)}</p></div></div>
    <p class="detail-description">${escapeHtml(metadata.description || '开发者未提供功能简介。')}</p>
    <div class="detail-actions action-grid">
      <a class="command primary" href="${assetUrl(pack.archiveUrl)}" download><i data-lucide="archive"></i>${appearance ? '下载皮肤包' : '下载整合包'}</a>
      <a class="command" href="${assetUrl(pack.packUrl)}" download><i data-lucide="file-json"></i>清单</a>
      <a class="command" href="${assetUrl(pack.reportUrl)}" download><i data-lucide="package-check"></i>检验报告</a>
    </div>
    <dl class="facts detail-summary-facts" aria-label="适配摘要">
      <div><dt>声明支持版本</dt><dd>${escapeHtml(pack.requires?.dsh || (pack.versionDeclarations?.kernel === 'legacy-undeclared' ? '历史包未声明（兼容未知）' : '作者未声明'))}</dd></div>
      <div><dt>平台</dt><dd>${escapeHtml(formatPlatforms(pack.requires))}</dd></div>
      <div><dt>包含内容</dt><dd>${components.length} 个组件</dd></div>
      <div><dt>归档大小</dt><dd>${pack.archiveSize.toLocaleString('zh-CN')} 字节</dd></div>
    </dl>
    ${renderTags(tags)}
    ${renderRelatedLinks(relatedLinks)}
    <div class="trust-strip" aria-label="整合包状态">
      <span class="trust-item trust-positive"><i data-lucide="package-check"></i><span>结构已检验</span></span>
      <span class="trust-item"><i data-lucide="external-link"></i><span>来源未解析</span></span>
      <span class="trust-item trust-warning"><i data-lucide="triangle-alert"></i><span>宿主未测试</span></span>
    </div>
    ${appearance || pack.previews?.length ? renderPreviews(pack.previews ?? appearance?.previews, metadata.name, '作者提供的展示图片；不代表当前宿主运行实测。', appearance ? '皮肤预览' : '功能预览') : ''}
    ${metadata.introduction && metadata.introduction !== metadata.description ? `<section class="detail-section"><h3>详细介绍</h3><p class="detail-copy">${escapeHtml(metadata.introduction)}</p></section>` : ''}
    <div class="detail-columns">
    <section class="detail-section"><div class="section-title"><h3>包含内容</h3><span class="section-count">${components.length} 项</span></div>
      <div class="included-list">${components.length ? components.map(component => `<div class="included-item"><span><strong>${escapeHtml(component.ref || component.id || '未命名组件')}</strong><small>${escapeHtml(component.version || '未指定版本')}${component.required === false ? ' · 可选' : ' · 必需'}</small></span>${componentSourceUrl(component.ref) !== '#' ? `<a class="component-source" href="${escapeHtml(componentSourceUrl(component.ref))}" target="_blank" rel="noreferrer" title="打开组件原始来源" aria-label="打开 ${escapeHtml(component.ref)} 原始来源"><i data-lucide="external-link"></i></a>` : ''}</div>`).join('') : '<p class="empty-inline">开发者未声明包含内容</p>'}</div>
    </section>
    <div><section class="detail-section"><h3>宿主要求</h3><dl class="facts">
      <div><dt>包格式</dt><dd>EAC Feature Pack v1</dd></div>
      <div><dt>宿主能力</dt><dd>${escapeHtml(pack.requires?.hostCapabilities?.join('、') || '无额外要求')}</dd></div>
    </dl><p class="section-note">以上是包作者声明的适配范围，不代表宿主已完成运行验收。</p></section>
    ${appearanceSection}</div></div>
    <details class="detail-section prompt-accordion"><summary><strong>收录检验</strong></summary>
      <dl class="check-list">
        <div><dt>清单与归档结构</dt><dd class="check-pass"><i data-lucide="check-circle-2"></i>已通过</dd></div>
        <div><dt>文件 SHA-256</dt><dd class="check-pass"><i data-lucide="check-circle-2"></i>已匹配</dd></div>
        <div><dt>内核范围语法</dt><dd>${pack.checks?.includes('manifest-requires-range') ? '已检验' : pack.versionDeclarations?.kernel === 'legacy-undeclared' ? '历史包未声明，不计为通过' : '未检验'}</dd></div>
        <div><dt>外部插件版本声明</dt><dd>${pack.checks?.includes('manifest-plugin-versions') ? '精确版本（不代表来源已锁定）' : '未检验'}</dd></div>
        <div><dt>内核版本比对</dt><dd>未执行，由下游宿主判断</dd></div>
        <div><dt>插件来源</dt><dd>未解析</dd></div>
        <div><dt>宿主运行</dt><dd>未测试</dd></div>
      </dl>
      <p class="section-note">插件来源尚未解析，宿主运行尚未测试。检查通过不代表安装兼容或安全认证。</p>
    </details>
    <details class="detail-section prompt-accordion"><summary><strong>下载校验 · SHA-256</strong></summary>
      <p>${pack.archiveSize.toLocaleString('zh-CN')} 字节 · 开发者归档原始字节</p>
      <div class="digest-line"><code>${escapeHtml(pack.archiveDigest)}</code><button class="copy-button" data-copy="${escapeHtml(pack.archiveDigest.slice(7))}" type="button" title="复制 SHA-256" aria-label="复制 SHA-256"><i data-lucide="clipboard"></i></button></div>
    </details>
    <p class="section-note">版本及兼容条件由开发者声明，Mojobox 不安装或执行组件。</p>`
}

function skinDetail(pack) {
  if (pack.format === 'eac-feature-pack-v1') return intakeDetail(pack)
  const sourceUrl = safeExternalUrl(pack.source?.repository)
  const packageUrl = sourcePackageUrl(pack)
  const tags = Array.isArray(pack.metadata.tags) ? pack.metadata.tags : []
  const promptSections = Array.isArray(pack.requiredPromptSections) ? pack.requiredPromptSections : []
  const implementationFiles = pack.references?.implementation || []
  const relatedLinks = [
    pack.origin?.projectUrl ? { label: '原项目', url: pack.origin.projectUrl } : null,
    !pack.origin?.projectUrl && pack.origin?.repository ? { label: '上游仓库', url: pack.origin.repository } : null,
    pack.authorRepository ? { label: '作者仓库', url: pack.authorRepository } : null,
    packageUrl !== '#' ? { label: 'Prompt 资料来源', url: packageUrl } : null,
    ...(Array.isArray(pack.links) ? pack.links : [])
  ].filter(Boolean)
  return `
    <div class="detail-heading"><span class="detail-mark pack-detail-mark"><i data-lucide="file-json"></i></span>
      <div><span class="eyebrow">SKIN PROMPT PACKAGE</span><h2>${escapeHtml(pack.metadata.name)}</h2><p>${escapeHtml(pack.metadata.id)}</p></div></div>
    <p class="detail-description">${escapeHtml(pack.metadata.description)}</p>
    <div class="detail-actions action-grid">
      <a class="command primary" href="${assetUrl(pack.promptUrl)}" download><i data-lucide="download"></i>下载 Prompt</a>
      <a class="command" href="${assetUrl(pack.manifestUrl)}" download><i data-lucide="file-json"></i>清单</a>
      <a class="command" href="${assetUrl(pack.readmeUrl)}" download><i data-lucide="file-text"></i>说明</a>
    </div>
    <dl class="facts detail-summary-facts" aria-label="适配摘要">
      <div><dt>目标界面</dt><dd>${escapeHtml(pack.target?.surface || '未声明')}</dd></div>
      <div><dt>声明支持版本</dt><dd>${escapeHtml(pack.target?.version || pack.target?.dsh || '未声明')}</dd></div>
      <div><dt>主题</dt><dd>${escapeHtml(formatThemes(pack.themes))}</dd></div>
      <div><dt>作者 / 许可</dt><dd>${escapeHtml(pack.author)} · ${escapeHtml(pack.license)}</dd></div>
    </dl>
    ${renderTags(tags)}
    ${renderRelatedLinks(relatedLinks)}
    <div class="trust-strip" aria-label="皮肤资料状态">
      <span class="trust-item trust-positive"><i data-lucide="package-check"></i><span>来源已固定</span></span>
      <span class="trust-item"><i data-lucide="file-json"></i><span>Prompt 已收录</span></span>
      <span class="trust-item trust-warning"><i data-lucide="triangle-alert"></i><span>不可直接安装</span></span>
    </div>
    ${renderPreviews(pack.origin?.previews, pack.metadata.name, pack.origin?.notes)}
    <p class="notice">这是皮肤设计资料，不可直接安装。安装、加载、切换和运行兼容由目标宿主或 loader 负责。</p>
    ${pack.metadata.introduction && pack.metadata.introduction !== pack.metadata.description ? `<section class="detail-section"><h3>详细介绍</h3><p class="detail-copy">${escapeHtml(pack.metadata.introduction)}</p></section>` : ''}
    <div class="detail-columns">
    <section class="detail-section"><div class="section-title"><h3>包含内容</h3><span class="section-count">3 个文件</span></div><dl class="facts">
      <div><dt>manifest.json</dt><dd>皮肤资料清单</dd></div>
      <div><dt>prompt.md</dt><dd>设计与复刻说明</dd></div>
      <div><dt>README.md</dt><dd>收录说明</dd></div>
      ${implementationFiles.length ? `<div><dt>引用文件</dt><dd>${implementationFiles.map(file => `<code>${escapeHtml(file)}</code>`).join('<br>')}</dd></div>` : ''}
    </dl></section>
    <section class="detail-section"><h3>资料溯源</h3><dl class="facts">
      <div><dt>来源提交</dt><dd class="mono">${escapeHtml(pack.source?.revision || '未声明')}</dd></div>
      <div><dt>资料仓库</dt><dd>${sourceUrl !== '#' ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer">Prompt 资料仓库</a>` : '未声明'}</dd></div>
      <div><dt>历史引用路径</dt><dd>${escapeHtml(pack.sources?.map(source => `${source.project}: ${source.repositoryPath}`).join('；') || '未声明')}</dd></div>
      <div><dt>来源核对</dt><dd>${pack.origin?.evidence?.map(url => `<a href="${escapeHtml(safeExternalUrl(url))}" target="_blank" rel="noreferrer">核对记录</a>`).join(' · ') || '未提供'}</dd></div>
    </dl></section>
    </div>
    <details class="detail-section prompt-accordion"><summary><span><strong>Prompt 章节</strong><small>默认折叠，展开查看 ${promptSections.length} 个章节</small></span><span class="section-count">${promptSections.length} 项</span></summary><dl class="facts">
      ${promptSections.map(section => `<div><dt>${escapeHtml(section)}</dt><dd>已收录</dd></div>`).join('')}
    </dl></details>
    <details class="detail-section prompt-accordion"><summary><strong>文件摘要 · SHA-256</strong></summary><dl class="facts">
      <div><dt>manifest.json</dt><dd class="mono">${escapeHtml(pack.files.manifest)}</dd></div>
      <div><dt>prompt.md</dt><dd class="mono">${escapeHtml(pack.files.prompt)}</dd></div>
      <div><dt>README.md</dt><dd class="mono">${escapeHtml(pack.files.readme)}</dd></div>
    </dl></details>`
}

const repositoryUrl = 'https://github.com/DSH-EAC/EAC-mojobox'
const submissionTypes = { plugin: '独立插件', pack: '功能整合包', skin: '皮肤 / 外观包', prompt: '皮肤 Prompt 资料' }

function contributePage() {
  const type = Object.hasOwn(submissionTypes, state.selected) ? state.selected : null
  const guides = {
    plugin: `<h2>独立插件：提交一张信息卡</h2><p>软件仍由作者发行；JSON 只是目录记录，不需要 Mojobox SDK 或新的运行时 Manifest。</p><dl class="guide-facts"><dt>文件与目录</dt><dd><code>catalog/plugin-listings/&lt;id&gt;.json</code>；有下载时附原始 <code>artifacts/plugins/&lt;id&gt;-&lt;version&gt;.tgz</code>。</dd><dt>最少材料</dt><dd>稳定 ID、实际包名、精确版本、名称与用途、HTTPS 来源、许可、兼容与冲突状态。</dd><dt>规则</dt><dd>兼容未知保留 <code>dsh: null, basis: unknown</code>；<code>conflicts: null</code> 是未知，<code>[]</code> 是未报告。许可未知填 null，仅收录来源。下载必须保留原始字节，附大小与 SHA-256；归档最多 8 MiB。</dd></dl><ol><li>核对正式发行、用途和再分发许可。</li><li>填写信息卡；可选提交核验过的原始 npm 归档，不重打包。</li><li>执行下方检查，随 PR 说明限制和真实测试范围。</li></ol>`,
    pack: `<h2>功能整合包：提交完成的薄包</h2><p>作者维护插件组合，Mojobox 检查并提供原始下载。</p><dl class="guide-facts"><dt>文件与目录</dt><dd><code>artifacts/&lt;id&gt;-&lt;version&gt;.dshpack</code> 与 <code>catalog/feature-packs/&lt;id&gt;.json</code>。归档是 ZIP，只含根 <code>pack.json</code> 和可选 <code>icon.png</code>。</dd><dt>最少材料</dt><dd>清单含 formatVersion: 1、稳定 ID、名称、版本、requires.dsh 范围和至少一个插件引用；记录含分类 function、HTTPS 来源、作者、许可和最终归档 SHA-256。</dd><dt>规则</dt><dd>npm/GitHub 插件引用须精确版本；builtin 引用由宿主提供。未知内核范围先提候选，不编造。不要嵌入插件代码、Profile 或完整客户端。</dd></dl><ol><li>按文件结构说明制作薄包并确认版本声明。</li><li>计算最终归档摘要，添加同 ID 收录记录。</li><li>检查归档与下载，将事实源和验证结果提交 PR。</li></ol>`,
    skin: `<h2>皮肤 / 外观包：说明加载边界</h2><p>沿用薄 Feature Pack，分类为 appearance；安装、加载和切换由宿主或 loader 负责。</p><dl class="guide-facts"><dt>文件与目录</dt><dd><code>artifacts/&lt;id&gt;-&lt;version&gt;.dshpack</code> 与 <code>catalog/feature-packs/&lt;id&gt;.json</code>；可选截图放 <code>catalog/previews/&lt;id&gt;/</code>，不放入薄包。</dd><dt>最少材料</dt><dd>功能包要求的清单、来源、作者、许可、摘要与版本声明；记录使用 category: appearance，声明 appearance.kind。</dd><dt>规则</dt><dd>如实说明 loader 名称、版本和来源、皮肤 ID、注册点与已知冲突；未知不猜测。截图说明对应宿主、主题和版本，核对代码及素材许可，遮盖私人信息。</dd></dl><ol><li>先按薄包规则准备归档与收录记录。</li><li>补充加载器、皮肤标识、限制和可核验预览。</li><li>完成检查，在 PR 中区分设计预览与实际运行证据。</li></ol>`,
    prompt: `<h2>皮肤 Prompt：提交设计资料</h2><p>用于设计与复刻，不可直接安装，不转换成 .dshpack。</p><dl class="guide-facts"><dt>文件与目录</dt><dd><code>catalog/skin-prompt-packages/&lt;id&gt;/</code> 下的 <code>manifest.json</code>、<code>prompt.md</code>、<code>README.md</code>；在同级 <code>source.json</code> 的 packages 追加来源条目。</dd><dt>最少材料</dt><dd>符合现有 Schema 的清单、完整 Prompt 和说明；作者仓库、40 位固定 commit、原路径，以及三个文件的原始字节 SHA-256（带 sha256: 前缀）。清单注明许可、目标界面、主题、引用和必需章节。</dd><dt>规则</dt><dd>使用条目级 source，不修改旧的统一导入基线。归属和截图可在 origins.json 补充，只写可核验信息。更新资料时同步来源 commit 和摘要。</dd></dl><ol><li>从自己的固定来源准备三个完整文件。</li><li>追加 source.json 条目并计算每个文件摘要。</li><li>运行检查，提交资料、来源和许可说明供人工审核。</li></ol>`
  }
  return `<main class="catalog-page guide-page"><section class="catalog-intro"><div><span class="eyebrow">CONTRIBUTE</span><h1>提交你的作品</h1><p>正式收录使用 Fork + Pull Request。先选择类型，准备原始文件和来源事实；材料不完整可先提候选 Issue。</p></div></section>
    <nav class="guide-tabs" aria-label="提交类型">${Object.entries(submissionTypes).map(([id, label]) => `<a class="command ${type === id ? 'primary' : ''}" href="#/contribute/${id}" ${type === id ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
    ${type ? `<section class="guide-panel" aria-label="${submissionTypes[type]}提交指南">${guides[type]}<a class="related-link" href="${repositoryUrl}/blob/main/docs/community-submissions.md#${type}" target="_blank" rel="noreferrer">完整${submissionTypes[type]}规范 <i data-lucide="external-link"></i></a>${type === 'plugin' ? `<a class="related-link" href="${repositoryUrl}/blob/main/docs/plugin-intake.md" target="_blank" rel="noreferrer">信息卡字段与下载规则</a>` : type !== 'prompt' ? `<a class="related-link" href="${repositoryUrl}/blob/main/docs/author-pack-request.md" target="_blank" rel="noreferrer">薄包文件结构与最小清单</a><a class="related-link" href="${repositoryUrl}/blob/main/docs/intake.md" target="_blank" rel="noreferrer">归档收录规则</a>` : ''}</section>` : `<section class="guide-panel"><h2>从哪一种开始？</h2><p>单个软件发行选“独立插件”；组合多个插件选“功能整合包”；需要 loader 加载的皮肤选“皮肤 / 外观包”；设计和复刻说明选“皮肤 Prompt 资料”。</p><p>Skill 仅预留分类，当前不接受收录。完整环境或尚未确定的格式请先提候选 Issue。</p></section>`}
    <section class="guide-panel"><h2>从 Fork 到发布</h2><ol><li>Fork 仓库，从最新 main 建分支，只添加自己的事实源、归档和预览。</li><li>完成本地检查，在 PR 模板中写明来源、身份或代提交授权、许可及真实测试范围。</li><li>通过自动检查与维护者人工审核后合并；发布工作流成功后才会上线。</li></ol><pre><code>npm ci\nnpm test\nnpm run build\nnpm run verify:downloads\ngit diff --check</code></pre><p>提交到自己的分支后，再运行 <code>npm run check:submission -- origin/main</code> 检查已提交增量。更新归档必须新版本、新文件和新摘要，不能覆盖历史字节。静态检查通过不等于安全、兼容或宿主已测试。</p><div class="guide-tabs"><a class="command primary" href="${repositoryUrl}/fork" target="_blank" rel="noreferrer">Fork 仓库</a><a class="command" href="${repositoryUrl}/issues/new/choose" target="_blank" rel="noreferrer">提交候选 / 咨询</a><a class="command" href="${repositoryUrl}/blob/main/docs/community-submissions.md" target="_blank" rel="noreferrer">完整审核指南</a></div></section></main>`
}

function sourcePage() {
  return `<main class="catalog-page guide-page"><section class="catalog-intro"><div><span class="eyebrow">DOWNSTREAM SOURCE</span><h1>接入 Mojobox 来源</h1><p>为市场、宿主和加载器读取来源事实。插件入口是一份静态 JSON，无需后端端口或登录；安装与运行仍由下游决定。</p></div></section>
    <section class="guide-panel"><h2>插件来源接口 v1</h2><div class="related-links"><a class="related-link" href="${assetUrl('generated/api/v1/plugins.json')}">插件索引 · plugins.json <i data-lucide="file-json"></i></a><a class="related-link" href="${assetUrl('generated/api/v1/schemas/plugin-index.schema.json')}">索引 Schema</a><a class="related-link" href="${assetUrl('generated/api/v1/schemas/plugin-listing.schema.json')}">信息卡 Schema</a></div><ol><li>配置实际 HTTPS 索引 URL，校验 Schema、schemaVersion: plugins.mojobox.dev/v1、sourceId: dsh-eac.mojobox 与 demo: false。</li><li>完整保留 listing、兼容、冲突和 limitations。conflicts: null 是未知，[] 是未报告；runtime: not-tested、dependencies: not-resolved 不可变成“可安装”。</li><li>以实际索引 URL 解析所有相对路径：<code>new URL(file.url, indexUrl)</code>。download 与 report 为 null 时不推测下载地址。</li><li>限长读取下载和报告，核验实际响应字节的 size 与 SHA-256，再按宿主规则审核平台、依赖、权限和安装资格。</li><li>使用一次完整合法快照更新目录；网络、Schema 或摘要失败保留上一份成功快照。revision 是内容指纹，不是发布顺序或签名。</li></ol><a class="related-link" href="${repositoryUrl}/blob/main/docs/plugin-source-api-v1.md" target="_blank" rel="noreferrer">完整消费契约与示例 <i data-lucide="external-link"></i></a></section>
    <section class="guide-panel"><h2>整合包与皮肤目录</h2><p>网页目录与插件接口由同一收录事实源生成，但格式不同。功能包和皮肤仍按各自的归档、来源与加载边界消费；皮肤 Prompt 是设计资料。</p><div class="guide-tabs"><a class="command" href="#/packs">功能包目录</a><a class="command" href="#/skins">皮肤与 Prompt 目录</a><a class="command" href="${assetUrl('generated/catalog.json')}">网站 Catalog JSON</a></div><h3>EAC 供货：独立草稿导出</h3><p>既有 supply.eac/v1 是独立批次草稿与导出流程，不是本页提供的线上接口。新插件不会自动加入旧批次，现有导入器也不会自动读取插件来源 v1。需要下游实现一次读取或转换，并保留完整限制。</p><a class="related-link" href="${repositoryUrl}/blob/main/docs/plugin-source-api-v1.md#与现有-eac-供货的关系" target="_blank" rel="noreferrer">供货边界与接入说明</a></section></main>`
}

function renderIntake() {
  const focusedId = document.activeElement?.dataset?.select
  const { packs, skins } = intakeCollections()
  if (state.tab === 'packs' && skins.some(pack => pack.metadata.id === state.selected)) state.tab = 'skins'
  if (!['home', 'packs', 'skins', 'plugins', 'skills', 'contribute', 'source'].includes(state.tab)) {
    state.tab = state.selected && skins.some(pack => pack.metadata.id === state.selected) ? 'skins' : state.selected ? 'packs' : 'home'
  }
  const items = state.tab === 'home' ? [] : filteredItems()
  const selected = state.tab === 'plugins' ? catalog.plugins.find(plugin => plugin.id === state.selected) : state.tab === 'skills' ? undefined : state.tab === 'skins'
    ? skins.find(pack => pack.metadata.id === state.selected)
    : packs.find(pack => pack.metadata.id === state.selected)
  const totalItems = packs.length + skins.length + catalog.plugins.length
  const isDetail = Boolean(selected) && !state.query.trim()
  const isMissingDetail = Boolean(state.selected) && !selected && !state.query.trim()
  const currentLabel = { skins: '皮肤包', packs: '功能包', plugins: '插件', skills: 'Skill' }[state.tab] || '功能包'
  const collectionSize = { skins: skins.length, packs: packs.length, plugins: catalog.plugins.length, skills: 0 }[state.tab]
  const itemDetail = item => state.tab === 'plugins' ? pluginDetail(item) : state.tab === 'skins' ? skinDetail(item) : intakeDetail(item)
  const itemRow = item => state.tab === 'plugins' ? pluginRow(item) : state.tab === 'skins' ? skinRow(item) : packRow(item)
  const collectionDescription = { skins: '皮肤归档、设计 Prompt 和各自的原始来源。', packs: '经过结构检查的功能组合与原始归档。', plugins: '独立插件的精确版本、发行来源、兼容声明与已知限制。', skills: '暂无收录。宿主格式与供货约定尚待确认。' }[state.tab]
  const categoryOptions = Object.entries(categoryLabels)
    .filter(([value]) => packs.some(pack => pack.metadata.category === value))
    .map(([value, label]) => `<option value="${value}" ${state.category === value ? 'selected' : ''}>${label}</option>`).join('')
  const emptyState = (hasCatalog, title) => hasCatalog
    ? '<i data-lucide="search"></i><strong>没有匹配项</strong><span>调整搜索条件，或清空搜索后查看全部目录。</span>'
    : `<div class="empty-illustration"><i data-lucide="boxes"></i><span></span></div><strong>暂无正式收录内容</strong><span>${title}通过收录检查后会展示在这里。</span><a class="empty-cta" href="https://github.com/DSH-EAC/dsh-mojobox/blob/main/docs/${state.tab === 'plugins' ? 'plugin-intake' : 'intake'}.md" target="_blank" rel="noreferrer">查看收录规范 <i data-lucide="arrow-up-right"></i></a>`
  const entryCard = (tab, icon, title, description, count, className) => `
    <a class="entry-card ${className}" href="#/${tab}" data-tab="${tab}">
      <span class="entry-icon"><i data-lucide="${icon}"></i></span>
      <span class="entry-copy"><strong>${title}</strong><span>${description}</span></span>
      <span class="entry-count">${count}<small>项</small><i data-lucide="arrow-up-right"></i></span>
    </a>`
  app.className = 'app intake'
  app.innerHTML = `
    <header class="topbar intake-topbar">
      <a class="brand brand-link" href="#/home" data-tab="home" aria-label="返回 Mojobox 首页"><span class="brand-mark"><span></span><span></span><span></span></span><span><strong>Mojobox</strong><small>DSH 生态目录</small></span></a>
      <nav class="topbar-nav intake-nav" aria-label="站点导航">${[['home', '首页'], ['plugins', '插件'], ['packs', '功能包'], ['skins', '皮肤包'], ['skills', 'Skill'], ['source', '下游接入']].map(([tab, label]) => `<a class="topbar-link ${state.tab === tab ? 'is-active' : ''}" href="#/${tab}" data-tab="${tab}" ${state.tab === tab ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
      <div class="topbar-tools"><a class="topbar-link submit-link" href="#/contribute" data-tab="contribute" ${state.tab === 'contribute' ? 'aria-current="page"' : ''}>提交指南</a><a class="repo-link" href="${repositoryUrl}" target="_blank" rel="noreferrer"><i data-lucide="code-2"></i><span>GitHub</span></a></div>
    </header>
    ${catalog.demo ? '<p class="notice warning" role="status">测试演示：以下样本仅验证收录与下载流程，不是真实功能包，请勿用于安装。</p>' : ''}
    ${state.tab === 'contribute' ? contributePage() : state.tab === 'source' ? sourcePage() : state.tab === 'home' ? `
      <main class="home-page">
        <section class="hero home-hero" aria-labelledby="hero-title"><div class="hero-copy"><span class="eyebrow">DSH · 开发者生态目录</span><h1 id="hero-title">把好用的工具，<br>装进一个盒子。</h1><p>发现 DSH 的插件、功能包与皮肤包。Mojobox 负责收纳、核对来源和提供原始下载，内容由上游开发者维护。</p><div class="hero-actions"><a class="hero-link" href="#/plugins" data-tab="plugins">浏览插件 <i data-lucide="arrow-up-right"></i></a><a class="hero-link" href="#/packs" data-tab="packs">浏览功能包 <i data-lucide="arrow-up-right"></i></a><a class="hero-link" href="#/skins" data-tab="skins">浏览皮肤包 <i data-lucide="arrow-up-right"></i></a><span class="hero-note"><i data-lucide="package-check"></i>原始文件，每一份都有摘要</span></div></div><div class="hero-art" aria-hidden="true"><span class="hero-orbit orbit-one"></span><span class="hero-orbit orbit-two"></span><span class="hero-cube"><i data-lucide="boxes"></i></span></div></section>
        <section class="home-summary"><div class="metric"><strong>${totalItems}</strong><span>${catalog.demo ? '演示样本' : '正式收录'}</span></div><div class="metric"><strong>${catalog.plugins.length}</strong><span>插件</span></div><div class="metric"><strong>${packs.length}</strong><span>功能包</span></div><div class="metric"><strong>${skins.length}</strong><span>皮肤包</span></div><span class="summary-note">收纳 · 检验 · 下载</span></section>
        <section class="home-content participation"><div class="section-heading"><div><span class="eyebrow">GET INVOLVED</span><h2>从这里参与</h2></div><p>作者提供内容，Mojobox 整理来源，下游负责安装与运行。</p></div><div class="role-grid">${[['#/plugins', '浏览资源', '找插件、功能包和皮肤，核对来源与使用边界。'], ['#/contribute', '上游提交', '按类型准备最少材料，通过 Fork + PR 申请收录。'], ['#/source', '下游接入', '读取静态索引、Schema 与原始文件摘要。'], [`${repositoryUrl}/blob/main/README.md#开发与验证`, '项目开发', '在本地运行目录、校验器与静态网站。']].map(([url, title, description]) => `<a class="role-card" href="${url}"><strong>${title} <i data-lucide="arrow-up-right"></i></strong><span>${description}</span></a>`).join('')}</div></section>
        <section class="home-content"><div class="section-heading"><div><span class="eyebrow">EXPLORE</span><h2>资源目录</h2></div></div><div class="entry-grid">${entryCard('plugins', 'box', '插件', '精确发行、兼容声明与使用边界。', catalog.plugins.length, 'entry-plugin')}${entryCard('packs', 'boxes', '功能包', '开发者提交的功能组合与 Feature Pack。', packs.length, 'entry-pack')}${entryCard('skins', 'file-json', '皮肤包', '皮肤归档、设计 Prompt 与可追溯来源。', skins.length, 'entry-skin')}${entryCard('skills', 'file-text', 'Skill', '暂无收录', 0, 'entry-skill')}</div></section>
        <section class="principles"><div><span class="eyebrow">MOJOBOX ROLE</span><h2>让上游内容更容易被找到</h2></div><div class="principle-list"><div><i data-lucide="archive"></i><span><strong>收纳</strong><small>保存开发者提供的原始归档和资料。</small></span></div><div><i data-lucide="shield-check"></i><span><strong>检验</strong><small>检查结构、摘要和来源记录，不替作者维护内容。</small></span></div><div><i data-lucide="download"></i><span><strong>供给</strong><small>为宿主、加载器和下游工具提供可靠下载来源。</small></span></div></div></section>
      </main>` : `
      <main class="catalog-page ${isDetail || isMissingDetail ? 'is-detail' : ''}" aria-label="${currentLabel}目录">
        ${isDetail || isMissingDetail ? `<section class="detail-page"><a class="back-link" href="#/${state.tab}" data-tab="${state.tab}"><i data-lucide="arrow-up-right"></i>返回${currentLabel}列表</a><div class="detail-page-body" id="detail">${isDetail ? itemDetail(selected) : `<div class="detail-empty"><i data-lucide="box"></i><h2>未找到此${currentLabel}</h2><p>${state.tab === 'packs' ? '未找到此整合包。' : ''}当前暂无正式收录的此条目，请返回列表选择其他项目。</p></div>`}</div></section>` : `<section class="catalog-intro"><div><span class="eyebrow">${{ skins: 'APPEARANCE COLLECTION', packs: 'FEATURE COLLECTION', plugins: 'PLUGIN COLLECTION', skills: 'SKILL COLLECTION' }[state.tab]}</span><h1>${currentLabel}</h1><p>${collectionDescription}</p></div><div class="catalog-count"><strong>${items.length}</strong><span>当前显示</span></div></section>
        ${state.tab !== 'skills' ? `<nav class="guide-tabs" aria-label="本类提交规范">${(state.tab === 'skins' ? ['skin', 'prompt'] : [state.tab === 'plugins' ? 'plugin' : 'pack']).map(type => `<a class="command" href="#/contribute/${type}">提交${submissionTypes[type]}</a>`).join('')}</nav><section class="catalog-toolbar" aria-label="目录搜索和筛选"><label class="search-field"><i data-lucide="search"></i><input type="search" value="${escapeHtml(state.query)}" placeholder="搜索名称、ID 或包说明" aria-label="搜索${currentLabel}" /></label>${state.tab === 'packs' ? `<label class="catalog-filter"><span>分类</span><select id="category-filter"><option value="all">全部功能包</option>${categoryOptions}</select></label>` : state.tab === 'plugins' ? `<label class="catalog-filter"><span>下载状态</span><select id="availability"><option value="all">全部插件</option><option value="published" ${state.availability === 'published' ? 'selected' : ''}>已核验下载</option><option value="unpublished" ${state.availability === 'unpublished' ? 'selected' : ''}>仅来源收录</option></select></label>` : '<span class="catalog-hint"><i data-lucide="info"></i>皮肤包按来源、主题和目标界面整理</span>'}</section>` : ''}
        <div class="catalog-grid ${state.tab === 'skins' ? 'skin-gallery' : ''} ${items.length ? '' : 'is-empty'}">${items.length ? items.map(itemRow).join('') : `<div class="no-results">${state.tab === 'skills' ? '<i data-lucide="file-text"></i><strong>暂无 Skill 收录</strong><span>暂不提供 Skill 下载或安装。</span>' : emptyState(collectionSize, currentLabel)}</div>`}</div>`}
      </main>`}
    <footer class="site-footer"><span>Mojobox · 为 DSH 生态收纳好工具</span><span>由开发者维护内容 · 安装与运行交给宿主</span></footer>`
  bindEvents()
  refreshIcons()
  if (focusedId) [...document.querySelectorAll('[data-select]')].find(button => button.dataset.select === focusedId)?.focus()
}

function selectedDetail() {
  const plugin = catalog.plugins.find(item => item.id === state.selected)
  if (plugin) return pluginDetail(plugin)
  const pack = catalog.packs.find(item => item.metadata.id === state.selected)
  if (pack) return packDetail(pack)
  const skin = (catalog.skinPackages || []).find(item => item.metadata.id === state.selected)
  if (skin) return skinDetail(skin)
  return `
    <div class="detail-empty">
      <i data-lucide="box"></i>
      <h2>目录详情</h2>
      <p>选择一个插件或 Pack 查看发布事实与兼容证据。</p>
    </div>`
}

function render() {
  if (catalog.mode === 'intake') return renderIntake()
  const items = filteredItems()
  app.className = 'app'
  app.innerHTML = `
    <header class="topbar">
      <div class="brand"><span class="brand-mark"><span></span><span></span><span></span></span><div><strong>Mojobox</strong><small>DSH 生态目录</small></div></div>
      <a class="repo-link" href="https://github.com/DSH-EAC/dsh-mojobox" target="_blank" rel="noreferrer" title="打开 GitHub 仓库" aria-label="打开 GitHub 仓库"><i data-lucide="code-2"></i><span>GitHub</span></a>
    </header>
    <div class="summary-band">
      <strong>${catalog.plugins.length} <span>插件</span></strong>
      <strong>${catalog.packs.length} <span>Pack</span></strong>
      <strong>${catalog.plugins.reduce((sum, plugin) => sum + plugin.evidence.length, 0)} <span>证据</span></strong>
      <span class="revision">dsh-std ${escapeHtml(catalog.specifications.dshStd.manifestVersion)} · ${escapeHtml(catalog.specifications.dshStd.revision.slice(0, 8))}</span>
    </div>
    <main class="workspace">
      <aside class="filters" aria-label="目录筛选">
        <div class="segmented" role="tablist" aria-label="目录类型">
          <button type="button" data-tab="plugins" class="${state.tab === 'plugins' ? 'active' : ''}" role="tab" aria-selected="${state.tab === 'plugins'}"><i data-lucide="box"></i>插件</button>
          <button type="button" data-tab="packs" class="${state.tab === 'packs' ? 'active' : ''}" role="tab" aria-selected="${state.tab === 'packs'}"><i data-lucide="boxes"></i>Pack</button>
        </div>
        <label class="search-field"><i data-lucide="search"></i><input type="search" value="${escapeHtml(state.query)}" placeholder="搜索名称、ID 或包说明" aria-label="搜索目录" /></label>
        <div class="filter-heading"><i data-lucide="filter"></i><span>筛选</span></div>
        <label>产物状态<select id="availability" ${state.tab === 'packs' ? 'disabled' : ''}><option value="all">全部</option><option value="published" ${state.availability === 'published' ? 'selected' : ''}>已发布</option><option value="unpublished" ${state.availability === 'unpublished' ? 'selected' : ''}>未发布</option></select></label>
        <label>有效通过等级<select id="evidence-filter" ${state.tab === 'packs' ? 'disabled' : ''}><option value="all">全部</option>${levelOrder.map(level => `<option value="${level.toLowerCase()}" ${state.evidence === level.toLowerCase() ? 'selected' : ''}>${level}</option>`).join('')}</select></label>
        <label>验证宿主<select id="host-filter" ${state.tab === 'packs' ? 'disabled' : ''}><option value="all">全部</option>${[...new Map(catalog.plugins.flatMap(plugin => plugin.evidence).filter(record => record.host).map(record => [record.host.id, record.host])).values()].map(host => `<option value="${escapeHtml(host.id)}" ${state.host === host.id ? 'selected' : ''}>${escapeHtml(host.name)}</option>`).join('')}</select></label>
        <label>Pack 分类<select id="category-filter" ${state.tab === 'plugins' ? 'disabled' : ''}><option value="all">全部</option>${Object.entries(categoryLabels).filter(([value]) => catalog.packs.some(pack => pack.metadata.category === value)).map(([value, label]) => `<option value="${value}" ${state.category === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
      </aside>
      <section class="directory" aria-label="目录结果">
        <div class="directory-heading"><div><span class="eyebrow">${state.tab === 'plugins' ? 'COMPONENTS' : 'COLLECTIONS'}</span><h1>${state.tab === 'plugins' ? '插件目录' : '整合包目录'}</h1></div><span>${items.length} 项</span></div>
        <div class="item-list">
          ${items.length ? items.map(item => state.tab === 'plugins' ? pluginRow(item) : packRow(item)).join('') : '<div class="no-results"><i data-lucide="search"></i><strong>没有匹配项</strong><span>调整搜索或筛选条件</span></div>'}
        </div>
      </section>
      <aside class="detail" id="detail" aria-label="目录详情">${selectedDetail()}</aside>
    </main>`
  bindEvents()
  refreshIcons()
}

function selectItem(id, tab = state.tab) {
  state.tab = tab
  state.selected = id
  location.hash = `#/${tab}/${encodeURIComponent(id)}`
  render()
  if (window.innerWidth < 1100) document.querySelector('#detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function bindEvents() {
  document.querySelectorAll('.detail-previews img, .skin-cover img').forEach(image => {
    const showUnavailable = () => {
      image.hidden = true
      image.closest('figure, .skin-cover').classList.add('preview-unavailable')
    }
    image.addEventListener('error', showUnavailable)
    if (image.complete && !image.naturalWidth) showUnavailable()
  })
  document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => {
    state.tab = button.dataset.tab
    state.selected = null
    location.hash = `#/${state.tab}`
    render()
  }))
  const search = document.querySelector('.search-field input')
  const updateSearch = event => {
    state.query = event.target.value
    if (event.isComposing) return
    const caret = event.target.selectionStart
    render()
    const input = document.querySelector('.search-field input')
    input?.focus()
    if (caret !== null) input?.setSelectionRange(caret, caret)
  }
  search?.addEventListener('input', updateSearch)
  search?.addEventListener('compositionend', updateSearch)
  document.querySelector('#availability')?.addEventListener('change', event => { state.availability = event.target.value; render() })
  document.querySelector('#evidence-filter')?.addEventListener('change', event => { state.evidence = event.target.value; render() })
  document.querySelector('#host-filter')?.addEventListener('change', event => { state.host = event.target.value; render() })
  document.querySelector('#category-filter')?.addEventListener('change', event => { state.category = event.target.value; render() })
  document.querySelectorAll('[data-select]').forEach(button => button.addEventListener('click', () => selectItem(button.dataset.select)))
  document.querySelectorAll('[data-open-plugin]').forEach(button => button.addEventListener('click', () => selectItem(button.dataset.openPlugin, 'plugins')))
  document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy)
      button.classList.add('copied')
      button.setAttribute('aria-label', 'SHA-256 已复制')
    } catch {
      button.setAttribute('aria-label', '复制失败，请手动选择摘要')
      button.title = '复制失败，请手动选择摘要'
      const code = button.previousElementSibling
      if (code) { code.style.whiteSpace = 'normal'; code.style.overflowWrap = 'anywhere' }
    }
  }))
}

function applyHash() {
  const [, tab, encodedId] = location.hash.match(/^#\/(home|plugins|packs|skins|skills|contribute|source)(?:\/(.+))?$/) || []
  if (tab) state.tab = tab
  try { state.selected = encodedId ? decodeURIComponent(encodedId) : null }
  catch { state.selected = null }
}

async function start() {
  const response = await fetch(assetUrl('generated/catalog.json'))
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  catalog = await response.json()
  if (!catalog || !Array.isArray(catalog.packs) || !Array.isArray(catalog.plugins)) throw new Error('目录数据格式错误')
  catalog.skinPackages = Array.isArray(catalog.skinPackages) ? catalog.skinPackages : []
  if (!location.hash) state.tab = catalog.mode === 'intake' ? 'home' : 'plugins'
  applyHash()
  render()
  window.addEventListener('hashchange', () => { applyHash(); render() })
}

function showLoadError(error) {
  app.className = 'app-error'
  app.innerHTML = `<strong>目录载入失败</strong><span>${escapeHtml(error.message)}</span>`
}

start().catch(showLoadError)
