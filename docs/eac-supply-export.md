# EAC 供货导出器

状态（2026-10-10）：导出实现随本次开发分支提交。首轮文件已交付并收到读取与隔离反馈，
第二轮完整草稿也已交付；用户转述两轮可通过，不再要求逐批反馈。未生成正式发布 receipt，
没有据此声称插件已安装或供货已公网部署。记录见[首轮](eac-issue-20-delivery.md)与[第二轮](eac-second-batch-delivery.md)。

新增 26 条轻量插件信息卡由独立的[插件来源接口 v1](plugin-source-api-v1.md)提供，
不自动加入本导出器；旧批次契约与政策选择保持不变。

依据：[供货格式优化建议](eac-supply-format-proposal-v1.md)及
[下游回复](https://github.com/DSH-EAC/EAC-mojobox/blob/8697f96b9f9274e516021699edf8953cdf0211fc/docs/eac-supply-consensus-v1.md)。

## 做什么、不做什么

```text
Mojobox 现有事实源 → 原样归档检查 → supply.eac/v1 清单与发布说明
                                            ↓
                                EAC 自己实现导入、审核和安装
```

- 不修改作者的 `.dshpack`、`pack.json` 或插件代码。
- 不替换网站目录，不读取本机内核，不执行或安装插件，不联网抓取插件。
- 不生成 EAC 的私有 `MarketIndex`、假 `releaseId` 或 legacy Pack/Lock。
- 不创建账号系统、榜单或评分；这些不受供货分工限制，双方各自产品可独立建设。
- `active` 只代表供给记录有效，绝不代表已允许安装；运行状态固定 `not-tested`。

## 当前导出范围

| 来源 | 输出 | 限制 |
| --- | --- | --- |
| `policies/eac-supply-selection.json` 指定的独立插件 | `plugin` 或 `skin` 来源展示记录 | 初始选择 `dsh-better-sidebar@0.12.2`；不自动猜测其安装产物和授权 |
| `catalog/feature-packs/` 与 `artifacts/` | 功能及外观组合，原始归档地址、SHA-256 和大小 | 遵守 `distribution.json.packCategories`；`workflow` 未映射，跳过并报告 |
| `catalog/skin-prompt-packages/` 与其固定来源 | `material` | 不可安装，不提供安装型 artifact |

`--pilot` 只导出所选独立插件及 `blue-fantasy` 资料，不导出整合包。
无该选项时导出全部允许分发的整合包和资料，独立插件仍按显式选择收录。

### 为什么首个插件暂时只有来源

现有插件记录有 URL 和摘要，但导出器尚未读取并核对 `.tgz` 的实际字节、大小和包内身份，
固定源码提交、兼容依据及授权也没有在该记录中完整核实。因此不把旧记录的字段直接拼成安装发行。
当前清单可以测试双方导入与展示，不能代替首个真实插件产物的安装对接验收。
下一步核验作者发行材料，再增加有明确核验事实源的插件产物导出；不得把维护者投影当成作者原始 Manifest。

### 版本与未知信息

- 插件身份、版本与来源来自原始插件记录；不把标签自动转换成 commit。
- 整合包兼容要求、组件版本与预留 `enabled` 原样读取 `pack.json`。
- 组件 `id` 使用原始唯一 `ref`，避免因列表排序变化改掉关系标识。
- 不推断 `required`、`resolved` 或执行图，组合固定 `coverage: unknown`。
- 没有 loader 声明时加载方式为 `unknown`，不擅自推断为独立插件。
- 已有皮肤 ID 保留，冲突未经出处核对时 `conflictsKnown: false`；预览不是安装证据。
- 资料的供货记录版本由 `policies/eac-supply-selection.json.materialVersions` 明确维护，
  初始为 `1.0.0`，不是上游软件版本。来源变化时必须升资料记录版本，不能悄悄覆盖同版本来源。

## 本地生成草稿

以下公网地址只是规划地址，运行命令不代表它已经上线。草稿内容不可作为正式发布提交给市场。

```powershell
npm run export:eac -- --draft --pilot --public-url https://dsh-eac.github.io/EAC-mojobox/supply/ --sequence 1 --revision draft-pilot-1 --generated-at 2026-10-04T12:00:00Z --output .cache/eac-supply-draft-pilot-1
```

需要查看全部内容时去掉 `--pilot` 并使用另一个输出目录。
每次使用新的 `.cache/` 子目录；已经存在的输出不会覆盖。
相同输入、时间、批次和公开地址得到相同字节，没有隐式当前时间或网络输入。

草稿输出：

```text
.cache/eac-supply-draft-pilot-1/
├── batches/1/supply.json
└── export-report.json
```

完整导出还会在同批次目录复制薄包下载和本地预览，都是检查过的原始字节。
`export-report.json` 记录导出数量、跳过分类和检查范围，不进入供货清单的 `items`。

## 正式批次

只能在本次代码和事实源完成审核、提交后，从干净 Git 工作区生成。输出仍在 ignored `.cache/`，不自动提交、推送或部署。
CLI 在收集前后都检查工作区及 HEAD，避免把未提交内容伪装成 `sourceCommit`。

初次发布明确使用 `--first-release`，不能将其用于重置已有线上历史：

```powershell
npm run export:eac -- --first-release --pilot --public-url https://dsh-eac.github.io/EAC-mojobox/supply/ --sequence 1 --revision 2026-10-04.1 --generated-at 2026-10-04T12:00:00Z --output .cache/eac-supply-release-1
```

正式输出另有：

```text
supply-receipt.json    固定入口候选；包含批次 URL、原始 JSON 摘要、大小和事实源 commit
export-state.json      维护者保存的本地发行账本；防止重新使用历史批次编号
```

后续发布必须提供上一份完整正式输出目录：

```powershell
npm run export:eac -- --previous .cache/eac-supply-release-1 --pilot --public-url https://dsh-eac.github.io/EAC-mojobox/supply/ --sequence 2 --revision 2026-10-04.2 --generated-at 2026-10-04T13:00:00Z --output .cache/eac-supply-release-2
```

导出器核对上一清单原始字节与 receipt，再核对账本。序号必须为上一序号加一，编号不能复用。
调用方必须保存每份正式输出及其账本；不能把 `.cache/` 作为唯一永久备份。
当前没有线上发布系统，不会自动知道公网最新批次；正式部署必须由维护者核对线上最新 receipt，
确认 `--previous` 是最新批次，不能误用首次发布重置历史。

## 撤回与历史保留

新版本出现时保留旧版本记录，不自动声称旧版失效。资源整体从当前事实源消失时，必须显式撤回。
撤回输入是维护者准备的 JSON 数组，例如：

```json
[
  {
    "packageName": "dsh-better-sidebar",
    "version": "0.12.2",
    "reason": "维护者已确认停止供给该版本。"
  }
]
```

该示例仅说明格式，不代表实际插件已撤回。将真实决定保存到自己的审核材料后，
在新批次命令追加 `--withdrawals <json-file>`。

- 不接受不存在的身份、重复撤回请求或空原因。
- 已撤回记录永久继承，不会因当前事实源仍存在而恢复 active。
- 同版本改变产物摘要、大小或格式，或者删除已有产物字段，拒绝导出。
- 同版本换成同字节镜像地址可以接受，但不代表新增镜像获得授权。
- 历史组合可保留撤回组件引用用于追溯；市场必须关闭相关安装路径，不得借该引用绕过撤回。

## 部署给下游

本次不自动部署。真正上线时按以下顺序操作：

1. 双方固定候选 Schema 的共同版本，完成导入器对照测试。
2. 将本批次 `batches/<sequence>/` 发布到 `--public-url` 对应的静态目录。
3. 保留此前所有批次及下载路径；新输出不是完整历史文件副本，不要用清空部署删除旧批次。
4. 匿名重下载新清单及薄包，核对 receipt、SHA-256、大小和原始字节。
5. 最后更新固定 `supply-receipt.json`，确认下游已接受新批次。

导出器不会访问计划网址，因此“本地生成成功”不等于“公网可下载”。
标准网站构建不会自动带入这批文件，需要在发布流程增加独立的供货产物部署步骤。
危险或侵权产物需要停止托管时，保留撤回元数据即可；不得为保留历史重新公开危险文件。

## 校验与边界

```powershell
node --test scripts/eac-supply.test.mjs
npm test
npm run build
npm run verify:downloads
git diff --check
```

协议候选位于 `schemas/eac-supply.schema.json`、`schemas/eac-supply-receipt.schema.json`；
正反 fixture 位于 `fixtures/eac-supply/`。校验器还检查身份唯一、精确版本、兼容语法、
执行图、组件绑定和历史规则。它不核验许可真实性、不检查恶意代码、不匹配实际宿主版本。

下游需实现导入器、纯展示记录转换、产物审核和安装资格判定；本次未调用其市场校验器，
未执行实际插件安装。公开站点的登录、热度与社区评价属于独立功能，不被此导出协议占用。
