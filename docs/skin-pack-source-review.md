# 皮肤包来源复核记录

> 2026-11-02：本文保留历史来源核对。皮肤插件与外观组合现按插件／整合包收录；Prompt 资料停止独立收录、网站发布和新供货导出，下文导入与展示说明仅用于追溯。

> 复核时间：2026-10-01
>
> 本记录对应 `feat/skin-pack-development` 分支，只记录来源、包组成和静态收录状态。
> 不把临时探针归档当作正式上游产物，也不替宿主或皮肤加载器签发运行证据。

## 方向结论

`docs/project-positioning-and-roadmap.md` 将 Mojobox 定位为 DSH 生态的来源中介平台。皮肤包是
第二条主线，与功能整合包共用薄 Feature Pack v1 的收录、静态检查、归档和下载链路。
Mojobox 不实现皮肤加载、切换、渲染、素材管理或运行时回滚；这些职责属于皮肤加载器和宿主。

外观包与皮肤包在 Mojobox 中统一归类为 `appearance`，表示对客户端样式或整体外观的修改。
`dsh-skin-prompt-packages` 是当前皮肤资料的来源事实；运行时皮肤内容以后以 Mojobox 自身的
`catalog/feature-packs/` 与 `artifacts/` 收录记录为准。

其中的十套 `skin-prompts/packages/` 已按上游 `skin-prompt-package-v1` 原样收纳到
`catalog/skin-prompt-packages/`，并固定源提交、manifest/prompt/README 摘要。它们是 AI
设计资料，不是可安装插件；需要宿主或 loader 消费的运行时皮肤仍须另行提供薄 Feature Pack。

## 上游事实

### 原项目与资料来源展示补充（2026-10-04）

十套历史 Prompt 的原始文件和固定摘要继续保留。目录维护的原项目映射位于
`catalog/skin-prompt-packages/origins.json`，展示时区分原项目、Prompt 资料来源与 EAC/AIO 历史引用路径。

- 女仆工坊的原项目为 `Small-tailqwq/dsh-deep-whale`，依据上游社区来源元数据。
- 蓝色幻想、龙的传人、初音未来、Minecraft、交易终端、鲸吟和 XP 已由
  `zhu1090093659/dsh-web-ui` 迁入 `zhu1090093659/dsh-skins`；已核对固定的子模块映射及各皮肤清单。
- QQ98 与 THS 的 npm 发布元数据仍指向 `dsh-web-ui`，原项目已停用它们；保留历史资料，暂不提供未经核实的图片。
- 新版原项目预览与历史 Prompt 引用版本可能不同，页面在图片前标明区别。素材许可沿用各自来源，不以历史 Prompt 的代码许可替代新版素材许可。
- Prompt 资料路径为 `skin-prompts/packages/<id>`，修正此前遗漏 `skin-prompts/` 的链接。

自制薄包的发布来源仍为 Mojobox；组件原项目链接从 `authoring/upstream-snapshot.json` 的已核对仓库
与清单中的 GitHub 引用生成，加载器来源单独标注。链接展示不改变来源解析和运行验证状态。

### 皮肤定义与来源资料

- 仓库：[DSH-EAC/dsh-skin-prompt-packages](https://github.com/DSH-EAC/dsh-skin-prompt-packages)
- 当前复核提交：`bcb2ecaf318f60df2ff86e5214d646a785ccabc9`
- `skin-prompts/` 提供 Prompt 包 Schema、皮肤来源和设计说明。
- `mojobox/` 提供 legacy Plugin Catalog 适配和来源快照，但没有正式 `.dshpack`。
- 最新适配仍把鲸鱼娘三件套记录为三个独立 npm 插件引用。
- 本地 `candidates/community-skins/community-metadata.json` 与上游当前文件字节一致，
  SHA-256 均为 `d5c5852efbe97ebb5b2b2102c1b3ec2c02ad540f7f086443e44ff6e8e93a0e03`。

### 加载器与公约化皮肤

- 仓库：[DSH-EAC/dsh-ui-skin-loader](https://github.com/DSH-EAC/dsh-ui-skin-loader)
- 当前复核提交：`afa947215a862a9c3304f6fff7a812efe5a42fdc`
- `@dsh-eac/ui-skin-loader` 提供 `uiSkinLoader` 服务、皮肤登记、公约化切换、持久化和故障隔离。
- `@dsh-eac/skin-maid-atelier` 与 `@dsh-eac/skin-deep-whale-day-night` 使用
  `dsh.ecosystem.ui-skin-loader/v1`，并具有独立的皮肤 ID 和 body marker。
- `v1.1.0` 的 14 个 tarball 和 SHA-256 清单已在上游提交中保存，但目前仍是上游仓库归档快照；
  不能把它们直接当作 Mojobox 的 `.dshpack`。

## 两条包路线

### 现有鲸鱼娘三件套

```text
@smalltailqwq/dsh-client-ui-skin-deep-whale-manager@0.1.6
@smalltailqwq/dsh-client-ui-skin-maid-atelier@0.1.7
@smalltailqwq/dsh-client-ui-skin-orca-link@0.1.7
```

这条路线使用上游自己的 manager、`skin.json` 和 `ui-skin-*` patch 行，不依赖
`@dsh-eac/ui-skin-loader`。它仍是当前分支交接文档指定的首个试点。

### 加载器公约路线

```text
@dsh-eac/ui-skin-loader@1.1.0
@dsh-eac/skin-maid-atelier@1.1.0
@dsh-eac/skin-deep-whale-day-night@1.1.0
```

这条路线由 loader 管理互斥和激活状态。它与旧三件套不是同一组插件，不能在同一薄包中混用，
也不能在未验证冲突行为前放入同一个测试 Profile。

旧 `maid-atelier` 与公约化 `maid-atelier` 尤其不能视为可并装的两个版本；两者都可能触及相同
的视觉标记和页面样式。

## 临时静态探针

为验证 Mojobox 现有检查器能否接受两条路线，各生成了只包含根 `pack.json` 的缓存探针：

| 探针 | 检查结果 | SHA-256 | 状态 |
| --- | --- | --- | --- |
| `dev.example.deep-whale-appearance-1.0.0.dshpack` | `manifest-schema`、`archive-layout`、`archive-sha256` | `095ec6c89615da895a5fa67cf8eab250dc0bf239339fca876c17de81dde5314d` | `runtime: not-tested` |
| `dev.example.deep-whale-loader-appearance-1.1.0.dshpack` | `manifest-schema`、`archive-layout`、`archive-sha256` | `40628b85b924fd2db9d202ab8c7031ee8c5732c210d79258d35bc7a4ee1de7df` | `runtime: not-tested` |

探针位于 `.cache/skin-pack-probe-20261001/`，不进入 `artifacts/` 或正式目录。

静态检查证明当前 Feature Pack 收录链路可以表达两种皮肤包组成；新的收录记录还可以在 `appearance`
对象中保存 loader、皮肤 ID、冲突和预览来源。它没有解析插件来源，也没有证明
loader、宿主安装或皮肤运行成功。loader 是否安装、如何解析依赖和能否运行不属于 Mojobox 的收录门禁；
Mojobox 只把已核对的 loader 来源、版本和依赖声明提供给下游读取。

## 当前阻塞与下一步

正式收录仍需要上游明确交付的 `.dshpack` 或可被下游稳定读取的正式 Feature Pack 来源。现有
插件 tarball、loader 仓库中的 `.verify` 快照和本地探针都不能直接替代开发者归档；这属于归档来源问题，
不是 loader 安装或运行问题。

下一步按以下顺序推进：

1. 向上游确认首个试点采用现有鲸鱼娘三件套，还是切换到 loader 公约路线。
2. 获取对应路线的正式薄 `.dshpack`、来源页面、作者、许可证和最终 SHA-256。
3. 用 `inspect:feature-pack`、`npm test`、`npm run build` 和 `npm run verify:downloads` 完成收录门禁。
4. 将 loader 依赖、冲突和运行验证状态原样记录为下游信息；Mojobox 不执行安装或运行测试。
