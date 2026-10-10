# Mojobox MVP 开发边界与计划

> 历史归档：记录一键安装优先方案，已经被收纳优先的项目路线取代。
> 当前执行规范见 [收录规范](../intake.md) 与 [项目路线](../project-positioning-and-roadmap.md)。

> 2026-09-30 用户调整：先做 Mojobox 收纳、检验、展示、下载框架，再适配整合包，最后搭载测试。
> 当时调整见 [收录规范](../intake.md) 和 [实施计划](implementation-plan.md)。
> 下文为上一轮一键安装 MVP 基线，保留历史背景；宿主 staging、来源发布和安装验收不再阻塞框架开发。

本文是当前 Mojobox MVP 的开发基线。它覆盖“目录可看、功能和外观整合包可收录、宿主可一键安装”这条最短可用链路；与旧版 Mojobox 自定义 `.dshpack` 设计冲突时，以本文为准。

## 1. 产品定义

Mojobox 是 DSH 插件、功能整合包和外观整合包的目录与分发仓库：

- 目录网站展示包名、说明、版本、来源、兼容范围、下载地址和 SHA-256；
- 维护者发布经过审阅的功能整合包和市场索引；
- 宿主侧 Host 插件读取同一索引，完成校验、下载和一键安装；
- Mojobox 不读取本机环境，不修改 Profile，不执行插件，不承担安装事务。

第一版同时面向功能整合包和外观整合包。外观包与皮肤包指同一类 `appearance` 内容，
表示对客户端样式或整体外观进行修改。

## 2. 明确不做

当前阶段不做：

- EAC 专属新协议、UI、bridge、sidecar 或安装事务；
- Mojobox 自己实现插件安装器、快照、回滚或 Profile 管理；
- 浏览器直接修改桌面客户端；
- Profile、Preset、完整环境迁移和账号服务；
- 完整传递依赖离线闭包；
- Pack 升级迁移、多版本索引和自动升级策略。

宿主已有的 Feature Pack 安装能力可以复用，但不再扩展 EAC 业务能力。

## 3. 两层格式边界

### 3.1 MVP 安装格式

MVP 使用宿主已经实现的 Feature Pack v1：

- 根清单为 `pack.json`；
- 使用 `formatVersion: 1`；
- 组件通过 `plugins[].ref` 声明；
- 可选 `payload/presets` 和 `payload/skills`，本阶段不使用；
- 市场索引为 `packs-index.json`，每项至少包含 `id`、`name`、`version`、`url` 和 `sha256`。

宿主实现位于官方桌面仓库的 `dsh-unified-market`、`feature-pack-cli.js` 和 `feature-pack.js`。Host 插件只做市场 UI、索引读取和操作编排，安装核心由宿主 Feature Pack CLI 执行。

### 3.2 Legacy 格式

当前 `packs.mojobox.dev/v1alpha1`、Pack Lock 和 `objects/sha256/` 归档链路保留为 legacy：

- 不作为 MVP 的宿主安装输入；
- 不删除已有 Schema、fixture 和测试；
- 不再围绕它扩展新的宿主桥接；
- 后续确认没有消费者后再决定是否清理。

两种格式不能通过扩展名区分，也不能静默互转。目录数据必须标明实际安装格式。

## 4. 宿主前置条件

第一版的一键安装定义为：用户已经安装 Host 插件后，在宿主的“功能包市场”内点击一次安装。

首装 Host 插件仍是单独步骤。浏览器目录第一版只负责浏览和下载，不承诺从普通网页直接启动或修改桌面客户端。

现有宿主原型已经提供：

- `pack.market` 市场索引读取；
- `pack.inspect` 归档检查；
- `pack.install` 一键安装；
- 安装进度、失败结果、文件锁排队和重复安装保护。

宿主资源装配已在 EAC 仓库 `feat/mojobox-host-resources` 的 `ad4e8c31` 纳入
`feature-pack-cli.js` 和 `feature-pack.js`，定向资源契约测试已通过；完整 staged 分发树仍待
补齐锁定内核 tarball 后复验。

## 5. 第一个正式 Pack

用户指定的 `BAIKAI23333/END-EAC-on-Deespeek-desktop` 作为首个候选功能整合包。它在完成以下核验前只能标记为候选，不写入生产索引：

1. 获取明确的 release、tag 或 commit；
2. 确认它是功能插件集合，不包含样式/皮肤载荷；
3. 确认 `pack.json` 符合 Feature Pack v1；
4. 确认每个插件引用、版本、来源和许可证；
5. 生成发布归档并计算真实 SHA-256；
6. 在目标官方桌面版本的隔离 Profile 完成一次安装和重启验证。

不以 GitHub 仓库页面存在、Schema 通过或下载成功代替实际安装证据。

## 6. Mojobox MVP 事实源

- 插件事实：`catalog/plugins/*.json`；
- MVP 功能包元数据：新增或调整为宿主 Feature Pack 对应的 Pack 记录；
- 市场索引：由构建脚本从已审阅 Pack 和真实归档生成；
- 归档摘要：来自最终发布文件的 SHA-256；
- 网站数据：只消费生成后的 Catalog 和索引；
- 生成物：`site/public/generated/`、`dist/` 和缓存不手工编辑。

MVP 不要求网站和宿主使用两套独立的包列表。目录展示和宿主安装必须引用同一包 ID、版本、URL 和摘要。

## 7. 最短开发顺序

1. 冻结 legacy Mojobox Pack 安装链路，补本文和入口文档。
2. 确定 Host 插件资源已进入目标桌面分发，并补资源完整性测试。
3. 读取并核验首个外部功能整合包，生成宿主格式 Pack 和归档。
4. 生成 `packs-index.json`，接入 Host 插件的远端索引；保留离线空快照兜底。
5. 让目录网站展示同一 Pack，并提供下载和 SHA-256。
6. 在隔离 Profile 验证：安装、重启生效、重复安装、失败不留半成品。
7. 完成静态站部署和一次真实下载校验。

## 8. MVP 完成标准

- 网站能展示首个功能整合包及其真实版本、来源和摘要；
- 宿主市场能读取同一索引并一键安装；
- 安装使用宿主既有 Feature Pack CLI，不复制一套安装逻辑；
- 安装失败、文件锁和重复安装有明确结果；
- 安装后目标功能在重启后的官方桌面端可用；
- 外观包按同一收录链路发布，EAC 新适配或复杂迁移不阻塞当前发布；
- `npm test`、构建、归档检查、宿主隔离安装和公网下载均有实际结果记录。
