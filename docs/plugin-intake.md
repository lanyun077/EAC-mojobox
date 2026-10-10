# 插件轻量收录 v1

插件是作者发布的软件包；Mojobox 的 JSON 只是它的收录信息卡，不是新的运行时 Manifest。
作者不用改代码、实现 Mojobox SDK 或重做发行格式。当前下载支持含 `package.json.dsh.bundle`
的原始 npm `.tgz`；源码仓库、GitHub 发行等可以先作为来源收录，不能冒充已核验下载。

## 最少提交什么

在 `catalog/plugin-listings/<id>.json` 提交一张信息卡：

```json
{
  "format": "mojobox-plugin-listing-v1",
  "id": "org.example.tools",
  "packageName": "@example/tools",
  "name": "工具插件",
  "version": "1.0.0",
  "summary": "说明插件提供什么功能。",
  "source": { "url": "https://github.com/example/tools/releases/tag/v1.0.0" },
  "license": "MIT",
  "compatibility": { "dsh": null, "basis": "unknown" },
  "conflicts": null
}
```

这就是最简状态：可展示来源，不能显示已核验下载。许可未知填 `null`，只能收录来源，
不能由 Mojobox 再分发。作者可由已有发布信息核对，未核实时不编造；`author` 是可选展示字段。
`maintainedBy` 省略时按 `registry-maintained` 展示，代录不意味着作者提交或背书。

| 字段 | 含义与边界 |
| --- | --- |
| `id` | 稳定目录 ID，文件名同 ID；不是宿主安装 ID |
| `packageName`、`version` | 实际包名和精确 SemVer；不用 `latest`、标签或范围替代版本 |
| `name`、`summary` | 展示名称和一句用途说明 |
| `source.url` | 对应版本的正式来源，必须 HTTPS；不是仅凭市场榜单转录 |
| `license` | 作者声明的许可；未知是 `null`，不编造 |
| `compatibility` | 未知写 `dsh: null, basis: unknown`；有作者范围时写 `author-declared` 和 `reference` 依据链接 |
| `conflicts` | `null` = 未确认；`[]` = 提交方未报告已知冲突，不是已验证无冲突；非空数组记录已知冲突的对象、版本/条件和依据 |

可选项只有：`author`、`maintainedBy`、`source.repository`、`source.commit`、`limitations`、
`links`、`artifact`。`source.commit` 是发行关联的完整 commit，没有关联证据则省略，不用当前
仓库 HEAD 冒充。registry `gitHead` 是发布方声明的关联，不表示 Mojobox 已证明源码与构建等价。
字段精确要求以 [Schema](../schemas/plugin-listing.schema.json) 为准。

## 如何表明可用和冲突

不设置一个笼统的 `usable: true`。分别展示：

- **信息已收录**：格式和身份通过检查。
- **原始文件已核验**：字节大小、SHA-256、包内身份/许可和 Bundle 声明通过检查。
- **作者声明兼容**：注明范围和依据，不等于 Mojobox 测过。
- **宿主未测试**：当前生成器固定输出 `runtime: not-tested`，不会采信作者一句“可用”作为本项目实测。

`conflicts` 只记录有依据的已知冲突，例如同一注册 ID、某宿主已内置同名组件、特定版本不能
共存。纯粹功能相似、同时改同一面板，应写在 `limitations` 为“待组合验证”，不能直接判为
硬互斥。没有下游测试或可追溯依据，不承诺全平台兼容、安全、无冲突或必然安装成功。

`limitations` 也用于写外部程序、API key、宿主专有服务、写文件、联网和命令执行等已知限制。
详细依赖复用真实 `package.json`，生成器投影 `dependencies`、`peerDependencies`、`engines`
和 `dsh`，作者不需要在信息卡里重复抄写。Mojobox 不解析依赖、不执行插件、不做安装器。

## 有原始下载时多交什么

原始归档放在 `artifacts/plugins/<id>-<version>.tgz`，并增加：

```json
{
  "artifact": {
    "format": "npm-tgz",
    "url": "https://registry.npmjs.org/example-tools/-/example-tools-1.0.0.tgz",
    "sha256": "填最终原始文件的64位小写SHA-256",
    "size": 12345
  }
}
```

上面只是新增字段示意，需要合入完整信息卡。归档最多 8 MiB，解压数据读取上限 32 MiB，
只在内存读取，不落盘解压、不安装。拒绝路径穿越、重复成员、符号/硬链接和身份不一致。
超限发行先做来源记录，不因此编造一个“轻量包”。

维护者人工核对正式来源、原始字节、再分发依据、署名及素材许可。`license` 字符串和 CI
通过不代替许可审核。当前 24 个下载发行保留包内 MIT、Apache-2.0 或 BSD-3-Clause 许可及版权全文，没有改写或重打包；代录不代表作者为 Mojobox 背书。软件许可不自动覆盖外部图库、壁纸或后续加载的素材。
更新必须新版本、新归档；已发布的同版本字节不得替换。文字补充不要求重发软件版本。

```bash
npm test
npm run build
npm run verify:downloads
npm run check:submission -- origin/main
```

最后一个命令只检查已提交增量；正式提交前仍需人工审阅。撤下来源记录可移除网站入口，
历史归档不删除；安全事故另行处理。

## 首批来源与现阶段边界

2026-10-08 从 EAC-Pack 固定 commit
`ee159871e953f52dfe95d6259678bacf5ffe3272` 的 `catalog/eac.json` 发现并核验：

| 包 | 精确版本 | 本轮结论 |
| --- | --- | --- |
| `dsh-web-mobile-fix` | `1.0.6` | 原始归档核验；保留作者宽泛范围，RC2 运行未测 |
| `dsh-soul-md` | `0.9.0` | 原始归档核验；作者声明 RC2/0.2.x，运行未测；不改既有薄包的 0.9.1 |
| `meow-smooth` | `0.8.1` | 原始归档核验；没有结构化内核范围，兼容未知，运行未测 |

2026-10-09 继续从 `authoring/curation-sources.json` 已固定的发行记录扩充 11 个插件，合计 14 个。
再次核对缓存原始字节的 npm SHA-512 integrity、SHA-256、大小、包内身份、Bundle 和许可证；
没有追随 latest，也没有安装依赖或执行发行中的脚本。以下均为 Mojobox 代录、运行未测，
`conflicts: null` 表示已知冲突尚未确认。

| 包 | 精确版本 | 许可 |
| --- | --- | --- |
| `dsh-context` | `0.62.3` | Apache-2.0 |
| `dsh-session-manager` | `0.6.2` | MIT |
| `@vlln/dsh-navbar` | `0.4.0` | MIT |
| `dsh-undo-savepoint` | `0.4.10` | MIT |
| `@nagi-ovo/dsh-visualize` | `0.1.4` | BSD-3-Clause |
| `@nanmicoder/dsh-agent-teams` | `0.1.22` | MIT |
| `@wxg-prc-cpg/browser-skill-dsh-plugin` | `0.3.2` | MIT |
| `@yolk_vat-y/dsh-project-memory` | `0.5.14` | MIT |
| `@changfenhuang/dsh-genui` | `0.11.3` | MIT |
| `dsh-vision-router` | `3.0.1` | MIT |
| `dsh-chat-import` | `0.24.0` | MIT |

这些发行没有当前轻量信息卡可逐字投影的 `package.json.dsh.compatibility.dsh` 范围，所以信息卡
保留 `compatibility: { dsh: null, basis: unknown }`。真实的 `engines`、peer 和 `dsh` 声明仍在
检验报告及生成目录的 `packageMetadata` 中；不抹去作者声明，也不将静态 peer 比较解释为运行证明。
`dsh-univer-office@0.3.6` 约 49 MB，超过当前归档限制，本轮不收录；不收内核内置或 EAC 私有包。
BrowserSkill 以插件身份收录；GenUI 附带的 `SKILL.md` 保留在原始发行内，均不拆成独立 Skill。

取作者 npm 正式发行，不拆 EAC-Pack 内嵌私有包、不把 EAC 特制副本伪装成上游版、不重复
供给内核已内置组件。registry SHA-512 integrity 在人工采集时已匹配；日常构建离线核验
信息卡 SHA-256 和包内信息，不联网追随 latest。

新事实源独立于 legacy `catalog/plugins/` 的 dsh-std Manifest，旧 Lock/Evidence 的摘要不变。
网站现有 `catalog.mojobox.dev/v1alpha1` intake 输出的 `plugins` 从空数组变为轻量信息卡，
新增 `skills: []`。消费方必须识别 `format`，不得按 legacy Manifest 解释。
新信息卡 **不自动加入 `supply.eac/v1`**：既有供货协议没有通用插件冲突/限制字段，直接导出会
丢失重要边界。现提供独立[插件来源接口 v1](plugin-source-api-v1.md)，完整保留信息卡与校验过的下载；
下游需增加一次读取/转换，已有试点格式和样本不修改。

## 中量收录：2026-10-10

用户转述下游认为两轮 Issue 草稿可以通过，并希望后续持续收集插件、提供稳定接口，
不再要求下游逐批反馈。本轮在 14 条基础上增加 12 条，合计 **26 条：24 个原始下载、2 个来源条目**。
固定发行来自既有来源清单；重新取得原始 npm 字节并核对 registry SHA-512，不追随 latest。
收录记录与采集依据见 `authoring/plugin-intake-20261010.json`。

| 包 | 精确版本 | 本轮处理 |
| --- | --- | --- |
| `picturereader` | `3.3.3` | 原始下载，MIT；OCR/图像后端按宿主配置 |
| `computer-user` | `0.3.7` | 原始下载，MIT；Windows 桌面操作需宿主授权 |
| `dsh-better-sidebar` | `0.24.1` | 原始下载，MIT；不替换旧供货的 `0.12.2` 来源 |
| `dsh-pet` | `0.3.1` | 仅来源；原始发行约 62 MB，超过 8 MiB |
| `dsh-whale-widget` | `0.3.18` | 原始下载，MIT；外部媒体和余额服务另有边界 |
| `dsh-dafeiyu` | `0.1.14` | 仅来源；约 168 MB，且需审核 `ASSET_LICENSE.md` |
| `dsh-unified-market` | `0.4.1` | 原始下载，MIT；未执行其安装、更新、配置修改逻辑 |
| `dsh-drag-and-drop` | `0.1.6` | 原始下载，BSD-3-Clause；路径桥接依赖宿主 |
| `dsh-find-plugin` | `0.4.0` | 原始下载，MIT；搜索需网络，星数不代表兼容 |
| `dsh-meme` | `0.1.44` | 原始下载，MIT；外部图库许可另行核对 |
| `dsh-plugin-wallpaper-engine` | `1.2.0` | 原始下载，MIT；宿主/侧边栏要求保留于限制说明 |
| `dsh-status-rotator` | `0.34.1` | 原始下载，MIT；状态栏共存未测试 |

新增条目均为 `registry-maintained`，兼容和冲突仍明确未知；不从 peer、README 或功能相似
推导硬冲突，不写可安装保证。含 Bundle、精确身份、合法归档和许可通过静态核验，
依赖闭包、实际安装、加载、全平台运行和媒体版权审计不因此完成。

下一批沿用同一门槛，先筛选正式发行、用途与许可，再核验归档；允许只收录来源，
不为凑数量放宽体积限制、改写作者原包或采集内核已内置组件。26 条是本轮规模，不是协议上限。

Skill 本轮仅保留导航、独立空目录和职责文档，不收录实际内容、不定义宿主格式、不提供
安装下载、不增加下游 `skill` 枚举。插件附带的 Skill 保持在作者插件中，不拆成另一条可安装资源。
后续根据真实需求增补契约，旧合法信息卡不因新增可选字段失效；提高强制门槛需明确迁移方案。
