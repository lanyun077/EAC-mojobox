# EAC/AIO 整合包解析与收录判断

复核日期：2026-10-01。事实源是 [v0.1.7 发布成品](https://github.com/zouyuxuan122/EAC-Plugin-Integration-Pack/releases/tag/v0.1.7)
及提交 `58d020813bb565f7888b6f0b539ec0711733a519`。清单、组件摘要和包元数据已保存到
[`candidates/integration-suites/dsh-plugin-suite-0.1.7/`](../candidates/integration-suites/dsh-plugin-suite-0.1.7/README.md)。

Mojobox 本次只读解析文件，学习组合方式与保存来源，没有安装或执行上游插件。
下文区分来源中已有的搭配、我们可学习的设计，以及尚未验证的新组合。

## 1. 实际组成

| 范围 | 套餐条目 | 含义 |
| --- | --- | --- |
| EAC | 48 | EAC v5.3.6 随包体系及补充项；不代表 48 个全部默认启用 |
| AIO | 19 | AIO 6.9.3 第三方全集与稳定线补充，共享版本沿用 EAC |
| 皮肤 | 10 | 可安装 client 插件，全部默认关闭；与 Prompt 资料不同 |
| 独立产物 | 69 | `48 + 19 + 10 - 8`，不是 77 个独立插件 |

EAC/AIO 共用余额、插件管理、皮肤切换、Better Sidebar、插件保护、余额挂件、输入灵动岛和
撤销回退八项。实际归档内有 69 个组件 tarball；身份、大小、SHA-256 全部与包内索引一致。
三个套餐清单、整合包 package.json 与固定源码一致。来源 README 的旧数量不作为本次计数依据。

它发布的是 `dsh-plugin-suite` 插件：Host 部分调用宿主 PluginManager，Client 部分提供套餐、
选择安装、更新、移除和进度界面。整合包自己的快照、队列与版本豁免都由上游实现。
Mojobox 应收录这些成品与声明，不复制安装逻辑。

## 2. 值得学习的搭配

下表按能力组织，是来源中同时收录的组件及设计参考；除明确的数据/工具依赖外，
并列出现不证明它们必须一起安装，也不证明整个工作流已通过 Mojobox 运行验收。

| 工作流 | 来源组件 | 可以学习什么 | 适配时注意 |
| --- | --- | --- | --- |
| 文件开发与变更处理 | Better Sidebar、file-changes、client-file-changes、change-review、message-rewind、undo-savepoint | 文件工作区、变更数据、展示与审核、纠错与恢复覆盖完整开发过程 | file-changes 提供数据，client-file-changes 展示；文件还原还需要宿主能力 |
| 读图与电脑操作 | picturereader + computer-user | 读图提供观察，电脑操作提供动作，组成工具协作 | 外部模型、操作系统与用户授权属于实际运行条件；不能仅通过 peer 范围判断可用 |
| 提示词与长会话 | prompt-custom、soul-md、webui-prompt-optimizer、compact（EAC）或 auto-compact（AIO） | 指令、人设、输入优化与上下文压缩分别覆盖不同环节 | 注入提示词可能重叠，需要明确配置与顺序；两种压缩实现只选一种 |
| 多 Agent 开发 | Agent Teams + 文件工作区 + 变更审核/恢复 | 多 Agent 产出需要有查看、检查与撤销的工具，完整包应覆盖产出管理 | 该包使用 `0.1.13-eac.3` 特制版；已有基底的 `0.1.22` 是另一产物，不直接替换 |
| 插件与能力管理 | unified-market、plugin-wizard、plugin-shield、undo-savepoint、dock-settings、feature-toggles | 发现、选择、启停、Skills/MCP 配置与恢复属于完整工具包的一部分 | 宿主已有插件管理与终端时避免重复安装；快照和恢复交给上游与宿主 |
| 会话导航与纠错 | session-manager、navbar、message-rewind、conversation-tweaks | 归档管理、长对话定位、重新编辑和继续生成形成日常会话流程 | message-rewind 回退的是对话；undo-savepoint 管理配置快照，不能混称文件恢复 |
| 移动端访问 | web-mobile-fix、viewport-lock、meow-smooth、phone | 窄屏布局与远端接入同时考虑，比只修改样式完整 | phone 依赖 EAC sidecar 桥，不能作为任意官方桌面端的通用能力 |
| 费用与价格 | balance、offpeak；whale-widget 可选 | 余额、会话费用和价格提示配合；挂件是附加展示 | offpeak 的 `9.9.9` 是 EAC 占位版本，不能据此追 npm；已有宿主余额能力时评估重叠 |
| 个性化扩展 | font-custom、composer-dynamic-island、raw-html、visualize、wallpaper-engine、可选皮肤 | 主功能、交互增强与整体皮肤分层，皮肤不应强制启用 | 同时修改页面布局、DOM 与全局样式的组件需核对冲突；单独保留皮肤来源与许可 |

其中最适合先扩充我们功能包的是文件开发流程、会话管理、读图与操作、插件配置与恢复。
当前三至五个插件的场景包适合作为轻量基底；完整包应覆盖入口、执行、查看结果、纠错与恢复。
组件数量是清单事实，功能完整性应按实际工作流判断。

## 3. 对现有基底的启发

这些是下一版作者清单的设计建议，本次没有改动已交付包：

- **开发工作台**：保留 Market、Better Sidebar、Context，考察文件变更、审核、会话导航和恢复。
  数据层与展示层成对核对，不能只加一个前端按钮插件。
- **团队协作**：Agent Teams 之外补齐工作区、Project Memory、Context 与产出审核。
  Project Memory/Context 来自我们的既有选型，不是这份 EAC 套餐已经包含的组件。
- **视觉操作**：学习观察与动作配套；评估现有 Vision Router 与 computer-user 所需观察接口。
  不能假设 Vision Router 可以直接代替 picturereader；BrowserSkill 则面向浏览器，需要独立比较。
- **会话效率**：将会话管理、导航、消息回退与一种上下文压缩组合，保留明确的用户数据影响说明。
- **联网研究与文档办公**：该包没有提供我们已选的 ModSearch、BrowserSkill、Univer Office、GenUI
  整套方案，因此它适合成为完整包参考，不替代这些专项方向。

重叠组件优先保留一个主入口。不要同时堆入 Market、Unified Market、Find Plugin 等发现工具，
或同时启用多种压缩、图片输入和全局皮肤实现。EAC 特制版本须核对自己的发布字节和宿主条件。

## 4. 必须保留的限制

### 默认启停与内核依赖

- `easy-setup`、`side-session`、`webui`、`client-ui-custom` 依赖 EAC 的 `settingsScope`；
  目录已默认关闭，上游报告称官方 RC2 上启用会阻塞启动。
- `terminal`、`plugin-manager` 在 EAC 清单中标记为默认关闭，并说明官方 RC2 已自带。
  这是来源策略，Mojobox 不自行判断每个宿主是否应该跳过。
- 所有皮肤默认关闭。`skin-switch` 的选择器在上游 RC2 测试中不可用，单独皮肤可启用；
  不应把“皮肤文件已收录”写成“切换器全部可用”。
- `compact` 与 `auto-compact` 不同套餐中的实现有重叠，上游明确不应同装一个 Profile。
  源 Host 的任务选择代码没有为这对组件实现独立的跨套餐冲突检查，不能把文档告知当成自动保证。

### 安装策略与证据

源码与实际发布 Host 字节一致。安装步骤会自动批准内核返回的 `pendingBuilds`，并在检测到
兼容错误时尝试设置精确版本豁免；重打包流程也放宽部分 `@deepseek-ai/*` peer 范围、剥离
生命周期脚本并补充 bundle patch。这些说明它是经过适配的组合，不能把新 peer 范围直接当作
对任意版本宿主的兼容证明。

批量任务会先创建快照；单项失败以失败结果记录并继续处理。源码没有实现整批失败后自动调用
`restoreSnapshot`，因此不把“自动快照”扩大为“整批原子回滚已验证”。这些行为属于上游安装器。

69 个内嵌插件均未带 `node_modules`，9 个清单声明普通 dependencies，Better Sidebar 有
`node-pty` 等依赖。插件 tarball 已携带不等于干净环境中的依赖全部可离线解析；现成宿主缓存
可能提供这些依赖，本次未安装验证。来源运行报告主要绑定 `0.1.6` 与官方 `0.2.0-rc.2`，
本次 `0.1.7` 的 Mojobox 状态仍为 `runtime: not-tested`，不新增生产 Evidence。

### 包体与授权

归档约 120 MiB，其中大肥鱼组件约 52.9 MiB、页面桌宠约 14.8 MiB，二者占组件字节约 56%。
完整功能包可以借鉴将素材与装饰设为可选的方式，体积与核心功能覆盖分别评估。

整合包代码声明 MIT，但不重新许可全部内嵌组件。实际私有桥接组件缺少 license 字段，
大肥鱼素材告知不授予额外美术许可，女仆皮肤要求 `CC-BY-NC-SA-4.0`。
在许可范围未核实前，保存候选资料和上游链接，不将整个成品复制到 Mojobox 的公开下载。

## 5. 收录判断与最小对接方向

| 层次 | 当前结果 |
| --- | --- |
| 仓库保存来源、清单和组合资料 | 已收纳到候选目录 |
| 真实原始归档核验 | 外层 SHA-256 与 Release 一致；69 个内嵌组件身份、大小和摘要一致 |
| 现有正式目录原样接收 `.tgz` | 不支持；现有链路仅接受薄 ZIP `.dshpack` |
| 在普通 Git 中保存整包 | 125,909,484 字节超过 GitHub 的 100 MiB 单文件上限 |
| Mojobox 重新托管成品 | 再分发许可未核实；当前不复制载荷 |
| 安装和运行结果 | 仅引用上游特定版本报告，本次未执行 |

最小对接方向是新增独立的**上游成品引用**收录：保存原始 Release URL、真实大小与摘要，
保留套餐清单、独立组件数量、默认启停、限制和许可范围，网站提供上游原始下载入口。
不将它伪装为 Feature Pack，不把安装管理器或组件的重打包任务搬入 Mojobox。

这样的引用可避免在普通 Git 中保存大二进制；重新托管字节则仍需核对授权及选择合适的发行
存储。当前候选已经提供这些事实输入，但没有扩展正式 Schema、构建器、网站或宿主协议。

## 6. 后续自制组合

2026-10-03 已按用户要求完成 69 项去留筛选，以公开来源制作必备包、日常减重版与分类包，
并扩充原有七个功能基底。结果见 [减重与分类说明](suite-curation.md)。这次交付的是 DSH-EAC
自编 Feature Pack 清单；原始 suite 的 `.tgz` 与安装管理器仍仅保存候选来源，没有重新托管。
