# Mojobox × EAC 市场：供货格式优化建议 v1

日期：2026-10-04

状态：双方讨论稿，未定稿、未实现，不代表已经开放供货接口

面向：Mojobox 维护者、EAC 插件市场维护者

本文回应 [EAC 市场供货目录接口要求 v1](https://github.com/DSH-EAC/EAC-mojobox/blob/d6f60312f3edf2b05c20a43d5d510b7c8fe78e28/docs/eac-supply-requirements-v1.md)。
建议保留“固定 HTTPS 入口 + 静态 JSON + 精确产物 + 撤回记录”的方向，调整信息不完整时的处理、套餐结构和发布规则。

## 1. 先明确：我们交付什么

Mojobox 提供的是资源供货清单，不是安装计划，也不是市场内部数据库。

```text
作者提供插件、皮肤、整合包及声明
                 ↓
Mojobox 收录事实，静态检查，导出 EAC 供货清单
                 ↓
EAC 市场导入、核对、转换成自己的市场目录
                 ↓
市场展示；用户确认后由宿主安装器或加载器执行
```

一期建议采用“市场发布时导入”，而不是立即开发客户端多源订阅：

- Mojobox 增加一个 EAC 专用导出，不替换当前网站 `catalog.json`。
- 作者原始 `.dshpack`、`pack.json` 和插件产物保持原样。
- 市场实现 `supply.eac/v1` 导入器，转换成现有 `MarketIndex` v2。
- 市场保留自己现有的 `publication.sourceId`、发布序号和发行历史。
- Mojobox 的来源身份和发布序号用于记录供货批次，不冒充市场的发布身份。
- 不重新启用 Mojobox 冻结的 legacy Pack/Lock，不要求作者为接入市场重做整合包。

截至本次核对，市场源码 `8d2f53fd3b888149a0aa8c5d9708eb536ead771a` 的目录校验器接受 `MarketIndex` v1/v2，不能直接把本文清单作为现有市场目录读取。

## 2. 双方分工

| 工作 | 负责方 |
| --- | --- |
| 插件代码、皮肤素材、原始发布包、组合内容和更新 | 上游作者；DSH-EAC 自制组合由其明确署名的组合维护者负责 |
| 包名、版本、来源、下载地址、真实摘要与大小的收录和核对 | Mojobox |
| 兼容、依赖、冲突声明的原文与出处 | 作者提供，Mojobox 保存；未知不补造 |
| 许可与授权材料 | 作者提供或来源中已有，Mojobox 收录，市场按自身分发要求复核 |
| 读取清单、提取真实包元数据、导入内部目录 | EAC 市场 |
| 展示分类、推荐、评分和是否开放安装 | EAC 市场 |
| 本机环境判断、安装计划、启停、回滚 | 下游宿主安装器及对应加载器 |
| 运行验收及 `verified` 标记 | 下游在具体宿主和环境中验收后产生 |

静态检查通过不证明运行兼容、安全或安装成功。本文一期供货记录统一写 `runtime: "not-tested"`；以后接入运行证据需另行约定证据格式，不直接把该字段改成 `verified`。

## 3. 三个状态不要混用

| 概念 | 含义 | 不代表什么 |
| --- | --- | --- |
| `status: active` | 当前仍供给这条来源记录 | 不代表已经允许安装 |
| `status: withdrawn` | 停止供给这个版本，保留撤回记录 | 不自动卸载用户已安装内容 |
| 市场判定可安装 | 产物、来源、授权、兼容信息和安装入口满足下游规则 | 不代表已经运行验收 |

缺材料的内容可以作为“来源条目”展示；完整产物才能进入安装候选。`material` 永远不可安装。

不建议让 Mojobox 为普通插件直接声明 `installable: true`。安装资格由市场依据事实计算。

## 4. 目录顶层格式

```json
{
  "schemaVersion": "supply.eac/v1",
  "sourceId": "dsh-eac.mojobox",
  "sequence": 1,
  "revision": "2026-10-04.1",
  "generatedAt": "2026-10-04T12:00:00Z",
  "items": []
}
```

| 字段 | 规则 |
| --- | --- |
| `schemaVersion` | 固定 `supply.eac/v1`，仅在双方确认后成为正式 v1 |
| `sourceId` | 稳定的供货方标识，建议值 `dsh-eac.mojobox`；不能随批次变化 |
| `sequence` | 正整数，每次正式发布严格递增；重试发布完全相同字节不算新批次 |
| `revision` | 人类可读的批次编号，每个序号唯一对应一个编号，不复用 |
| `generatedAt` | UTC ISO 8601 时间；用于说明，不用于判断新旧顺序 |
| `items` | 完整供货快照，不是增量补丁；允许空数组 |

`sequence` 用来判断新旧，`revision` 用来沟通定位，两者不是重复功能。
同一批次不得重新生成时间后仍沿用旧序号；输入或输出字节变化必须发新批次。

### 类型范围

| `type` | 含义 | 一期处理 |
| --- | --- | --- |
| `plugin` | 独立功能插件 | 来源展示；满足市场条件后安装 |
| `skin` | 独立皮肤或主题插件 | 来源展示；核对真实加载方式后决定安装 |
| `function-pack` | 功能组件组合 | 原始薄包下载和组合展示；满足额外条件后组合安装 |
| `appearance-pack` | 外观组件组合 | 同上，不默认同时启用多套皮肤 |
| `material` | Prompt、说明等资料 | 仅展示与来源访问，不进入安装索引 |
| `skill` | 待明确格式的技能内容 | 保留需求，暂不作为 v1 接受类型，不承诺收到即可安装 |

不把现有 `workflow` 包强行映射到上述类型；没有双方确认的映射时不导出，并在构建报告说明原因。

## 5. 公共字段：来源展示的最小材料

所有正式 v1 类型都使用以下公共字段。

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `type` | 是 | 上表中一期接受的类型 |
| `packageName` | 是 | 插件用真实 npm 包名；组合用作者稳定 ID；资料用稳定资料 ID |
| `version` | 是 | 记录对应的精确 SemVer 版本，不允许 `latest` 或范围 |
| `name` | 是 | 来源中的展示名称，市场可另做展示润色 |
| `summary` | 是 | 简短客观介绍，不写“安全认证”“必定兼容”等推断 |
| `source` | 是 | 来源对象，见下表 |
| `status` | 是 | `active` 或 `withdrawn` |
| `runtime` | 是 | 一期固定 `not-tested` |
| `withdrawnReason` | 撤回时是 | 撤回原因；不得在日志或目录中泄露用户隐私 |

记录唯一键为 `packageName + version`，不是 `type + packageName + version`。同一产物不能通过换分类制造重复记录。
功能与外观是组合的分类；只引用一个皮肤的 `.dshpack` 仍属于 `appearance-pack`，不能冒充这个皮肤的 `.tgz`。

资料没有作者版本时，由资料记录维护者声明记录版本，明确这不是上游软件版本；不使用 `latest` 代替版本。

`material` 除公共字段外必须有 `installable: false`，不要求宿主兼容信息。
一期不允许它携带 `artifact`、`components` 或 `execution`，资料下载可通过来源页面提供，不复用安装产物字段。

### `source` 对象

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `url` | 是 | 作者仓库、发布页或资料页的 HTTPS 地址 |
| `commit` | 是，可为 `null` | 能核对时填写完整 40 位 Git commit；无法取得时如实填 `null` |
| `reference` | 否 | 辅助说明，例如发布标签或来源子目录；不能替代固定 commit |

展示可以接受 `commit: null`。如果市场正式发行要求完整 commit，缺失时先保持来源展示，不能编造提交或默认为仓库 HEAD。
仓库 commit 与产物摘要是两个事实，不能据此推断 npm 产物一定由该 commit 构建。

## 6. 插件和皮肤：有真实文件再提供产物

`plugin`、`skin` 在公共字段之外增加以下字段。

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `requiresDsh` | 是，可为 `null` | 保留作者精确版本或合法 SemVer 范围；未知为 `null` |
| `compatibilityBasis` | 是 | `author-declared`、`maintainer-target` 或 `unknown` |
| `compatibilityReference` | 非 unknown 时是 | 对应声明或组合目标的 HTTPS 出处 |
| `artifact` | 否 | 核对真实文件后填写；不存在时只展示来源 |
| `license` | 否 | 来源中的许可证声明，不用组合清单的 MIT 覆盖组件许可 |
| `authorization` | 否 | 有证据时填写授权对象；缺失表示尚未提供依据 |

`maintainer-target` 只表示维护者希望适配的目标，不是已证明的支持范围。
`requiresDsh: null` 必须搭配 `compatibilityBasis: "unknown"`；非 null 则必须说明依据。
市场还需核对真实 `package.json`、依赖和宿主能力；不能只依据这个字符串开放安装。
RC 版本按双方锁定的 SemVer 实现核对，不自行假定所有后续 RC 均兼容。

### `artifact` 对象

| 字段 | 规则 |
| --- | --- |
| `format` | 插件和皮肤为 `npm-tgz`；组合原始薄包为 `eac-feature-pack-v1` |
| `downloadUrl` | 匿名可下载的 HTTPS 文件直链；无 URL 凭据，不是 HTML 发布页面 |
| `sha256` | 原始下载文件字节的 SHA-256，统一 64 位小写十六进制，不带前缀 |
| `size` | 原始文件字节数，正整数，必须从真实文件计算 |

对象一旦提供，四个字段必须完整；不要放半个对象或未核验的猜测摘要。
同一 `packageName + version` 的产物字节不可替换；更换字节必须升版本。
下载地址可以换成同字节镜像，但摘要、大小和身份必须一致。镜像授权需要单独核对。
撤回后可以保留历史 URL；不要求继续托管危险或侵权文件，市场不得为接受撤回而强制下载它。

### `authorization` 对象

```json
{
  "basis": "license",
  "reference": "https://example.org/project/LICENSE",
  "redistribution": true
}
```

`basis` 为 `license` 或 `permission`；`reference` 指向依据；`redistribution` 为布尔值。
没有对象表示未知，`false` 表示已知不允许再分发，不能通过默认值变成 `true`。
代码、图片、壁纸、音频等许可范围不一致时，引用材料必须说明覆盖范围；市场不能仅凭一个 `true` 跳过复核。
缺材料时允许来源展示，不允许 Mojobox 或市场据此镜像分发；正式可安装发行还必须满足市场自己的授权门槛。

名称、作者、依赖、`package.json.dsh` 和原始元数据摘要可由市场静态提取，不要求 Mojobox 创建第二份同义 Manifest。
市场提取时应拒绝危险归档路径并限制大小，不运行插件、不执行安装脚本、不执行 npm 生命周期脚本。

### 最小目录示例：一个插件来源和一条资料

以下所有 `example.org` 地址、重复字符 commit、摘要和大小都是结构占位，不能发布为真实供货记录，也不属于下载验收正例。

```json
{
  "schemaVersion": "supply.eac/v1",
  "sourceId": "dsh-eac.mojobox",
  "sequence": 1,
  "revision": "2026-10-04.1",
  "generatedAt": "2026-10-04T12:00:00Z",
  "items": [
    {
      "type": "plugin",
      "packageName": "@example/editor-tools",
      "version": "1.0.0",
      "name": "编辑工具",
      "summary": "提供编辑辅助功能。",
      "source": {
        "url": "https://example.org/editor-tools",
        "commit": null
      },
      "status": "active",
      "runtime": "not-tested",
      "requiresDsh": null,
      "compatibilityBasis": "unknown"
    },
    {
      "type": "material",
      "packageName": "org.example.blue-skin-prompt",
      "version": "1.0.0",
      "name": "蓝色主题 Prompt 资料",
      "summary": "皮肤设计与复刻参考，不是可安装皮肤。",
      "source": {
        "url": "https://example.org/blue-skin-prompt",
        "commit": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
      },
      "status": "active",
      "runtime": "not-tested",
      "installable": false
    }
  ]
}
```

这是“可以导入并展示”的最小状态，不是“插件已经能安装”。
插件补齐真实 `artifact`、来源与授权，并完成市场核对后，才能进入安装候选。

例如，核验真实文件后，可以给上面的插件记录补充或替换以下字段；其余公共字段仍须保留：

```json
{
  "source": {
    "url": "https://example.org/editor-tools/releases/1.0.0",
    "commit": "ffffffffffffffffffffffffffffffffffffffff"
  },
  "requiresDsh": "0.2.0-rc.2",
  "compatibilityBasis": "author-declared",
  "compatibilityReference": "https://example.org/editor-tools/requirements",
  "artifact": {
    "format": "npm-tgz",
    "downloadUrl": "https://example.org/editor-tools-1.0.0.tgz",
    "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "size": 1024
  },
  "license": "MIT",
  "authorization": {
    "basis": "license",
    "reference": "https://example.org/editor-tools/LICENSE",
    "redistribution": true
  }
}
```

这个片段同样是占位示例，不证明该插件或这些地址存在；市场仍须静态检查真实包中的安装入口和元数据。

## 7. 皮肤追加字段：加载方式与未知信息分开

`skin` 增加 `appearance` 对象；组合为 `appearance-pack` 时也可提供同样的展示信息。

```json
{
  "appearance": {
    "loadingMode": "standalone-plugin",
    "skinIds": [],
    "skinIdsKnown": false,
    "conflicts": [],
    "conflictsKnown": false,
    "previews": []
  }
}
```

这是附加字段片段，不是一条完整记录。

| 字段 | 规则 |
| --- | --- |
| `loadingMode` | `standalone-plugin`、`loader-based` 或 `unknown`，按真实来源填写 |
| `loader` | 仅 `loader-based` 时必填，包含 `id`，可附作者声明的 `version` 和 `source` HTTPS 地址 |
| `skinIds` / `skinIdsKnown` | 已知注册 ID 的数组及信息是否已核对；未知时数组为空且布尔值为 false |
| `conflicts` / `conflictsKnown` | 保存已知冲突声明，以及是否已有作者声明或核对出处 |
| `conflictsReference` | `conflictsKnown: true` 时必填，给出 HTTPS 出处 |
| `previews` | HTTPS 图片地址数组，可以为空；有固定来源时优先固定，外部可变图片不算固定产物 |

`conflictsKnown: true` 表示已有对应范围的声明，不表示对全生态穷举验证；数组为空只能表示该范围内未记录已知冲突。
已有部分冲突线索但材料仍未核对时，允许非空数组配 `conflictsKnown: false`，供市场提示风险。
单个插件可能注册多个主题，因此使用 `skinIds` 数组，而不是强制单一 `skinId`。

独立主题插件不能被强制填一个不存在的 loader；未知加载方式不得直接进入皮肤切换流程。
市场应从真实包元数据核对皮肤协议和加载入口，不靠名称、目录分类或供货方自报猜测。
多皮肤组合的启用策略由作者声明、下游核对，不默认“安装后全部启用”。

## 8. 整合包：保留原始薄包，组件解析是额外能力

整合包本身可以是作者交付的 `.dshpack` 文件；市场使用的组合描述是它的导出视图，不替代原始文件。

- `artifact` 可提供原始 `.dshpack` 的地址、摘要、大小和格式，用于原样下载。
- 薄包 `artifact` 不得作为插件 `.tgz` 交给插件安装器。
- `components` 必须提供，至少一个，保留作者引用；不要求展示阶段每个组件都有下载直链。
- `execution` 必须提供，未知就明确写 `unknown`，不因缺少执行图阻止收纳和展示。
- `requiresDsh`、兼容依据及许可字段沿用第 6 节；清单许可证不替代组件许可证。

### 尚未解析组件的组合示例

```json
{
  "type": "function-pack",
  "packageName": "org.example.essentials",
  "version": "1.0.0",
  "name": "基础工具组合",
  "summary": "作者维护的基础功能组合，组件产物尚未解析。",
  "source": {
    "url": "https://example.org/essentials",
    "commit": "cccccccccccccccccccccccccccccccccccccccc"
  },
  "status": "active",
  "runtime": "not-tested",
  "requiresDsh": "0.2.0-rc.2",
  "compatibilityBasis": "maintainer-target",
  "compatibilityReference": "https://example.org/essentials/requirements",
  "components": [
    {
      "id": "editor",
      "ref": "@example/editor-tools",
      "version": "^1.0.0"
    }
  ],
  "execution": {
    "coverage": "unknown",
    "edges": []
  }
}
```

上述 `components[].version` 是作者的引用约束，不是已锁定发行版本；引用允许范围，不与顶层精确版本规则混淆。
`ref` 原样保留 npm、`github:owner/repo` 或 `builtin:目录名`；作者未写引用版本时省略组件 `version`，不默认补 `latest`。
`id` 是这个组合内的稳定组件标识，用于执行关系，不是市场的 `pluginId`。
`required` 可在作者明确声明后追加；缺失时由市场要求作者补齐，不能把“可选”或“必装”当成已确认事实。
原始清单的 `enabled` 如存在，原样保留为作者输入；它在当前 Feature Pack v1 是预留字段，不能直接视为经过验收的自动启用策略。

### 组件已有真实产物时

在组件中追加 `resolved`，引用同一快照中的独立插件或皮肤记录，不重复维护下载信息：

```json
{
  "id": "editor",
  "ref": "@example/editor-tools",
  "version": "^1.0.0",
  "required": true,
  "resolved": {
    "packageName": "@example/editor-tools",
    "version": "1.0.0",
    "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  }
}
```

目标记录必须 `active`、有完整 `artifact`，且包名、精确版本、摘要全部一致。市场再把它绑定到自己的真实 `releaseId`，不能生成假发行。
以上是假设已另行补齐目标产物后的片段；第 6 节最小示例尚未提供 `artifact`，不能拿来通过此绑定检查。
组件解析必须来自作者材料或独立核验记录；不能仅靠引用字符串猜测实际 `.tgz` 或填摘要。

一期组合安装只覆盖已绑定真实产物的组件。`builtin` 组件、GitHub 源码引用和其他需宿主专门解析的形式仍可展示，但没有另行确认的宿主能力协议时不开放组合安装。

### 执行关系

```json
{
  "execution": {
    "coverage": "complete",
    "reference": "https://example.org/essentials/execution",
    "edges": []
  }
}
```

`coverage` 为 `unknown`、`partial` 或 `complete`。`edges` 始终是数组。
`complete` 必须有核对出处 `reference`；它只表示当前组件集合的执行关系已完整整理，不表示已经运行成功。
已核对确实没有先后关系时，`complete + edges: []` 合法。

存在先后关系时，每条边使用如下结构：

```json
{
  "prerequisiteId": "context",
  "consumerId": "editor",
  "milestone": "installed"
}
```

两端必须引用当前组合的 `components[].id`，不能引用不存在的组件；不得自依赖或成环。
`milestone` 只接受 `installed` 或 `active`，分别表示前置组件装好或启用后才能继续。
此片段要求组合里确实有 `context` 和 `editor` 两个组件，不能直接加入上面的单组件示例。
依赖可选组件时必须说明选择规则；一期不实现复杂条件依赖，材料不足时保持展示。

### 市场开放组合安装的必要条件

1. 组合本身与参与安装的组件没有撤回。
2. 当前作者清单中的所有组件都已解析并绑定市场正式发行，版本满足原始引用约束。
3. 作者已明确必装、可选等参与策略；下游支持该策略。
4. 来源、真实包身份、摘要、大小、授权和安装入口通过市场核对。
5. `execution.coverage` 为 `complete`，执行图合法且有出处。
6. 宿主满足真实兼容与依赖条件，下游支持所需安装及启用步骤。
7. 用户看过计划并确认，由宿主执行；失败与回滚由宿主管理。

只有 `coverage: complete` 不足以开放安装。任一条件不满足，继续展示与提供已有原始下载，不伪装成一键安装成品。

## 9. 发布与撤回：固定入口、不可变快照

建议用一个固定 HTTPS 发布说明入口，例如 `supply-receipt.json`，指向该批次的不可变清单。
这样不需要动态后端，也不需要把 JSON 自身摘要写进 JSON 自身。

```json
{
  "schemaVersion": "supply-receipt.eac/v1",
  "sourceId": "dsh-eac.mojobox",
  "sequence": 1,
  "revision": "2026-10-04.1",
  "sourceCommit": "dddddddddddddddddddddddddddddddddddddddd",
  "catalogUrl": "https://example.org/releases/2026-10-04.1/supply.json",
  "sha256": "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  "size": 4096
}
```

- `sourceCommit` 是生成这次清单所用的 Mojobox 事实源完整 commit，不假称生成文件一定已提交到 Git。
- `catalogUrl` 必须可以下载该批次原始 JSON，不能只链接源码提交或已变化的最新目录。
- 发布时先上传并复核不可变快照，再更新固定发布说明；不要先公布一个尚未能下载的批次。
- 说明与清单的 `sourceId`、`sequence`、`revision` 必须一致。
- 相同序号只接受完全相同的说明与清单字节；不同字节拒绝。较低序号拒绝，不以时间覆盖顺序。
- 市场获取、核对、转换成功后再原子接受新批次；失败保留已接受目录并报告错误。
- 撤回记录必须保留，版本升级不能删除旧版本发行与撤回记录；Mojobox 需要额外保存供货历史，不只导出当前收录文件。
- 市场检查此前接受过的记录是否仍在快照中；没有撤回记录就消失属于非法快照。
- 撤回版本默认不能通过恢复 `active` 重新启用；若要恢复，需要双方另行约定显式审核流程。
- 市场成功接受撤回后关闭对应安装入口；是否另做安全提醒由市场处理，不自动操作用户环境。
- 已装组件撤回时，使用它的组合也必须停止对应安装路径，不能绕过组件状态。

撤回后的记录保留公共身份、原因及已知历史事实；不存在的未知字段无需为了撤回而补造。
保留“撤回记录”不等于永久公开或托管危险产物。

HTTPS 和 SHA-256 用于传输与字节核对，不是恶意代码检测，也不是独立的发布签名。
发布说明与清单放在同一站点不提供额外身份认证；市场必须预先登记并信任供货入口，限制下载大小与重定向，不接收任意输入的网址。
初始建议清单上限 8 MiB；产物上限、超时和重定向策略由市场既有下载安全规则控制。

## 10. 下游还需要做什么

不能只在市场配置里新增一个 URL。下游至少需要：

1. 校验发布说明、目录格式、来源身份、序号和撤回历史。
2. 将记录分成来源展示、资料展示、安装候选和不可安装组合。
3. 对安装候选匿名下载真实 `.tgz`，核对身份、摘要与大小，静态读取包元数据。
4. 补齐内部 `ReleaseRecord` 所需的 `metadataDigest`、大小、来源与授权记录；缺材料不能伪造通过。
5. 使用真实 `official-bundle` 或作者提供的 `dsh-std` 分支，不把 Mojobox 代维护投影伪装成作者 Manifest。
6. 将组合映射为市场 `MarketCollection`，绑定真实组件发行；不转换为旧公共 Pack/Lock。
7. 合并现有资源时检查包名、版本和摘要冲突；同包同版本不同字节必须拒绝，不静默覆盖。
8. 保存供货批次与内部发行的映射，发布撤回时保留自己的发行状态历史。
9. 通过自己的正式目录校验，再进入市场发布流程。

Mojobox 不必直接生成完整 `MarketIndex`，不负责补写推荐、评分、市场 UI 或本机安装事务。
客户端直接订阅多个独立源属于后续另一个任务，需要独立来源缓存、冲突规则和撤回传播，不能默认现有市场已经支持。

## 11. 最小落地顺序与验收

### 第一步：双方确认契约

确认本文字段、来源展示分支、发布导入模式和责任分工；共同确定 JSON Schema 与正反测试样本。
本文未创建正式 Schema，不得仅凭文档宣称接口已经可用。
正式 v1 按类型限定字段，不静默接受未知类型或把未知安装字段传给宿主。
不兼容改动发布新版本端点；旧版保留时间在定稿时约定，不能只写含糊的“一个版本周期”。

### 第二步：一个真实插件 + 一条资料

选择许可明确、能匿名下载、元数据和官方安装入口可核验的简单插件。
Mojobox 导出真实记录；市场导入、提取元数据并通过内部目录校验。
资料只展示，任何安装路径都不能接受 `material`。
插件安装测试使用隔离环境；静态校验和运行验收分别记录。

### 第三步：一个真实皮肤

核对皮肤真实协议、独立入口或 loader、已知冲突及预览来源，不补造未知信息。
市场区分“可下载”“可安装”“可切换”，不能把三者视为同一能力。

### 第四步：一个小组合

先验证未知依赖图时只展示，再验证真实组件绑定、执行图与隔离安装。
作者补材料不设虚构交付日期；组合安装不阻塞其他资源的来源展示。

### 必测反例

| 输入或事件 | 预期 |
| --- | --- |
| 顶层版本是 `latest`、重复身份或未知类型 | 拒绝批次并保留已接受目录 |
| 没有插件 `artifact` | 接受为来源展示，不生成安装发行 |
| 产物摘要、大小或包内身份不匹配 | 拒绝该安装候选，不发布损坏产物 |
| 宿主要求精确 RC2、当前宿主是 RC1 | 不扩大范围；按真实规则提示不满足 |
| 独立主题未声明 loader | 不因缺 loader 拒绝来源展示，不假造加载器 |
| 皮肤冲突未知 | 显示未知，不表示已验证无冲突 |
| `complete + edges: []` 有核对出处且确实无关系 | 关系层合法，仍检查其他安装条件 |
| 执行图引用不存在的组件或形成环 | 拒绝组合安装，不执行部分计划 |
| 组合中有未解析或已撤回组件 | 保持组合展示，关闭组合安装 |
| 资料带 `installable: true` 或安装型 `artifact` | 拒绝资料记录；资料不允许冒充安装产物 |
| 刷新得到旧序号、同序号不同字节、历史记录无撤回就消失 | 拒绝批次，保留已接受状态 |
| 新批次正常撤回插件 | 接受撤回，阻止新安装并传播到相关组合 |

安装候选核对失败可以产生审查报告，但不允许自动接受半份快照或跳过其中的撤回；发布前必须明确哪些记录仅供展示，并完整校验最终目录。

## 12. 请 EAC 市场确认的事项

1. 是否同意一期由市场在发布流程导入，不要求 Mojobox 生成市场私有目录或实现客户端多源订阅？
2. 是否同意缺产物、兼容未知的插件，以及组件未解析的整合包，只展示、不安装？
3. 是否同意允许精确宿主版本，兼容声明不由 Mojobox 擅自扩大？
4. 是否同意独立皮肤不强制 loader，未知注册 ID、冲突和预览不补造？
5. 市场正式安装发行的 commit、授权和元数据材料，哪些由市场提取、哪些必须由作者或供货方补齐？
6. 是否同意固定发布说明入口、不可变清单、递增序号及保留撤回历史？
7. 谁提供 v1 导入器与可执行校验样本，首个真实样本选哪个插件？

双方确认后再确定实际 HTTPS 地址、正式 Schema 和交付时间。当前不把占位字段、未完成的导入器或未经测试的安装能力当成已经上线。

## 13. 建议结论

我们认可静态供货目录的方向。Mojobox 提供“有什么、从哪来、文件是否对应”的事实，市场负责审核、展示和安装资格，宿主与加载器负责实际执行。

先以一个插件和一条资料跑通真实链路；皮肤与组合逐步增加。供货格式可以表达不完整材料，但不能把未知写成保证，也不能为了对接改变作者原始产物。
