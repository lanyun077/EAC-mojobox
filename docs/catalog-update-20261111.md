# 官版 0.2.2-rc.1 内容更新

核对日期：2026-11-11。本次更新网站的插件信息卡和自制整合包，目标为官方 DSH
`0.2.2-rc.1`。保留目录 ID、组合用途与互斥策略，更新采用精确版本和新增归档。
这是来源、归档和版本声明的静态核验，插件安装、依赖闭包、加载与运行均未测试。

## 更新结果

- 26 张独立插件卡中，19 张升级版本：17 个新原始下载、2 个仍仅提供来源；其余 7 张没有新的正式发行。
- 14 个功能整合包全部递增版本；原 `0.1.0` 更新为 `0.2.0`，原 `0.2.0` 更新为 `0.3.0`。
  随后移动包 `0.2.1`、团队包 `0.3.1` 修正简介中遗留的 RC2 字样，组件和内核目标不变。
- 5 个外观包更新为 `0.2.0`：Bloom、Catppuccin、OpenCode Palette、Wallpaper Engine、鲸鱼娘系列。
- 更新的 19 个整合包均声明精确 `requires.dsh: 0.2.2-rc.1`，这是本项目作为组合作者选择的目标，
  不代表已验证所有插件行为。Dream Skin、Open Sea、Endfield 保留历史版本及未知范围。
- 当前规模仍为 26 个插件（24 个下载、2 个仅来源）、22 个整合包；正式下载入口仍为 46 个。

机器可读依据见 [`authoring/catalog-update-20261111.json`](../authoring/catalog-update-20261111.json)。
共核对 37 个 npm 项目及 Endfield 的 GitHub 来源；其中 35 个 npm 原始归档实际下载并核验
registry integrity、SHA-256、大小和包内身份，2 个仅来源项目只核对 registry 元数据。
原始插件 tarball 不重打包，不执行发行脚本；已有归档不覆盖、删除或改名。

## 功能整合包共享版本

| 组件 | 原组合版本 | 更新版本 |
| --- | --- | --- |
| DSH Market | 1.66.8 | 1.73.17 |
| Context | 0.62.3 | 0.83.1 |
| Better Sidebar | 0.24.1 | 0.30.1 |
| Session Manager | 0.6.2 | 0.7.5 |
| Navbar | 0.4.0 | 0.4.0，重核来源 |
| Undo Savepoint | 0.4.10 | 0.5.1 |
| Soul MD | 0.9.1 | 0.12.2（独立卡从 0.9.0 更新） |
| Visualize | 0.1.4 | 0.1.9 |
| Meow Smooth | 0.8.1 | 0.8.1，重核来源 |
| Agent Teams | 0.1.22 | 0.1.29 |
| BrowserSkill | 0.3.2 | 0.4.2 |
| ModSearch | 5.10.5 | 5.10.12 |
| Project Memory | 0.5.14 | 0.6.12 |
| Univer Office | 0.3.6 | 0.4.0 |
| GenUI | 0.11.3 | 0.16.0 |
| Vision Router | 3.0.1 | 3.2.0 |
| Chat Import | 0.24.0 | 0.26.5 |

17 个组件均通过目标版本的官方静态检查。规则来自实际核验的
`@deepseek-ai/dsh-app-boot@0.2.2-rc.1`：先看 `engines.dsh`；没有时检查所有
`@deepseek-ai/dsh` / `@deepseek-ai/dsh-*` peer；使用 `includePrerelease: true`。
不使用版本豁免，也不把缺少声明解释为 API、DOM 或服务兼容证明。
完整包元数据、摘要和规则文件摘要见
[`curation-sources.json`](../authoring/curation-sources.json)。其中 69 项原始 registry 观察
保留 2026-10-03 的 `registryCheckedAt`，不冒称本次重新审查了所有历史排除项。

## 外观包依据

| 自制包 | 新组件 | 整体目标的来源 |
| --- | --- | --- |
| Bloom | dsh-bloom-theme 0.27.0 | 作者 `engines.dsh >=0.2.2-rc.1` |
| Catppuccin | @nonamelego/dsh-catppuccin 0.7.3 | 作者 `engines.dsh >=0.1.7-rc.1`、`dsh.compatibility.dsh` |
| OpenCode Palette | dsh-opencode-palette 2.1.12 | 作者 `engines.dsh >=0.2.0-rc.1` |
| Wallpaper Engine | wallpaper-engine 1.4.2 + Better Sidebar 0.30.1 | 前者 `engines.dsh ^0.2.0-rc.1`；后者 DSH peers 为 `^0.2.2-rc.1` |
| 鲸鱼娘 | manager 0.1.9、maid/orca 0.1.10 | 作者根 DSH peer：manager `>=0.1.7-rc.1`，两款皮肤 `>=0.2.2-0 <0.2.3-0` |

这些是 Mojobox 自编引用清单，目标选取依据已逐项记录。没有把其他作者的原始整合包改写。
Dream Skin 11.7.0、Open Sea 1.2.7、Endfield 1.2.5 已查到新版，但未确认整体 DSH 范围，
不从子模块 peer 或本机版本代填。三包继续使用原 `0.1.0` 历史例外；例外政策未扩展。
现有外观预览沿用固定的历史来源，已经在收录备注注明，不作为新版实测截图。

## 使用条件与保留项

- **旧配置**：本次只更新远端内容，不操作用户 Profile。实际升级由下游逐插件选择和执行。
  Vision Router 3.2.0 明确不会自动迁移旧 Profile；作者要求先执行只读
  `doctor --upgrade-preflight`，再核对旧会话、自定义配置和回退方案。此条件写入独立卡及含它的包。
- **Node**：Vision Router 要求 `>=24.9.0`；其他插件保留各自 Node 声明。本机隔离官版自带
  Node `24.21.0`，满足本批功能组件的声明，但不代表其他客户端环境相同。
- **Better Sidebar**：新版面向 `0.2.2-rc.1`，额外的 Better Locale `^0.1.0` 是可选 peer；
  不把它误报为已解析依赖。组合加载仍待下游验证。
- **Project Memory**：保留 `github:00080000/dsh-project-memory`，因为现有薄包引用语法不接受其带下划线的
  npm scope。已核对 GitHub commit `7db33b846014cb273e322bff8462d28d36dcd241` 的包名/版本与
  npm 0.6.12；Feature Pack v1 无法锁定 Git commit，不能保证未来 GitHub 安装解析到相同字节。
- **Univer Office**：0.4.0 原始归档为 38,675,580 字节、内容合计 162,371,937 字节，
  仅更新薄包中的引用，不新增独立插件下载。元数据声明 MIT，但归档 `LICENSE` 为 Apache-2.0 全文；
  上游许可标注不一致需单独确认，不把自编清单 MIT 扩展为第三方再分发许可。
- **鲸鱼娘美术**：代码 MIT 与美术 CC BY-NC-SA 4.0 分开，保留禁止商用、署名和上游 NOTICE 要求。
  OpenCode 的 npm 包未携带 LICENSE 正文；本次仅更新引用，不托管其第三方插件归档。
- **Find Plugin / PictureReader**：当前最新版仍为 0.4.0 / 3.3.3，其旧 DSH peer 不接受
  `0.2.2-rc.1`。保留面向其他宿主的原始下载，在限制中明确提示，不加入本批功能组合。
- **Pet / Dafeiyu**：来源版本分别更新到 0.4.7 / 0.1.23；新版归档未审核，仍只提供来源，
  不将历史体积测量当作新版实测。Dafeiyu 素材授权仍未完成审核。
- **兼容字段**：独立插件接口继续只逐字投影包内 `dsh.compatibility.dsh`。
  `engines.dsh` 和 peers 保留在检验报告及限制中，不通过修改协议把静态比对冒充作者整体声明。

## 验证与回退

本次沿用现有 Schema、构建器和下游接口，无协议变更。新版本有新的原始字节摘要；旧版 Pack/Lock、
Evidence、历史来源快照和所有旧归档保留。自制包采用固定时间 ZIP，只含根 `pack.json`。

本地 `node authoring/build.mjs --check` 通过，22 个自制包连续重建摘要一致；`npm test` 共
164 项，162 通过、2 项因 Windows 符号链接权限跳过。根路径及 `/EAC-mojobox/` 生产构建、
46 个生产下载复核、demo 构建及下载复核均通过。贡献增量检查和远端 CI/Pages 结果见本次 PR。
尚未进行插件依赖安装、官版实际加载、配置迁移或组合运行验收。

回退时恢复上一版信息卡、收录记录及作者清单的指针，并还原相应来源文档；所有新增与历史归档
原样保留，不能通过删除已发布归档回退。本批记录恢复不会自动回滚用户已经安装的插件或配置。
