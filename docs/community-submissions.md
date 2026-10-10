# 外部开发者提交与审核

Mojobox 是来源目录，不是插件开发平台或皮肤加载器。当前入口是 GitHub Fork + Pull Request；
Issue 用于咨询和提交候选，不会自动发布。没有上传服务器，也不执行作者的安装脚本或 Prompt。

## 1. 选择提交类型

| 类型 | 必须提交 | 下载与职责 |
| --- | --- | --- |
| 独立插件 | [轻量信息卡](plugin-intake.md)，下载可选 | 不要求更改作者格式；原始 npm 归档核验后下载，宿主负责安装 |
| 功能整合包 | 薄 `.dshpack` 与同 ID 的收录 JSON | 原样下载，宿主负责安装与运行 |
| 可安装的皮肤/外观包 | 同上，分类为 `appearance` 并声明 `appearance.kind` | Mojobox 不加载、不切换皮肤 |
| 皮肤 Prompt 资料 | `manifest.json`、`prompt.md`、`README.md` 与固定来源记录 | 三个资料文件，不转换成可安装包 |

新增独立插件按[轻量收录规范](plugin-intake.md)；旧 dsh-std Manifest 仅维护已有记录。
Skill 暂只预留分类，不接受实际收录或安装。
完整客户端、用户 Profile、带内嵌代码的整套环境不符合当前薄包收录范围，先开 Issue 讨论。

## 2. 功能包与皮肤归档

```text
artifacts/org.example.tools-1.0.0.dshpack
catalog/feature-packs/org.example.tools.json
catalog/previews/org.example.tools/overview.png   # 可选截图
```

`.dshpack` 是 ZIP，只包含根 `pack.json` 和可选根 `icon.png`。
最小清单见 [作者文件结构说明](author-pack-request.md)，限制见 [收录规范](intake.md)。
不要改 Mojobox 代码或上游 Schema 来让自己的包通过。

收录记录示例：

```json
{
  "format": "eac-feature-pack-v1",
  "id": "org.example.tools",
  "version": "1.0.0",
  "category": "function",
  "source": "https://github.com/example/tools/releases/tag/v1.0.0",
  "author": "Example author",
  "license": "MIT",
  "sha256": "替换为最终归档的64位小写SHA-256",
  "tags": ["development", "productivity"],
  "introduction": "介绍用途、适用场景、包含组件的配合关系，以及已知限制。",
  "links": [{ "label": "作者仓库", "url": "https://github.com/example/tools" }],
  "previews": ["previews/org.example.tools/overview.png"]
}
```

| 信息 | 放在哪里 | 要求 |
| --- | --- | --- |
| 名称、短简介、版本、包含组件 | 归档的 `pack.json` | ID、版本、至少一个插件必填；短简介强烈推荐 |
| 分类、来源、作者、许可、摘要 | 收录 JSON | 必填；来源必须为无凭据 HTTPS URL |
| 标签 | 收录 JSON 的 `tags` | 可选；最多 12 个不重复标签，每个 1 至 32 字符；推荐 2 至 5 个 |
| 详细介绍 | 收录 JSON 的 `introduction` | 可选纯文本，最多 6000 字符；不渲染 HTML/Markdown |
| 作者仓库、文档、反馈入口 | 收录 JSON 的 `links` | 可选，最多 12 条，每条含 `label` 与无凭据 HTTPS `url` |
| 截图 | 收录 JSON 的 `previews` | 可选，最多 16 张；首张为皮肤列表封面 |
| 内核版本要求 | `pack.json.requires.dsh` | 新收录和更新版本必填合法范围；未知先提交候选，不能编造或用标签冒充兼容证明 |
| 外部插件版本 | `pack.json.plugins[].version` | npm/GitHub 引用必填精确 SemVer；`builtin:` 由宿主提供，不强制版本 |
| loader、皮肤 ID 与已知冲突 | 收录 JSON 的 `appearance` | 外观包声明 `kind`，其余仅填写可核验信息 |

旧包不强制补标签、简介或图片。没有提供时显示缺失状态，不猜测作者或兼容范围。
版本要求和已有归档迁移见[版本声明策略](intake-version-policy.md)。版本声明只检查语法，
不读取本机内核、不解析插件来源，不意味着已经兼容或保证安装可复现。
第三方组件的许可不被整合包清单的 MIT 等许可证覆盖；PR 要说明代码、素材和截图的许可边界。

## 3. 预览图由作者提供

两种方式都支持：

- 随 PR 提交 `catalog/previews/<id>/<filename>`，在记录中填写 `previews/<id>/<filename>`。
- 填写无凭据 HTTPS 原图链接，优先作者仓库的完整 commit 固定链接，而非可能变动的分支。

本地文件名使用小写字母、数字、点、下划线或连字符；只接受 PNG、JPEG、WebP，每张不超过
2 MiB。拒绝 SVG、HTML、符号链接、路径穿越和不匹配的文件签名。图片独立于 `.dshpack`，
构建会原样复制到生成目录并记录 SHA-256，下载复核再次检查字节。不进行图片解码或安全认证。

上传真实界面截图，遮盖 token、用户名、聊天和文件路径等私人信息。PR 必须注明截图对应的
包版本、宿主/loader 版本、明暗主题、素材来源和使用许可。旧版截图或设计稿要明确注明，
不能冒充本版本运行实测。远端图片不在 CI 中下载，其在线状态、真实性和许可由维护者人工确认。

功能包截图在详情页展示，皮肤包首图还用于列表封面。图片缺失或加载失败仍可浏览、下载。
外观包原有的 `appearance.previews` 保持兼容；新记录优先使用顶层 `previews`，不要两处重复填写。

## 4. 外部皮肤 Prompt 资料

在 `catalog/skin-prompt-packages/<id>/` 提交三个完整文件，清单沿用现有
`schemas/skin-prompt-package.schema.json`。标签与简介使用清单已有的 `tags`、`description`；
来源、目标界面、主题、许可证、引用和章节要求必须符合 Schema，不伪造 EAC/AIO 来源。

在 `catalog/skin-prompt-packages/source.json` 的 `packages` 中追加条目：

```json
{
  "id": "example-skin",
  "path": "packages/example-skin",
  "source": {
    "repository": "https://github.com/example/skin-prompts",
    "revision": "替换为作者仓库的40位完整commit",
    "path": "packages/example-skin"
  },
  "files": {
    "manifest": "sha256:替换为manifest.json原始字节摘要",
    "prompt": "sha256:替换为prompt.md原始字节摘要",
    "readme": "sha256:替换为README.md原始字节摘要"
  }
}
```

条目级 `source` 允许来自其他作者仓库；省略时沿用旧的统一来源。
顶层 `repository`、`revision`、`schemaPath` 和 `schemaDigest` 是现有导入基线，新增外部资料时
不要修改它们。条目的 `source.path` 是作者仓库中的目录，`path` 保留本地记录约定。

需要展示原作者和截图时，在 `origins.json` 增加同 ID 对象，字段沿用现有记录：
`repository`、`projectUrl`、`previews: [{label, url}]`、`notes`、`evidence: [HTTPS URL]`。
截图 URL 也可写 `previews/<id>/<filename>` 并上传到 `catalog/previews/<id>/`。
`evidence` 是归属说明的参考链接，不是宿主运行证据。没有可核验原项目时不填 `origins`。

计算摘要只针对最终文件原始字节，不复制其他包的值：

```powershell
(Get-FileHash artifacts/org.example.tools-1.0.0.dshpack -Algorithm SHA256).Hash.ToLower()
(Get-FileHash catalog/skin-prompt-packages/example-skin/manifest.json -Algorithm SHA256).Hash.ToLower()
```

资料摘要在记录中加 `sha256:` 前缀；归档 `sha256` 字段不加前缀。

## 5. 从 Fork 到发布

1. Fork 仓库，从最新 `main` 建立 `feat/add-<id>` 或 `fix/update-<id>` 分支。
2. 只提交自己包的事实源、归档和图片。一次 PR 尽量只处理一个稳定 ID。
3. 按模板填写来源、身份/代提交授权、许可、截图说明、版本和真实测试范围。
4. 本地运行以下命令，在 PR 中填写实际结果；当前主分支已停用 PR 检查工作流，不等待不存在的自动检查。
5. 维护者复核测试结果并人工审核，必要时要求修改；有权限的维护者合并，不自动合并第三方内容。
6. `main` 的 Pages 工作流再次测试、构建、复核下载，成功后才部署。合并不等于已上线。

```bash
npm ci
npm test
npm run build
npm run verify:downloads
git diff --check
```

提交到自己的分支后，可再运行 `npm run check:submission -- origin/main` 检查已提交的增量。
该命令只比较 Git 提交，不覆盖未提交修改；它不能替代上面的全量检查。

更新归档必须递增版本、提供新文件名和新摘要；已经发布的归档不得修改、删除或重命名。
仅修改介绍、标签、相关链接或截图无需重打归档。Prompt 更新必须更新对应来源 commit
和文件摘要，不能用旧 commit 冒充新字节。固定来源由人工对照上游确认，CI 不联网核验。

## 6. 自动门禁与人工审核

本地检查覆盖 Schema、身份、归档结构、SHA-256、公开图片路径/大小/签名、Prompt 文件摘要、
多来源格式、构建和最终下载字节；PR 增量检查阻止改写历史归档或提交生成目录。
全量检查失败时所有新增内容都不能发布，不是只检查某一条 JSON。

维护者必须核对：作者身份/代提交授权、可追溯来源、再分发许可、内容范围、截图隐私和版本、
标签准确性、已知冲突、兼容声明是否有真实证据。CI 不能验证这些，也不证明插件无恶意代码。
外部 PR 若修改工作流、脚本、Schema 或安装逻辑，按代码贡献单独审阅，不作为普通数据收录放行。

仓库管理员应在 GitHub 配置 `main` Ruleset/Branch protection：

- 必须通过 PR 合并，至少 1 个批准；有新提交时撤销旧批准，要求最近改动获批准。
- 解决所有审阅对话。当前没有 PR 检查 job，不配置不存在的必需状态；若将来恢复 CI，再按实际 job 配置。
- 要求分支更新到最新 `main`；启用 Merge Queue 前须另行实现对应检查工作流。
- 禁止强推和删除 `main`；按团队实际成员配置 CODEOWNERS，关键脚本/工作流要求负责人批准。
- 数据收录推荐 Squash merge，一包一条可追踪提交；不要求外部作者强推变基。

这些是管理员设置，不会因提交文档而自动生效。本轮不恢复已删除的 PR 工作流，也不修改远端保护规则或自动合并设置。
不能使用 `pull_request_target` 来检出并执行外部代码，也不向 Fork PR 提供发布凭据。
提交增量检查在本地执行；发布仅来自 `main`，提交 PR 不部署。必要的脚本依赖安装不等于执行收录插件。

## 7. 撤回与故障处理

来源或许可证存疑时暂缓合并。发布后出现风险，可移除收录记录并重建以撤下网站入口；
历史归档原始字节仍保留，不能把“撤下入口”说成从 Git 历史彻底删除。
密钥或个人信息泄漏要走单独的安全处理，不受一般历史归档保留规则阻碍。
部署失败先查看 CI/Pages 日志并修复或回退收录提交，不手工修改 `dist`。
