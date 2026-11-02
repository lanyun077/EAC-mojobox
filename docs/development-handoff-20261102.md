# Mojobox 继续开发交接

核对日期：2026-11-02。本文供维护者或新开发会话接续工作。
这是当前状态快照与开发导航；具体字段以 Schema、事实源和现行收录文档为准。

## 2026-11-02 后续产品决策：统一插件与整合包

用户已确认取消皮肤一级分类。皮肤插件按普通插件收录，8 个既有外观包并入整合包目录；
“功能包”入口统一称为“整合包”。设计 Prompt 与设计思路停止独立收录和网站／新供货导出，
原有 10 套资料及来源记录保留追溯。外观包的 `appearance` 元数据、加载器、冲突与预览保留；
原始 `.dshpack` 不改字节，插件仍通过薄包清单引用，不嵌入插件代码。

实现分支为 `feat/unify-plugin-pack-catalog`；用户随后授权提交、推送并检查上游资源更新。
本轮先推送开发分支，不创建 PR、合并或部署。
下面 main、远端状态及第 11 节验证表仍是本次开发前的交接快照，不表示新改动已经上线。

### 本次本地实现验证

- `npm test`：164 项，162 通过、0 失败，2 项因 Windows 符号链接权限跳过；恢复来源页图标导入后，网站测试 34 项再次通过。新增退休 Prompt 类型 fixture 后，官方标签测试 3 项通过。
- 根路径、`/EAC-mojobox/` 和 `/dsh-mojobox/` 均完成构建与 46 个归档下载复核；根路径连续两次构建的 148 个文件 SHA-256 一致。
- `node authoring/build.mjs --check`：22 个自制包与原字节一致；演示构建及 1 个演示归档下载复核通过。
- 浏览器验证了 1440px 桌面、390px 窄屏、统一目录、搜索与标签交集、详情返回保留筛选，以及两种子路径和旧外观详情链接。
- 320px 视口存在原有最小宽度问题：`html/body` 的 `min-width: 320px` 加上 15px 垂直滚动条，会产生 15px 横向溢出；本轮分类调整未修改该布局。

以上为分类调整的本地验证，未运行收录插件、宿主安装或外部预览在线性测试；不代表已合并或发布。

## 1. 先了解现在的位置

项目已从本地备份恢复到新仓库，网站、原始下载和插件来源接口可以访问。
下一步可以在现有框架上持续收录资源、维护来源和改善检索，无需重新开发收纳框架或重做删库恢复。

| 项目 | 当前值 |
| --- | --- |
| 独立 Git 仓库目录 | `D:\Deepseek-Harness-EAC\dsh-mojobox` |
| 正式远端 | <https://github.com/lanyun077/EAC-mojobox> |
| 网站 | <https://lanyun077.github.io/EAC-mojobox/> |
| 插件来源接口 | <https://lanyun077.github.io/EAC-mojobox/generated/api/v1/plugins.json> |
| main 基线 | `011d4397c194ae412c45ade3d692034893aea1a3` |
| 原项目恢复前最新开发提交 | `dfa8a6ca3e808b9ee59a5ae84b92200987c907a3`，官方分类改版 |
| 正式远端名称 | `origin` |
| 旧远端名称 | `deleted-origin`，仅用于追溯，不用于继续发布 |

本轮核对时，本地 main 与 GitHub main 相同，写文档前工作区干净。
本次文档在 `docs/development-handoff-20261102` 分支编写；交付时保留为本地未提交修改，
没有因写交接而提交、推送、建 PR、合并或部署。新会话应先检查工作区并保留这份文档。
后续分类调整已在 `feat/unify-plugin-pack-catalog` 分支继续维护该文档，保留原有未提交内容。

父目录是其他工程的工作区。Mojobox 是独立子仓，不要在父仓提交本项目，也不要跑父仓的
Tauri、桌面客户端或内核构建来代替 Mojobox 验证。

## 2. 项目方向与必须守住的边界

一句话：**上游维护内容，Mojobox 收纳与供给，下游负责安装和运行。**

Mojobox 负责收集原始资源，记录身份、版本、来源、许可、兼容声明和冲突限制，
完成静态检查，生成网站、下载、报告和下游索引。

不把 Mojobox 扩展成插件运行时、桌面皮肤加载器、完整环境迁移工具或独立包管理器。
有限安装支持只复用宿主已有接口；本机 Profile、依赖解析、安装事务、快照、回滚和皮肤切换归宿主。
真实宿主测试须使用隔离环境，不以用户日常 Profile 做实验。

最新长期路线是：完善插件与整合包收纳（含成品皮肤插件、外观组合） → 用真实资源沉淀规则 →
提供下游接口 → 后续动态开发者网站。近期重点已推进到“中量插件收集与稳定来源供给”；
动态提交、登录、热度与排行尚未实现，也不是本轮交接授予的新开发任务。

当前网站保持静态，通过 GitHub PR 接收正式投递，Issue 接收候选和咨询。
用户此前认为无服务器阶段不宜先做热度统计，因此最近的产品改动重点是检索和简洁分类。

路线文档里的建议状态、未来字段和阶段目标不等于现有 Schema 已支持。
现行执行以 [AGENTS.md](../AGENTS.md)、[作者提交规范](community-submissions.md)、
[收录规范](intake.md)、[插件轻量收录](plugin-intake.md) 为准；旧阶段计划见 `docs/archive/`，仅供追溯。

## 3. 已有资源和功能

| 资源 | 数量 | 实际交付 |
| --- | --- | --- |
| 独立插件 | 26 条 | 24 个原始 npm `.tgz` 下载，2 条只提供来源 |
| 整合包 | 22 个 | 14 个功能、8 个外观 Feature Pack；原始 `.dshpack`、清单与报告，外观包保留加载声明与预览 |
| 历史皮肤 Prompt | 10 套 | 仅保留追溯，不计入正式目录、下载或新供货 |
| 独立 Skill | 0 | 仅预留分类，不收录、不安装，没有独立供货协议 |

正式下载共 46 个归档，即 24 个插件加 22 个 Feature Pack；10 套历史 Prompt 不计入正式收录。
`artifacts/` 还保存历史文件，不能把该目录总文件数当作正式在售或运行验证数量。

网站已有首页、插件／整合包目录、详情、来源与摘要、投稿指南、下游接入指南，
并支持多关键词、相关性排序、官方标签多选、整合包类型筛选、可分享 URL 和空结果处理。
前端源码在 `site/src/main.js` 与 `site/src/styles.css`，沿用绿色、米白的现有风格。

静态检查通过不表示来源已经在线解析、安装成功、无冲突或运行安全。
没有新的宿主运行证据时，应继续展示 `not-tested`、未知兼容和限制，不自动升级为“可用认证”。

## 4. 从哪里修改：事实源与生成物

| 工作内容 | 事实源 / 主要实现 | 优先阅读 |
| --- | --- | --- |
| 新插件 | `catalog/plugin-listings/*.json`、`artifacts/plugins/*.tgz`；`scripts/plugin-listing.mjs` | [插件收录](plugin-intake.md)、`schemas/plugin-listing.schema.json`、`fixtures/plugin-listings/` |
| 功能包与外观包 | `catalog/feature-packs/*.json`、`artifacts/*.dshpack`；`scripts/feature-pack.mjs` | [文件结构](author-pack-request.md)、[收录规范](intake.md)、`schemas/intake.schema.json`、`fixtures/intake/` |
| 历史皮肤 Prompt（停止收录） | `catalog/skin-prompt-packages/`，不作为正式构建输入 | [历史说明](community-submissions.md#prompt)；旧 Schema／工具仅用于历史核对 |
| 预览图 | `catalog/previews/<id>/` 与资源记录中的引用 | [预览提交规则](community-submissions.md#3-预览图由作者提供) |
| 官方词表 | `policies/catalog-tags.json` | [官方标签](catalog-tags.md) |
| 网站整合包标签 | `catalog/website-tags.json` | `schemas/website-tags.schema.json`、`fixtures/catalog-tags/` |
| 目录构建 | `scripts/build-catalog.mjs` | 读取资源事实源，验证完成后生成目录、报告、原始下载和插件索引 |
| 稳定插件索引 | `scripts/plugin-index.mjs`、两份插件 Schema | [插件来源接口 v1](plugin-source-api-v1.md)、`fixtures/plugin-index/` |
| 网站与部署路径 | `site/`、`vite.config.mjs` | [检索说明](catalog-search.md)、[部署](deployment.md) |
| 已提交增量边界 | `scripts/check-submission.mjs` | [贡献指南](../CONTRIBUTING.md)、PR 模板 |

`site/public/generated/`、`dist/`、`dist-demo/`、`.cache/`、`node_modules/` 是生成物或本地材料，
不要手工改生成 JSON 来绕过事实源，也不要提交它们。

`catalog/plugins/`、旧 Pack/Lock、Evidence 以及 `scripts/build-site.mjs` 属于 legacy 维护链路。
新收录不套用旧协议，也不另造格式桥接；上游协议和运行时语义仍由上游拥有。

## 5. 最近的产品决策：官方分类与作者标签

官方标签应少量、宽泛、可概括，避免为每个角色、作品或组件创建分类。

| 组 | 已定标签 |
| --- | --- |
| 整合包用途，7 个 | `general` 通用增强、`development` 开发编程、`conversation` 会话与智能体、`office` 办公创作、`research` 检索分析、`automation` 自动化集成、`entertainment` 娱乐互动 |
| 外观整合包主题，8 个 | `generic` 通用设计、`anime` 二次元、`game` 游戏主题、`nature` 自然风景、`traditional` 国风传统、`retro` 复古怀旧、`tech` 科技工业、`interface` 界面仿真 |

每项通常选 1～2 个官方标签，最多 3 个；也可以只交自定义词，由维护者审核补充官方归类。
没有标注仍可收录，显示“未分类”。作者词最多 12 个，每个 1～32 字符。

- 官方标签用于分类、卡片、标签检索及相关性；作者词只在详情展示，即使同名也不自动提升为官方分类。
- 原有名称、简介、作者、来源、组件等文字检索保留；“作者标签不参与”不等于这些文字也不能搜索。
- 同组多选是 OR，和关键词、形态等条件是 AND；URL 例如 `#/packs?tag=anime,game&category=appearance`。
- 所有 Feature Pack 标注均写 `type: pack`；外观包按 `appearance` 使用主题词表。两组在整合包页合并展示，Prompt 网站标注已撤下。
- 不用组件名回退生成分类，不凭资源名字猜题材、兼容或安全；无把握留未分类。
- 分类只覆盖整合包，没有为独立插件新增用途标签或修改其严格 v1 接口。

词表、资源标注、构建、前端和投稿指南已经接通。新会话不要把这项当作尚待实现的计划重复开发。
参考依据与人工标注理由在 [catalog-tags.md](catalog-tags.md)。

## 6. 收录与下游供给的操作边界

收录新插件先核对精确发行、包身份、许可与再分发条件，填写轻量信息卡。
许可不清、体积超限或素材边界不明确时，可只收来源；不能为了凑数量伪造许可或兼容。
有下载时保留作者原始 `.tgz`，当前上限 8 MiB，按 Schema 和检查器核验。
不要求作者制作 Mojobox SDK 或新的运行时 Manifest，不把功能相似直接标成硬冲突。

Feature Pack 的 `.dshpack` 是 ZIP，只含根 `pack.json` 和可选 `icon.png`；新包须有合法
`requires.dsh`，外部组件须精确版本，不嵌入插件代码或完整 Profile。
8 个历史皮肤的版本例外按 ID、版本、摘要精确登记，不扩展为新包通行证。
更新归档必须新版本、新文件、新摘要，禁止修改、删除或重命名旧归档。

历史 Prompt 资料冻结留存，不再通过独立投稿新增或更新，不参与正式构建和新供货导出。
代码许可、图片、人物素材、音频和截图许可分别核对，Mojobox 的 MIT 不覆盖第三方资源。

下游应配置新域名的索引 URL；格式仍为 `plugins.mojobox.dev/v1`，`sourceId` 仍为
`dsh-eac.mojobox`，不能因仓库迁移顺手修改身份。
相对 URL 以实际索引 URL 解析，保留完整兼容、冲突、限制，检查实际下载/报告大小与 SHA-256。
`download: null` 只提供来源；`conflicts: null` 是未知，`[]` 是未报告，都不代表实测无冲突。
失败保留上次合法目录，索引删项不能自动卸载本机插件；`revision` 是内容指纹，不是签名或版本序号。

网站 `generated/catalog.json` 是前端数据，不是新的稳定下游接口。
既有 `supply.eac/v1` 批次导出器和插件 v1 索引并行，前两轮草稿获认可不等于下游已读新索引。
正式在线批次与 receipt 尚未发布，不将新插件塞进缺少冲突/限制表达的旧格式。
详见 [插件接口](plugin-source-api-v1.md)、[供货导出](eac-supply-export.md)。

## 7. 恢复历史与 PR：不要再合一次旧备份

2026-10-22 已恢复原始可见 71 个提交，合并保留新仓库初始化提交，并完成地址迁移。
恢复完成后的远端有 76 个提交；此数量是当时快照，不作为以后阻止合法新增提交的约束。

2026-11-02 重新读取 GitHub 状态：

| 新仓库 PR | 状态 | 后续处理 |
| --- | --- | --- |
| [#1](https://github.com/lanyun077/EAC-mojobox/pull/1) 网站、投稿与下游入口迁移 | 已合并 | 已在 main，无需再合 |
| [#2](https://github.com/lanyun077/EAC-mojobox/pull/2) `backup/reflog-02d108a` | 已关闭，未合并 | 旧改动与主线已有补丁相同，保留备份即可 |
| [#3](https://github.com/lanyun077/EAC-mojobox/pull/3) `backup/reflog-3970a56` | 已关闭，未合并 | 旧改动与主线已有补丁相同，保留备份即可 |
| [#4](https://github.com/lanyun077/EAC-mojobox/pull/4) `backup/reflog-a99035a` | 已关闭，未合并 | 核心插件与接口内容已在主线，不将旧快照重复合入 |

核对时没有打开的 PR。以上状态不能沿用上次交接前的“#2～#4 还开着”。
备份分支不是开发待办，不需为了“全部合完”去解决它们的冲突，也不要为它们关闭 CI。

原远端 `DSH-EAC/EAC-mojobox` 及旧 `dsh-mojobox` 地址只用于历史追溯。
固定来源、历史 Issue/PR 不做全仓字符串替换，旧编号不能映射成新仓库无关同号记录。
新仓库没有自动恢复旧 Stars、Issue、审核讨论、Secrets 和 Release 附件；本地记录不能证明删除者身份。

私有抢救资料位于仓库之外的 `D:\Deepseek-Harness-EAC\mojobox-recovery-20261022`，
本轮已确认 `RECOVERY.md`、`mojobox-including-reflog.bundle`、`mojobox-after-restore.bundle` 仍存在。
目录含完整 Git/缓存/私有工作区快照，不得上传公开仓库；不要清理或覆盖它们。
这些是本机操作位置，不是项目运行依赖。公开恢复说明见 [仓库恢复记录](repository-recovery-20261022.md)。

## 8. CI、合并与发布

本轮回读确认 main 使用两组规则：

- `25649631`：必需严格 `check`、禁止非快进和删除分支；恢复时设置无豁免。
- `25649633`：PR 默认一个批准、撤销过期批准并解决审核对话；管理员仅在 PR 合并时可豁免审核组，不能因此跳过必需 CI。

个人仓库与旧组织仓库的权限模型不同，不照搬指定用户限制。
主线保护不能阻止有仓库删除权限的管理员删除整个仓库，应限制管理员并另存异地备份。
规则细节与核对命令见 [维护规则](maintainer-checks.md)。

`.github/workflows/check.yml` 负责 PR/主线检查，`pages.yml` 负责 main 合并后的发布。
Pages 来源是 GitHub Actions。新会话不能用“工作流文件还在”代替检查远端实际运行结果。
PR 标题、正文用中文，至少写目的、变化、协议影响、实际验证、限制和回退方法，不能留空模板。

创建分支用 `feat/`、`fix/`、`docs/` 等表达目的，不用 `codex/`。
审查、解释默认只读；开发授权不自动变成修改分支保护、通知下游或发布的授权。
用户已授权实现分类调整并提交、推送远端，以及检查上游资源更新；尚未授权 PR、合并或部署。

## 9. 建议下一步，尚未开工

当前没有需要再次抢救或合并的阻塞。建议按单项任务继续，以下是建议，不是自动启动的任务清单。

1. **持续收录与来源更新**：选择一批精确版本资源，核对许可、来源、冲突和限制，按既有信息卡提交。
   完成标准是记录、原字节、校验和目录一致；不能只增加链接或条数。
2. **确认新来源入口被下游采用**：提供新索引地址和现有消费指南；只有用户授权后才向对方仓库发消息。
   下游是否完成切换目前未核实，不需将逐批反馈设为继续收录的前置条件。
3. **按真实样本完善检索**：先复核现有 7/8 组能否覆盖，再针对实际缺口修改；独立插件分类须另评估网站元数据范围与接口兼容。
4. **隔离环境做宿主适配验证**：若下一任务明确要求，固定宿主/loader/插件版本并记录证据；不让测试成品包反过来改变框架定位。
5. **动态网站**：等明确需要提交队列、账号或审核后台时再选后端和部署方案。当前不新增数据库、爬虫调度、热度统计或登录系统。

长路线中的历史版本查询、统一状态、撤回体验等还需按当前格式逐项评估，不能只根据路线文字假称已经实现。

## 10. 新会话启动与验证

先在正确子仓检查，不盲目拉取覆盖本地文档：

```powershell
Set-Location 'D:\Deepseek-Harness-EAC\dsh-mojobox'
git status --short --branch
git remote -v
git log -5 --oneline
```

阅读本交接、根 `AGENTS.md`、`README.md`，再按任务查表读取对应 Schema、正反例与生产样本。
只在任务需要同步时 fetch；从更新后的 `origin/main` 新建目的分支，并保留所有已有修改。
开始前说明本次修改哪些事实源、如何验证、不越过哪些边界。

要求 Node.js 22.12 或更新受支持版本，CI 用 Node.js 22。依赖缺失或 lockfile 变化时执行 `npm ci`；
已有依赖且本任务未改依赖，不必机械重装。

```powershell
npm test
npm run build
npm run verify:downloads
git diff --check
```

网站改动还要验证根路径和仓库子路径，检查桌面/窄屏与相关交互：

```powershell
$env:BASE_PATH = '/EAC-mojobox/'
npm run build
npm run verify:downloads
Remove-Item Env:BASE_PATH
```

项目规范另要求 `/dsh-mojobox/` 子路径检查时，同样设置对应 `BASE_PATH` 后构建与校验。
`npm run dev` 启动本地开发；`npm run preview -- --host 127.0.0.1` 预览已构建目录，
访问时保留实际 base。loopback 仅是本机地址，不是下游可远程访问的供货 URL。

框架/构建相关改动按 CI 复核：

```powershell
node authoring/build.mjs --check
npm run build:demo
npm run verify:downloads -- dist-demo --allow-demo
```

提交以后再运行 `npm run check:submission -- origin/main`，它检查已提交的增量，
不能把未提交工作区运行结果说成已审查全部提交。文档任务不需要运行插件或桌面端。
只有改动、失败或新的未解决疑点需要时再扩大验证，不重复完整恢复审计。

## 11. 哪些验证是今天的，哪些是历史证据

| 时间 | 证据与范围 |
| --- | --- |
| 2026-11-02，本次核对 | 本地与远端 main 同 SHA；#1 已合并、#2～#4 已关闭；实际分支规则和 Pages 配置已读取 |
| 2026-11-02，本次 HTTP | 新首页与插件接口均 HTTP 200；接口为 `plugins.mojobox.dev/v1`、`dsh-eac.mojobox`、26 条、`demo: false` |
| 2026-11-02，本次文档验证 | `npm test`：169 项，167 通过、0 失败，2 项 Windows 符号链接跳过；文档本地链接与 `git diff --check` 检查通过 |
| 2026-10-22，最后源码基线验证 | 169 项测试，167 通过、0 失败、2 项 Windows 符号链接跳过；根与两种子路径构建、46 归档/10 套资料、演示和自制包原字节复核通过 |
| 2026-10-22，主线 Actions | [CI 成功](https://github.com/lanyun077/EAC-mojobox/actions/runs/39803505362)、[Pages 成功](https://github.com/lanyun077/EAC-mojobox/actions/runs/39803505326)，绑定 `011d4397` |
| 2026-10-22，恢复后公网复核 | 179 个本站文件 HTTP/大小/SHA-256 与本地一致，原 71 个提交从远端重新克隆确认；不含站外图片或宿主运行测试 |

本次仅文档变化，不重新宣称完成全部下载审计、浏览器验收或宿主验证。
后续改源码、数据或部署后，应执行对应验证，不能拿旧日期结果作为新版本验收。

## 12. 可直接给新会话的提示

> 请在 `D:\Deepseek-Harness-EAC\dsh-mojobox` 独立仓库继续 Mojobox 开发。
> 先读 `AGENTS.md`、`docs/development-handoff-20261102.md` 和 `README.md`，检查当前分支与未提交修改。
> 当前正式仓库是 `lanyun077/EAC-mojobox`，main 基线为 `011d4397`，网站与插件索引已恢复；
> 新库 #1 已合并、#2～#4 是已关闭的旧备份 PR，不要重复合并。
> 保持“上游维护内容、Mojobox 收纳/静态检查/供给、下游安装运行”的边界，使用目的明确的分支名，
> 不手改生成物、不改原始归档、不把未知信息写成兼容认证。先落实我接下来指定的一项开发任务，
> 按项目要求验证，并区分本地完成、已提交、已发布和下游已接入。
