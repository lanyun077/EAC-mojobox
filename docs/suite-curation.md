# EAC/AIO 减重与分类组合

复核日期：2026-10-03。目标内核为官方 DSH `0.2.0-rc.2`。来源是
[EAC/AIO v0.1.7](https://github.com/zouyuxuan122/EAC-Plugin-Integration-Pack/releases/tag/v0.1.7)
的 69 个实际内嵌组件，以及各组件的公开发布源。

本轮交付自制 Feature Pack v1 薄 `.dshpack`，由 DSH-EAC 维护组合、上游维护插件。
不是重打包上游 suite 安装器，也不提供完整离线 npm 依赖闭包。安装、启停、确认、
数据恢复与运行验收由宿主和插件负责。现有薄包协议、Mojobox 本体和宿主安装器均未扩展。

## 去留结果

全部 69 项都有记录：30 项排除、8 项替换、7 项升级、1 项保留、7 项暂缓、16 项交给皮肤专项。
“暂缓”和“皮肤专项”不表示插件失效；旧版有新版本也不自动表示旧版没有价值。
逐项理由见 [`authoring/suite-curation.json`](../authoring/suite-curation.json)。

| 判断依据 | 本轮处理 |
| --- | --- |
| 官方已有能力 | 删除旧 terminal/plugin-manager；原生压缩保留，两个附加压缩器均不组合 |
| 明确服务不兼容 | easy-setup、side-session、webui、client-ui-custom 的 settingsScope 问题排除；skin-switch 的 codec 问题另行处理 |
| 公开版本不满足内核 peer | picturereader 3.3.3、computer-user 0.3.7、find-plugin 0.4.0 排除，不使用版本豁免 |
| EAC 专有桥或没有独立成品 | 浮窗、手机配对、核心桥、旧文件投影等不写成通用 npm/builtin 引用 |
| 有新版、来源可追溯 | Sidebar 改为 0.24.1、Session Manager 改为 0.6.2、Navbar 改为 0.4.0、Undo 改为 0.4.10、Soul MD 改为 0.9.1 |
| 多个入口覆盖同一能力 | 市场只保留 DSH Market；可视化、记忆与手机布局各自单选 |
| 输入事件重叠尚未运行验证 | drag-and-drop 会全局处理文件 drop；file-drop-eac 等保留候选，不与附件/侧栏默认并装 |
| 没有消费者的兼容层 | aio-ui-compat、桌宠设置等一并排除 |
| 作者明确停用 | QQ98、THS 在 registry 有 discontinued/deprecated 声明，不继续推荐 |
| 素材与体积 | 皮肤、桌宠、大肥鱼、壁纸、挂件移出功能包，不重新托管其素材 |

官方 RC2 的 `evaluatePluginCompatibility` 用 `includePrerelease: true` 判断全部
`@deepseek-ai/dsh` / `@deepseek-ai/dsh-*` peer。本次照此规则做静态比对，选中的
17 个公开组件没有内核 peer 不匹配。规则来源及摘要见
[`authoring/curation-sources.json`](../authoring/curation-sources.json)，不是自行放宽 peer。
缺少 peer 或宽泛范围仍不能证明必需服务、API、DOM、操作系统与实际运行都兼容。

## 必备与减重版

**必备工具包（4 项）**：DSH Market、Context、Session Manager、Undo Savepoint。
覆盖发现插件、观察上下文、整理会话和恢复配置/工作区。原生文件工具、终端、联网工具和
压缩不重新打包，侧栏、团队与外部服务按需求添加。

**日常减重版（7 项）**：必备四项，加 Better Sidebar、Navbar、Visualize。
覆盖文件编辑、Git/AI 变更查看、长会话定位、交互结果展示与恢复。
必备包是减重版的严格子集；减重版又是新版 Power Toolbox 的严格子集，共享引用版本一致。

原套件归档为 125,909,484 字节。减重版所选七个 npm 组件的压缩归档合计为
6,495,660 字节，约 6.2 MiB；该值**不含传递依赖、宿主或安装后的展开体积**。
这不是同一个归档删文件后的体积比较。薄 `.dshpack` 只含清单，其大小不能拿来冒充
120 MiB 完整离线包的减重比例。Better Sidebar 仍有编辑器/渲染依赖，故必备包不含它。

## 分类包与旧基底升级

所有引用版本一致；分类包是独立可读清单，用户按场景选择，不需要把所有分类同时装入 Profile。

| 包 | 数量 | 覆盖 |
| --- | ---: | --- |
| 必备工具包 | 4 | 市场、上下文、会话、恢复 |
| 日常减重版 | 7 | 必备 + 文件开发、导航、交互展示 |
| 会话效率包 | 4 | 会话整理、Navbar、Context、Undo |
| 开发工作台包 | 6 | 减重版去掉交互展示，侧重编辑/变更/导航/恢复 |
| 人设与常驻记忆包 | 3 | Soul MD、Context、Undo；不含预写人设 |
| 移动会话包 | 3 | Meow Smooth、Session Manager、Undo；远程连接另行配置 |
| 对话迁移包 | 3 | Chat Import、Session Manager、Undo；导入会创建会话数据 |
| 轻量工作台 0.2.0 | 5 | 原三项补会话整理与恢复 |
| 项目记忆包 0.2.0 | 7 | 项目索引 + 开发工作台 |
| 团队协作包 0.2.0 | 8 | 项目记忆 + Agent Teams 与产出查看/恢复 |
| 联网研究包 0.2.0 | 7 | 检索、BrowserSkill、会话整理/导航/恢复 |
| 文档办公包 0.2.0 | 8 | Office、GenUI + 开发工作台 |
| 视觉研究包 0.2.0 | 8 | Vision Router、BrowserSkill + 开发工作台 |
| Power Toolbox 0.2.0 | 12 | 减重版 + 项目记忆、团队、检索、浏览器、视觉 |

新增七个包以 `0.1.0` 开始，旧七个功能包递增到 `0.2.0`，稳定 ID 不变。
旧归档原始字节保留，当前收录记录只指向新版本。原八个皮肤包和十套 Prompt 资料不变。
分类是否完整按工作流判断，人设、移动、迁移三件专项包无需为了数量塞入无关插件。

新版侧栏已有 Git 与 AI 改动视图；Undo 0.4.10 提供工作区消息级恢复。这覆盖了旧私有
file-changes/change-review 的主要场景，但**不是**实现等价：配置快照、工作区文件回退和
改写对话历史是三种不同能力。完整桌面 computer-user 仍是缺项；BrowserSkill 仅操作浏览器。
这两项缺口不以同名 npm 包、壳代码移植或虚假的运行证据补齐。

## 组合限制与使用条件

`pack.json.conflicts` 包含已知重叠及我们的单选组合策略；不宣称每对组件都已有运行故障证据。
Mojobox 保存清单，由宿主决定是否检查和如何处理。没有字段条目不代表无冲突，收录不会
自动移除用户 Profile 中原有的旧插件。跨分类同时安装仍应核对互斥字段：

- DSH Market 与 Unified Market/Find Plugin 单选。
- GenUI 与 Visualize 单选；办公与减重版/完整工具箱包含不同展示实现。
- Soul MD 与 Project Memory 单选；人设包与项目记忆/团队/完整工具箱不能直接叠加。
- Meow Smooth 不叠加 Mobile Fix/Viewport Lock；移动布局与全局皮肤需单独验证。
- 文件/视觉组合不加入全局拖拽路径插件；视觉只用 Vision Router，避免旧图片注入。

条件与数据影响：

- **Undo**：支持配置/插件树快照与工作区回退，不承诺安装器原子回滚或所有会话导入可撤销；
  作者明确 desktop Profile 不启用安全模式，应使用宿主恢复入口。快捷方式、快照与文件恢复
  由插件执行，Mojobox 不执行。
- **Session Manager / Chat Import**：迁移、删除、导入会操作本地会话数据；仅引用上游实现与
  作者适配说明，本轮没有改写用户会话。
- **Project Memory**：升级到 0.5.14，固定提交的 GitHub package.json 与 npm 身份均已核对。
  因当前引用语法不接受其带下划线的 npm scope，仍用 `github:00080000/dsh-project-memory`。
  Feature Pack v1 不能锁 Git commit，未来安装可能解析其他 HEAD；npm 归档核验不能冒称
  未来 GitHub 安装字节已验证。该限制不扩展为新的协议或宿主锁定器。
- **BrowserSkill**：需要 bsk CLI、浏览器扩展与授权，薄包不安装外部应用。
- **Vision Router**：2.3.0 升至公开 3.0.1；默认视觉链有图像/问题外发，local-only 需配置。
  图像附件仍由宿主管理，不能把浏览器操作称为全桌面操作。
- **Office**：单组件实际 npm 归档 49,178,378 字节，约 46.9 MiB，另有 Chromium/网关条件；
  只放办公分类。新版宿主自带 office Skill 不等于可编辑文档 UI 与工作区预览。
- **移动**：Meow 0.8.1 的作者实机报告仍主要绑定旧内核。静态未见内核 peer 拒绝，
  RC2 布局/通知、HTTPS、远程通道仍待宿主测试，不能宣传开箱远程访问。

## 事实源与验证

17 个选中 npm 成品已实际下载，registry integrity、包名、版本、package.json 与
bundle patch 都已核对，源码只读。第三方 tarball 与代码留在 ignored 缓存，公开仓库只保存
元数据与我们写的薄清单；MIT 只覆盖自编清单/说明，不重新许可第三方组件。

- `authoring/suite-curation.json`：69 项人工决策、组合范围与互斥策略。
- `authoring/curation-sources.json`：registry 观察、选中 artifact 的真实大小/摘要、package 投影、
  文件摘要、GitHub 限制和官方 peer 规则来源。
- `authoring/packs/`：作者清单；`catalog/feature-packs/`：当前收录记录。
- `artifacts/`：固定时间 ZIP，只有根 `pack.json`。

```powershell
node authoring/build.mjs --check
node --test scripts/curation.test.mjs
npm test
npm run build
npm run verify:downloads
```

回归检查全部来源是否有去留记录、共享版本是否一致、排除项是否重新进入、互斥实现是否同包，
以及必备/减重/完整工具箱的包含关系。构建报告仍为 `runtime: not-tested` 和
`references: not-resolved`：来源快照的独立核验不改变收录检查器的职责，不签发运行 Evidence。
