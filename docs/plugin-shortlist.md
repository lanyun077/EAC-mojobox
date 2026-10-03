# 插件常客与候选记录

最后核对：2026-10-03；目标内核：DSH `0.2.0-rc.2`。星数仍为 2026-10-01 的采集值。
本记录供以后编写整合包时重复使用，
每次新包先检查宿主是否已有同类能力，再核对上游版本。这里的“常客”是组合候选，尚未经过
Mojobox 的安装与运行验收；不能把星数或作者的 passed 字段当成本项目证据。

来源、固定 Git revision、npm gitHead、许可和 registry integrity 保存在
[`authoring/upstream-snapshot.json`](../authoring/upstream-snapshot.json)。版本变动后重新核对，
不复制旧摘要，也不自动把 latest 加进生产包。

本轮功能组合的实际 npm 归档核验与版本以
[`authoring/curation-sources.json`](../authoring/curation-sources.json) 为准，逐项筛选见
[减重与分类说明](suite-curation.md)。历史快照与皮肤版本没有自动更新。

## 常用底座

| 插件与来源 | 采集星数 / 版本 | 反复采用的理由 | 组合时检查 |
| --- | --- | --- | --- |
| [DSH Market](https://github.com/dsh-market/dsh-market)，`dshmarket` | 5178 / `1.66.8` | 发现与管理入口；多个场景复用 | 宿主已提供市场时裁剪；会使用宿主插件管理与重启能力 |
| [Better Sidebar](https://github.com/omdsh-dev/DSH-better-sidebar)，`dsh-better-sidebar` | 3936 / `0.24.1` | 文件、编辑器、终端和 Git 工作区 | 扩展右侧栏；检查宿主现有文件栏与其他侧栏插件 |
| [Context](https://github.com/bowenliang123/dsh-context)，`dsh-context` | 1756 / `0.62.3` | 上下文组成、演进和统计 | Node 要求；宿主已有同等观测时不要重复推荐 |

从完整套件补入的常客：

| 组件 | 选定版本 | 使用方向与边界 |
| --- | --- | --- |
| Session Manager | `0.6.2` | 会话整理；迁移/删除写会话数据，作者声明 RC2 适配 |
| Undo Savepoint | `0.4.10` | 配置/插件快照与工作区恢复；desktop 禁用其安全模式，不等于安装器原子回滚 |
| Navbar | `0.4.0` | 长会话节点定位；与 EAC 私有滚动条不叠加 |
| Visualize | `0.1.4` | 日常交互展示；和办公方向的 GenUI 分开组合 |
| Soul MD | `0.9.1` | 人设卡与常驻记忆；与 Project Memory 分开组合 |
| Meow Smooth | `0.8.1` | 移动输入/布局/通知；RC2 运行未验，不创建远程通道 |

## 按需常客

| 插件与来源 | 采集星数 / 版本 | 用在什么包 | 前置条件与取舍 |
| --- | --- | --- | --- |
| [Project Memory](https://github.com/00080000/dsh-project-memory) | 17 / `0.5.14` | 项目记忆 | 功能补位优先于星数；首次建索引；npm scope 下划线不在当前引用语法内，使用 GitHub 引用，提交不锁定 |
| [Agent Teams](https://github.com/NanmiCoder/dsh-agent-teams)，`@nanmicoder/dsh-agent-teams` | 1869 / `0.1.22` | 团队协作 | 多 Agent 费用、并发和任务管理；peer 明确列出 rc.2，后续内核再核对 |
| [ModSearch](https://github.com/liustack/modsearch)，`@liustack/modsearch` | 579 / `5.10.5` | 联网研究 | 默认 Firecrawl Keyless，有外部请求和配额；已有原生联网工具时评估工具重叠 |
| [BrowserSkill](https://github.com/Tencent/BrowserSkill)，`@wxg-prc-cpg/browser-skill-dsh-plugin` | 7990 / `0.3.2` | 浏览器研究与自动化 | `bsk` CLI、Chrome/Edge 扩展和授权；整合包不安装外部应用 |
| [Vision Router](https://github.com/ysr666/dsh-vision-router)，`dsh-vision-router` | 1129 / `3.0.1` | 视觉 | 默认图像发送到云端；local-only 需独立配置，不默认加入轻量工作台 |
| [Univer Office](https://github.com/dream-num/dsh-univer-office)，`dsh-univer-office` | 454 / `0.3.6` | 文档办公 | Node >=22.19；本机 Chromium；本地网关；上游声明适配 Better Sidebar 文件预览，但组合未实测 |
| [GenUI](https://github.com/omdsh-dev/dsh-genui)，`@changfenhuang/dsh-genui` | 497 / `0.11.3` | 交互图表与办公展示 | 必须使用该 scope；无 scope 的同名 npm 包是另一项目。技能由插件自身发布，薄包不另塞 Skill |

## 下一轮候选

| 插件与来源 | 采集星数 / 版本 | 适合的后续方向 | 本轮处理 |
| --- | --- | --- | --- |
| [Chat Import](https://github.com/Nwflower/dsh-chat-import)，`dsh-chat-import` | 208 / `0.24.0` | 对话迁移包 | 已核验成品并进入独立分类，不加入日常工作台；会创建/写入会话数据，需宿主验证 |
| [DSH Taskboard](https://github.com/shengsheng90/DSH-taskboard)，`@shengsheng/dsh-taskboard` | 330 / `0.1.7` | 长任务与看板包 | 已保存元数据；与 Agent Teams 的任务面板比较后再组合，宽泛 peer 不是兼容证据 |
| [DSH IM](https://github.com/xmanrui/dsh-im)，`@xmanrui/dsh-im` | 1572 / `4.34.0` | 通信通知包 | 需要渠道凭据、扫码或长期服务；兼容字段只声明历史 alpha 基线，单独评估 |
| [Whale Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget)，`dsh-whale-widget` | 3731 / `0.3.17` | 余额与桌宠可选包 | 已保存元数据；EAC 已有账号/余额能力，需要先判断功能重叠，不默认加入所有包 |

上一轮排除的 `dsh-find-plugin`、`dsh-at-file`、ModLens 与 Vision Toolkit 理由见
[Power Toolbox 审查](power-toolbox-review.md)。有新版本或明确的新需求再评估，不永久封禁项目，
也不因为出现更高星替代就自动更换已交付包。

## 后续收集步骤

完整整合包的组合经验另见 [EAC/AIO 解析记录](eac-plugin-suite-analysis.md)。该来源已核验
69 个实际内嵌组件，保存为 [`dsh-plugin-suite@0.1.7` 候选](../candidates/integration-suites/dsh-plugin-suite-0.1.7/README.md)。
优先学习文件工作区与变更审核/恢复、会话管理、观察与操作工具配套，再扩充完整包。
其中的 EAC 特制版本不是本表 upstream 稳定版的可直接替代品；候选包仍未进入正式网站或下载。

69 项已逐项完成本轮筛选，新自制组合已进入薄包收录。`picturereader`、`computer-user`、
`dsh-find-plugin` 的公开新版内核 peer 不包含 RC2，排除；全局路径拖拽留候选；
完整电脑操作和对话历史回退仍是能力缺口。不能把 BrowserSkill/Undo 冒称为全部替代。

1. 从 GitHub 按 stars 排序、精选列表与作者仓库发现候选；确认它是 DSH 插件，而非客户端、
   Skill 集合或只带 dsh-plugin 标签的项目。
2. 读 README 和真实 package 元数据，记录正式引用、版本、源码提交、registry gitHead、
   dist integrity、许可证和外部前置条件。
3. 比较宿主内置能力与已选插件；同功能候选先选一种，尚未验证的 UI/工具重叠明确记录。
4. 更新本记录和来源快照；以明确场景写 `authoring/packs/` 清单，不把候选列表全部塞入一个包。
5. 按 `authoring/README.md` 打包、填写收录摘要并验证下载；安装与运行结果由宿主提供独立证据。

这是一份人工维护的持续选型记录，没有新增定时任务、自动安装或自动更新生产包的流程。
