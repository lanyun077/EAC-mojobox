# 开发者整合包收录规范

本文件是当前收录主线。Mojobox 负责收纳、静态检验、展示和下载；整合包内容、依赖、更新和功能正确性由开发者维护。宿主安装与运行测试是后续独立阶段，不阻塞收录框架开发。

除可供宿主读取的 Feature Pack 外，Mojobox 也收纳独立的 `skin-prompt-package-v1` 皮肤资料包。
这类资料包用于 AI 阅读、复刻和继续设计，不是可安装插件，不进入宿主安装索引。

## 当前支持范围

第一版支持 `eac-feature-pack-v1` 薄 Feature Pack：ZIP 内必须有根 `pack.json`，可选根 `icon.png`。
`function`、`appearance` 和 `workflow` 均可收录；外观包与皮肤包指同一类样式或整体外观修改。
这是当前支持的输入格式，不是对所有 DSH 宿主兼容的承诺。

- 至少一个插件引用；接受 npm 名、`github:owner/repo` 和 `builtin:目录名`。
- 不解析或下载引用，也不运行插件。
- 新收录与更新版本必须声明合法非空的 `requires.dsh`；npm/GitHub 插件引用必须声明精确 SemVer
  版本。`builtin:` 只声明宿主内置组件，可以不写版本；如填写则同样检查精确版本语法。
  [版本声明策略](intake-version-policy.md)规定已有 8 个皮肤归档的精确历史例外、迁移与报告字段。
  不读取本机内核、不按构建电脑的内核拒绝面向其他版本的包。
- 对 `appearance` 包，收录记录必须声明 `appearance` 元数据；皮肤加载器依赖、皮肤 ID、冲突、预览来源、安装结果和运行状态只作为来源声明提供给下游，
  不作为 Mojobox 的安装或运行门禁。
- 不接收 preset、skill、非空 overrides、内嵌插件代码或其他文件；遇到这些输入给出不支持原因，不静默转换。
- 清单上限 1 MiB、图标上限 512 KiB、归档上限 2 MiB；图标检查 PNG 签名，不进行图片解码或安全认证。
- 拒绝重复路径、符号链接、危险路径、加密成员、重复插件引用和明确标记的草稿。
- 这些限制是首版收录策略，不改变 EAC 原始格式的定义。更大或不同格式的包后续按实际需求适配。

## 提交方式

完整的外部 PR 流程、展示字段和预览图要求见[作者提交与审核指南](community-submissions.md)。
`tags`、`introduction`、`links`、`previews` 是可选收录展示字段，旧记录无需迁移；它们不修改
上游 Feature Pack 格式。图片可从 `catalog/previews/<id>/` 随 PR 上传，不能放进薄包归档。

开发者提供现成归档和来源，不要求 Mojobox 重新组合插件。皮肤代码和素材由被引用的插件发布，
Mojobox 只收录薄包清单及原始归档。首版采用仓库内保存并随静态站原样托管归档的方式；不自动抓取远端、不改写开发者产物。

1. 将真实产物放入 `artifacts/<id>-<version>.dshpack`。
2. 添加 `catalog/feature-packs/<id>.json`，示例结构如下（摘要必须替换为真实计算值）：

```json
{
  "format": "eac-feature-pack-v1",
  "id": "org.example.tools",
  "version": "1.0.0",
  "category": "function",
  "source": "https://github.com/example/tools/releases/tag/v1.0.0",
  "author": "Example author",
  "license": "MIT",
  "sha256": "填写实际归档的64位小写十六进制SHA-256"
}
```

外观包将 `category` 设为 `appearance`，并额外填写 `appearance` 对象。例如：

```json
{
  "category": "appearance",
  "appearance": {
    "kind": "skin",
    "loader": {
      "id": "@dsh-eac/ui-skin-loader",
      "version": "1.1.0",
      "source": "https://github.com/DSH-EAC/dsh-ui-skin-loader"
    },
    "skinIds": ["maid-atelier"],
    "conflicts": ["bodyAttr:theme"],
    "previews": ["https://example.org/preview.png"]
  }
}
```

`appearance` 只描述收录事实，不是 loader 的运行协议。Mojobox 不安装、加载、切换或判断皮肤兼容性。

`source` 是开发者来源页面，不是安装地址；要求 HTTPS 且不能包含 URL 用户名和密码。作者与许可证需人工核对来源，自动检查只能验证字段及其与清单的一致性，不构成法律核验。一个稳定 ID 当前只收录一个版本，更新时提交新的版本和真实摘要，历史版本由 Git 历史保留。

## 命令

```powershell
npm run inspect:feature-pack -- artifacts/<id>-<version>.dshpack
npm run inspect:feature-pack -- artifacts/<id>-<version>.dshpack <预期sha256>
node scripts/build-catalog.mjs --check
npm test
npm run build:intake
npm run check:skin-prompts
```

独立检查命令只读指定归档；不提供预期摘要时仅计算摘要，不声称与开发者发布字节一致。`--check` 检查收录记录和归档，不生成文件；`npm test` 包含该门禁。

`build:intake` 先检查全部输入，再生成 `site/public/generated/` 下的目录、清单、检验报告和原样下载文件。不通过时不会进入输出替换步骤；输出写入中的磁盘或权限失败会导致构建失败，不能部署该次产物。生成目录只用于当前构建，不作为历史发行存储。

默认 `prepare:site`、`dev` 和 `build` 已切到新收录数据。网站展示作者、来源、内核声明、检查范围、原始归档、清单和报告下载。`npm run verify:downloads` 独立复核 `dist/` 中的文件、摘要、大小和报告；空正式目录合法。旧的 `inspect:pack` / `host:pack` 仅适用 legacy，不适用新收录归档。

使用 `npm run build:demo` 和 `npm run preview:demo` 查看测试演示。演示仅写入 `.cache/intake-demo/` 与 `dist-demo/`，不会添加正式收录记录或覆盖正式构建。`npm run verify:downloads -- dist-demo --allow-demo` 可验证演示；没有 `--allow-demo` 时拒绝演示产物，发布流程不启用该参数。

## 检验结论

自动报告分别记录清单 Schema、归档布局和 SHA-256，始终标记 `runtime: not-tested` 与 `references: not-resolved`。检验通过不表示来源在线、插件可安装、无恶意代码、功能正确或任意宿主兼容。

实际运行证据应在后续搭载测试完成后独立记录，不能用结构检查替代。
新增 `manifest-plugin-versions` 和 `manifest-requires-range` 检查项。历史例外不记录范围检查通过，
以 `versionDeclarations.kernel: legacy-undeclared` 和 `warnings` 明示兼容未知；所有报告的
`versionDeclarations.comparison` 均为 `not-performed`。这些字段投影到目录，并由下载复核重新验证。

## 样本与正式收录

`fixtures/intake/` 中的样本使用不存在的测试插件，只用于正反测试。测试会在临时目录创建 ZIP 和收录记录，检查下载字节、摘要、失败保留已有输出和删除收录后的清理。

正式 `catalog/feature-packs/` 允许为空，这是有效状态。当前已收录 DSH-EAC 自制的功能与皮肤薄包，
其作者清单见 [`authoring/`](../authoring/README.md)。候选目录不自动公开；测试通过不自动把样本提升为正式内容。

## 皮肤资料包来源

当前已从 [dsh-skin-prompt-packages](https://github.com/DSH-EAC/dsh-skin-prompt-packages)
固定提交 `bcb2ecaf318f60df2ff86e5214d646a785ccabc9` 收录十套资料包。事实源位于
`catalog/skin-prompt-packages/`，每套包含 `manifest.json`、`prompt.md` 和 `README.md`，
并由 `source.json` 固定上游提交与每个文件的 SHA-256。

这类资料包在生成目录中以 `skinPackages` 提供，网站展示来源、许可证、目标界面、主题、Prompt
章节和文件摘要。Mojobox 不执行 Prompt，不把它们伪装成 `.dshpack`，也不替 loader 或宿主判断安装和运行兼容。
