# Mojobox 当前状态与可行性审查包

> 历史归档：保留当时的候选输入、阻塞分析和方案比较，不用于判断今天是否可收录或发布。
> 最新方向和规范从 [文档索引](../README.md) 进入。

> 历史审查材料：本文记录框架优先调整前的宿主/候选阻塞，不代表当前进度。
> 当时状态见 [实施计划](implementation-plan.md) 和 [框架验收](../framework-acceptance.md)。
> Node 版本阻塞已过时；宿主安装及候选来源不再作为收录框架开发前置。

更新时间：2026-09-30
用途：交给额外模型、上游维护者或代码审查者，判断 Mojobox MVP 是否可继续推进、当前候选包是否可发布，以及下一步应该投入哪一层。

## 0. 给审查模型的结论摘要

请先接受以下结论作为当前事实，再判断方案是否合理：

1. **Mojobox 本体链路基本可行。** 目录、候选描述、旧格式冻结、宿主 Feature Pack v1 边界和资源契约已经建立，Mojobox 自己不承担插件安装事务。
2. **当前首个候选包不可发布。** 临时目录只有 `pack.json` 和 `README.md`，没有真实 `.dshpack`；清单引用的 `@dsh-eac/desktop-pack@1.1.0` 在 npm registry 返回 `E404`。
3. **不能把旧 GitHub `.tgz` 直接改名或塞进 Feature Pack。** 该文件是 npm 聚合包，根清单是 `package.json`，安装语义是插件管理器 / `dsh plugin add`，不是 Feature Pack v1。
4. **当前最合理的方向是先补齐上游真实来源，再生成官方格式归档。** 不应先做新的 EAC 专属桥接、第二套安装器或静默格式转换。
5. **宿主资源阶段还有独立环境阻塞。** 资源代码已纳入，但完整 staging 需要内核缓存；本机 Node `22.17.0` 低于项目要求的 `22.19+ / 24+`，官方构建没有生成构建记录，因此不能把失败伪装成缓存完成。

审查时请重点回答：

- 当前 MVP 是否在“已有上游 Feature Pack 能力”的前提下足够小且可交付？
- `plugins[].ref` 应该继续引用 npm 聚合包，还是拆成 `builtin:` / GitHub / 已发布 npm 插件引用？
- 如果上游暂时无法提供可解析来源，是否应暂停首包发布并更换首个候选，而不是扩展 Mojobox 协议？
- 宿主侧是否能在不改变用户 Profile 语义的前提下完成实际安装和重启验收？

## 1. 项目目标与边界

### 1.1 产品目标

Mojobox 是 DSH 功能整合包的目录与分发仓库，目标是打通以下链路：

```text
审阅来源 -> 形成官方 Feature Pack v1 描述 -> 生成真实 .dshpack
-> 生成 packs-index.json -> 网站展示/下载 -> 官方桌面 Host 读取
-> Feature Pack CLI 安装 -> 隔离 Profile 验收 -> 公网发布
```

Mojobox 负责：

- 包描述、来源和版本记录；
- 清单结构校验；
- 真实归档的构建与 SHA-256；
- 市场索引；
- 静态目录和下载入口；
- 与官方宿主格式对齐的发布事实。

官方桌面 Host / Feature Pack CLI 负责：

- 读取市场索引；
- 下载、校验和解析 `.dshpack`；
- 检查本机内核、插件、冲突和 Profile 状态；
- 进行用户确认、安装、重复安装保护、文件锁排队和宿主事务。

### 1.2 明确不做

当前 MVP 不做以下事情：

- Mojobox 自己实现插件安装器、依赖解析、快照、回滚或 Profile 管理；
- 新建 EAC 专属安装协议、bridge、sidecar RPC 或浏览器深链接；
- 把 Mojobox legacy Pack/Lock/归档自动转换为 EAC Feature Pack；
- 把两个同后缀但不同语义的 `.dshpack` 格式混用；
- 公开外观包、皮肤、壁纸和挂件；
- 账号服务、完整环境迁移、Preset/Profile 包；
- 在没有真实来源和真实运行证据时生成索引或签发 Evidence。

## 2. 当前代码与分支状态

### 2.1 Mojobox 仓库

- 路径：`<workspace>/dsh-mojobox`（本机路径已脱敏）
- 分支：`feat/mojobox-foundation`
- 最近相关提交：
  - `e9e989d feat(mojobox): 收敛 MVP 边界并补齐功能包基础`
  - `5a42dd4 docs(mojobox): 记录首个候选包格式核验结果`
  - `d1effab feat(mojobox): 添加 EAC 聚合包 Feature Pack 草稿`
  - `51b48fc docs(mojobox): clarify feature pack candidate gate`
- 当前工作区：干净。

本仓库 `npm test` 当前结果：

```text
73 tests
72 passed
1 skipped
0 failed
```

跳过项是 Windows 文件符号链接需要特权，不是本次功能失败。

### 2.2 外层 EAC 仓库

- 路径：`<workspace>`（本机路径已脱敏）
- 分支：`feat/mojobox-host-resources`
- 相关提交：`ad4e8c31 feat(packaging): 纳入 Feature Pack 宿主资源`
- 定向资源契约测试：`7/7 passed`
- 外层工作区有用户已有的未跟踪内容，不能删除或清理：
  - `.pnpm-store/`
  - `.tmp-kernel-build/`
  - `dsh-mojobox/`
  - `tauri-shell/sidecar/phone-bridge.js`
  - `tauri-shell/sidecar/rescue-integration.js`

资源提交做了两件事：

- 把 `feature-pack.js` 纳入 `tauri-shell/stage-resources.mjs` 的桌面库清单；
- 把 `feature-pack-cli.js` 纳入脚本清单，并同步资源完整性测试。

这只证明“代码清单已纳入”，还不等于完整安装树已经生成并可发布。

## 3. 已确认的候选输入

### 3.1 原始上游候选

来源：`https://github.com/BAIKAI23333/END-EAC-on-Deespeek-desktop`

固定信息：

| 项目 | 值 |
| --- | --- |
| tag | `v1.1.0` |
| commit | `7eec9741f3f2491c6e33ed56c5e1fd3bd588bc1f` |
| Release asset | `dsh-eac-desktop-pack-1.1.0.tgz` |
| SHA-256 | `9393044bb7d501d17f7dfe8900f4432366ea0560c21ff640a2262681ab5718c6` |
| 识别结果 | `@dsh-eac/desktop-pack@1.1.0` npm 聚合包 |
| 内容特征 | 12 个 EAC 插件、`dsh-plugin.json`、`cordis.patch.yml`、`node_modules` |
| 声明许可证 | MIT |
| 目标内核 | `0.1.7-rc.2` |

### 3.2 为什么原始候选不能直接发布

它的根清单是 npm `package.json`，没有 Feature Pack v1 所需的：

- `formatVersion: 1`；
- Feature Pack 根 `pack.json`；
- `plugins[].ref` 声明；
- 与归档对应的 `packs-index.json` 条目。

它还携带插件包内部的 `node_modules`、`cordis.patch.yml` 和 `dsh-plugin.json`。这些文件属于 DSH 插件包 / 官方插件管理语义，不是 Mojobox 市场索引的顶层安装契约。

因此不能执行以下操作：

- 把 `.tgz` 改名成 `.dshpack`；
- 在归档外面包一层 `pack.json` 就声称格式转换完成；
- 把原始 tgz 的 SHA-256 当作 Feature Pack 归档摘要；
- 在 Mojobox 中隐式下载 tgz、解析其内部成员并重写成另一种安装语义。

### 3.3 当前临时描述包

路径：

```text
candidates/feature-packs/dev.dsh-eac.desktop-pack-1.1.0/pack.json
candidates/feature-packs/dev.dsh-eac.desktop-pack-1.1.0/README.md
```

清单核心内容：

```json
{
  "formatVersion": 1,
  "id": "dev.dsh-eac.desktop-pack",
  "version": "1.1.0",
  "requires": { "dsh": ">=0.1.7-rc.2 <0.1.8.0" },
  "plugins": [
    { "ref": "@dsh-eac/desktop-pack", "version": "1.1.0" }
  ],
  "overrides": []
}
```

已完成核验：

- 官方运行时 `validateManifest` 通过；
- EAC Feature Pack Schema 通过；
- `overrides` 为空；
- 内核范围、ID、版本、插件引用字段结构正确；
- 已移除 Schema 不允许的 `$schema` 元字段。

尚未满足发布条件：

- 没有真实 `.dshpack`；
- 没有归档级 SHA-256；
- 没有有效 `url`；
- 没有能被宿主解析的公开 npm 来源；
- 没有目标 Profile 安装、重启和实际功能 Evidence。

## 4. 当前阻塞及其性质

### 阻塞 A：插件来源不存在或不可解析

命令：

```text
npm view @dsh-eac/desktop-pack@1.1.0 name version dist.tarball --json
```

结果：npm registry 返回 `E404`。

含义：清单写了一个合法的 npm 名称格式，但宿主无法通过 npm registry 解析它。格式合法不等于来源存在。

解除条件必须满足至少一个：

1. 上游真的发布 `@dsh-eac/desktop-pack@1.1.0` 到可访问 registry，并能固定 tarball、版本、许可证和摘要；
2. 清单改为真实存在且符合宿主语义的 `github:owner/repo` 插件引用；
3. 如果插件属于 EAC 随包内置组件，改用实际存在的 `builtin:<assets 目录名>`，并核验宿主资源目录、插件 ID、版本和许可证；
4. 换用另一个已经公开发布、能被官方 CLI 安装并能在隔离 Profile 验收的首个候选。

不能用“本地曾经有一个 tgz”替代上述条件，因为公共索引必须让第三方和宿主在干净环境中复现同一输入。

### 阻塞 B：没有真实 Feature Pack 归档

`pack.json` 只是描述文件，不能用于：

- 计算最终下载摘要；
- 运行 `feature-pack-cli inspect` 的归档读取路径；
- 生成 `packs-index.json` 的真实 `url` 和 `sha256`；
- 完成下载、校验、安装和重启测试。

解除条件：先确定每个 `plugins[].ref` 的真实来源，再按官方 Feature Pack v1 生成 ZIP 归档。归档必须包含根 `pack.json`，可选图标或 payload，不能携带用户 Profile、凭据、本机绝对路径或未经声明的任意文件。

### 阻塞 C：宿主完整分发树尚未复验

资源代码已进入 EAC staging 清单，但：

```text
node tauri-shell/stage-resources.mjs --skip-npm
```

曾因以下缺失失败：

```text
dsh-desktop/vendor/kernel/0.1.5-rc.2/deepseek-ai-schemastery-3.18.2.tgz
```

随后按项目入口执行 `npm run fetch-kernel`。源码下载和依赖安装完成，但官方构建阶段没有生成：

```text
.dsh-build/client-build-environment.json
```

根因是本机 Node 为 `22.17.0`，而内核要求 `^22.19.0 || >=24.0.0`。在这个 Node 版本下，上游脚本使用的 `import.meta.main` 不会执行真正的构建逻辑，进程可能返回 0；后续 pack 阶段才暴露“构建记录缺失”。

解除条件：使用 Node `22.19+` 或 `24+`，按项目自己的 `npm run fetch-kernel` 重新生成内核 tarball，再重跑 staging、资源契约和实际分发树检查。不得手工补 tarball、猜摘要、修改 lock integrity 或伪造 `.dsh-build` 记录。

### 阻塞 D：没有生产安装 Evidence

即使清单和归档都通过 Schema，也只能证明结构正确，不能证明：

- 插件来源能被宿主安装；
- 内核版本范围实际满足；
- 12 个功能在 EAC 客户端中可用；
- 重启后插件仍生效；
- 重复安装不会覆盖用户选择；
- 单项失败不会留下错误注册表或半成品。

解除条件：固定宿主版本、内核版本、操作系统和架构，在新的隔离 home/profile 执行首次安装、重启、重复安装、禁用状态保留和失败路径检查。

## 5. 方案比较

### 方案 1：继续等待并发布 npm 聚合包引用

做法：上游先把 `@dsh-eac/desktop-pack@1.1.0` 发布到 registry，Mojobox 保持当前 `plugins[].ref`，再生成官方 `.dshpack`。

优点：

- 对现有描述包改动最小；
- 版本和来源表达直观；
- 后续版本可以沿用 npm 发布流程。

风险：

- 当前包并未发布，时间不可控；
- npm 聚合包是否符合官方 Feature Pack CLI 的插件安装和 bundle 语义仍需实测；
- 包内 12 个成员的许可证、来源、插件声明必须全部可追溯；
- 如果上游发布的是普通 npm 压缩包而不是可被 `dsh plugin add` 接受的插件包，问题仍未解决。

适用条件：上游明确承诺 registry 发布、稳定版本、可审计 tarball，并提供官方 CLI 安装验收。

### 方案 2：改为 `builtin:` 引用 EAC 内置插件

做法：把 12 个实际存在于 EAC `assets/plugins/` 的插件逐一写入 `plugins[].ref`，例如 `builtin:<目录名>`，由宿主只校验并登记，不重复下载。

优点：

- 适合 EAC 自带插件，避免错误地把本地内置组件当成 npm 公共包；
- 安装来源由目标桌面分发树控制，版本和文件在同一发布物内；
- 不需要将不存在的 npm 包写入公共索引。

风险：

- Feature Pack 会与特定 EAC 分发树强绑定；
- 必须核对每个目录名、插件 ID、版本、许可证和 bundle 声明；
- 宿主升级或资源清单改变时，包兼容性需要重新验收；
- 如果这些插件实际上不是 EAC 内置资源，不能硬套 `builtin:`。

适用条件：12 个插件确实随 EAC 分发，宿主的 `builtin` 解析路径稳定，并且上游愿意把 EAC 作为发布宿主。

### 方案 3：拆成真实可发布的 GitHub/npm 插件引用

做法：不引用聚合 tgz，而是让 `pack.json` 逐一列出真实公开的插件来源和版本范围。

优点：

- 每个插件来源更透明；
- 单个插件可以独立升级和审查；
- 能避免聚合包内部 `node_modules` 与宿主安装器语义混在一起。

风险：

- 12 个来源可能不是同一组织维护；
- 需要处理版本、许可证、冲突和重复依赖；
- 网络安装不等于完整离线可复现，需固定宿主锁定和失败行为；
- 如果插件没有真实公开发布物，拆分只是把阻塞分散，不能消除阻塞。

适用条件：每个成员插件都有稳定 GitHub/npm 来源，且官方 CLI 对这些来源有明确安装支持。

### 方案 4：在 Mojobox 内实现 tgz 到 Feature Pack 的桥接

做法：Mojobox 读取旧 tgz，重写清单、复制成员、生成新的归档并提供另一套安装逻辑。

结论：**当前不推荐，且违反已确定边界。**

原因：

- 会让 Mojobox 复制宿主安装器和依赖解析职责；
- 会造成两个 `.dshpack` 语义之间的隐式转换；
- 无法仅凭压缩包证明 bundle、快照、试启动、回滚和用户数据语义等价；
- 将来上游格式变化时，桥接层会成为额外兼容负担；
- 当前目标是验证 MVP 真实用户链路，不是建立新的包协议。

### 推荐顺序

优先级建议：

1. 先询问上游能否提供真实 Feature Pack 来源或正式发布 npm 包；
2. 若插件确属 EAC 内置资源，优先评估方案 2；
3. 若成员插件各自公开，评估方案 3；
4. 如果以上都不成立，暂停该候选，换一个已有真实 Feature Pack 的包；
5. 不采用方案 4。

## 6. 推荐发展路线

### 路线 A：最小可交付 MVP（推荐）

目标：先证明 Mojobox 能发布一个真实、可安装、可验收的 Feature Pack，而不是强行发布指定的聚合包。

步骤：

1. 使用 Node `22.19+` 或 `24+` 完成 EAC 内核缓存和 staging 复验；
2. 向上游确认当前 12 个插件的真实公开来源和安装入口；
3. 如果 `desktop-pack` 不可公开解析，寻找一个规模更小、来源已公开的功能包作为首个生产候选；
4. 生成官方 Feature Pack v1 `.dshpack`；
5. 运行官方 CLI `inspect` / `plan`，确认清单和宿主兼容性；
6. 在隔离 Profile 安装、重启、重复安装和失败路径验收；
7. 由同一份包元数据生成 `packs-index.json` 和网站展示数据；
8. 做真实 HTTP 下载并重新计算 SHA-256；
9. 通过后才进入发布流程。

成功标准：至少一个包完整走通“索引 -> 下载 -> 校验 -> 宿主安装 -> 重启可用”。

### 路线 B：先做 EAC 内置聚合包

目标：将 EAC 自带的 12 个插件明确建模为 `builtin:` Feature Pack。

前置判断：

- 12 个插件是否全部存在于当前 EAC 分发资源；
- 目录名是否稳定且可由宿主解析；
- 插件 ID、版本和许可证是否可以逐项审计；
- `builtin:` 安装是否需要复制文件，还是只登记已存在资源；
- 客户端升级后内置资源变化时，旧包如何标记不兼容。

如果任一前置无法证明，不应只因为“它们随桌面端存在”就自动视为 `builtin` 包。

### 路线 C：等待上游正式 npm 发布

目标：保持当前薄描述包，等待上游发布正式 npm artifact。

需要上游补齐：

- registry 名称和可访问性；
- 公开版本与 dist.tarball；
- npm 包内真实 `package.json`、插件声明和许可证；
- `dsh plugin add` 或 Feature Pack CLI 的安装测试；
- 与 `requires.dsh` 一致的目标内核版本；
- 包内是否包含不应进入市场包的用户配置或预构建文件。

在这些内容没有交付之前，Mojobox 只能保留候选描述，不能推进索引。

## 7. 分阶段验收门槛

当前工作按 6 个阶段管理：

| 阶段 | 目标 | 当前状态 | 下一步可验证条件 |
| --- | --- | --- | --- |
| 1 | 宿主资源复核 | 代码和定向测试完成，完整 staging 被内核缓存/Node 阻断 | Node 升级后 `fetch-kernel`、staging、资源完整性通过 |
| 2 | 首个功能包核验 | 描述包结构通过，真实来源阻断 | 来源可解析、归档可生成、摘要可固定 |
| 3 | 索引接入 | 未开始 | 有真实 `.dshpack`、固定 URL/SHA-256 后生成索引 |
| 4 | 目录展示 | 未开始 | 网站与索引使用同一 ID/版本/URL/SHA-256 |
| 5 | 隔离安装验收 | 未开始 | 安装、重启、重复安装、失败路径均有真实输出 |
| 6 | 发布与公网下载 | 未开始 | 静态站部署后 HTTP 下载摘要与索引一致 |

### 不得提前宣称完成的事项

- Schema 通过 != 来源存在；
- `pack.json` 存在 != 有 `.dshpack`；
- GitHub Release 存在 != 宿主可安装；
- npm 包身份存在 != Feature Pack 安装成功；
- 资源清单纳入 != 安装树完整；
- 本地 smoke 通过 != 生产包功能和重启可用；
- 网站能展示 != 公网发布和摘要校验完成。

## 8. 建议审查模型执行的检查

### 8.1 输入和格式

1. `pack.json` 是否完全符合 `docs/schemas/feature-pack-pack.json`？
2. 是否存在 Schema 之外的字段、路径穿越、非空 `overrides` 或隐式 payload？
3. `id`、版本、内核范围和插件引用是否能在宿主实现中得到同样解释？
4. 归档内是否只有声明允许的文件？

### 8.2 来源和供应链

5. `plugins[].ref` 是否能在干净环境中解析？
6. 每个插件的来源、精确版本、许可证、包名和 artifact 摘要是否可追溯？
7. 旧 tgz 是否被错误地当成了 Feature Pack？
8. 任何 URL、SHA-256 或版本是否由猜测、复制旧值或本机缓存产生？
9. 归档是否偷偷携带 `node_modules`、`cordis.patch.yml`、用户配置、凭据或本机绝对路径？

### 8.3 宿主安装和数据安全

10. 宿主安装前是否只读检查，是否会意外初始化或修改日常 Profile？
11. 同版本重复安装是否 no-op？
12. 用户已禁用插件时，安装是否保留禁用状态？
13. `file:`、`link:`、fork 或用户自建插件是否被错误覆盖？
14. 文件锁、单项失败和重启中断时，是否会留下错误注册表或半安装状态？
15. 包声明的 `requires.dsh` 是否与实际目标内核和预发布版本比较规则一致？

### 8.4 发布一致性

16. 网站、`packs-index.json`、归档内 `pack.json` 是否使用同一个 ID、版本、URL 和摘要？
17. 摘要是否来自最终发布字节，而不是源 tgz 或清单摘要？
18. 重复构建是否可复现，ZIP 路径和时间是否稳定？
19. 离线快照和远端索引的失败策略是否明确？
20. 公开文档是否清楚说明两个 `.dshpack` 格式不能互换？

## 9. 建议给上游的最小问题清单

可以直接把下面的问题发给 `END-EAC-on-Deespeek-desktop` 上游：

1. `@dsh-eac/desktop-pack@1.1.0` 是否计划发布到 npm？如果是，registry、包版本和发布日期是什么？
2. 当前 GitHub `.tgz` 是否只是内部聚合包，还是可以作为官方 `dsh plugin add` 的安装输入？
3. 12 个成员插件的真实包名、版本、来源、许可证和 `dsh-plugin.json` 是否可以逐项公开核对？
4. 你们希望 Feature Pack 使用一个聚合插件引用，还是逐项引用 12 个插件？
5. 如果插件随 EAC 分发，是否应使用 `builtin:`，对应的实际 `assets/plugins` 目录名是什么？
6. 目标内核是 `0.1.7-rc.2` 还是其他精确版本？为什么描述包写的是 `>=0.1.7-rc.2 <0.1.8.0`？
7. 是否有官方 Feature Pack v1 `.dshpack` 示例、归档 URL 和 SHA-256？
8. 是否已在干净 EAC Profile 中完成安装、重启和重复安装测试？
9. 是否包含外观、壁纸、挂件或用户级配置？如果包含，应拆出当前 MVP 不公开的部分。
10. 许可证、NOTICE 和第三方依赖声明是否覆盖聚合包内的全部成员？

## 10. 可复现命令

### Mojobox

```powershell
cd <workspace>/dsh-mojobox
npm test
npm run build
git diff --check
```

描述包 Schema 校验（在 Mojobox 目录执行）：

```powershell
node --input-type=module -e "import Ajv from 'ajv'; import schema from '../docs/schemas/feature-pack-pack.json' with {type:'json'}; import fs from 'node:fs'; const p=JSON.parse(fs.readFileSync('candidates/feature-packs/dev.dsh-eac.desktop-pack-1.1.0/pack.json','utf8')); const v=new Ajv({allErrors:true}).compile(schema); console.log(JSON.stringify({valid:v(p),errors:v.errors},null,2));"
```

真实归档出现后才允许执行：

```powershell
npm run inspect:pack -- <archive.dshpack>
npm run host:pack -- plan <archive.dshpack> --home <隔离DSH_HOME> --profile <隔离profile>
```

### EAC 宿主

在使用 Node `22.19+` 或 `24+` 后：

```powershell
cd <workspace>/dsh-desktop
npm run fetch-kernel
cd ..
node tauri-shell/stage-resources.mjs --skip-npm
node --experimental-strip-types --test dsh-desktop/test/bundled-files.test.ts
```

不要在 Node `22.17.0` 下把 `fetch-kernel` 的 0 退出码当作成功；必须检查 `.dsh-build/client-build-environment.json`、`vendor/kernel/0.1.5-rc.2/*.tgz` 数量和 staging 输出。

## 11. 当前推荐决策

在收到额外模型审查前，建议维持以下决策：

1. 保留当前分支和候选描述包，不生成生产索引；
2. 优先解决 Node 版本和内核 staging，这是独立于包来源的宿主基础问题；
3. 向上游索要真实 registry/GitHub/builtin 来源，拒绝只提供一个 npm 聚合 tgz；
4. 如果上游短期无法提供可解析来源，换一个已发布且可安装的功能包作为首个 MVP 包；
5. 只有真实 `.dshpack`、最终 SHA-256、隔离 Profile 验收都具备后，才进入索引、网站和发布阶段；
6. 不新增 Mojobox 到 EAC 的格式桥接，不复制宿主安装事务。

## 12. 审查输出格式建议

额外模型审查后，建议要求它用以下格式返回：

```text
可行性结论：可行 / 有条件可行 / 当前不可行

必须保留的边界：
- ...

发现的事实错误或遗漏：
- 文件、命令或证据：...

推荐路线：
- 方案：...
- 原因：...

必须补齐的前置条件：
- ...

不能接受的实现：
- ...

最小验收集：
- ...

发布阻断项：
- ...
```

审查模型如果无法证明某个来源、摘要、安装结果或上游行为，应将其标为“未知/待证实”，不要把推测写成已完成事实。
