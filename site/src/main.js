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
  const values = [...new Set((Array.isArray(tags) ? tags : []).filter(Boolean))]
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
  return repository !== '#' && pack.source?.revision ? `${repository.replace(/\/$/, '')}/tree/${encodeURIComponent(pack.source.revision)}/packages/${encodeURIComponent(pack.metadata.id)}` : repository
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
    return catalog.plugins.filter(plugin => {
      const matchesQuery = !query || `${plugin.name} ${plugin.id}`.toLowerCase().includes(query)
      const matchesAvailability = state.availability === 'all' || (state.availability === 'published') === Boolean(plugin.artifact)
      const level = highestEvidence(plugin.evidence)
      const matchesEvidence = state.evidence === 'all' || level.toLowerCase() === state.evidence
      const matchesHost = state.host === 'all' || plugin.evidence.some(record => record.host?.id === state.host)
      return matchesQuery && matchesAvailability && matchesEvidence && matchesHost
    })
  }
  const { packs, skins } = catalog.mode === 'intake' ? intakeCollections() : { packs: catalog.packs, skins: catalog.skinPackages || [] }
  if (state.tab === 'skins') return skins.filter(pack => {
    const appearanceText = pack.appearance ? JSON.stringify(pack.appearance) : ''
    const matchesQuery = !query || `${pack.metadata.name} ${pack.metadata.nameEn || ''} ${pack.metadata.id} ${pack.metadata.description} ${(pack.metadata.tags || []).join(' ')} ${appearanceText}`.toLowerCase().includes(query)
    return matchesQuery
  })
  return packs.filter(pack => {
    const appearanceText = pack.appearance ? JSON.stringify(pack.appearance) : ''
    const matchesQuery = !query || `${pack.metadata.name} ${pack.metadata.id} ${pack.metadata.description} ${appearanceText}`.toLowerCase().includes(query)
    const matchesCategory = state.category === 'all' || pack.metadata.category === state.category
    return matchesQuery && matchesCategory
  })
}

function pluginRow(plugin) {
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
  if (pack.format === 'eac-feature-pack-v1') return packRow(pack)
  return `
    <article class="pack-card ${state.selected === pack.metadata.id ? 'is-selected' : ''}">
      <button class="pack-select" data-select="${escapeHtml(pack.metadata.id)}" aria-pressed="${state.selected === pack.metadata.id}" type="button">
        <span class="card-topline"><span class="item-mark pack-mark"><i data-lucide="file-json"></i></span><span class="badge badge-lock">AI 皮肤资料</span></span>
        <strong class="card-title">${escapeHtml(pack.metadata.name)}</strong>
        <span class="card-author">${escapeHtml(pack.author)} · ${pack.themes.join(' / ')} 主题</span>
        <span class="card-description">${escapeHtml(pack.metadata.description || '未提供皮肤说明。')}</span>
        <span class="card-status"><span class="badge badge-parsed">来源已固定</span><span class="badge badge-warning">不可直接安装</span></span>
        <span class="card-inspect">查看详情 <i data-lucide="arrow-up-right"></i></span>
      </button>
      <div class="card-actions"><a href="${assetUrl(pack.promptUrl)}" download><i data-lucide="download"></i>下载 Prompt</a><a href="${assetUrl(pack.manifestUrl)}" download>清单 <i data-lucide="file-json"></i></a></div>
    </article>`
}

function pluginDetail(plugin) {
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
  const tags = [...(Array.isArray(metadata.tags) ? metadata.tags : []), categoryLabels[metadata.category] || '未分类']
  const relatedLinks = [
    pack.authorRepository ? { label: '作者仓库', url: pack.authorRepository } : null,
    pack.source ? { label: catalog.demo ? '测试来源占位' : '开发者发布页', url: pack.source } : null,
    ...(Array.isArray(pack.links) ? pack.links : [])
  ].filter(Boolean)
  const appearanceSection = appearance ? `
    <section class="detail-section"><h3>皮肤包声明</h3><dl class="facts">
      <div><dt>外观类型</dt><dd>${escapeHtml(appearance.kind || '未声明')}</dd></div>
      <div><dt>皮肤 ID</dt><dd>${escapeHtml(appearance.skinIds?.join('、') || '未声明')}</dd></div>
      <div><dt>加载器依赖</dt><dd>${loader ? `${escapeHtml(loader.id)}${loader.version ? ` @ ${escapeHtml(loader.version)}` : ''}` : '未声明'}</dd></div>
      <div><dt>已知冲突</dt><dd>${escapeHtml(appearance.conflicts?.join('、') || '未声明')}</dd></div>
      ${loader?.source ? `<div><dt>加载器来源</dt><dd><a href="${escapeHtml(safeExternalUrl(loader.source))}" target="_blank" rel="noreferrer">打开来源</a></dd></div>` : ''}
      ${appearance.previews?.length ? `<div><dt>预览来源</dt><dd>${appearance.previews.map(url => `<a href="${escapeHtml(safeExternalUrl(url))}" target="_blank" rel="noreferrer">预览</a>`).join('、')}</dd></div>` : ''}
    </dl>${appearance.notes ? `<p class="section-note">${escapeHtml(appearance.notes)}</p>` : ''}<p class="section-note">加载器安装、发现、加载、切换与运行兼容由下游 loader 或宿主负责。</p></section>` : ''
  return `
    <div class="detail-heading"><span class="detail-mark pack-detail-mark"><i data-lucide="boxes"></i></span>
      <div><span class="eyebrow">FEATURE PACK</span><h2>${escapeHtml(metadata.name)}</h2><p>${escapeHtml(metadata.id)}</p></div></div>
    <p class="detail-description">${escapeHtml(metadata.description || '开发者未提供功能简介。')}</p>
    <div class="trust-strip" aria-label="整合包状态">
      <span class="trust-item trust-positive"><i data-lucide="package-check"></i><span>结构已检验</span></span>
      <span class="trust-item"><i data-lucide="external-link"></i><span>来源未解析</span></span>
      <span class="trust-item trust-warning"><i data-lucide="triangle-alert"></i><span>宿主未测试</span></span>
    </div>
    <div class="detail-actions action-grid">
      <a class="command primary" href="${assetUrl(pack.archiveUrl)}" download><i data-lucide="archive"></i>${appearance ? '下载皮肤包' : '下载整合包'}</a>
      <a class="command" href="${assetUrl(pack.packUrl)}" download><i data-lucide="file-json"></i>清单</a>
      <a class="command" href="${assetUrl(pack.reportUrl)}" download><i data-lucide="package-check"></i>检验报告</a>
    </div>
    <section class="detail-section detail-introduction"><h3>${appearance ? '皮肤包介绍' : '整合包介绍'}</h3><p class="detail-copy">${escapeHtml(metadata.introduction || metadata.description || '开发者未提供更详细的整合包介绍。')}</p></section>
    <section class="detail-section"><div class="section-title"><h3>包含内容</h3><span class="section-count">${components.length} 项</span></div>
      <div class="included-list">${components.length ? components.map(component => `<div class="included-item"><span><strong>${escapeHtml(component.ref || component.id || '未命名组件')}</strong><small>${escapeHtml(component.version || '未指定版本')}${component.required === false ? ' · 可选' : ' · 必需'}</small></span></div>`).join('') : '<p class="empty-inline">开发者未声明包含内容</p>'}</div>
    </section>
    <section class="detail-section"><h3>标签</h3>${renderTags(tags)}</section>
    <section class="detail-section"><h3>版本适配</h3><dl class="facts">
      <div><dt>整合包版本</dt><dd>${escapeHtml(metadata.version || '未声明')}</dd></div>
      <div><dt>DSH / 内核</dt><dd>${escapeHtml(pack.requires?.dsh || '作者未声明')}</dd></div>
      <div><dt>平台</dt><dd>${escapeHtml(formatPlatforms(pack.requires))}</dd></div>
      <div><dt>宿主能力</dt><dd>${escapeHtml(pack.requires?.hostCapabilities?.join('、') || '无额外要求')}</dd></div>
    </dl><p class="section-note">以上是包作者声明的适配范围，不代表宿主已完成运行验收。</p></section>
    <section class="detail-section"><h3>相关链接</h3>${renderRelatedLinks(relatedLinks)}</section>
    <section class="detail-section"><h3>发布信息</h3><dl class="facts">
      <div><dt>版本</dt><dd>${escapeHtml(metadata.version)}</dd></div>
      <div><dt>开发者</dt><dd>${escapeHtml(pack.author)}</dd></div>
      <div><dt>许可证</dt><dd>${escapeHtml(pack.license)}</dd></div>
      <div><dt>分类</dt><dd>${escapeHtml(categoryLabels[metadata.category] || '未分类')}</dd></div>
      <div><dt>格式</dt><dd>EAC Feature Pack v1</dd></div>
      <div><dt>内核要求</dt><dd>${escapeHtml(pack.requires?.dsh || '作者未声明')}</dd></div>
      <div><dt>来源</dt><dd>${catalog.demo ? '测试来源占位，不是真实发布' : `<a href="${escapeHtml(safeExternalUrl(pack.source))}" target="_blank" rel="noreferrer">开发者发布页面</a>`}</dd></div>
    </dl></section>${appearanceSection}
    <section class="detail-section"><h3>收录检验</h3>
      <dl class="check-list">
        <div><dt>清单与归档结构</dt><dd class="check-pass"><i data-lucide="check-circle-2"></i>已通过</dd></div>
        <div><dt>文件 SHA-256</dt><dd class="check-pass"><i data-lucide="check-circle-2"></i>已匹配</dd></div>
        <div><dt>插件来源</dt><dd>未解析</dd></div>
        <div><dt>宿主运行</dt><dd>未测试</dd></div>
      </dl>
      <p class="section-note">插件来源尚未解析，宿主运行尚未测试。检查通过不代表安装兼容或安全认证。</p>
    </section>
    <section class="detail-section"><h3>下载校验</h3>
      <p>${pack.archiveSize.toLocaleString('zh-CN')} 字节 · 开发者归档原始字节</p>
      <div class="digest-line"><code>${escapeHtml(pack.archiveDigest)}</code><button class="copy-button" data-copy="${escapeHtml(pack.archiveDigest.slice(7))}" type="button" title="复制 SHA-256" aria-label="复制 SHA-256"><i data-lucide="clipboard"></i></button></div>
    </section>
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
    pack.authorRepository ? { label: '作者仓库', url: pack.authorRepository } : null,
    packageUrl !== '#' ? { label: '皮肤资料包仓库', url: packageUrl } : null,
    sourceUrl !== '#' ? { label: '来源仓库', url: sourceUrl } : null,
    ...(Array.isArray(pack.links) ? pack.links : [])
  ].filter(Boolean)
  return `
    <div class="detail-heading"><span class="detail-mark pack-detail-mark"><i data-lucide="file-json"></i></span>
      <div><span class="eyebrow">SKIN PROMPT PACKAGE</span><h2>${escapeHtml(pack.metadata.name)}</h2><p>${escapeHtml(pack.metadata.id)}</p></div></div>
    <p class="detail-description">${escapeHtml(pack.metadata.description)}</p>
    <div class="trust-strip" aria-label="皮肤资料状态">
      <span class="trust-item trust-positive"><i data-lucide="package-check"></i><span>来源已固定</span></span>
      <span class="trust-item"><i data-lucide="file-json"></i><span>Prompt 已收录</span></span>
      <span class="trust-item trust-warning"><i data-lucide="triangle-alert"></i><span>不可直接安装</span></span>
    </div>
    <div class="detail-actions action-grid">
      <a class="command primary" href="${assetUrl(pack.promptUrl)}" download><i data-lucide="download"></i>下载 Prompt</a>
      <a class="command" href="${assetUrl(pack.manifestUrl)}" download><i data-lucide="file-json"></i>清单</a>
      <a class="command" href="${assetUrl(pack.readmeUrl)}" download><i data-lucide="file-text"></i>说明</a>
    </div>
    <p class="notice">这是可供 AI 阅读、复刻和继续设计的皮肤资料包，不是可安装插件。Mojobox 不执行 Prompt；安装、加载、切换和运行兼容由目标宿主或 loader 负责。</p>
    <section class="detail-section detail-introduction"><h3>皮肤包介绍</h3><p class="detail-copy">${escapeHtml(pack.metadata.introduction || pack.metadata.description || '作者未提供更详细的皮肤包介绍。')}</p></section>
    <section class="detail-section"><h3>标签</h3>${renderTags(tags)}</section>
    <section class="detail-section"><h3>版本适配</h3><dl class="facts">
      <div><dt>目标界面</dt><dd>${escapeHtml(pack.target?.surface || '未声明')}</dd></div>
      <div><dt>目标版本</dt><dd>${escapeHtml(pack.target?.version || pack.target?.dsh || '未声明')}</dd></div>
      <div><dt>主题</dt><dd>${escapeHtml(pack.themes?.join('、') || '未声明')}</dd></div>
      <div><dt>保留行为</dt><dd>${pack.target?.preserveBehavior === true ? '是' : '未声明'}</dd></div>
    </dl><p class="section-note">皮肤资料只声明目标界面和主题范围，不代表 loader 或宿主已经完成兼容测试。</p></section>
    <section class="detail-section"><div class="section-title"><h3>包含内容</h3><span class="section-count">3 个文件</span></div><dl class="facts">
      <div><dt>manifest.json</dt><dd>皮肤资料清单</dd></div>
      <div><dt>prompt.md</dt><dd>设计与复刻说明</dd></div>
      <div><dt>README.md</dt><dd>收录说明</dd></div>
      ${implementationFiles.length ? `<div><dt>引用文件</dt><dd>${implementationFiles.map(file => `<code>${escapeHtml(file)}</code>`).join('<br>')}</dd></div>` : ''}
    </dl></section>
    <section class="detail-section"><h3>来源信息</h3><dl class="facts">
      <div><dt>作者</dt><dd>${escapeHtml(pack.author)}</dd></div>
      <div><dt>许可证</dt><dd>${escapeHtml(pack.license)}</dd></div>
      <div><dt>来源提交</dt><dd class="mono">${escapeHtml(pack.source?.revision || '未声明')}</dd></div>
      <div><dt>来源仓库</dt><dd>${sourceUrl !== '#' ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noreferrer">打开 GitHub</a>` : '未声明'}</dd></div>
      <div><dt>引用来源</dt><dd>${escapeHtml(pack.sources?.map(source => `${source.project}: ${source.repositoryPath}`).join('；') || '未声明')}</dd></div>
    </dl></section>
    <section class="detail-section"><h3>相关链接</h3>${renderRelatedLinks(relatedLinks)}</section>
    <details class="detail-section prompt-accordion"><summary><span><strong>Prompt 章节</strong><small>默认折叠，展开查看 ${promptSections.length} 个章节</small></span><span class="section-count">${promptSections.length} 项</span></summary><dl class="facts">
      ${promptSections.map(section => `<div><dt>${escapeHtml(section)}</dt><dd>已收录</dd></div>`).join('')}
    </dl></details>
    <section class="detail-section"><h3>文件摘要</h3><dl class="facts">
      <div><dt>manifest.json</dt><dd class="mono">${escapeHtml(pack.files.manifest)}</dd></div>
      <div><dt>prompt.md</dt><dd class="mono">${escapeHtml(pack.files.prompt)}</dd></div>
      <div><dt>README.md</dt><dd class="mono">${escapeHtml(pack.files.readme)}</dd></div>
    </dl></section>`
}

function renderIntake() {
  const focusedId = document.activeElement?.dataset?.select
  const { packs, skins } = intakeCollections()
  if (state.tab === 'packs' && skins.some(pack => pack.metadata.id === state.selected)) state.tab = 'skins'
  if (!['home', 'packs', 'skins'].includes(state.tab)) {
    state.tab = state.selected && skins.some(pack => pack.metadata.id === state.selected) ? 'skins' : state.selected ? 'packs' : 'home'
  }
  const items = state.tab === 'home' ? [] : filteredItems()
  const selected = state.tab === 'skins'
    ? skins.find(pack => pack.metadata.id === state.selected)
    : packs.find(pack => pack.metadata.id === state.selected)
  const totalItems = packs.length + skins.length
  const isDetail = Boolean(selected) && !state.query.trim()
  const isMissingDetail = Boolean(state.selected) && !selected && !state.query.trim()
  const currentLabel = state.tab === 'skins' ? '皮肤包' : '功能包'
  const categoryOptions = Object.entries(categoryLabels)
    .filter(([value]) => packs.some(pack => pack.metadata.category === value))
    .map(([value, label]) => `<option value="${value}" ${state.category === value ? 'selected' : ''}>${label}</option>`).join('')
  const emptyState = (hasCatalog, title) => hasCatalog
    ? '<i data-lucide="search"></i><strong>没有匹配项</strong><span>调整搜索条件，或清空搜索后查看全部目录。</span>'
    : `<div class="empty-illustration"><i data-lucide="boxes"></i><span></span></div><strong>暂无正式收录内容</strong><span>${title}通过收录检查后会展示在这里。</span><a class="empty-cta" href="https://github.com/DSH-EAC/dsh-mojobox/blob/main/docs/intake.md" target="_blank" rel="noreferrer">查看收录规范 <i data-lucide="arrow-up-right"></i></a>`
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
      <nav class="topbar-nav intake-nav" aria-label="站点导航"><a class="topbar-link ${state.tab === 'home' ? 'is-active' : ''}" href="#/home" data-tab="home">首页</a><a class="topbar-link ${state.tab === 'packs' ? 'is-active' : ''}" href="#/packs" data-tab="packs">功能包</a><a class="topbar-link ${state.tab === 'skins' ? 'is-active' : ''}" href="#/skins" data-tab="skins">皮肤包</a></nav>
      <div class="topbar-tools"><a class="topbar-link submit-link" href="https://github.com/DSH-EAC/dsh-mojobox/blob/main/docs/author-pack-request.md" target="_blank" rel="noreferrer">提交收录</a><a class="repo-link" href="https://github.com/DSH-EAC/dsh-mojobox" target="_blank" rel="noreferrer"><i data-lucide="code-2"></i><span>GitHub</span></a></div>
    </header>
    ${catalog.demo ? '<p class="notice warning" role="status">测试演示：以下样本仅验证收录与下载流程，不是真实功能包，请勿用于安装。</p>' : ''}
    ${state.tab === 'home' ? `
      <main class="home-page">
        <section class="hero home-hero" aria-labelledby="hero-title"><div class="hero-copy"><span class="eyebrow">DSH · 开发者生态目录</span><h1 id="hero-title">把好用的工具，<br>装进一个盒子。</h1><p>发现、检验并下载 DSH 的功能包与皮肤包。Mojobox 负责收纳、核对来源和提供原始下载，内容由上游开发者维护。</p><div class="hero-actions"><a class="hero-link" href="#/packs" data-tab="packs">浏览功能包 <i data-lucide="arrow-up-right"></i></a><a class="hero-link" href="#/skins" data-tab="skins">浏览皮肤包 <i data-lucide="arrow-up-right"></i></a><span class="hero-note"><i data-lucide="package-check"></i>原始文件，每一份都有摘要</span></div></div><div class="hero-art" aria-hidden="true"><span class="hero-orbit orbit-one"></span><span class="hero-orbit orbit-two"></span><span class="hero-cube"><i data-lucide="boxes"></i></span></div></section>
        <section class="home-summary"><div class="metric"><strong>${totalItems}</strong><span>${catalog.demo ? '演示样本' : '正式收录'}</span></div><div class="metric"><strong>${packs.length}</strong><span>功能包</span></div><div class="metric"><strong>${skins.length}</strong><span>皮肤包</span></div><span class="summary-note">收纳 · 检验 · 下载</span></section>
        <section class="home-content"><div class="section-heading"><div><span class="eyebrow">EXPLORE</span><h2>从这里开始</h2></div><p>按资源类型浏览，打开卡片查看来源、检查范围和下载文件。</p></div><div class="entry-grid">${entryCard('packs', 'boxes', '功能包', '开发者提交的可收纳功能组合与 Feature Pack。', packs.length, 'entry-pack')}${entryCard('skins', 'file-json', '皮肤包', '皮肤归档、设计 Prompt 与可追溯来源。', skins.length, 'entry-skin')}</div></section>
        <section class="principles"><div><span class="eyebrow">MOJOBOX ROLE</span><h2>让上游内容更容易被找到</h2></div><div class="principle-list"><div><i data-lucide="archive"></i><span><strong>收纳</strong><small>保存开发者提供的原始归档和资料。</small></span></div><div><i data-lucide="shield-check"></i><span><strong>检验</strong><small>检查结构、摘要和来源记录，不替作者维护内容。</small></span></div><div><i data-lucide="download"></i><span><strong>供给</strong><small>为宿主、加载器和下游工具提供可靠下载来源。</small></span></div></div></section>
      </main>` : `
      <main class="catalog-page" aria-label="${currentLabel}目录">
        ${isDetail || isMissingDetail ? `<section class="catalog-toolbar detail-toolbar" aria-label="详情页搜索和筛选"><label class="search-field"><i data-lucide="search"></i><input type="search" value="${escapeHtml(state.query)}" placeholder="搜索名称、ID 或包说明" aria-label="搜索${currentLabel}" /></label>${state.tab === 'packs' ? `<label class="catalog-filter"><span>分类</span><select id="category-filter"><option value="all">全部功能包</option>${categoryOptions}</select></label>` : '<span class="catalog-hint"><i data-lucide="info"></i>皮肤包按来源、主题和目标界面整理</span>'}</section><section class="detail-page"><a class="back-link" href="#/${state.tab}" data-tab="${state.tab}"><i data-lucide="arrow-up-right"></i>返回${currentLabel}列表</a><div class="detail-page-body" id="detail">${isDetail ? (state.tab === 'skins' ? skinDetail(selected) : intakeDetail(selected)) : `<div class="detail-empty"><i data-lucide="box"></i><h2>未找到此${currentLabel}</h2><p>未找到此整合包。当前暂无正式收录内容，链接对应的内容不在当前目录中，请返回列表选择其他项目。</p></div>`}</div></section>` : `<section class="catalog-intro"><div><span class="eyebrow">${state.tab === 'skins' ? 'APPEARANCE COLLECTION' : 'FEATURE COLLECTION'}</span><h1>${currentLabel}</h1><p>${state.tab === 'skins' ? '收纳皮肤归档、设计 Prompt 和来源信息，保留各自的下载文件与检查范围。' : '收纳经过结构检查的功能整合包，为宿主和下游工具提供明确的原始来源。'}</p></div><div class="catalog-count"><strong>${items.length}</strong><span>当前显示</span></div></section>
        <section class="catalog-toolbar" aria-label="目录搜索和筛选"><label class="search-field"><i data-lucide="search"></i><input type="search" value="${escapeHtml(state.query)}" placeholder="搜索名称、ID 或包说明" aria-label="搜索${currentLabel}" /></label>${state.tab === 'packs' ? `<label class="catalog-filter"><span>分类</span><select id="category-filter"><option value="all">全部功能包</option>${categoryOptions}</select></label>` : '<span class="catalog-hint"><i data-lucide="info"></i>皮肤包按来源、主题和目标界面整理</span>'}</section>
        <div class="catalog-grid ${items.length ? '' : 'is-empty'}">${items.length ? items.map(item => state.tab === 'skins' ? skinRow(item) : packRow(item)).join('') : `<div class="no-results">${emptyState(state.tab === 'skins' ? skins.length : packs.length, currentLabel)}</div>`}</div>`}
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
  const [, tab, encodedId] = location.hash.match(/^#\/(home|plugins|packs|skins)(?:\/(.+))?$/) || []
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
  applyHash()
  render()
  window.addEventListener('hashchange', () => { applyHash(); render() })
}

function showLoadError(error) {
  app.className = 'app-error'
  app.innerHTML = `<strong>目录载入失败</strong><span>${escapeHtml(error.message)}</span>`
}

start().catch(showLoadError)
