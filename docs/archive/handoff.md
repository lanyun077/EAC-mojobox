# Mojobox 本体建设交接（2026-09-23）

> 历史归档：记录早期 legacy 建设和当时环境，不作为新会话的执行指令。
> 当前规范见 [文档索引](../README.md)；本文的分支、进度和命令仅代表当时状态。

> **历史交接说明**：本文记录 2026-09-23 的 legacy Mojobox 本体建设，不是当前 MVP 的安装
> 方案。当时边界、宿主格式和开发顺序参见 [MVP 开发文档](mvp-development.md) 和
> [MVP 实施计划](implementation-plan.md)。本文中的自定义 Pack/Lock、实验 CLI 和 EAC
> Adapter 结论保留作历史背景，不应作为新功能的默认入口。

本文交接一次连续会话的全部成果，供下一个会话或维护者直接接续。事实以仓库当前工作区为准，
不把计划写成已完成项。

## 1. 仓库与分支

| 项目 | 值 |
| --- | --- |
| 远端 | `https://github.com/DSH-EAC/dsh-mojobox` |
| 本地路径 | `<workspace>/dsh-mojobox`（本机路径已脱敏） |
| 分支 | `codex/mojobox-core-foundation`（本次新建，基于 `main`） |
| 起始 revision | `d76f5ea78f36ba8c1e862574ea09de02398fffd9` |
| 状态 | 全部改动未提交、未推送、未创建 PR、未部署 |

该目录被父仓库 `<workspace>` 视为未跟踪目录。父仓库停留在
`codex/staged-windows-artifact` 分支并有与本次无关的未提交文件，不要在那里混入 Mojobox 改动。

## 2. 本次目标

用户要求：**先做好 Mojobox 本体**，让后续参与者能持续往里添加整合包；功能包优先维护，
外观包延后但保留位置；不要过度防御性编程和过度工程化。

据此确定的本体边界：

- 贡献者增加一个功能包，无需修改网站或安装业务代码，即可完成锁定、校验、生成、展示和下载。
- 外观包保留协议位置和源数据，当前不公开分发，未来复用同一条链路。
- Mojobox 负责描述、校验、锁定、分发和读取；插件安装归宿主，不自行实现包管理器。

## 3. 交付产物

### 3.1 新增文件

| 路径 | 作用 |
| --- | --- |
| `distribution.json` | 公开分发范围的唯一开关，当前 `packCategories: ["function"]` |
| `evidence-suites.json` | 固定历史 suite 的 ID、版本、真实摘要和 commit 源码坐标 |
| `scripts/lock-pack.mjs` | 离线生成 Pack Lock（精确版本、Manifest 真实字节摘要、目录 artifact 摘要） |
| `scripts/inspect-pack.mjs` | 只读检查 `.dshpack`：格式、组件集合、来源、对象摘要、ZIP 路径 |
| `adapters/official-cli.mjs` | 官方 DSH CLI 薄接入：只读计划 + 显式确认安装 |
| `scripts/official-cli.smoke.mjs` | 隔离 home 下的可复现宿主安装冒烟脚本 |
| `.github/workflows/check.yml` | PR 校验 + 构建 + 归档独立读取，无部署权限 |
| `docs/pack-format.md` | Pack/Lock/归档/生成目录字段说明与新增包示例 |
| `docs/host-adapter.md` | 宿主差异核实、接入顺序、计划约定、实验接入与验收口径 |
| `docs/deployment.md` | 根路径与子路径构建、发布要求、缓存与代理说明 |
| `docs/implementation-plan.md` | 阶段状态、后续顺序、验收口径 |
| `scripts/*.test.mjs`（7 个） | 构建、发布筛选、Lock、检查器、宿主接入、网站、validator 回归 |
| `fixtures/valid/plugin-official-patch-string.json`、<br>`fixtures/valid/plugin-official-patch-list.json`、<br>`fixtures/invalid/plugin-official-patch-list-non-string.json` | 官方 patch 字段正反例 |

### 3.2 修改文件

| 路径 | 改动 |
| --- | --- |
| `package.json` / `package-lock.json` | 新增 `lock:pack`、`inspect:pack`、`host:pack` 脚本与 `yauzl`、`tar-stream` 依赖 |
| `scripts/validate.mjs` | 文件名与 ID 一致、重复 Pack/Lock 组件、Evidence 与历史 suite 解耦 |
| `scripts/build-site.mjs` | 按发布策略筛选 Pack/Manifest/归档、Evidence 仅关联当前版本、归档大小与摘要、构建前校验 |
| `schemas/official-package-metadata.schema.json` | `dsh.bundle.patch` 支持字符串或有序字符串列表 |
| `spec-revisions.json` | 新增 `officialHarness.packageManifest.patchList` 固定坐标，未覆盖原基线 |
| `site/src/main.js`、`site/src/styles.css` | 移除未经验证的深链入口、展示归档大小/摘要/组件来源、Evidence 状态过滤、搜索包说明、组织地址 |
| `README.md`、`CONTRIBUTING.md`、`docs/architecture.md`、`docs/agent-guide.md`、`AGENTS.md` | 与新流程、新边界、实际验证范围对齐 |
| `catalog/packs/dev.mojobox.focus-kit.pack.json`、`catalog/packs/dev.mojobox.windows-operator.pack.json` | 补充明确的 `category: function` |
| `.github/workflows/pages.yml` | 发布前增加归档独立校验 |

### 3.3 生成物（不提交）

`site/public/generated/`、`dist/`、`.cache/` 均可重建。当前构建输出：13 条公开插件记录、
3 个功能包及对应 `.dshpack`，每个归档带 `archiveUrl`、`archiveSize`、`archiveDigest`。

## 4. 关键设计决策

1. **发布策略与协议分离。** Schema 保留 `function`、`appearance`、`workflow` 三种分类，
   公开范围由 `distribution.json` 决定。停用类型时目录和下载一起排除，不只是隐藏页面。
2. **历史证据不再跟随 validator 漂移。** 原实现要求 Evidence 的 suite 摘要等于当前
   `validate.mjs` 字节，导致改校验逻辑就作废旧证据。现由 `evidence-suites.json` 固定历史输入，
   旧组件版本记录保留但构建不再关联，当前版本摘要错误仍然拒绝。
3. **Lock 由工具生成。** 贡献者不再手工计算摘要；`lock:pack` 离线、不联网、不升级组件、
   不签发 Evidence。artifact 摘要来自已审阅目录，实际下载字节由构建验证。
4. **`.dshpack` 增加独立读取链路。** `inspect:pack` 不依赖源 Catalog、不联网、不解压、不执行
   插件，JSON 单文件限 1 MiB，大对象流式计算摘要。PR 与部署前都会实际读取最终产物。
5. **宿主接入只做薄适配。** 计划直接读取 Profile 与已装 `package.json`，不调用会初始化环境的
   `dsh plugin list`；安装调用官方 CLI，不自建依赖解析或回滚。
6. **不静默转换格式。** Mojobox 与 EAC 的 `.dshpack` 同后缀不同格式，界面和文档都明确说明。

## 5. 验证结果

### 5.1 自动化（`npm test`）

**73 项，72 通过、1 跳过**（跳过项为 Windows 文件符号链接需要特权）。

覆盖：发布范围过滤贯穿目录与下载、归档可复现、归档摘要对应真实字节、检查器对损坏与非约定
输入的拒绝、历史 suite 与当前 validator 解耦、Lock 生成与路径保护、贡献闭环（临时目录中新增
Pack 无需改业务代码即可锁定、发布、检查）、网站渲染与下载链接、官方 CLI 计划与保护。

### 5.2 构建

- `npm run build` 与 `BASE_PATH=/dsh-mojobox/ npm run build` 均成功。
- 连续两次构建归档摘要一致；ZIP 路径与结构经独立检查。
- 3 个真实归档 `inspect:pack` 全部通过（`structure-and-digests`）。
- 上一轮额外做过本地 HTTP 实际下载，3 个归档的状态码、字节大小、SHA-256 与目录一致，
  公开目录中无外观包。

### 5.3 宿主接入（隔离实测）

通过 `scripts/official-cli.smoke.mjs`，在 `.cache/official-smoke-*` 新建的专用 home 中完成：

- 只读计划不修改 Profile；
- 从归档提取并复核 tarball 内真实 `name`/`version` 与 bundle 声明后，官方 CLI 安装成功；
- 官方宿主登记为 Profile Bundle；
- 重复安装为 no-op，不写盘；
- 手动禁用后再次安装保持禁用；
- 新进程执行隔离 Profile 的 `--dump-config` 成功。

实际通过组合：Node 24.19.0、官方 `@deepseek-ai/dsh` 0.1.7-alpha.1、pnpm 11.7.0、Windows x64。

### 5.4 未验证

- 三个生产功能包的真实安装。它们声明 `host.snapshot`、`host.trial-boot`，官方 CLI 不提供，
  适配层按设计阻断，没有为“跑通安装”删除这些要求。
- 生产组件在客户端的实际功能与重启后表现。
- EAC UI / 市场的接入。
- 浏览器桌面与窄屏视觉验收（本次环境浏览器工具不可用）。
- Linux、macOS 与其他宿主。
- 部署与公网下载校验。

## 6. 已核实的上游事实

| 对象 | 结论 |
| --- | --- |
| 官方 `dsh.bundle.patch` | `dsh-v0.1.7-alpha.1`（`c36a83ff…`）类型为字符串或有序字符串列表，已增量适配 |
| 官方插件管理 | 0.1.6-alpha.2 起提供插件安装页、运行时启停与卸载；`plugin` 命令转发给 Profile 目录下的 pnpm |
| 官方 CLI 运行时 | 需要 Node 22.19+ 或 24+；Node 22.17 缺少 `import.meta.main`，会退出 0 但不执行命令 |
| 本地 tgz 安装 | Profile 的 `package.json` 保留 `file:` 来源，pnpm lock 记录 tarball 路径与完整性，安装后不能删除源文件 |
| EAC 当前格式 | 固定 commit `e7da2db3…`：顶层 `formatVersion: 1` + `plugins[].ref` + 可选 payload，与 Mojobox 不兼容 |
| EAC CLI | 命令分派前会初始化 Profile 与保护中心，其 `inspect` 不是无副作用诊断 |
| Mojobox 仓库 | 已发布官方元数据投影与包分类；`has_pages` 仍为 false |

## 7. 已知问题与风险

1. **生产包与官方 CLI 接入暂不互通。** 三个包都要求快照/试启动能力，官方 CLI 没有该能力，
   计划阶段即阻断。需要决定是实现对应宿主能力，还是调整包的声明与验收口径。
2. **同名 `.dshpack` 冲突。** 与 EAC Feature Pack 同后缀不同格式，用户容易误判。网站与文档
   已标注，但没有改版版本号或改名。
3. **归档不是完整离线包。** 只包含 Lock 指定的组件，传递依赖未纳入，断网安装未验收。
4. **插件可能没有 bundle 声明。** tarball 内缺少 `dsh.bundle.patch` 时只是普通依赖，不会成为
   Profile Bundle 层。展示元数据不等于已适配官方 bundle。
5. **不支持升级替换。** 同版本保留、不同版本或外部本地来源阻断，尚无版本迁移路径。
6. **目录单版本制。** 每个稳定 ID 只保存一个版本，发布历史依赖 Git 与版本产物。
7. **坐标未同步。** `spec-revisions.json.eacUpstream` 与两条 `dev.eac.*` 插件记录仍指向旧的
   `lanyun077` 地址；该字段不被 validator 消费，属遗留记录，尚未改动。
8. **未提交。** 所有改动仍在工作区，没有 commit、push、PR 或部署。

## 8. 下一步建议

1. 决定生产包的宿主能力策略：要么在宿主侧提供快照与试启动，要么明确这三个包只面向具备该
   能力的宿主，并为官方 CLI 准备不含该要求的独立包。
2. 选一个不含 `hostCapabilities` 要求的小型功能包，走完整链路：构建 → 下载 → `inspect:pack`
   → `host:pack plan` → 安装 → 实际功能 → 重启 → 重复安装，再决定是否签发 Evidence。
3. 需要“在 EAC 市场点击安装”时，在 EAC 的 `parsePackZip` 边界识别 Mojobox 格式，复用其
   现有安装执行链；不要用字段转换伪装等价。
4. 完成浏览器桌面与窄屏验收后部署静态目录，并校验公网目录与全部归档链接。
5. 视需要同步 `eacUpstream` 坐标并清理旧地址引用。

## 9. 常用命令

```bash
npm ci
npm test
npm run lock:pack -- catalog/packs/<id>.pack.json
npm run build
npm run inspect:pack -- dist/generated/downloads/<id>-<version>.dshpack
npm run host:pack -- plan <archive.dshpack> --home <绝对DSH_HOME> --profile <已有profile>
npm run host:pack -- install <archive.dshpack> --home <绝对DSH_HOME> --profile <已有profile> --cli <绝对dsh/lib/bin.js> --confirm
node scripts/official-cli.smoke.mjs <绝对dsh/lib/bin.js>
git diff --check
```

## 10. 环境注意事项

- 本机默认 Node 为 22.17.0，不满足官方 CLI 0.1.7-alpha.1；隔离测试使用
  本机工具运行时提供的 `node.exe`（24.19.0，本机路径已脱敏）。
- npm 默认缓存目录曾出现 `EPERM`，可用 `npm --cache .cache/npm` 规避；不要把缓存写进仓库。
- `git clone` 使用 schannel 曾报 `SEC_E_NO_CREDENTIALS`，加 `-c http.sslBackend=openssl` 可成功。
- 无凭据访问 GitHub API 会遇到限流，且 `raw.githubusercontent.com` 时常超时，可改用
  `api.github.com` 的 contents API 取 Base64 内容。
- 网络缓慢时先确认本机 7897 监听地址，仅对当前下载进程临时设置代理，不写入仓库或全局 npm 配置。

## 11. 完成定义

本轮交付可判断为：**本体链路（贡献 → 锁定 → 校验 → 构建 → 分发 → 读取 → 宿主调用）已打通并
有自动化与隔离实测覆盖；生产包运行验收、EAC UI 接入、浏览器验收与上线发布尚未完成。**
