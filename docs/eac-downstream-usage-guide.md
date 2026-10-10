# EAC 市场下游使用指导：本地供货联调

初稿：2026-10-04；状态更新：2026-10-10。

首轮附件与第二轮完整草稿已交付，用户转述两轮可通过，不再要求逐批反馈。
交付记录见[首轮](eac-issue-20-delivery.md)与[第二轮](eac-second-batch-delivery.md)。
本文继续说明既有 `supply.eac/v1` 草稿；新收录插件使用独立的[插件来源接口 v1](plugin-source-api-v1.md)，
下游需一次接入，不会自动进入旧批次。

面向：EAC 插件市场维护者。本文只说明本地文件对接，不涉及公网部署。

## 1. 现在要做什么

Mojobox 已有供货导出器第一版。请先让市场读取本地 `supply.json`，完成校验、来源展示、资料展示及整合包展示。

```text
Mojobox 生成文件 → 交付本地文件 → EAC 校验并转换 → 测试目录展示
```

当前不要求打通安装，更不能把这批草稿直接导入正式市场发行。

依据是 [供货格式优化建议](eac-supply-format-proposal-v1.md)和
[下游首轮回复](https://github.com/DSH-EAC/EAC-mojobox/blob/8697f96b9f9274e516021699edf8953cdf0211fc/docs/eac-supply-consensus-v1.md)。
Schema 随源码提供；复现交付时应使用对应附件的同字节 Schema，不将草稿认可当成安装或正式发布验收。

## 2. 必须先合并 main 吗

不需要。联调可以使用提供的文件，或双方确认的开发快照。

实现与依赖事实源随本次开发分支提交。使用 Git 联调时，以实际远端分支和固定 commit 为准，
不依赖维护者本地未提交文件，也不必等 main 合并。

- 只测试读取数据：Mojobox 提供 Schema 和导出文件即可，不需要下游克隆本项目。
- 测试参考校验器和自行重新导出：取得包含实现与依赖事实源的完整源码提交，再执行 `npm ci`；不能只拉旧提交。
- 用 Git 交付：双方固定源码 commit；样本输出是生成物，不会随分支自动提供。
- 正式导出：CLI 要求干净、已提交的工作区，技术上不要求分支名必须为 main；正式发布仍应按项目审核流程执行。

源码审核、草稿读取、真实安装与正式供货是不同验收范围，应分别记录。

## 3. 下游需要拿到哪些文件

### 只读数据的最小交付

| 文件 | 用途 |
| --- | --- |
| `schemas/eac-supply.schema.json` | 校验供货清单的候选结构 |
| `schemas/eac-supply-receipt.schema.json` | 后续正式批次的发布说明候选结构；草稿没有 receipt |
| 试点输出目录的 `batches/1/supply.json` | 两条真实来源数据，优先用于首次读取测试 |
| 同目录的 `export-report.json` | 确认是草稿、查看检查范围和警告 |
| 本文 | 导入方式、分工和验收要求 |

需要测整合包时，再提供完整导出目录。不能只交 `supply.json` 而漏掉对应薄包文件。

### 当前本地样本

| 样本 | 本地路径，均相对 Mojobox 仓库根目录 | 内容 |
| --- | --- | --- |
| 试点 | `.cache/eac-supply-draft-pilot-1/` | 1 个插件来源 + 1 条资料 |
| 完整 | `.cache/eac-supply-draft-full-1/` | 14 个功能整合包 + 10 条资料 + 1 个插件来源 |

这些目录被 Git 忽略，不会随代码分支自动交付。需连同样本文件提供给下游，或者由对方取得完整源码后自行生成。
目录中的 HTTPS 地址只是导出时生成的定位信息；本轮不要据此发起网络请求。

### 测试与参考实现

- `fixtures/eac-supply/valid.json`：合成合法结构样本，不用于生产供货。
- `fixtures/eac-supply/invalid-material.json`：资料伪装可安装的非法样本，必须拒绝。
- `scripts/eac-supply.mjs`：参考结构与语义校验器。
- `scripts/eac-supply.test.mjs`：协议、历史、输出与真实来源的本地测试。

参考脚本依赖 Mojobox 的其他模块、Schema 和政策文件，不是拷贝一个 `.mjs` 就能独立运行的单文件 SDK。
下游不必长期引入整个 Mojobox 工程；可在自己的仓库实现等价校验，并用共同样本对照结果。

## 4. 首轮样本应该怎样显示

| 记录 | 下游显示 | 下游不得做 |
| --- | --- | --- |
| `dsh-better-sidebar@0.12.2`，`type: plugin` | 插件来源条目、名称、版本、来源链接；明确材料未齐 | 生成安装发行、猜下载地址、假造 commit 或显示已验证 |
| `dev.dsh-eac.skin-prompt.blue-fantasy@1.0.0`，`type: material` | 蓝色幻想 Prompt 资料、介绍与固定来源；明确不可安装 | 放入插件安装列表，转换成皮肤 `.tgz` 或增加安装按钮 |
| 完整样本中的 `function-pack` | 名称、版本、组件引用、作者声明的宿主要求、薄包信息 | 在组件未解析、执行图未知时开放一键安装 |

首个插件没有 `artifact`，`requiresDsh: null`、`compatibilityBasis: unknown`，源码 commit 也未知。
`license: MIT` 是来源声明，不等于已提供完整授权材料。

功能整合包的 `artifact.format` 是 `eac-feature-pack-v1`，文件是薄 `.dshpack`，不是插件 `.tgz`。
其 `components` 尚无 `resolved`，`execution.coverage` 为 `unknown`，所以本轮只能测试展示和原始文件核对。

当前 8 个外观包被现有分发政策排除，完整样本不会包含它们；这是报告中的明确跳过，不是下游漏解析。
Schema 支持外观包和独立皮肤，不意味着这次交付已经有可安装皮肤样本。

## 5. 下游导入器按这个顺序做

1. 接受明确指定的本地文件路径，读取原始 UTF-8 字节，先限制大小为 8 MiB，再解析 JSON。
2. 校验 `schemaVersion: supply.eac/v1`、约定 `sourceId`、字段类型和每类记录允许的字段。
3. 继续做语义校验：身份唯一、精确版本、兼容声明一致、组件 ID 与执行关系合法等；仅 Schema 通过还不够。
4. 将记录转成下游自己的展示模型，不直接当成 `MarketIndex` v2。
5. 草稿结果只写入独立的测试目录或测试数据集，不更新正式目录，也不保存为正式已接受供货序号。
6. 导入失败明确返回错误，保留上一份可用测试结果，不生成半份安装目录。

供货身份是 `packageName + version`，不是 `type + packageName + version`。
`sourceId: dsh-eac.mojobox` 属于供货方，不替换市场自己的 `publication.sourceId`。

### 记录转换建议

- 无 `artifact` 的插件或皮肤，走来源展示分支；不要创建假 `ReleaseRecord`。
- `material` 走纯资料展示分支；所有安装 API 均拒绝此类型，而不只是页面隐藏按钮。
- 未解析整合包走独立组合展示模型。现有 `MarketCollection` 要求真实组件发行绑定，不能为展示塞入占位 `releaseId`。
- 如果当前市场目录尚不能保存资料和未解析组合，应先增加下游的纯展示表达或测试模型，不在 Mojobox 中补造发行。
- 缺少字段就按未知显示，不使用 `latest`、`*`、空 commit 或 `verified` 当默认值。
- 名称、简介和来源都是外部输入，渲染时转义文本、限制链接协议，不能直接作为可信 HTML 插入。

字段层面的正式约束以本次交付 Schema 和共同确认的语义测试为准。若下游现有模型接不住，请反馈缺口，不静默丢弃或升级安装资格。

## 6. 不联网怎样核对薄包

完整导出目录中，原始归档位于：

```text
batches/1/downloads/<packageName>-<version>.dshpack
```

下游按经过校验的包 ID、精确版本和批次号，在提供的目录中寻找文件，再核对：

1. 实际字节数等于 `artifact.size`。
2. 原始字节的 SHA-256 等于 `artifact.sha256`，后者为 64 位小写十六进制、不带前缀。
3. 若检查归档内容，静态读取根 `pack.json`，核对身份和组件，不执行任何插件。

本地测试可以另外保存“供货 URL → 本地文件”的测试映射，但不能修改供货 JSON 中的下载地址来冒充正式批次。
映射只接受提供目录内明确允许的文件，不能把任意 URL 路径直接拼接成磁盘路径；必须防止路径穿越和符号链接逃逸。
原始摘要检查前不要重新打包、格式化或修改文件。

## 7. 拿到完整 Mojobox 源码后怎样自测

要求 Node.js 22.12 或更新的受支持版本。以下命令在 Mojobox 仓库根目录执行，不在市场仓库执行。

```powershell
npm ci
node --test scripts/eac-supply.test.mjs
```

直接校验已交付的试点文件：

```powershell
node --input-type=module -e 'import {readFile} from "node:fs/promises"; import {validateSupply} from "./scripts/eac-supply.mjs"; const file=".cache/eac-supply-draft-pilot-1/batches/1/supply.json"; const bytes=await readFile(file); if(bytes.length>8388608) throw new Error("Supply exceeds 8 MiB"); const document=validateSupply(JSON.parse(bytes.toString("utf8"))); console.log({items:document.items.length,sourceId:document.sourceId});'
```

预期得到 2 条记录和 `sourceId: dsh-eac.mojobox`。这只证明清单通过参考校验，不代表市场导入器已通过或插件可以安装。

需要重新生成试点时：

```powershell
npm run export:eac -- --draft --pilot --public-url https://example.org/mojobox/supply/ --sequence 1 --revision downstream-local-1 --generated-at 2026-10-04T12:00:00Z --output .cache/eac-downstream-local-1
```

`example.org` 只是定位占位，不会被导出器访问；重新生成后文件摘要可能与已交付样本不同。
输出目录不能已存在；再次运行换一个新目录。去掉 `--pilot` 即生成完整样本。
不要去掉 `--draft` 来绕过草稿边界，也不要伪造正式 receipt。

## 8. 草稿与正式批次的区别

| 内容 | 当前草稿 | 后续正式批次 |
| --- | --- | --- |
| `supply.json` | 有，用于测试 | 有，必须绑定发布说明 |
| `export-report.json` | `draft: true` | `draft: false` |
| `supply-receipt.json` | 没有，不能伪造补齐 | 有，包含来源 commit、批次、摘要和大小 |
| `export-state.json` | 没有 | Mojobox 维护的发行账本，不是市场内部状态 |
| 可以写进正式市场 | 不可以 | 通过下游全部审核与发布门禁后才可以 |

`supply.json` 本身没有 `draft` 字段，因此不能仅靠它的 Schema 通过判断正式资格。
本地草稿入口和正式接受入口必须分开；正式入口缺少有效 receipt 或可信交付上下文时拒绝。

后续正式文件交付也不必先依赖公网。市场可以先从本地 receipt 与清单核对原始字节、大小及
`sourceId`、`sequence`、`revision` 一致性；正式发行还需核对可信来源及自己的发布要求。
较旧序号拒绝，同序号不同字节拒绝，撤回记录保留；撤回组件对应的组合安装也必须关闭。
获取和转换失败保留已接受目录，不自动卸载用户内容。

## 9. 下游请返回这些结果

| 检查 | 本轮期望 |
| --- | --- |
| 读取试点 JSON | 成功，识别 2 条记录 |
| 插件来源展示 | 成功，安装入口关闭 |
| 蓝色幻想资料展示 | 成功，所有安装路径拒绝 |
| 读取完整 JSON | 成功，识别 25 条记录及其类型 |
| 14 个薄包字节核对 | 摘要与大小一致，不转成插件产物 |
| 未解析组合展示 | 成功，组件和未知执行状态如实显示，一键安装关闭 |
| 非法资料 fixture | 拒绝，不修改已接受结果 |
| 格式化后误用原摘要、同版本换字节、重复身份 | 拒绝，不静默修正 |
| 撤回与旧序号等规则 | 用独立测试状态与合成数据验证，不发布假撤回 |

反馈请附：使用的 Schema 摘要或固定代码版本、样本文件摘要、导入器版本、通过和失败项目、
错误原文、是否需要新增纯展示模型。不要仅回复“能读 JSON”，也不要把未执行的安装测试填写为通过。

本轮成功标准是：下游能可靠读取、校验并正确展示真实来源，不能安装的内容保持不能安装。
真实插件产物核验、皮肤加载与整合包安装属于后续独立验收，不阻塞此次文件对接。

## 10. 本次交付文件指纹

以下为本文编写时实际文件原始字节的 SHA-256。字节或换行变化后必须重新计算，不能继续套用这些值。
摘要用于双方确认拿到了相同文件，不是安全认证或发布签名。

| 文件 | 字节数 | SHA-256 |
| --- | --- | --- |
| `schemas/eac-supply.schema.json` | 8308 | `a8688d0f3b69108393e4400a579cf09518d6f4468dd1cc29b62fd3950e945ca1` |
| `schemas/eac-supply-receipt.schema.json` | 909 | `21f98f22dea9f8d9a63fa4f2a0ee3b29fca62460581736f9ca454bd279d49740` |
| 现有试点 `batches/1/supply.json` | 1238 | `9200353a55836cdb0e8f69e4a751cf4fa2dbaaf99a4bd363acd392be8073b95e` |
| 现有完整 `batches/1/supply.json` | 34615 | `6f7ba917db7125b4b91b463f0fbef6cb2aa82a13e2b32316342baa32b46f84a6` |

PowerShell 本地复核示例：

```powershell
Get-FileHash .cache/eac-supply-draft-pilot-1/batches/1/supply.json -Algorithm SHA256
```

推荐先交付试点文件和两份 Schema，拿到下游读取与展示反馈，再交付完整样本。不需要先合并 main，也不需要先解决公网部署。
