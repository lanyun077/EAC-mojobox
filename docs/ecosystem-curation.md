# 首批 GitHub 皮肤与功能基底

采集日期：2026-10-01。按 GitHub 星数发现 DSH 原生皮肤和插件，再核对作者 README、插件入口、
已发布 npm 元数据与许可边界。星数是热度线索，不是运行质量或安全保证；DSH 皮肤规模较小，
本批兼顾热门作品和有代表性的配色系列，不设一个跨生态的绝对星数门槛。

本次 DSH-EAC 是整合包作者，独立编写引用清单。Mojobox 仍只负责收录、静态检查、展示和下载；
网站按用途统一皮肤包入口，没有修改皮肤代码、宿主、loader 或 Schema。历史交接中“必须等上游交付整合包”的
限制适用于收录上游产品，本次采用用户明确要求的自制包路线，不声称这些包由上游维护。

## 皮肤收录

以下 8 个包均为 `dev.dsh-eac.skin-<名称>@0.1.0`，每个包单独选择，不默认组合全局样式。
外观包与皮肤包是同一分类。皮肤包页统一展示这 8 个皮肤归档和原有 10 套 Prompt 资料，
保留各自的下载方式、详情和检查范围；功能包页展示 7 个功能组合。清单字段仍为 `appearance`。
旧 `#/packs/<皮肤包 ID>` 链接仍能打开皮肤详情，返回入口统一指向皮肤包列表。

| 包后缀 | 上游与采集星数 | 引用版本 | 特别说明 |
| --- | --- | --- | --- |
| `whale-girl` | [鲸鱼娘系列](https://github.com/Small-tailqwq/dsh-deep-whale)，2331 | 管理器 `0.1.6`；女仆/虎鲸 `0.1.7` | 原版三件套；与 EAC 同名公约皮肤及昼夜工坊分开；美术非商业许可 |
| `wallpaper-engine` | [Wallpaper Engine](https://github.com/elysia395/dsh-wallpaper-engine)，432 | `dsh-plugin-wallpaper-engine@1.1.0`、侧栏 `0.24.1` | 上游要求先升级内核与侧栏；本机壁纸和媒体能力由用户提供 |
| `open-sea` | [Open Sea](https://github.com/d-dev0101/open-sea-skin)，381 | `open-sea-skin@1.2.3` | 仓库是 `1.2.4`，本包引用已发布 `1.2.3`；GPU 能力交由宿主判断 |
| `dream-skin` | [Dream Skin](https://github.com/RevolutionLA/dsh-dream-skin)，197 | `dsh-dream-skin@9.29.0` | 8 套主题及主题包、壁纸管理；用户导入素材各自保留许可 |
| `endfield` | [终末地](https://github.com/ymh0000123/dsh-theme-endfield)，109 | `github:ymh0000123/dsh-theme-endfield`，声明 `1.1.5` | 根插件入口已核对；Git 引用不锁提交；MIT 不覆盖游戏素材 |
| `catppuccin` | [Catppuccin](https://github.com/NoNameLeGo/dsh-catppuccin-theme)，50 | `@nonamelego/dsh-catppuccin@0.5.8` | 4 套配色；HEAD 是 `0.5.9-beta.0`，其 0.2.0/桌面声明不能替代稳定版实测 |
| `bloom` | [Bloom](https://github.com/webkubor/dsh-bloom-theme)，48 | `dsh-bloom-theme@0.16.0` | 10 套配色与明暗主题；对比度测试为作者声明 |
| `opencode-palette` | [OpenCode 调色板](https://github.com/FeatherHunter/dsh-opencode-palette)，37 | `dsh-opencode-palette@2.0.10` | 上游 README 声明 38 款配色；可作为编程外观基底 |

所有收录记录均提供上游预览链接。固定提交下的预览是作者展示资料，不代表已发布 npm 版本的
实机截图；Bloom 的外部图片地址可能更新。皮肤管理器只在鲸鱼娘原版路线中声明，其他包采用
各自插件入口，不假设它们依赖或兼容 EAC loader。未核对到的主题 ID 不填猜测值。

## 功能基底

新包版本均为 `0.1.0`，ID 前缀为 `dev.dsh-eac.`，组合目标为 DSH `0.2.0-rc.2`。
下表的“工作台”是相同三个插件引用，清单中直接列出，不要求安装另一整合包。

| 包后缀 | 组件 | 用途与前置条件 |
| --- | --- | --- |
| `workbench-lite` | Market + Better Sidebar + Context | 插件发现、文件工作区、上下文观测的基础组合 |
| `project-memory-base` | 工作台 + Project Memory | 项目文档、代码符号和经验检索；首次建立索引，Git 引用不锁提交 |
| `agent-team-base` | 工作台 + Agent Teams | 多 Agent 与任务依赖；增加模型调用和上下文开销 |
| `web-research-base` | Market + Context + ModSearch + BrowserSkill | 检索与已登录浏览器操作；外部服务配额、`bsk` CLI、扩展和用户授权 |
| `office-base` | 工作台 + Univer Office + GenUI | 文档、表格、演示和对话内可视化；截图/PDF 需本机 Chromium，按需启动本地服务 |
| `vision-base` | Market + Context + Vision Router | 图像工具；默认远端链发送图像，local-only 配置不在薄包中下发 |

原有 `power-toolbox` 保留为较完整的参考组合。场景基底共享组件，不把六包全部安装作为默认
使用方案；安装后的重叠、版本、启停与冲突处理属于宿主。已有宿主提供市场、侧栏或上下文能力时，
应由包维护者裁剪组合，不因为插件流行就重复加入。

## 候选与暂缓

| 项目 | 当前记录与处理 |
| --- | --- |
| [透明 UI](https://github.com/WYH66666666/DSH-Transparent-UI-Plugin)，408 星 | README 推荐 `dsh-client-ui-aqua`，根清单却为 `@deepseek-ai/dsh-client-ui-aqua`；仓库 LICENSE 是 AGPL-3.0，清单为 MIT。保留来源快照，引用和许可范围须先厘清 |
| [Custom Skin](https://github.com/SLin-code/dsh-custom-skin)，100 星 | 标准 GitHub 根插件，已编译入口；但 peer 范围排除 0.2.0。记入历史基线候选，不加入当前功能基底 |
| [HeiGeAi 换肤系统](https://github.com/HeiGeAi/deepseek-harness-skin)，52 星 | 发现 21 套主题，但包位于 `tree/packages/client/ui-theme/`，不是当前支持的根插件引用。暂存来源线索，不转换源码覆盖结构 |
| [皮肤市场](https://github.com/kingOfSoySauce/dsh-skin-market)，174 星 | 可用于后续发现作者，不把另一市场及其人工审核直接当成 Mojobox 的证据 |
| [美女系列](https://github.com/XieRW/dsh-beauty-skins)，100 星 | 保留既有候选；源码覆盖路线仍不支持，不为增加数量改写插件协议 |

其余常用插件与专项候选见 [插件常客记录](plugin-shortlist.md)。发现资料和已核对来源分开：
本批的元数据快照不包含后面三条发现线索的完整源码审核。

## 验证边界

`authoring/upstream-snapshot.json` 保存来源元数据与精确 revision，但不是 Pack Lock。
npm integrity 是 registry 声明，未下载复核插件 tarball；实际 `.dshpack` 的 SHA-256 来自生成字节。
`github:` 引用及宿主是否遵守插件 `version` 由下游解析，不能把这批薄包说成锁定依赖的离线包。

收录检查始终为 `runtime: not-tested`、`references: not-resolved`。上游 README、package.json
和兼容字段即使写了 passed，也只代表作者声明；本次没有运行插件、安装脚本、用户 Profile
或 loader，没有新增生产 Evidence。

## 本轮验收

- `node authoring/build.mjs` 与 `--check`：15 个作者清单可重复生成相同字节；旧 Power Toolbox
  摘要保持 `dc80389752714f20659c7b87e200af63bf72bcf4ced3344bba8a8e3bb1de4da9`。
- `npm test`：96 项通过、1 项 Windows 符号链接权限跳过、0 失败；覆盖混合皮肤目录、计数、搜索、旧链接及两种下载。
- 根路径及 `BASE_PATH=/dsh-mojobox/` 构建通过；`npm run verify:downloads`：15 个正式薄包、10 套皮肤资料复核通过。
- 20 个引用组件均有来源快照，引用版本与选用的 npm 元数据或 Git 源清单一致。
- 9 个预览 URL 的 HTTP HEAD 返回 200 和图片内容类型；未下载或执行皮肤载荷。
- 浏览器首页与列表显示功能包 7 项、皮肤包 18 项（8 个归档、10 套 Prompt）；鲸鱼娘详情
  展示依赖、冲突、许可说明和预览，旧功能包详情链接可继续打开。根路径及子路径下载地址正确，
  子路径下实际下载的 Bloom 归档和 Blue Fantasy Prompt 摘要与原始文件一致。
  桌面与 390px 窄屏的归档和资料详情无横向溢出。
- CI 新增作者清单与交付归档的重建核对；`git diff --check` 通过。
