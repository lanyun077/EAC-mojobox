# 目录精简：停维护组件、滞后外观包与重复组合

核对日期：2026-11-13（Asia/Shanghai）。基于 `main` 提交 `49bb2a4` 的 22 个整合包，
逐项核对 27 个不同组件引用的 npm 发行或 GitHub 来源。当前目录调整为 **18 个整合包
（13 个功能、5 个外观）、25 张独立插件卡（23 个下载、2 个仅来源）**，共 41 个下载。
本次保持官版 `0.2.2-rc.1` 组合目标，未安装或运行第三方插件。

## 去留标准

- 上游明确归档、弃用且宿主已覆盖其核心能力的组件，从当前组合与独立入口移除。
- 长期引用旧发行、已有多次上游更新且当前内核范围仍无法确认的外观组合，撤下入口，
  等作者范围声明及新版本来源核验完成后再收录。
- 清理后组件集合与目标完全相同的组合，只维护一个入口。
- 不以最近一次提交时间单独认定停维护，也不因刚发布一至四个版本就删除仍在维护的组件。
  本次不顺带追逐新版，不把 npm 最新版等同于已核验或已运行的版本。

## 移除和撤下

| 对象 | 已核实事实 | 处理 |
| --- | --- | --- |
| `@vlln/dsh-navbar` 0.4.0 | [GitHub 仓库](https://github.com/vlln/dsh-navbar) 的 `archived: true`；作者 [固定 README](https://github.com/vlln/dsh-navbar/blob/e53adfc8c837ebcb4b6a52c2c4baf7cb6e8b795e/README.md) 明示只读归档，官版 0.1.2 系列已内置 TurnNavigator | 从 9 个功能组合移除，并撤下 `dev.vlln.dsh-navbar` 独立入口；导航使用宿主内置能力 |
| Dream Skin 主题工坊 | 仍引用 [9.29.0](https://registry.npmjs.org/dsh-dream-skin/9.29.0)（2026-09-29），[上游最新 11.7.0](https://registry.npmjs.org/dsh-dream-skin/11.7.0)（2026-11-06）；registry 中此后发布 45 个版本，原薄包未声明内核范围 | 撤下 `dev.dsh-eac.skin-dream-skin`，不将上游活跃项目说成停止维护 |
| Open Sea 海洋皮肤 | 仍引用 [1.2.3](https://registry.npmjs.org/open-sea-skin/1.2.3)（2026-09-07），[最新 1.2.7](https://registry.npmjs.org/open-sea-skin/1.2.7)（2026-10-31）；registry 中此后发布 3 个版本，原薄包未声明内核范围 | 撤下 `dev.dsh-eac.skin-open-sea`，不编造新版整体适配范围 |
| Endfield 主题 | 仍引用 1.1.5；[固定上游 package.json](https://github.com/ymh0000123/dsh-theme-endfield/blob/903f5fb59b77ca158f6e35e417bd23198d174057/package.json) 及 [v1.2.5 标签](https://github.com/ymh0000123/dsh-theme-endfield/tree/8315d584b69dfcabd4aa6a1b1d84d1ce14fa660a) 均为 1.2.5，原薄包未声明内核范围；上游未归档 | 撤下 `dev.dsh-eac.skin-endfield`，不把 README 中单项能力说明代填为整体内核范围 |
| DSH 轻量工作台 | 移除 Navbar 后，其 5 个组件、精确版本、内核目标与开发工作台包完全相同 | 撤下 `dev.dsh-eac.workbench-lite`，继续使用 `dev.dsh-eac.development`；不再维护两份相同组合 |

撤下采用删除收录记录、对应网站标注及当前作者清单的方式。作者旧清单可从 Git 历史追溯；
所有已经发布的 `.dshpack`、`.tgz` 原始字节、legacy Pack/Lock/Evidence、历史来源快照与
`policies/intake-legacy.json` 的精确历史例外保持不变。旧例外不再产生这三个包的当前入口。
`curation-sources.json` 中 Navbar 的旧静态核验仍保留，`suite-curation.json` 已明确排除它。

## 组合版本

9 个组合只移除 Navbar、修正相应功能说明并递增补丁版本；其余组件版本保持不变。
每个新版本生成独立归档和真实 SHA-256，收录记录指向新字节，不改写旧发行。

| 稳定 ID（省略 `dev.dsh-eac.`） | 版本 | 组件数 |
| --- | --- | --- |
| `agent-team-base` | 0.3.1 → 0.3.2 | 8 → 7 |
| `development` | 0.2.0 → 0.2.1 | 6 → 5 |
| `office-base` | 0.3.0 → 0.3.1 | 8 → 7 |
| `power-toolbox` | 0.3.0 → 0.3.1 | 12 → 11 |
| `project-memory-base` | 0.3.0 → 0.3.1 | 7 → 6 |
| `session-tools` | 0.2.0 → 0.2.1 | 4 → 3 |
| `suite-lite` | 0.2.0 → 0.2.1 | 7 → 6 |
| `vision-base` | 0.3.0 → 0.3.1 | 8 → 7 |
| `web-research-base` | 0.3.0 → 0.3.1 | 7 → 6 |

会话效率包不含市场，必备工具包含市场，两者用途与组件集合不同，继续分别保留。
子集与扩展组合按既有场景维护，不因共享底座而将其一并删除。

## 保留组件的来源观察

以下为当日 npm `dist-tags.latest` 观察。26 个 npm 引用及 1 个 Endfield GitHub 引用均已核对；
被撤下的 4 个组件见上表，下表列出保留的 23 个引用。除 Dream Skin 的 registry 指向 GitCode 外，
本次还读取其余 26 个引用所对应的 GitHub 仓库状态，均未发现其他归档项。
这不是重新下载或重新运行保留版本，实际产物证据沿用 [2026-11-11 更新](catalog-update-20261111.md)。

| 组件（链接为 npm 元数据） | 当前引用 | 观察到的最新版本 | 最新发布日期（UTC） |
| --- | --- | --- | --- |
| [Market](https://registry.npmjs.org/dshmarket) | 1.73.17 | 1.73.19 | 2026-11-12 |
| [Context](https://registry.npmjs.org/dsh-context) | 0.83.1 | 0.84.0 | 2026-11-12 |
| [Session Manager](https://registry.npmjs.org/dsh-session-manager) | 0.7.5 | 0.7.6 | 2026-11-12 |
| [Undo Savepoint](https://registry.npmjs.org/dsh-undo-savepoint) | 0.5.1 | 0.5.1 | 2026-11-07 |
| [Better Sidebar](https://registry.npmjs.org/dsh-better-sidebar) | 0.30.1 | 0.32.1 | 2026-11-12 |
| [Visualize](https://registry.npmjs.org/%40nagi-ovo%2Fdsh-visualize) | 0.1.9 | 0.1.9 | 2026-11-06 |
| [Soul MD](https://registry.npmjs.org/dsh-soul-md) | 0.12.2 | 0.12.3 | 2026-11-12 |
| [Meow Smooth](https://registry.npmjs.org/meow-smooth) | 0.8.1 | 0.8.1 | 2026-09-23 |
| [Agent Teams](https://registry.npmjs.org/%40nanmicoder%2Fdsh-agent-teams) | 0.1.29 | 0.1.29 | 2026-11-06 |
| [BrowserSkill](https://registry.npmjs.org/%40wxg-prc-cpg%2Fbrowser-skill-dsh-plugin) | 0.4.2 | 0.5.0 | 2026-11-12 |
| [ModSearch](https://registry.npmjs.org/%40liustack%2Fmodsearch) | 5.10.12 | 5.10.12 | 2026-11-07 |
| [Project Memory](https://registry.npmjs.org/%40yolk_vat-y%2Fdsh-project-memory) | 0.6.12（GitHub 引用） | 0.7.0 | 2026-11-12 |
| [Univer Office](https://registry.npmjs.org/dsh-univer-office) | 0.4.0 | 0.4.0 | 2026-11-02 |
| [GenUI](https://registry.npmjs.org/%40changfenhuang%2Fdsh-genui) | 0.16.0 | 0.16.0 | 2026-11-09 |
| [Vision Router](https://registry.npmjs.org/dsh-vision-router) | 3.2.0 | 3.2.1 | 2026-11-12 |
| [Chat Import](https://registry.npmjs.org/dsh-chat-import) | 0.26.5 | 0.26.6 | 2026-11-12 |
| [Bloom](https://registry.npmjs.org/dsh-bloom-theme) | 0.27.0 | 0.27.0 | 2026-11-07 |
| [Catppuccin](https://registry.npmjs.org/%40nonamelego%2Fdsh-catppuccin) | 0.7.3 | 0.7.3 | 2026-11-08 |
| [OpenCode Palette](https://registry.npmjs.org/dsh-opencode-palette) | 2.1.12 | 2.1.12 | 2026-11-01 |
| [Wallpaper Engine](https://registry.npmjs.org/dsh-plugin-wallpaper-engine) | 1.4.2 | 1.4.2 | 2026-11-05 |
| [Deep Whale Manager](https://registry.npmjs.org/%40smalltailqwq%2Fdsh-client-ui-skin-deep-whale-manager) | 0.1.9 | 0.1.9 | 2026-11-06 |
| [Maid Atelier](https://registry.npmjs.org/%40smalltailqwq%2Fdsh-client-ui-skin-maid-atelier) | 0.1.10 | 0.1.10 | 2026-11-06 |
| [Orca Link](https://registry.npmjs.org/%40smalltailqwq%2Fdsh-client-ui-skin-orca-link) | 0.1.10 | 0.1.10 | 2026-11-06 |

Meow Smooth 仍为最新发行、GitHub 未归档，最近推送为 2026-10-17，因此不凭发布日期认定停维护。
移动包中原有“作者实测为旧内核、当前组合未实测”的限制继续保留。近期有新发行的组件继续使用
两天前已核验的版本，后续升级需另行核验；本次没有把它们标成最新版。

## 验证与下游影响

Schema、薄包协议和插件来源 v1 字段不变。当前生成目录不应含已撤下的 4 个整合包或 Navbar，
9 份新归档必须与作者清单原样重建一致。相关回归同时检查排除项不重入、当前清单与收录一一对应、
组合不重复，以及共享组件版本和原互斥策略不漂移。

本轮实际验证：

| 检查 | 结果 |
| --- | --- |
| `node authoring/build.mjs --check` | 18 份当前作者清单与归档原样重建一致；其中 9 份为本次新归档 |
| `npm test` | 165 项：163 通过、2 项 Windows 文件符号链接权限跳过、0 失败 |
| 根路径 `npm run build`、`npm run verify:downloads` | 通过，41 个生产下载 |
| `BASE_PATH=/EAC-mojobox/` 下的构建及下载复核 | 通过，41 个生产下载；构建与复核使用相同环境变量 |
| `npm run build:demo`、`npm run verify:downloads -- dist-demo --allow-demo` | 通过，1 个演示归档 |
| 最终 `dist` 目录与 `collectSupply` 只读复核 | 18 个整合包、25 张插件卡，撤下入口及其下载均不存在；EAC 选出 13 个功能包，组件中没有 Navbar |
| 工作区差异调用 `checkSubmissionChanges` | 46 个变更通过身份、版本、历史归档与生成物边界检查；原有归档没有修改或删除 |
| `git diff --check` | 通过 |

上述增量检查直接验证未提交工作区，不冒称已运行只比较提交的 `check:submission` CLI 或远端 CI。
本次未修改网站 UI、Schema 或构建器；未进行插件安装、运行和用户配置迁移验收。

通用插件索引删除条目不触发下游自动卸载。已有用户若安装过 Navbar，应在宿主中自行核对并卸载；
Mojobox 不操作用户 Profile。workbench-lite 用户可改选 development，三个旧外观包用户暂不获得
当前推荐入口，不代表从历史安装中强制删除。现有 EAC 尚无正式在线批次与 receipt；若未来沿用
已经发出的历史批次，须按 [供货撤回规则](eac-supply-export.md) 显式撤回已消失的资源，不能把
本地目录删除当作已完成在线撤回。

回退可恢复 `49bb2a4` 中相应收录记录、网站标注和作者清单，并恢复 `suite-curation.json`
与相关回归约束；新增及历史归档均原样保留。目录回退不会回滚用户已安装的插件或配置。
