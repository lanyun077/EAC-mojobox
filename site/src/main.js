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
  PackageCheck,
  Search,
  ShieldCheck,
  TriangleAlert
}

const app = document.querySelector('#app')
const base = import.meta.env.BASE_URL
const levelOrder = ['Declared', 'Parsed', 'Negotiated', 'Tested', 'Observed', 'Attested']
const searchDefaults = { query: '', availability: 'all', category: 'all', tag: 'all', sort: 'relevance' }
const state = { tab: 'plugins', ...searchDefaults, evidence: 'all', host: 'all', selected: null }
let catalog

const categoryLabels = {
  function: '功能包',
  appearance: '外观整合包',
  workflow: '工作流包'
}

function tagLabel(tag) {
  return Object.values(catalog.tagGroups || {}).flat().find(item => item.id === tag)?.label || tag
}

function contentTags(pack) {
  const group = pack.metadata?.category === 'appearance' ? 'skins' : 'packs'
  const allowed = catalog.tagGroups?.[group] || []
  return (pack.websiteTags?.officialTags || []).filter(id => allowed.some(tag => tag.id === id))
}

function selectedTags() {
  return state.tag === 'all' ? [] : [...new Set(state.tag.split(',').filter(Boolean))]
}

function classificationDetail(pack) {
  const custom = [...new Set([...(pack.metadata.tags || []), ...(pack.websiteTags?.customTags || [])])]
  return `<section class="detail-section"><h3>官方分类</h3>${renderTags(contentTags(pack), '未分类')}<p class="section-note">仅描述用途或主题，不表示安全、兼容或运行认证。</p></section>${custom.length ? `<section class="detail-section"><h3>作者标签</h3>${renderTags(custom, '', value => value)}<p class="section-note">作者补充说明，不参与分类筛选或标签检索。</p></section>` : ''}`
}

function cardTags(pack) {
  const tags = contentTags(pack)
  return `<span class="tag-list card-tags">${tags.length ? tags.map(id => `<span class="tag">${escapeHtml(tagLabel(id))}</span>`).join('') : '<span class="tag">未分类</span>'}</span>`
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

function renderTags(tags, fallback = '未声明', label = tagLabel) {
  const values = [...new Set((Array.isArray(tags) ? tags : []).filter(Boolean).map(label))]
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

const normalizeSearch = value => String(value ?? '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim()

function searchFields(item) {
  const metadata = item.metadata || item
  const tags = item.metadata ? contentTags(item) : []
  return [
    [metadata.name, metadata.nameEn, metadata.id, item.packageName].filter(Boolean).join(' '),
    [...tags, ...tags.map(tagLabel), ...Object.values(catalog.tagGroups || {}).flat().filter(tag => tags.includes(tag.id)).flatMap(tag => tag.aliases), categoryLabels[metadata.category]].filter(Boolean).join(' '),
    [metadata.description, metadata.introduction, item.summary].filter(Boolean).join(' '),
    [item.author, typeof item.source === 'string' ? item.source : item.source?.url,
      item.source?.repository, ...(item.components || []).map(component => component.ref || component.id),
      ...(item.limitations || []), ...(item.conflicts || []), item.appearance?.loader?.id,
      ...(item.appearance?.skinIds || []), ...(item.appearance?.conflicts || []),
      item.appearance?.notes
    ].filter(Boolean).join(' ')
  ].map(normalizeSearch)
}

function searchScore(item, query) {
  const terms = [...new Set(normalizeSearch(query).split(' ').filter(Boolean))]
  const fields = searchFields(item)
  const weights = [8, 4, 2, 1]
  let score = 0
  for (const term of terms) {
    const field = fields.findIndex(text => text.includes(term))
    if (field === -1) return -1
    score += weights[field]
  }
  const name = normalizeSearch(item.metadata?.name || item.name)
  if (terms.length && name === normalizeSearch(query)) score += 16
  return score
}

function filterIntakeItems(items) {
  return items.map(item => ({ item, score: searchScore(item, state.query) })).filter(({ item, score }) => {
    return score >= 0 &&
      (state.availability === 'all' || (state.availability === 'published') === Boolean(item.archiveUrl)) &&
      (state.tab !== 'packs' || state.category === 'all' || item.metadata.category === state.category) &&
      (!selectedTags().length || selectedTags().some(tag => tag === 'unclassified' ? !contentTags(item).length : contentTags(item).includes(tag)))
  }).sort((a, b) => {
    if (state.sort === 'relevance' && a.score !== b.score) return b.score - a.score
    const aName = a.item.metadata?.name || a.item.name
    const bName = b.item.metadata?.name || b.item.name
    return aName.localeCompare(bName, 'zh-CN', { numeric: true }) ||
      (a.item.metadata?.id || a.item.id).localeCompare(b.item.metadata?.id || b.item.id)
  }).map(({ item }) => item)
}

function catalogHash(tab = state.tab, id = state.selected) {
  const params = new URLSearchParams()
  if (catalog.mode === 'intake' && ['plugins', 'packs'].includes(tab) && tab === state.tab) {
    for (const [key, fallback] of Object.entries(searchDefaults)) {
      if (state[key] !== fallback) params.set(key === 'query' ? 'q' : key, state[key])
    }
  }
  return `#/${tab}${id ? `/${encodeURIComponent(id)}` : ''}${params.size ? `?${params}` : ''}`
}

function renderSearchTools(items) {
  const select = (id, label, value, options) => `<label class="catalog-filter"><span>${label}</span><select id="${id}">${options.map(([key, text]) => `<option value="${escapeHtml(key)}" ${value === key ? 'selected' : ''}>${escapeHtml(text)}</option>`).join('')}</select></label>`
  const group = state.tab === 'packs' ? Object.values(catalog.tagGroups || {}).flat() : []
  const chosen = selectedTags()
  const tags = group.map(tag => ({ ...tag, count: items.filter(item => contentTags(item).includes(tag.id)).length }))
    .filter(tag => tag.count || chosen.includes(tag.id))
  const unclassified = items.filter(item => !contentTags(item).length).length
  if (state.tab !== 'plugins' && (unclassified || chosen.includes('unclassified'))) tags.push({ id: 'unclassified', label: '未分类', description: '尚未标注官方分类。', count: unclassified })
  const categories = Object.entries(categoryLabels).filter(([key]) => items.some(item => item.metadata?.category === key) || state.category === key)
  return `<section class="catalog-toolbar" aria-label="目录搜索和筛选">
    <label class="search-field"><i data-lucide="search"></i><input id="catalog-search" type="search" value="${escapeHtml(state.query)}" placeholder="搜索名称、作者、用途或组件" aria-label="搜索${{ plugins: '插件', packs: '整合包' }[state.tab]}" /></label>
    <div class="catalog-filter-row">
      ${state.tab === 'packs' && categories.length > 1 ? select('category-filter', '包类型', state.category, [['all', '全部类型'], ...categories]) : ''}
      ${state.tab === 'plugins' ? select('availability', '下载状态', state.availability, [['all', '全部插件'], ['published', '有核验归档'], ['unpublished', '仅来源收录']]) : ''}
      ${select('sort-filter', '排序', state.sort, [['relevance', '相关性'], ['name', '名称']])}
      <button class="command" type="button" data-reset-search>清空条件</button>
    </div>
    ${tags.length ? `<div class="official-tag-group" role="group" aria-label="官方分类"><span class="official-tag-heading">官方分类 · 可多选</span><div class="official-tag-options">${tags.map(tag => `<label class="official-tag-choice" title="${escapeHtml(tag.description)}"><input id="tag-filter-${escapeHtml(tag.id)}" type="checkbox" data-tag-filter="${escapeHtml(tag.id)}" ${chosen.includes(tag.id) ? 'checked' : ''} /><span>${escapeHtml(tag.label)}</span><small>${tag.count}</small></label>`).join('')}</div></div>` : ''}
    ${chosen.some(id => id !== 'unclassified' && !group.some(tag => tag.id === id)) ? '<p class="catalog-search-note" role="status">链接中含有不可用的分类；可清空条件后重新选择官方标签。</p>' : ''}
  </section><p class="catalog-search-note">空格分隔多个关键词，所有关键词均需匹配；名称优先匹配。${state.tab === 'plugins' ? '支持中文名称、包名、作者与来源检索。' : '官方标签多选取并集，与关键词和其他条件取交集；作者标签仅在详情展示。'}</p>`
}

function filteredItems() {
  const query = state.query.trim().toLowerCase()
  if (catalog.mode === 'intake') {
    return filterIntakeItems({ plugins: catalog.plugins, packs: catalog.packs }[state.tab] || [])
  }
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
  if (state.tab === 'skills') return []
  const packs = catalog.packs
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
        ${cardTags(pack)}
        <span class="card-status"><span class="badge badge-lock">${escapeHtml(categoryLabels[pack.metadata.category] || '未分类')}</span><span class="badge badge-parsed">结构已检验</span><span class="badge badge-warning">宿主未测试</span></span>
        <span class="card-inspect">查看详情 <i data-lucide="arrow-up-right"></i></span>
      </button>
      <div class="card-actions"><a href="${assetUrl(pack.archiveUrl)}" download><i data-lucide="download"></i>下载整合包</a>${catalog.demo ? '<span>测试样本</span>' : `<a href="${escapeHtml(safeExternalUrl(pack.source))}" target="_blank" rel="noreferrer">来源 <i data-lucide="external-link"></i></a>`}</div>
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
  const relatedLinks = [
    loader?.source ? { label: '加载器来源', url: loader.source } : null,
    pack.authorRepository ? { label: '作者仓库', url: pack.authorRepository } : null,
    pack.source ? { label: catalog.demo ? '测试来源占位' : '本包发布来源', url: pack.source } : null,
    ...(Array.isArray(pack.links) ? pack.links : [])
  ].filter(Boolean)
  const appearanceSection = appearance ? `
    <section class="detail-section"><h3>外观加载声明</h3><dl class="facts">
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
      <a class="command primary" href="${assetUrl(pack.archiveUrl)}" download><i data-lucide="archive"></i>下载整合包</a>
      <a class="command" href="${assetUrl(pack.packUrl)}" download><i data-lucide="file-json"></i>清单</a>
      <a class="command" href="${assetUrl(pack.reportUrl)}" download><i data-lucide="package-check"></i>检验报告</a>
    </div>
    <dl class="facts detail-summary-facts" aria-label="适配摘要">
      <div><dt>声明支持版本</dt><dd>${escapeHtml(pack.requires?.dsh || (pack.versionDeclarations?.kernel === 'legacy-undeclared' ? '历史包未声明（兼容未知）' : '作者未声明'))}</dd></div>
      <div><dt>平台</dt><dd>${escapeHtml(formatPlatforms(pack.requires))}</dd></div>
      <div><dt>包含内容</dt><dd>${components.length} 个组件</dd></div>
      <div><dt>归档大小</dt><dd>${pack.archiveSize.toLocaleString('zh-CN')} 字节</dd></div>
    </dl>
    ${classificationDetail(pack)}
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

const repositoryUrl = 'https://github.com/lanyun077/EAC-mojobox'
const submissionTypes = { plugin: '独立插件', pack: '整合包' }

function classificationGuide() {
  const example = { type: 'pack', id: 'org.example.tools', officialTags: ['development'], customTags: ['作者特色'] }
  return `<section class="guide-panel"><h2>选择官方分类，或填写作者标签</h2><p>下面是整合包官方用途与外观主题标签，通常选 1～2 个，最多 3 个。也可以只填自定义标签，由维护者审核归类；不确定时保留未分类。</p><dl class="guide-facts">${Object.values(catalog.tagGroups || {}).flat().map(tag => `<dt>${escapeHtml(tag.label)} <code>${escapeHtml(tag.id)}</code></dt><dd>${escapeHtml(tag.description)}</dd>`).join('')}</dl><p>在 <code>catalog/website-tags.json</code> 的 entries 中追加自己资源的条目，不修改作者归档：</p><pre><code>${escapeHtml(JSON.stringify(example, null, 2))}</code></pre><p>officialTags 按包类型选择用途或外观主题组的 ID；customTags 可填 1～12 个自由词，每个 1～32 字符。角色名、颜色和组件名只作为作者标签，在详情展示，不参与分类和标签检索。同名自定义词不会自动获得官方归类。原记录已有的 tags 保留，无需重复填写。</p><a class="related-link" href="${repositoryUrl}/blob/main/docs/catalog-tags.md" target="_blank" rel="noreferrer">官方标签、完整示例与审核规则 <i data-lucide="external-link"></i></a></section>`
}

function contributePage() {
  const type = Object.hasOwn(submissionTypes, state.selected) ? state.selected : null
  const guides = {
    plugin: `<h2>独立插件：提交一张信息卡</h2><p>软件仍由作者发行；JSON 只是目录记录，不需要 Mojobox SDK 或新的运行时 Manifest。</p><dl class="guide-facts"><dt>文件与目录</dt><dd><code>catalog/plugin-listings/&lt;id&gt;.json</code>；有下载时附原始 <code>artifacts/plugins/&lt;id&gt;-&lt;version&gt;.tgz</code>。</dd><dt>最少材料</dt><dd>稳定 ID、实际包名、精确版本、名称与用途、HTTPS 来源、许可、兼容与冲突状态。</dd><dt>规则</dt><dd>兼容未知保留 <code>dsh: null, basis: unknown</code>；<code>conflicts: null</code> 是未知，<code>[]</code> 是未报告。许可未知填 null，仅收录来源。下载必须保留原始字节，附大小与 SHA-256；归档最多 8 MiB。</dd></dl><ol><li>核对正式发行、用途和再分发许可。</li><li>填写信息卡；可选提交核验过的原始 npm 归档，不重打包。</li><li>执行下方检查，随 PR 说明限制和真实测试范围。</li></ol>`,
    pack: `<h2>整合包：提交完成的薄包</h2><p>作者维护插件组合，Mojobox 检查并提供原始下载。皮肤插件可以与功能插件一起引用；外观包使用 appearance 分类，补充加载器、皮肤 ID 和已知冲突。</p><dl class="guide-facts"><dt>文件与目录</dt><dd><code>artifacts/&lt;id&gt;-&lt;version&gt;.dshpack</code> 与 <code>catalog/feature-packs/&lt;id&gt;.json</code>。归档是 ZIP，只含根 <code>pack.json</code> 和可选 <code>icon.png</code>。</dd><dt>最少材料</dt><dd>清单含 formatVersion: 1、稳定 ID、名称、版本、requires.dsh 范围和至少一个插件引用；记录含分类 function、appearance 或 workflow、HTTPS 来源、作者、许可和最终归档 SHA-256。</dd><dt>规则</dt><dd>npm/GitHub 插件引用须精确版本；builtin 引用由宿主提供。未知内核范围先提候选，不编造。不要嵌入插件代码、Profile 或完整客户端。</dd></dl><ol><li>按文件结构说明制作薄包并确认版本声明。</li><li>计算最终归档摘要，添加同 ID 收录记录。</li><li>检查归档与下载，将事实源和验证结果提交 PR。</li></ol>`,
  }
  return `<main class="catalog-page guide-page"><section class="catalog-intro"><div><span class="eyebrow">CONTRIBUTE</span><h1>提交你的作品</h1><p>正式收录使用 Fork + Pull Request。先选择类型，准备原始文件和来源事实；材料不完整可先提候选 Issue。</p></div></section>
    <nav class="guide-tabs" aria-label="提交类型">${Object.entries(submissionTypes).map(([id, label]) => `<a class="command ${type === id ? 'primary' : ''}" href="#/contribute/${id}" ${type === id ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
    ${type ? `<section class="guide-panel" aria-label="${submissionTypes[type]}提交指南">${guides[type]}<a class="related-link" href="${repositoryUrl}/blob/main/docs/community-submissions.md#${type}" target="_blank" rel="noreferrer">完整${submissionTypes[type]}规范 <i data-lucide="external-link"></i></a>${type === 'plugin' ? `<a class="related-link" href="${repositoryUrl}/blob/main/docs/plugin-intake.md" target="_blank" rel="noreferrer">信息卡字段与下载规则</a>` : `<a class="related-link" href="${repositoryUrl}/blob/main/docs/author-pack-request.md" target="_blank" rel="noreferrer">薄包文件结构与最小清单</a><a class="related-link" href="${repositoryUrl}/blob/main/docs/intake.md" target="_blank" rel="noreferrer">归档收录规则</a>`}</section>` : `<section class="guide-panel"><h2>从哪一种开始？</h2><p>单个软件发行（含皮肤插件）选“独立插件”；功能或外观插件组合选“整合包”。不再独立收录设计 Prompt 和设计思路，相关说明由作者仓库维护。</p><p>Skill 仅预留分类，当前不接受收录。完整环境或尚未确定的格式请先提候选 Issue。</p></section>`}
    ${type && type !== 'plugin' ? classificationGuide() : ''}
    <section class="guide-panel"><h2>从 Fork 到发布</h2><ol><li>Fork 仓库，从最新 main 建分支，只添加自己的事实源、归档、网站标注和预览。</li><li>完成本地检查，在 PR 模板中写明来源、身份或代提交授权、许可及真实测试范围。</li><li>通过自动检查与维护者人工审核后合并；发布工作流成功后才会上线。</li></ol><pre><code>npm ci\nnpm test\nnpm run build\nnpm run verify:downloads\ngit diff --check</code></pre><p>提交到自己的分支后，再运行 <code>npm run check:submission -- origin/main</code> 检查已提交增量。更新归档必须新版本、新文件和新摘要，不能覆盖历史字节。静态检查通过不等于安全、兼容或宿主已测试。</p><div class="guide-tabs"><a class="command primary" href="${repositoryUrl}/fork" target="_blank" rel="noreferrer">Fork 仓库</a><a class="command" href="${repositoryUrl}/issues/new/choose" target="_blank" rel="noreferrer">提交候选 / 咨询</a><a class="command" href="${repositoryUrl}/blob/main/docs/community-submissions.md" target="_blank" rel="noreferrer">完整审核指南</a></div></section></main>`
}

function sourcePage() {
  return `<main class="catalog-page guide-page"><section class="catalog-intro"><div><span class="eyebrow">DOWNSTREAM SOURCE</span><h1>接入 Mojobox 来源</h1><p>为市场、宿主和加载器读取来源事实。插件入口是一份静态 JSON，无需后端端口或登录；安装与运行仍由下游决定。</p></div></section>
    <section class="guide-panel"><h2>插件来源接口 v1</h2><div class="related-links"><a class="related-link" href="${assetUrl('generated/api/v1/plugins.json')}">插件索引 · plugins.json <i data-lucide="file-json"></i></a><a class="related-link" href="${assetUrl('generated/api/v1/schemas/plugin-index.schema.json')}">索引 Schema</a><a class="related-link" href="${assetUrl('generated/api/v1/schemas/plugin-listing.schema.json')}">信息卡 Schema</a></div><ol><li>配置实际 HTTPS 索引 URL，校验 Schema、schemaVersion: plugins.mojobox.dev/v1、sourceId: dsh-eac.mojobox 与 demo: false。</li><li>完整保留 listing、兼容、冲突和 limitations。conflicts: null 是未知，[] 是未报告；runtime: not-tested、dependencies: not-resolved 不可变成“可安装”。</li><li>以实际索引 URL 解析所有相对路径：<code>new URL(file.url, indexUrl)</code>。download 与 report 为 null 时不推测下载地址。</li><li>限长读取下载和报告，核验实际响应字节的 size 与 SHA-256，再按宿主规则审核平台、依赖、权限和安装资格。</li><li>使用一次完整合法快照更新目录；网络、Schema 或摘要失败保留上一份成功快照。revision 是内容指纹，不是发布顺序或签名。</li></ol><a class="related-link" href="${repositoryUrl}/blob/main/docs/plugin-source-api-v1.md" target="_blank" rel="noreferrer">完整消费契约与示例 <i data-lucide="external-link"></i></a></section>
    <section class="guide-panel"><h2>整合包目录</h2><p>网页目录与插件接口由同一收录事实源生成，但格式不同。功能与外观整合包统一展示，保留各自的归档、来源、依赖与加载声明。</p><div class="guide-tabs"><a class="command" href="#/packs">整合包目录</a><a class="command" href="${assetUrl('generated/catalog.json')}">网站 Catalog JSON</a></div><h3>EAC 供货：独立草稿导出</h3><p>既有 supply.eac/v1 是独立批次草稿与导出流程，不是本页提供的线上接口。新插件不会自动加入旧批次，现有导入器也不会自动读取插件来源 v1。需要下游实现一次读取或转换，并保留完整限制。</p><a class="related-link" href="${repositoryUrl}/blob/main/docs/plugin-source-api-v1.md#与现有-eac-供货的关系" target="_blank" rel="noreferrer">供货边界与接入说明</a></section></main>`
}

function renderIntake() {
  const focusedId = document.activeElement?.dataset?.select
  const focusedControl = document.activeElement?.id
  const packs = catalog.packs
  if (!['home', 'packs', 'plugins', 'skills', 'contribute', 'source'].includes(state.tab)) {
    state.tab = state.selected ? 'packs' : 'home'
  }
  const items = state.tab === 'home' ? [] : filteredItems()
  const selected = state.tab === 'plugins' ? catalog.plugins.find(plugin => plugin.id === state.selected) : state.tab === 'skills' ? undefined : packs.find(pack => pack.metadata.id === state.selected)
  const totalItems = packs.length + catalog.plugins.length
  const isDetail = Boolean(selected)
  const isMissingDetail = Boolean(state.selected) && !selected
  const currentLabel = { packs: '整合包', plugins: '插件', skills: 'Skill' }[state.tab] || '整合包'
  const collectionSize = { packs: packs.length, plugins: catalog.plugins.length, skills: 0 }[state.tab]
  const itemDetail = item => state.tab === 'plugins' ? pluginDetail(item) : intakeDetail(item)
  const itemRow = item => state.tab === 'plugins' ? pluginRow(item) : packRow(item)
  const collectionDescription = { packs: '经过结构检查的功能与外观组合，以及开发者原始归档。', plugins: '独立插件的精确版本、发行来源、兼容声明与已知限制。', skills: '暂无收录。宿主格式与供货约定尚待确认。' }[state.tab]
  const emptyState = (hasCatalog, title) => hasCatalog
    ? '<i data-lucide="search"></i><strong>没有匹配项</strong><span>调整搜索条件，或清空搜索后查看全部目录。</span>'
    : `<div class="empty-illustration"><i data-lucide="boxes"></i><span></span></div><strong>暂无正式收录内容</strong><span>${title}通过收录检查后会展示在这里。</span><a class="empty-cta" href="${repositoryUrl}/blob/main/docs/${state.tab === 'plugins' ? 'plugin-intake' : 'intake'}.md" target="_blank" rel="noreferrer">查看收录规范 <i data-lucide="arrow-up-right"></i></a>`
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
      <nav class="topbar-nav intake-nav" aria-label="站点导航">${[['home', '首页'], ['plugins', '插件'], ['packs', '整合包'], ['skills', 'Skill'], ['source', '下游接入']].map(([tab, label]) => `<a class="topbar-link ${state.tab === tab ? 'is-active' : ''}" href="#/${tab}" data-tab="${tab}" ${state.tab === tab ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
      <div class="topbar-tools"><a class="topbar-link submit-link" href="#/contribute" data-tab="contribute" ${state.tab === 'contribute' ? 'aria-current="page"' : ''}>提交指南</a><a class="repo-link" href="${repositoryUrl}" target="_blank" rel="noreferrer"><i data-lucide="code-2"></i><span>GitHub</span></a></div>
    </header>
    ${catalog.demo ? '<p class="notice warning" role="status">测试演示：以下样本仅验证收录与下载流程，不是真实功能包，请勿用于安装。</p>' : ''}
    ${state.tab === 'contribute' ? contributePage() : state.tab === 'source' ? sourcePage() : state.tab === 'home' ? `
      <main class="home-page">
        <section class="hero home-hero" aria-labelledby="hero-title"><div class="hero-copy"><span class="eyebrow">DSH · 开发者生态目录</span><h1 id="hero-title">把好用的工具，<br>装进一个盒子。</h1><p>发现 DSH 的插件与整合包。Mojobox 负责收纳、核对来源和提供原始下载，内容由上游开发者维护。</p><div class="hero-actions"><a class="hero-link" href="#/plugins" data-tab="plugins">浏览插件 <i data-lucide="arrow-up-right"></i></a><a class="hero-link" href="#/packs" data-tab="packs">浏览整合包 <i data-lucide="arrow-up-right"></i></a><span class="hero-note"><i data-lucide="package-check"></i>原始文件，每一份都有摘要</span></div></div><div class="hero-art" aria-hidden="true"><span class="hero-orbit orbit-one"></span><span class="hero-orbit orbit-two"></span><span class="hero-cube"><i data-lucide="boxes"></i></span></div></section>
        <section class="home-summary"><div class="metric"><strong>${totalItems}</strong><span>${catalog.demo ? '演示样本' : '正式收录'}</span></div><div class="metric"><strong>${catalog.plugins.length}</strong><span>插件</span></div><div class="metric"><strong>${packs.length}</strong><span>整合包</span></div><span class="summary-note">收纳 · 检验 · 下载</span></section>
        <section class="home-content participation"><div class="section-heading"><div><span class="eyebrow">GET INVOLVED</span><h2>从这里参与</h2></div><p>作者提供内容，Mojobox 整理来源，下游负责安装与运行。</p></div><div class="role-grid">${[['#/plugins', '浏览资源', '找插件与整合包，核对来源与使用边界。'], ['#/contribute', '上游提交', '按类型准备最少材料，通过 Fork + PR 申请收录。'], ['#/source', '下游接入', '读取静态索引、Schema 与原始文件摘要。'], [`${repositoryUrl}/blob/main/README.md#开发与验证`, '项目开发', '在本地运行目录、校验器与静态网站。']].map(([url, title, description]) => `<a class="role-card" href="${url}"><strong>${title} <i data-lucide="arrow-up-right"></i></strong><span>${description}</span></a>`).join('')}</div></section>
        <section class="home-content"><div class="section-heading"><div><span class="eyebrow">EXPLORE</span><h2>资源目录</h2></div></div><div class="entry-grid">${entryCard('plugins', 'box', '插件', '精确发行、兼容声明与使用边界。', catalog.plugins.length, 'entry-plugin')}${entryCard('packs', 'boxes', '整合包', '开发者提交的功能与外观插件组合。', packs.length, 'entry-pack')}${entryCard('skills', 'file-text', 'Skill', '暂无收录', 0, 'entry-skill')}</div></section>
        <section class="principles"><div><span class="eyebrow">MOJOBOX ROLE</span><h2>让上游内容更容易被找到</h2></div><div class="principle-list"><div><i data-lucide="archive"></i><span><strong>收纳</strong><small>保存开发者提供的原始归档和资料。</small></span></div><div><i data-lucide="shield-check"></i><span><strong>检验</strong><small>检查结构、摘要和来源记录，不替作者维护内容。</small></span></div><div><i data-lucide="download"></i><span><strong>供给</strong><small>为宿主、加载器和下游工具提供可靠下载来源。</small></span></div></div></section>
      </main>` : `
      <main class="catalog-page ${isDetail || isMissingDetail ? 'is-detail' : ''}" aria-label="${currentLabel}目录">
        ${isDetail || isMissingDetail ? `<section class="detail-page"><a class="back-link" href="${escapeHtml(catalogHash(state.tab, null))}" data-tab="${state.tab}"><i data-lucide="arrow-up-right"></i>返回${currentLabel}列表</a><div class="detail-page-body" id="detail">${isDetail ? itemDetail(selected) : `<div class="detail-empty"><i data-lucide="box"></i><h2>未找到此${currentLabel}</h2><p>${state.tab === 'packs' ? '未找到此整合包。' : ''}当前暂无正式收录的此条目，请返回列表选择其他项目。</p></div>`}</div></section>` : `<section class="catalog-intro"><div><span class="eyebrow">${{ packs: 'FEATURE COLLECTION', plugins: 'PLUGIN COLLECTION', skills: 'SKILL COLLECTION' }[state.tab]}</span><h1>${currentLabel}</h1><p>${collectionDescription}</p></div><div class="catalog-count" role="status" aria-live="polite"><strong>${items.length}</strong><span>当前显示 / 共 ${collectionSize} 项</span></div></section>
        ${state.tab !== 'skills' ? `<nav class="guide-tabs" aria-label="本类提交规范">${[state.tab === 'plugins' ? 'plugin' : 'pack'].map(type => `<a class="command" href="#/contribute/${type}">提交${submissionTypes[type]}</a>`).join('')}</nav>${renderSearchTools({ plugins: catalog.plugins, packs }[state.tab] || [])}` : ''}
        <div class="catalog-grid ${items.length ? '' : 'is-empty'}">${items.length ? items.map(itemRow).join('') : `<div class="no-results">${state.tab === 'skills' ? '<i data-lucide="file-text"></i><strong>暂无 Skill 收录</strong><span>暂不提供 Skill 下载或安装。</span>' : emptyState(collectionSize, currentLabel)}</div>`}</div>`}
      </main>`}
    <footer class="site-footer"><span>Mojobox · 为 DSH 生态收纳好工具</span><span>由开发者维护内容 · 安装与运行交给宿主</span></footer>`
  bindEvents()
  refreshIcons()
  if (focusedId) [...document.querySelectorAll('[data-select]')].find(button => button.dataset.select === focusedId)?.focus()
  if (focusedControl) document.getElementById(focusedControl)?.focus()
}

function selectedDetail() {
  const plugin = catalog.plugins.find(item => item.id === state.selected)
  if (plugin) return pluginDetail(plugin)
  const pack = catalog.packs.find(item => item.metadata.id === state.selected)
  if (pack) return packDetail(pack)
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
      <a class="repo-link" href="${repositoryUrl}" target="_blank" rel="noreferrer" title="打开 GitHub 仓库" aria-label="打开 GitHub 仓库"><i data-lucide="code-2"></i><span>GitHub</span></a>
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
  if (state.tab !== tab) Object.assign(state, searchDefaults)
  state.tab = tab
  state.selected = id
  location.hash = catalogHash()
  render()
  if (window.innerWidth < 1100) document.querySelector('#detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function bindEvents() {
  document.querySelectorAll('.detail-previews img').forEach(image => {
    const showUnavailable = () => {
      image.hidden = true
      image.closest('figure').classList.add('preview-unavailable')
    }
    image.addEventListener('error', showUnavailable)
    if (image.complete && !image.naturalWidth) showUnavailable()
  })
  document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    if (state.tab !== button.dataset.tab || !button.classList.contains('back-link')) Object.assign(state, searchDefaults)
    state.tab = button.dataset.tab
    state.selected = null
    location.hash = catalogHash()
    render()
  }))
  const search = document.querySelector('.search-field input')
  const updateSearch = event => {
    state.query = event.target.value
    if (event.isComposing) return
    const caret = event.target.selectionStart
    if (catalog.mode === 'intake') history.replaceState(null, '', catalogHash())
    render()
    const input = document.querySelector('.search-field input')
    input?.focus()
    if (caret !== null) input?.setSelectionRange(caret, caret)
  }
  search?.addEventListener('input', updateSearch)
  search?.addEventListener('compositionend', updateSearch)
  const changeFilter = (key, value) => {
    state[key] = value
    if (catalog.mode === 'intake') location.hash = catalogHash()
    render()
  }
  document.querySelector('#availability')?.addEventListener('change', event => changeFilter('availability', event.target.value))
  document.querySelector('#evidence-filter')?.addEventListener('change', event => { state.evidence = event.target.value; render() })
  document.querySelector('#host-filter')?.addEventListener('change', event => { state.host = event.target.value; render() })
  document.querySelector('#category-filter')?.addEventListener('change', event => changeFilter('category', event.target.value))
  document.querySelectorAll('[data-tag-filter]').forEach(input => input.addEventListener('change', () => {
    const tags = selectedTags().filter(id => id !== input.dataset.tagFilter)
    if (input.checked) tags.push(input.dataset.tagFilter)
    changeFilter('tag', tags.sort().join(',') || 'all')
  }))
  document.querySelector('#sort-filter')?.addEventListener('change', event => changeFilter('sort', event.target.value))
  document.querySelector('[data-reset-search]')?.addEventListener('click', () => {
    Object.assign(state, searchDefaults)
    location.hash = catalogHash()
    render()
    document.querySelector('.search-field input')?.focus()
  })
  document.querySelectorAll('[data-select]').forEach(button => button.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    selectItem(button.dataset.select)
  }))
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
  const separator = location.hash.indexOf('?')
  const path = separator === -1 ? location.hash : location.hash.slice(0, separator)
  const search = separator === -1 ? '' : location.hash.slice(separator + 1)
  const [, tab, encodedId] = path.match(/^#\/(home|plugins|packs|skins|skills|contribute|source)(?:\/(.+))?$/) || []
  if (tab) state.tab = tab === 'skins' ? 'packs' : tab
  try { state.selected = encodedId ? decodeURIComponent(encodedId) : null }
  catch { state.selected = null }
  if (catalog.mode !== 'intake') return
  Object.assign(state, searchDefaults)
  if (!['plugins', 'packs'].includes(state.tab)) return
  const params = new URLSearchParams(search)
  state.query = params.get('q') || ''
  if (['relevance', 'name'].includes(params.get('sort'))) state.sort = params.get('sort')
  if (state.tab === 'plugins' && ['published', 'unpublished'].includes(params.get('availability'))) state.availability = params.get('availability')
  if (state.tab === 'packs' && Object.hasOwn(categoryLabels, params.get('category'))) state.category = params.get('category')
  if (state.tab !== 'plugins') state.tag = params.get('tag') || 'all'
}

async function start() {
  const response = await fetch(assetUrl('generated/catalog.json'))
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  catalog = await response.json()
  if (!catalog || !Array.isArray(catalog.packs) || !Array.isArray(catalog.plugins)) throw new Error('目录数据格式错误')
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
