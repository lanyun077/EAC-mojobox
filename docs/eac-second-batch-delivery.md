# EAC 第二批草稿联调交付

日期：2026-10-09。本文所有路径均相对本次 ZIP 的根目录，不使用 Mojobox 本地缓存前缀。

交付已投递至 [下游 issue #6](https://github.com/look-back-lysj/deep-seek-harness-Unity/issues/6)，
正文包含可还原 ZIP 的 Base64 与提取方法，已回读核对字节。ZIP 为 37941 字节，SHA-256：
`71bcc66716a77e2561c918156cb9330b421b7b8c056aa2a569b4286519eabdd7`。
2026-10-10 用户转述两轮草稿可通过，不再要求逐批反馈；没有据此生成正式 receipt 或运行证明。

## 交付内容

承接 [首轮验收反馈](https://github.com/DSH-EAC/EAC-mojobox/issues/20#issuecomment-6074856545)。
试点两条记录已由下游验收，未进行安装。本批是完整读取与薄包字节核对测试，不是正式供货。

```text
full/batches/1/supply.json             25 条完整清单
full/batches/1/downloads/*.dshpack     14 个原始功能薄包
full/export-report.json               草稿状态、数量和跳过原因
schemas/eac-supply.schema.json
schemas/eac-supply-receipt.schema.json
vendor/eac/feature-pack-pack.schema.json
vendor/eac/LICENSE
fixtures/eac-supply/valid.json
fixtures/eac-supply/invalid-material.json
fixtures/eac-supply/valid-unresolved-pack.json
fixtures/eac-supply/invalid-unresolved-pack.json
LICENSE                              Mojobox 许可，不覆盖上游插件或素材许可
README.md                            本说明
verify-delivery.mjs                  离线字节与数量核对，不执行插件
delivery-manifest.json               成员路径、大小、SHA-256
```

25 条 = 14 个 `function-pack` + 10 个 `material` + 1 个无制品插件来源。
14 个功能薄包全部未解析组件，`execution.coverage: unknown`，无 `resolved`、无执行边。
单独正例摘取实际 `dev.dsh-eac.essentials@0.1.0`，仍指向完整目录中的同一个薄包。
反例基于该记录构造不存在的执行组件，必须拒绝；反例是测试数据，不进入完整清单。

## 路径与批次约定

“第二批交付”是第二轮沟通，不是正式供货发布序号 2。本批仍为独立草稿 `sequence: 1`，
修订为 `unity-local-20261009`。不要写入正式已接受序号或与另一份草稿拼接成发布历史。

`supply.json` 的 HTTPS 地址是规划地址，不能请求。以校验后的身份与精确版本，在本地
`full/batches/1/downloads/` 查找对应文件；映射只接受这 14 个允许文件，不从任意 URL 拼磁盘路径。
不改供货 JSON、不格式化、不重新打包后沿用旧摘要。`compatibilityReference` 在草稿中也使用
规划定位，只通过本地同字节薄包核对作者声明，不把该 URL 当已上线证据。

本批没有 `supply-receipt.json` 或正式账本。receipt Schema 用于后续对照，
`delivery-manifest.json` 只是交付文件清单，不是 receipt、签名或安全认证。

## 下游怎么验证

1. 还原 ZIP 后先核对整包的大小、SHA-256，再解压到新建隔离目录。
2. 核对 `delivery-manifest.json` 中每个成员。可在解压目录运行 `node verify-delivery.mjs`。
   该脚本只核对字节、数量、未知状态和真实正例绑定，不替代 Schema/语义校验；无需安装依赖。
3. 使用下游 `supply-draft-v0.1.0` 或明确版本的导入器读取 `full/batches/1/supply.json`，
   限制原始 JSON 为 8 MiB，再执行 Schema 与语义检查。
4. 识别 25 条记录；来源-only 与资料仍走不可安装展示，组合显示精确引用和未知执行关系。
5. 核对 14 个原始薄包的实际大小、SHA-256、根 `pack.json` 身份、组件和作者宿主要求。
   不将 Feature Pack 转成插件 tgz 或 legacy Pack/Lock，不生成占位 `releaseId`。
6. 接受 `valid-unresolved-pack.json`，拒绝 `invalid-unresolved-pack.json` 和 `invalid-material.json`。
   失败不得覆盖上一份可用测试结果。
7. 在独立测试副本中注入错误大小、错误摘要、重复身份或重排/格式化后误用旧摘要，明确拒绝。
   不修改原始交付目录，不更新预期摘要来“修复”错误。

## 不包括什么

- 不包含后来新收录的 14 个独立插件发行，它们尚未加入当前 supply 字段映射。
- 不包含 8 个外观薄包，当前供货分发政策仅允许 function；跳过原因在报告中明确列出。
- 不包含 10 套资料的原文件，只供固定来源资料记录；访问原资料另遵守对应素材许可。
- 不提供组件依赖闭包、插件安装制品、运行证明、假源码 commit 或正式 receipt。
- 部分组合引用 `dsh-soul-md@0.9.1`，来源-only 示例是 `dsh-better-sidebar@0.12.2`，
  与组合引用的 `0.24.1` 并非同一发行，不用同名来源记录顶替组件解析。
- 办公等组合含大型或额外服务依赖；本批只核对薄包，不承诺可离线安装或宿主兼容。

所有条目保持 `runtime: not-tested`。Mojobox 静态检查与 SHA-256 不等于安全认证，
下游真实安装与皮肤加载仍需独立隔离环境、人工授权和运行验收。

## 当时的反馈建议（历史记录）

以下是交付时的复核项目，现不再要求下游逐批回传，可供自行验收复用。

请附导入器固定版本/commit、Schema 与清单摘要，逐项反馈：25 条读取、14 个归档核对、
未解析组合展示、来源与资料安装隔离、正反例拒绝、错误字节与重复身份拒绝、失败保留旧结果。
附原始错误；没有执行安装的项目继续写“未执行”，不记为通过。
