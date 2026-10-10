# Issue #20：首轮草稿联调文件交付

交付日期：2026-10-05；状态更新：2026-10-10。

对应 [下游 issue #20](https://github.com/DSH-EAC/EAC-mojobox/issues/20)。
问题是交付文件不可达，不是网络端口冲突；本轮不需要开启本地 HTTP 服务或合并 main。

## 当前状态

ZIP 与说明已公开交付：[草稿 ZIP](https://github.com/user-attachments/files/33049184/mojobox-eac-pilot-draft-20261005.zip)、
[原交付说明](https://github.com/user-attachments/files/33049192/eac-issue-20-delivery.md)。
[下游首轮反馈](https://github.com/DSH-EAC/EAC-mojobox/issues/20#issuecomment-6074856545)
记录了两条来源读取、资料安装隔离和反例拒绝通过，未执行安装。文件不可达的阻塞已解除。

源码随本次开发分支提交；以下记录追溯当时附件，不改写历史 ZIP 或成员摘要。

本地交付目录为 `.cache/eac-issue-20-delivery-20261005/`：

- `mojobox-eac-pilot-draft-20261005.zip`：交付附件，11895 字节。
- `SHA256SUMS.txt`：ZIP 原始字节 SHA-256。

ZIP SHA-256：

```text
16f5188a1dff4c0fa81db737a0a216d3dd55a00f9fd3bbbc6c1483c3f80e2bfa
```

## 附件内容与复核

```text
schemas/eac-supply.schema.json
schemas/eac-supply-receipt.schema.json
pilot/batches/1/supply.json
pilot/export-report.json
fixtures/eac-supply/valid.json
fixtures/eac-supply/invalid-material.json
docs/eac-downstream-usage-guide.md
delivery-manifest.json
```

`delivery-manifest.json` 记录另外 7 个文件的路径、字节数及 SHA-256；它是附件文件清单，不是正式供货 receipt。
所有既有文件原样打包，没有修改换行、编码或 JSON 内容。两份 Schema 和试点清单与 issue 中的预期指纹完全一致。

补齐报告指纹：`pilot/export-report.json` 为 445 字节，SHA-256 为
`613b10d4ccafb5b1804b3f2159fb9b1a6a0a0ffa19af5c4570a7883dfd3c64b0`。

本次验证：ZIP 内全部 8 个成员逐字节等于待打包文件；试点清单通过参考校验；合法 fixture 接受，非法资料 fixture 拒绝；
`node --test scripts/eac-supply.test.mjs` 16/16 通过。未运行下游导入器或执行插件安装。

## 当时的 Issue 回复草稿（历史记录）

以下是当时的交付正文草稿，附件已交付，无需重复发送：

> 已按本 issue 的最小交付集提供草稿 ZIP，额外附上正反 fixture、使用指导及逐文件指纹清单。
>
> 附件：`mojobox-eac-pilot-draft-20261005.zip`，11895 字节。
>
> ZIP SHA-256：`16f5188a1dff4c0fa81db737a0a216d3dd55a00f9fd3bbbc6c1483c3f80e2bfa`。
>
> 两份 Schema 和试点清单的指纹与本 issue 一致。补齐报告：`pilot/export-report.json`，445 字节，SHA-256 为 `613b10d4ccafb5b1804b3f2159fb9b1a6a0a0ffa19af5c4570a7883dfd3c64b0`。解压后可按 `delivery-manifest.json` 核对各文件。
>
> 本批只有两条来源记录，没有插件安装制品。请只使用本地草稿入口，不请求 JSON 中的规划地址，不进入正式市场，不记录正式已接受序号。本批没有正式 receipt，附件清单也不能替代 receipt。
>
> 认可下游自行补充未解析组合的纯展示模型，Mojobox 不补造发行或占位 releaseId。请在收到并核对附件后，继续本 issue 的首轮读取、拒绝非法资料与展示反馈；完整样本留待第二轮。

发送 ZIP 时不要通过编辑器另存包内文件。摘要只用于确认文件一致，不是发布签名或安全认证。
下游收到后先计算 ZIP SHA-256，再解压并核对成员摘要；无须克隆 Mojobox，也无须启动网络服务。
