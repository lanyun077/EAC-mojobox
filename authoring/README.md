# DSH-EAC 自制薄包

这里保存用户授权 DSH-EAC 编写的功能与皮肤包清单。我们维护插件组合，上游作者维护插件代码；
这些包不是上游作者发布的整合包，也不是来源仓库的代码镜像。

## 事实源

- `packs/<id>.json`：我们编写的根 `pack.json` 原始字节。
- `upstream-snapshot.json`：2026-10-01 核对的 26 份组件元数据，含 GitHub 星数、固定提交、
  package/README 摘要，以及 npm 版本、gitHead 和 registry 声明的 dist integrity。
- `suite-curation.json`：2026-10-03 对 EAC/AIO 69 个组件的逐项去留记录、当前功能包与互斥策略。
- `curation-sources.json`：69 项 registry 观察、17 个已实际核验的选中 npm 成品，以及官方 RC2
  peer 规则来源。包含实际 SHA-256、大小、identity/integrity、package 投影与文件摘要。
- `../catalog/feature-packs/<id>.json`：分类、来源、许可范围、皮肤预览和归档摘要。
- `../artifacts/<id>-<version>.dshpack`：我们交付给 Mojobox 的正式归档。

2026-10-01 的历史快照只核对元数据；2026-10-03 的新快照已下载核验选中 npm tarball。
公开仓库只保存元数据，第三方代码留在 ignored 缓存，没有执行插件。GitHub 提交、npm gitHead
与版本是不同事实，不能据此推断仓库 HEAD 和已发布字节相同；GitHub 引用不能锁提交。

选型先读 [插件常客与候选](../docs/plugin-shortlist.md) 和
[首批收录说明](../docs/ecosystem-curation.md)。已有 Power Toolbox 的清单也已恢复到这里，
重复打包得到原始归档摘要，不改动其发布字节。

当前功能组合见 [减重与分类说明](../docs/suite-curation.md)。新增七个包为 `0.1.0`，原七个
功能基底以稳定 ID 升级到 `0.2.0`，旧归档原始字节保留。所有当前功能包共享同一批引用版本。

## 打包与核对

在仓库根目录运行：

```powershell
node authoring/build.mjs
node authoring/build.mjs --check
npm test
npm run build
npm run verify:downloads
git diff --check
```

打包器只读取本目录清单，在内存中生成 ZIP，并复用现有 Feature Pack 检查器。
所有清单通过后才创建缺失归档；已存在的同版本字节不同会报错，不能覆盖。
ZIP 时间固定、文件模式固定，只含根 `pack.json`，相同输入产生相同摘要。
`--check` 不写文件，并核对重建字节、归档身份、作者、许可证与收录摘要。

新增包时先生成归档，再按输出的真实摘要填写收录记录。后续更新已交付包要递增版本并更新记录，
不得把修改过的清单继续标为原版本。新贡献仍走 Mojobox 的原始归档收录流程；站点构建不会调用
本打包器，不替第三方作者重新打包。

## 选型纪律

功能基底按场景选择，皮肤独立成包。`plugins` 写明确版本，npm 选已发布版本；GitHub 引用不能
携带 commit，其 `version` 只是声明，固定提交只作为来源记录。不要写来源不可核验的包名。

本次新功能包以 `0.2.0-rc.2` 为精确目标，表示我们的组合目标，不是运行验收。皮肤保留上游
依赖声明与限制，不替所有皮肤统一编造内核支持范围。未知皮肤 ID 不推断；loader 只在上游实际
要求时声明。`conflicts` 只记录已知冲突，缺少条目不表示无冲突。
新包和更新版本需要声明合法 `requires.dsh`，外部插件引用须为精确版本。已有 8 个未声明
内核的皮肤 `0.1.0` 归档按真实摘要保留历史例外，仍可原样重建；更新不继承例外。
作者确认支持范围后递增包版本、创建新归档并更新收录摘要，详见[版本声明策略](../docs/intake-version-policy.md)。

清单的 MIT 只覆盖 DSH-EAC 编写的清单与说明，不重新许可插件、壁纸、人物或游戏素材。
安装、依赖解析、启停和运行验证仍由宿主或 loader 负责。

`conflicts` 同时记录已知重叠和作者选定的单选组合策略。互斥的展示、记忆与布局方案不应直接
跨分类叠加；组合策略并不证明每一对插件都有运行故障。`scripts/curation.test.mjs` 防止排除项
重入、共享版本漂移或互斥实现同包，不模拟插件运行或扩展安装器。
