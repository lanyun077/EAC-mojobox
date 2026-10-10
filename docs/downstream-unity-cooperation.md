# Mojobox 插件、整合包与皮肤资料供货：首轮联调提案

日期：2026-10-09。面向 `look-back-lysj/deep-seek-harness-Unity` 维护者。

本文是首轮提案的历史投递快照，下面的数量、未提交状态和内嵌协议保留当时原文，
不代表当前状态。后续交付见[第二轮记录](eac-second-batch-delivery.md)，
当前 26 条插件及消费契约见[插件来源接口 v1](plugin-source-api-v1.md)。
用户转述两轮草稿可通过，现不再要求逐批反馈；草稿认可不等于真实安装验收。

我们希望成为贵市场的资源来源：Mojobox 收纳、核对来源、保留原始发行并提供下载，贵市场决定如何导入、审核以及交给官方宿主安装。本 Issue 用于确认转换规则与共同测试，不要求立即开放全部安装。

## 1. 当前状态和分工

- 本地已有 14 个独立插件原始 npm 发行、14 个功能薄包、8 个外观薄包，以及 10 套皮肤 Prompt 资料。
- 独立插件从 3 个扩充到 14 个；核对了 npm SHA-512、实际 SHA-256、字节大小、包内身份、许可与 Bundle 声明。没有安装依赖、执行安装脚本或运行插件。
- 新插件信息卡、供货导出实现仍在 Mojobox 本地工作区，尚未提交推送，不能把 `feat/eac-supply-export` 当成已可拉取的远端。
- 下文提供了可直接使用的 npm 原始发行、已经存在的固定提交薄包、已有公开供货附件和内嵌协议样本；不要求贵方访问我们的本机文件。
- 本地新增记录的 `runtime: not-tested`、兼容未知、冲突未知都应原样保留，不是“验证可用”或作者授权背书。
- 贵方负责 MarketIndex 转换、发行资格、安装预检与确认、官方管理器调用、隔离环境运行测试和实际回执。我们不维护贵方安装器，不修改用户日常 Profile。
- 本轮不接入独立 Skill。插件自身附带的 Skill 保留在作者发行中，不拆分成另一条可安装资源。

## 2. 现在能实际拿到什么

### 2.1 已公开的供货草稿附件

此前已在 [EAC-mojobox issue #20](https://github.com/DSH-EAC/EAC-mojobox/issues/20#issuecomment-5990948165) 交付：

- [mojobox-eac-pilot-draft-20261005.zip](https://github.com/user-attachments/files/33049184/mojobox-eac-pilot-draft-20261005.zip)
- 大小：11895 字节。
- SHA-256：`16f5188a1dff4c0fa81db737a0a216d3dd55a00f9fd3bbbc6c1483c3f80e2bfa`。
- [原交付说明](https://github.com/user-attachments/files/33049192/eac-issue-20-delivery.md)。

ZIP 包含两份 supply Schema、2 条真实来源的试点清单、草稿报告、正反 fixture、使用指导和逐文件摘要清单。先校验 ZIP，再解压、核对成员原始字节；不要格式化后继续沿用原摘要。

该批只有 `dsh-better-sidebar@0.12.2` 来源和蓝色幻想 Prompt 资料，没有插件安装制品，也没有正式 receipt。`delivery-manifest.json` 只是附件清单，不能冒充 receipt。ZIP 中的规划 URL 不应请求。

### 2.2 14 个插件原始发行

点击包名即可下载作者对应精确版本的 npm 原始 `.tgz`。以下大小和 SHA-256 均来自实际字节；Mojobox 归档不会重打包、插入 wrapper 或去掉许可证。

发行关联 commit 来自发布方 npm `gitHead` 声明，不是我们证明源码与成品构建等价。下载检查只读归档，单包上限 8 MiB、解压读取上限 32 MiB；拒绝危险路径、重复成员与链接，不落盘执行内容。静态核验不是安全认证。

| 插件原始下载 | 精确版本 | 包内许可 | 字节数 | 原始 SHA-256 |
| --- | --- | --- | --- | --- |
| [`dsh-web-mobile-fix`](https://registry.npmjs.org/dsh-web-mobile-fix/-/dsh-web-mobile-fix-1.0.6.tgz) | `1.0.6` | MIT | 7201 | `1441efa3b4c814e2226ff5d947fad5e69aa36ed2bd46020b81a11513fb20c290` |
| [`dsh-context`](https://registry.npmjs.org/dsh-context/-/dsh-context-0.62.3.tgz) | `0.62.3` | Apache-2.0 | 229916 | `774b5ffabd05479a501df2c046384d47ee0cc6fe89ea13729802ae7d9178cb6a` |
| [`@changfenhuang/dsh-genui`](https://registry.npmjs.org/@changfenhuang/dsh-genui/-/dsh-genui-0.11.3.tgz) | `0.11.3` | MIT | 2666615 | `6f7de08dc584a5097e4064296dd23bbfa79a7b1af705f6b497bd99906ab1030a` |
| [`dsh-session-manager`](https://registry.npmjs.org/dsh-session-manager/-/dsh-session-manager-0.6.2.tgz) | `0.6.2` | MIT | 111812 | `2ccaa0938cdea0876962981ec76d846f3dbee8cadc01ae3f4d23183f5ea83c1c` |
| [`dsh-undo-savepoint`](https://registry.npmjs.org/dsh-undo-savepoint/-/dsh-undo-savepoint-0.4.10.tgz) | `0.4.10` | MIT | 240396 | `4f5893133bb99faadc9c976a596bb2d9b0b796aecec0de8dce9b13631c2938a5` |
| [`@nagi-ovo/dsh-visualize`](https://registry.npmjs.org/@nagi-ovo/dsh-visualize/-/dsh-visualize-0.1.4.tgz) | `0.1.4` | BSD-3-Clause | 963881 | `b489813c8774ec495c7b3707fb6e231690b180d219fb04068dd8b8f2f3540eeb` |
| [`@nanmicoder/dsh-agent-teams`](https://registry.npmjs.org/@nanmicoder/dsh-agent-teams/-/dsh-agent-teams-0.1.22.tgz) | `0.1.22` | MIT | 2099312 | `bdc19f0b017955625f3ab339a73465d7beac518df36dcd7c1b6ceb45a18f099d` |
| [`dsh-chat-import`](https://registry.npmjs.org/dsh-chat-import/-/dsh-chat-import-0.24.0.tgz) | `0.24.0` | MIT | 1139163 | `485262cea00d486c022090f565c40ccab4ed1f2835b75aef1f697ff7c56b6be0` |
| [`meow-smooth`](https://registry.npmjs.org/meow-smooth/-/meow-smooth-0.8.1.tgz) | `0.8.1` | MIT | 209108 | `42f38e0377971cbf777c7b8d211c1fc2124e43a2cbdd839c4e48fe2370204485` |
| [`dsh-soul-md`](https://registry.npmjs.org/dsh-soul-md/-/dsh-soul-md-0.9.0.tgz) | `0.9.0` | MIT | 30798 | `34e7b8ffb1e8111b50243ff50dc8943918da83607f343dd17fc749a7f5cd9c3b` |
| [`@vlln/dsh-navbar`](https://registry.npmjs.org/@vlln/dsh-navbar/-/dsh-navbar-0.4.0.tgz) | `0.4.0` | MIT | 14463 | `72886a2376c09e202a830029beb5503ce4710a9b208bacca8759c2d41a61c908` |
| [`@wxg-prc-cpg/browser-skill-dsh-plugin`](https://registry.npmjs.org/@wxg-prc-cpg/browser-skill-dsh-plugin/-/browser-skill-dsh-plugin-0.3.2.tgz) | `0.3.2` | MIT | 107246 | `3d466b7ad76a981930a2934a1f0d49e8c7e7317ef86c58831ca9aea45df9420d` |
| [`@yolk_vat-y/dsh-project-memory`](https://registry.npmjs.org/@yolk_vat-y/dsh-project-memory/-/dsh-project-memory-0.5.14.tgz) | `0.5.14` | MIT | 365127 | `1fcfc8a628e41719b3bee719bfb1dc308f2657fd4565f9e8efd68764c5bca558` |
| [`dsh-vision-router`](https://registry.npmjs.org/dsh-vision-router/-/dsh-vision-router-3.0.1.tgz) | `3.0.1` | MIT | 2187294 | `89bc152d7a7ca9a658b75cdf343297959390910be7a1f80f9eaa45b6325e9d6c` |

新增 11 个发行没有当前信息卡可逐字投影的 `package.json.dsh.compatibility.dsh` 范围，保持 `dsh: null / basis: unknown`；`engines`、peer 和其他作者兼容记录仍在包内。不能因 peer 静态比较无 mismatch 就标为运行通过。

未收录内核内置、EAC 私有包；约 49 MB 的 `dsh-univer-office@0.3.6` 超过当前单包 8 MiB 上限，也未纳入。部分现有薄包仍引用该插件，薄包可核对不等于依赖已完整供货。

### 2.3 已存在的功能和外观薄包

固定 Mojobox 提交：[`50c0bf9754ee301b3521d2a515dc1206a2708b82`](https://github.com/DSH-EAC/dsh-mojobox/blob/50c0bf9754ee301b3521d2a515dc1206a2708b82/README.md)。已逐项核对下列 22 个归档与该远端提交中的 Git blob 一致。点击名称为固定提交的原始文件地址，不是浮动 main。

它们使用 EAC Feature Pack v1：ZIP 的根 `pack.json` 声明组合，不内嵌完整插件和依赖。检查结构不表示组合已安装；也不能因为后缀为 `.dshpack` 就按 legacy Pack/Lock 解释。

| 原始薄包下载 | 目录 ID | 版本 | 分类 | 字节数 | 原始 SHA-256 |
| --- | --- | --- | --- | --- | --- |
| [DSH 团队协作包](https://raw.githubusercontent.com/DSH-EAC/dsh-mojobox/50c0bf9754ee301b3521d2a515dc1206a2708b82/artifacts/dev.dsh-eac.agent-team-base-0.2.0.dshpack) | `dev.dsh-eac.agent-team-base` | 0.2.0 | function | 1086 | `6725ac57233775f23357a8b8c9540902c163283dae9d906ee5a0f0e0574218ee` |
| [DSH 对话迁移包](https://raw.githubusercontent.com/DSH-EAC/dsh-mojobox/50c0bf9754ee301b3521d2a515dc1206a2708b82/artifacts/dev.dsh-eac.conversation-migration-0.1.0.dshpack) | `dev.dsh-eac.conversation-migration` | 0.1.0 | function | 930 | `fdb5da4e866ff78a9d4d6777390e6761229e6b5bec6ceb411ec674f63c0f3bca` |
| [DSH 开发工作台包](https://raw.githubusercontent.com/DSH-EAC/dsh-mojobox/50c0bf9754ee301b3521d2a515dc1206a2708b82/artifacts/dev.dsh-eac.development-0.1.0.dshpack) | `dev.dsh-eac.development` | 0.1.0 | function | 1040 | `774bd6fcc3efd4e850a16e693622f50de8f780d5b8b391cee393076039ed6e70` |
| [DSH 必备工具包](https://raw.githubusercontent.com/DSH-EAC/dsh-mojobox/50c0bf9754ee301b3521d2a515dc1206a2708b82/artifacts/dev.dsh-eac.essentials-0.1.0.dshpack) | `dev.dsh-eac.essentials` | 0.1.0 | function | 967 | `51d20262d228854677b554af1f98706ea4fb0f6d1ced4d2a126121a61ed8dd9b` |
| [DSH 移动会话包](https://raw.githubusercontent.com/DSH-EAC/dsh-mojobox/50c0bf9754ee301b3521d2a515dc1206a2708b82/artifacts/dev.dsh-eac.mobile-tools-0.1.0.dshpack) | `dev.dsh-eac.mobile-tools` | 0.1.0 | function | 966 | `65f128f25449a908ec15720c17f6041f19a3568f1ed05b0c7f76f9bc18700e95` |
| [DSH 文档办公包](https://raw.githubusercontent.com/DSH-EAC/dsh-mojobox/50c0bf9754ee301b3521d2a515dc1206a2708b82/artifacts/dev.dsh-eac.office-base-0.2.0.dshpack) | `dev.dsh-eac.office-base` | 0.2.0 | function | 1083 | `e1ce185f0c140c1222a940da06374279fcbe0aad5cc543d5c77b1ffd06e1187d` |
| [DSH Power Toolbox](https://raw.githubusercontent.com/DSH-EAC/dsh-mojobox/50c0bf9754ee301b3521d2a515dc1206a2708b82/artifacts/dev.dsh-eac.power-toolbox-0.2.0.dshpack) | `dev.dsh-eac.power-toolbox` | 0.2.0 | function | 1273 | `a40ccf445a8b22fa97f885e2159858410ad4700a259526b89949e46107f53de1` |
| [DSH 项目记忆包](https://raw.githubusercontent.com/DSH-EAC/dsh-mojobox/50c0bf9754ee301b3521d2a515dc1206a2708b82/artifacts/dev.dsh-eac.project-memory-base-0.2.0.dshpack) | `dev.dsh-eac.project-memory-base` | 0.2.0 | function | 1087 | `b75eae394663c64d9a58ecb30b283e47d6f5792aa15d18084935f520689fa5da` |
| [DSH 人设与常驻记忆包](https://raw.githubusercontent.com/DSH-EAC/dsh-mojobox/50c0bf9754ee301b3521d2a515dc1206a2708b82/artifacts/dev.dsh-eac.prompt-memory-0.1.0.dshpack) | `dev.dsh-eac.prompt-memory` | 0.1.0 | function | 956 | `b81038f0f7113e05f3d6eabe55cd37cc1ecf75d976f02cd39b05483fa7c12cb9` |
| [DSH 会话效率包](https://raw.githubusercontent.com/DSH-EAC/dsh-mojobox/50c0bf9754ee301b3521d2a515dc1206a2708b82/artifacts/dev.dsh-eac.session-tools-0.1.0.dshpack) | `dev.dsh-eac.session-tools` | 0.1.0 | function | 917 | `53040de4999fba6e74459d87d09b57622b112a87834de2d817fee7fe516f0168` |
| [Bloom 中国风主题](https://raw.githubusercontent.com/DSH-EAC/dsh-mojobox/50c0bf9754ee301b3521d2a515dc1206a2708b82/artifacts/dev.dsh-eac.skin-bloom-0.1.0.dshpack) | `dev.dsh-eac.skin-bloom` | 0.1.0 | appearance | 623 | `d927ce73d6d8c3252e4b7edb94eaefbfb558939ff8475e11ca53066a6e5ab126` |
| [Catppuccin 四色主题](https://raw.githubusercontent.com/DSH-EAC/dsh-mojobox/50c0bf9754ee301b3521d2a515dc1206a2708b82/artifacts/dev.dsh-eac.skin-catppuccin-0.1.0.dshpack) | `dev.dsh-eac.skin-catppuccin` | 0.1.0 | appearance | 636 | `62a3d6d0d9a1b156bc9ff5487d77e3595a44f7f667845af771a9678e243f8b24` |
| [Dream Skin 主题工坊](https://raw.githubusercontent.com/DSH-EAC/dsh-mojobox/50c0bf9754ee301b3521d2a515dc1206a2708b82/artifacts/dev.dsh-eac.skin-dream-skin-0.1.0.dshpack) | `dev.dsh-eac.skin-dream-skin` | 0.1.0 | appearance | 617 | `15aa08f54437e24ab58e392a844015933292c7414d5ac87e60c7a960392d51bc` |
| [终末地工业编辑风主题](https://raw.githubusercontent.com/DSH-EAC/dsh-mojobox/50c0bf9754ee301b3521d2a515dc1206a2708b82/artifacts/dev.dsh-eac.skin-endfield-0.1.0.dshpack) | `dev.dsh-eac.skin-endfield` | 0.1.0 | appearance | 657 | `93bda44e79d64b097d99f571fc1ab54fa226b8a5880e5ad8714e4b527b8dd95c` |
| [Open Sea 海洋皮肤](https://raw.githubusercontent.com/DSH-EAC/dsh-mojobox/50c0bf9754ee301b3521d2a515dc1206a2708b82/artifacts/dev.dsh-eac.skin-open-sea-0.1.0.dshpack) | `dev.dsh-eac.skin-open-sea` | 0.1.0 | appearance | 638 | `4713f8264b56554418dc49fefadeaefd259e254628bf1ec1af3e65ce8d47fcd6` |
| [OpenCode 护眼调色板](https://raw.githubusercontent.com/DSH-EAC/dsh-mojobox/50c0bf9754ee301b3521d2a515dc1206a2708b82/artifacts/dev.dsh-eac.skin-opencode-palette-0.1.0.dshpack) | `dev.dsh-eac.skin-opencode-palette` | 0.1.0 | appearance | 646 | `82a22a226b6ca2d84b66b6232da63f9e054c572d2bc739deb2980fc28c886ef6` |
| [Wallpaper Engine 壁纸与玻璃界面](https://raw.githubusercontent.com/DSH-EAC/dsh-mojobox/50c0bf9754ee301b3521d2a515dc1206a2708b82/artifacts/dev.dsh-eac.skin-wallpaper-engine-0.1.0.dshpack) | `dev.dsh-eac.skin-wallpaper-engine` | 0.1.0 | appearance | 655 | `aff9f6ef1cdc1231db3bd29d81a4cf686b843e8027ac38136080e9c983941c8f` |
| [鲸鱼娘皮肤系列](https://raw.githubusercontent.com/DSH-EAC/dsh-mojobox/50c0bf9754ee301b3521d2a515dc1206a2708b82/artifacts/dev.dsh-eac.skin-whale-girl-0.1.0.dshpack) | `dev.dsh-eac.skin-whale-girl` | 0.1.0 | appearance | 726 | `906285cdab5ae522fcd7873b01f4ca4d69ac9ea81d8751d65c3835b478b7e579` |
| [DSH 日常减重版](https://raw.githubusercontent.com/DSH-EAC/dsh-mojobox/50c0bf9754ee301b3521d2a515dc1206a2708b82/artifacts/dev.dsh-eac.suite-lite-0.1.0.dshpack) | `dev.dsh-eac.suite-lite` | 0.1.0 | function | 1105 | `55066da2e7083777934d39bdbc6deebca004e75ab576198ccf06375fc44cf0d3` |
| [DSH 视觉研究包](https://raw.githubusercontent.com/DSH-EAC/dsh-mojobox/50c0bf9754ee301b3521d2a515dc1206a2708b82/artifacts/dev.dsh-eac.vision-base-0.2.0.dshpack) | `dev.dsh-eac.vision-base` | 0.2.0 | function | 1127 | `88163d6693a5d335c3a64c26b6b7582bb5d648b67c3a22602e71393793cd6b4c` |
| [DSH 联网研究包](https://raw.githubusercontent.com/DSH-EAC/dsh-mojobox/50c0bf9754ee301b3521d2a515dc1206a2708b82/artifacts/dev.dsh-eac.web-research-base-0.2.0.dshpack) | `dev.dsh-eac.web-research-base` | 0.2.0 | function | 1054 | `13fc4e2596794434ffeba65404d511afc7ba118f923412093f4ef9584f241689` |
| [DSH 轻量工作台](https://raw.githubusercontent.com/DSH-EAC/dsh-mojobox/50c0bf9754ee301b3521d2a515dc1206a2708b82/artifacts/dev.dsh-eac.workbench-lite-0.2.0.dshpack) | `dev.dsh-eac.workbench-lite` | 0.2.0 | function | 1011 | `90104ab4b4916d36144073f09dbd8f718369ec21504bf892850facc994c9df3b` |

8 个旧外观薄包保留历史归档，存在内核兼容未知的例外；不会改写原包或伪造范围。新收录和新版本另按现行收录门槛审核。当前 supply 分发政策只导出功能薄包，外观薄包在网页目录可见不等于已经进入供货批次。

可参考已公开的 [Feature Pack 输入 Schema](https://github.com/DSH-EAC/dsh-mojobox/blob/50c0bf9754ee301b3521d2a515dc1206a2708b82/vendor/eac/feature-pack-pack.schema.json)、[收录规范](https://github.com/DSH-EAC/dsh-mojobox/blob/50c0bf9754ee301b3521d2a515dc1206a2708b82/docs/intake.md) 和 [合法根 pack.json](https://github.com/DSH-EAC/dsh-mojobox/blob/50c0bf9754ee301b3521d2a515dc1206a2708b82/fixtures/intake/valid.json)。

### 2.4 10 套皮肤 Prompt 资料

固定来源：[`dsh-skin-prompt-packages@bcb2ecaf318f60df2ff86e5214d646a785ccabc9`](https://github.com/DSH-EAC/dsh-skin-prompt-packages/tree/bcb2ecaf318f60df2ff86e5214d646a785ccabc9)，Mojobox 的 [来源索引](https://github.com/DSH-EAC/dsh-mojobox/blob/50c0bf9754ee301b3521d2a515dc1206a2708b82/catalog/skin-prompt-packages/source.json) 与 [资料 Schema](https://github.com/DSH-EAC/dsh-mojobox/blob/50c0bf9754ee301b3521d2a515dc1206a2708b82/schemas/skin-prompt-package.schema.json)。

资料 ID：`blue-fantasy`、`dragon-heir`、`maid-atelier`、`miku`、`minecraft`、`qq98`、`ths`、`trading`、`whale-song`、`xp`。

它们是 `manifest.json + prompt.md + README.md` 的设计资料，不是可安装皮肤，不生成插件发行或安装按钮。尤其 `maid-atelier` 使用 `CC-BY-NC-SA-4.0`，不可因为 Mojobox 项目本身 MIT 就抹去其素材许可。

## 3. 我们的协议分别管什么

| 协议 | 对象 | 不能误解为 |
| --- | --- | --- |
| `mojobox-plugin-listing-v1` | 插件轻量信息卡与原始发行来源 | dsh-std 运行时 Manifest、MarketIndex、运行兼容证明 |
| `eac-feature-pack-v1` | Mojobox 收录记录；归档内部是 `formatVersion: 1` 的 EAC Feature Pack | legacy Pack/Lock、完整环境、插件 tgz |
| `dsh-skin-prompt-package-v1` | 皮肤设计资料 | 可安装插件、皮肤加载器 |
| `supply.eac/v1` | 有来源身份、序号、修订和各类条目的供货批次 | 贵方 MarketIndex v2、安装资格 |
| `supply-receipt.eac/v1` | 绑定供货 JSON 原始字节、大小、来源 commit 和批次的正式发布说明 | 草稿附件清单、安全签名、运行回执 |

supply 的来源身份是 `sourceId: dsh-eac.mojobox`，条目身份为 `packageName + version`，不是 `type + packageName + version`。

receipt 包含 `schemaVersion/sourceId/sequence/revision/sourceCommit/catalogUrl/sha256/size`。本轮只有草稿，不补造正式 receipt。`supply.json` 自身没有 `draft` 字段，不能只凭 Schema 通过认定正式。

已重新运行本地完整导出：25 条 = 14 个功能薄包 + 10 条资料 + 1 条旧插件来源。此完整草稿尚未上传；其 JSON 为 34343 字节，SHA-256 `ca9151e9f93b80fa7fe13596b31a2abfaf35d5347fefbde1386b80b866102b55`。它不包含新收录的 14 张插件信息卡：现有 supply 没有通用插件冲突和限制映射，我们先讨论，不能静默丢字段后声称供货完成。

本地候选 Schema 的原始文件指纹如下；两份 supply Schema 可以直接从已有 ZIP 取得。内嵌展示或另存内容可能改变换行，不能将这里的文件指纹套在重新序列化的 JSON 上。

| 文件 | 字节数 | SHA-256 |
| --- | --- | --- |
| `schemas/plugin-listing.schema.json` | 2723 | `55001e1d55be1f94223fe9a967dfc52329e4faf63361858c5e0204135bcea423` |
| `schemas/eac-supply.schema.json` | 8308 | `a8688d0f3b69108393e4400a579cf09518d6f4468dd1cc29b62fd3950e945ca1` |
| `schemas/eac-supply-receipt.schema.json` | 909 | `21f98f22dea9f8d9a63fa4f2a0ee3b29fca62460581736f9ca454bd279d49740` |

## 4. 静态接口与本地测试入口

网站接口是读取静态 JSON 和原始文件，不需要调用 Mojobox 安装 API：

```text
GET <BASE>/generated/catalog.json
GET <BASE>/generated/plugins/<id>.json
GET <BASE>/generated/reports/<id>.plugin.json
GET <BASE>/generated/downloads/<id>-<version>.tgz
GET <BASE>/generated/packs/<id>.json
GET <BASE>/generated/reports/<id>.json
GET <BASE>/generated/downloads/<id>-<version>.dshpack
GET <BASE>/generated/skin-packages/<material-id>/manifest.json
GET <BASE>/generated/skin-packages/<material-id>/prompt.md
GET <BASE>/generated/skin-packages/<material-id>/README.md
```

供货批次输出与网页目录独立：

```text
<ROOT>/batches/<sequence>/supply.json
<ROOT>/batches/<sequence>/downloads/<id>-<version>.dshpack
<ROOT>/export-report.json
<ROOT>/supply-receipt.json   # 只有正式导出才存在
```

上面的路径是已实现的本地输出契约，不是已经部署的公网 URL。不要向 `example.org` 请求规划地址。两种入口不能混读字段，例如网页 `archiveUrl` 和 supply `artifact.downloadUrl` 并不是同一个对象。

维护者本机预览当前可测试 `http://127.0.0.1:4191/EAC-mojobox/generated/catalog.json`。127.0.0.1 只指访问者自己的电脑，不是供货服务；贵方不能据此远程连接我们。取得完整开发快照后，才可在自己的电脑运行：

```powershell
npm ci
npm test
npm run build
npm run verify:downloads
npm run preview -- --host 127.0.0.1 --port 4192 --strictPort
```

默认根路径下测试 `http://127.0.0.1:4192/generated/catalog.json`，也可按 JSON 中的相对路径读取详情、报告和下载。这些命令在 Mojobox 根目录执行，不在贵方市场工程执行；当前旧远端提交缺新增实现，不要只拉旧 main 后套这些新增接口。

## 5. 插件信息卡正例和反例

下面是真实 `dsh-context@0.62.3` 信息卡，可先用 npm artifact URL 核验实际文件。不需要等我们的公网供货部署。

```json
{
  "format": "mojobox-plugin-listing-v1",
  "id": "dev.bowenliang123.dsh-context",
  "packageName": "dsh-context",
  "name": "上下文洞察与管理",
  "version": "0.62.3",
  "summary": "提供跨会话上下文统计、组成分析、趋势面板和右侧上下文面板。",
  "author": "bowenliang123",
  "maintainedBy": "registry-maintained",
  "source": {
    "url": "https://registry.npmjs.org/dsh-context/0.62.3",
    "repository": "https://github.com/bowenliang123/dsh-context",
    "commit": "be2810288299f291640d5b8fcc4c4c11541fd3b8"
  },
  "license": "Apache-2.0",
  "compatibility": {
    "dsh": null,
    "basis": "unknown"
  },
  "conflicts": null,
  "limitations": [
    "需要宿主会话、设置和客户端 UI 相关能力；依赖未解析。",
    "包声明过多个 DSH 版本兼容记录，但当前信息卡协议不接受无法逐字投影的声明，因此这里保留为未知。",
    "宿主未安装、未运行；与其他侧栏或设置面板插件的组合尚未验证。"
  ],
  "artifact": {
    "format": "npm-tgz",
    "url": "https://registry.npmjs.org/dsh-context/-/dsh-context-0.62.3.tgz",
    "sha256": "774b5ffabd05479a501df2c046384d47ee0cc6fe89ea13729802ae7d9178cb6a",
    "size": 229916
  }
}
```

`conflicts: null` 表示冲突未知，`[]` 只表示提交方未报告已知冲突，不代表共存已验证。`limitations` 中的组合提示不应自动变成硬互斥。

<details>
<summary>信息卡候选 Schema（完整）</summary>

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Mojobox lightweight plugin listing v1",
  "type": "object",
  "additionalProperties": false,
  "required": ["format", "id", "packageName", "name", "version", "summary", "source", "license", "compatibility", "conflicts"],
  "properties": {
    "format": { "const": "mojobox-plugin-listing-v1" },
    "id": { "type": "string", "pattern": "^[a-z0-9][a-z0-9._-]{2,63}$" },
    "packageName": { "type": "string", "pattern": "^(?:@[a-z0-9._-]+/)?[a-z0-9][a-z0-9._-]*$", "maxLength": 214 },
    "name": { "$ref": "#/definitions/text" },
    "version": { "type": "string", "maxLength": 128 },
    "summary": { "$ref": "#/definitions/text" },
    "author": { "$ref": "#/definitions/text" },
    "maintainedBy": { "enum": ["author", "registry-maintained"] },
    "license": { "anyOf": [{ "type": "null" }, { "$ref": "#/definitions/text" }] },
    "source": {
      "type": "object", "additionalProperties": false, "required": ["url"],
      "properties": {
        "url": { "$ref": "#/definitions/https" },
        "repository": { "$ref": "#/definitions/https" },
        "commit": { "type": "string", "pattern": "^[a-f0-9]{40}$" }
      }
    },
    "compatibility": {
      "type": "object", "additionalProperties": false, "required": ["dsh", "basis"],
      "properties": {
        "dsh": { "anyOf": [{ "type": "null" }, { "type": "string", "minLength": 1, "maxLength": 256 }] },
        "basis": { "enum": ["unknown", "author-declared"] },
        "reference": { "$ref": "#/definitions/https" }
      }
    },
    "conflicts": { "anyOf": [{ "type": "null" }, { "$ref": "#/definitions/textList" }] },
    "limitations": { "$ref": "#/definitions/textList" },
    "links": {
      "type": "array", "maxItems": 12,
      "items": {
        "type": "object", "additionalProperties": false, "required": ["label", "url"],
        "properties": { "label": { "$ref": "#/definitions/text" }, "url": { "$ref": "#/definitions/https" } }
      }
    },
    "artifact": {
      "type": "object", "additionalProperties": false, "required": ["format", "url", "sha256", "size"],
      "properties": {
        "format": { "const": "npm-tgz" },
        "url": { "$ref": "#/definitions/https" },
        "sha256": { "type": "string", "pattern": "^[a-f0-9]{64}$" },
        "size": { "type": "integer", "minimum": 1, "maximum": 8388608 }
      }
    }
  },
  "definitions": {
    "text": { "type": "string", "minLength": 1, "maxLength": 2000, "pattern": "\\S" },
    "https": { "type": "string", "format": "uri", "pattern": "^https://", "maxLength": 4096 },
    "textList": { "type": "array", "maxItems": 32, "uniqueItems": true, "items": { "$ref": "#/definitions/text" } }
  }
}
```

</details>

Schema 之外仍须检查精确 SemVer、HTTPS 无凭据、字段相互一致。兼容未知时必须 `dsh: null, basis: unknown`，不能带范围或依据；作者范围需要 `basis: author-declared` 和真实 reference，拒绝 `*`。提供下载必须有许可声明；包内 name/version/license/Bundle 与信息卡一致，作者范围还须与原包结构化声明一致。

纯来源正例用于测试“合法但不可安装”，不能伪造下载：

```json
{
  "format": "mojobox-plugin-listing-v1",
  "id": "org.example.tools",
  "packageName": "@example/tools",
  "name": "Example tools",
  "version": "1.0.0",
  "summary": "Test fixture only",
  "source": {
    "url": "https://example.org/releases/1.0.0"
  },
  "license": null,
  "compatibility": {
    "dsh": null,
    "basis": "unknown"
  },
  "conflicts": null
}
```

非法兼容反例必须拒绝，不静默修正：

```json
{
  "format": "mojobox-plugin-listing-v1",
  "id": "org.example.tools",
  "packageName": "@example/tools",
  "name": "Example tools",
  "version": "1.0.0",
  "summary": "Test fixture only",
  "source": {
    "url": "https://example.org/releases/1.0.0"
  },
  "license": null,
  "compatibility": {
    "dsh": "*",
    "basis": "unknown"
  },
  "conflicts": null
}
```

其他正反样本：ZIP 内 `fixtures/eac-supply/valid.json` 和 `invalid-material.json`；已公开的薄包 [重复引用反例](https://github.com/DSH-EAC/dsh-mojobox/blob/50c0bf9754ee301b3521d2a515dc1206a2708b82/fixtures/intake/invalid-duplicate.json)。本地还包含缺少精确插件版本、缺少内核范围、版本范围替代精确版本、非法预览和归档攻击测试；它们随后续源码交付，不假称已经公开。

## 6. 与贵方 MarketIndex 的转换缺口

阅读了贵方 `8d2f53fd3b888149a0aa8c5d9708eb536ead771a` 下的 [目录校验器](https://github.com/look-back-lysj/deep-seek-harness-Unity/blob/8d2f53fd3b888149a0aa8c5d9708eb536ead771a/packages/market-core/src/catalog/validate.ts)。

贵方已区分 `official-bundle` 和 `dsh-std`，并有 `listings` 纯展示路径。我们建议先做来源/资料导入，再推进可安装发行，不把信息卡直接作为 MarketPluginRecord。

- 原始 npm Bundle 应走真实 `official-bundle`，从校验后的 tgz 读取 `package/package.json` 原始字节及摘要；我们的 `packageMetadata` 只是部分字段投影，不能重新序列化后冒充原始 package.json。
- 发行材料、目标环境、默认启用意图、使用入口、发行时间、provenance 和管理证据仍须贵方审核；不能用猜测值补齐 release 或自动获得安装资格。
- Mojobox 的 artifact SHA-256 是裸 64 位十六进制，贵方部分对象要求 `sha256:` 前缀，转换时统一表示，核验仍针对同一原始字节。
- 不额外伪造 dsh-std Manifest、Manifest digest 或公共 Evidence。
- `runtime: not-tested` 不得变成 `verification: verified`；作者兼容声明也不是运行证据。
- 兼容未知不自动放行安装。贵方可纯展示或进入自己的人工/隔离测试流程，但本 Issue 不授权跳过原有门禁。
- 来源-only 条目和 material 必须在安装 API 层拒绝，不仅页面隐藏按钮。
- 未解析薄包先走组合纯展示，不能塞占位 releaseId，也不能把 Feature Pack 转成 legacy Pack/Lock。
- 贵方 ID 校验、元数据与对象绑定规则应保持不变；我们的目录 ID 不等于宿主安装 ID。
- `conflicts`、`limitations`、`compatibility` 若现有模型接不住，请明确反馈；先保留原始信息卡引用和摘要，不静默丢弃。

## 7. 建议共同验收顺序

| 测试 | 预期结果 |
| --- | --- |
| 读取已交付供货 ZIP | 大小及摘要匹配，识别 2 条记录，保持草稿 |
| 合法来源卡、纯资料 | 能展示来源和未知状态，不能进入安装规划 |
| 非法资料 fixture | 拒绝，保留上一份可用测试结果 |
| 新插件真实样本 | npm tgz 大小/SHA-256/包内身份一致，仍显示未运行验证 |
| 单字节篡改或错误大小 | 拒绝，不自动更新预期摘要或换同名包 |
| 非法兼容声明 | 拒绝 `*` 和不一致 basis，不默认补兼容 |
| 薄包下载 | 核验归档身份与 SHA-256；不装插件、不调用 legacy 链路 |
| 皮肤资料与旧外观例外 | 保留素材许可和兼容未知；不生成安装入口 |
| 旧供货序号、同序号换字节、缺 receipt | 正式入口拒绝，草稿测试不污染正式账本 |
| 后续隔离官方宿主安装 | 贵方完成自己的预检确认、安装/启用/停用/回滚测试并返回真实结果 |

当前 Mojobox 自动测试 150 项：148 通过，2 项因 Windows 符号链接权限跳过，0 失败；根路径及仓库子路径构建通过，36 个下载归档和 10 套皮肤资料复核通过；桌面、390px、320px 浏览器检查通过。尚未运行贵方导入器，以上不能当作下游安装或业务验收。

## 8. 请贵方确认与回传

1. 首轮消费入口选择：先读静态 Catalog/信息卡，还是优先沿用已交付 `supply.eac/v1`？建议先离线资料导入，协议映射确认后再扩展供货转换器。
2. 如何保留插件 `conflicts/limitations/compatibility`？是否接受兼容未知条目先仅展示？
3. official-bundle 进入候选与进入可安装发行分别缺哪些必填材料？请给一个贵方接受的真实最小样本。
4. 是否已有供货导入命令或测试 HTTP endpoint？请给当前 MarketIndex 版本、导入器固定 commit、调用方法及输入上限，不必为此新开公网服务。
5. 请回传一个成功导入样本、一个拒绝的非法资料样本、一个 SHA/大小失败样本、一个兼容未知仅展示样本，附原始错误及是否修改测试目录。
6. 第一轮确认后，我们再交完整草稿、14 张插件信息卡及相关实现的固定开发快照；不先改贵方代码，不抢做安装或皮肤加载器。

希望先把“文件到手 → 能核验 → 能正确展示 → 不误放安装”走通，再安排一个低风险真实插件的隔离宿主联调。我们负责可靠供货，贵方负责市场适配和真实安装结果，各自边界保持清楚。
