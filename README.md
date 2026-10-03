# DSH Mojobox

DSH 生态的插件与整合包收录、验证、归档和分发目录。

Mojobox 把分散在 npm、GitHub Release 和开发者仓库中的插件、功能整合包和皮肤包整理成可追溯的来源，检查归档结构与 SHA-256，生成目录和下载文件，供宿主市场、皮肤加载器及其他下游工具使用。

上游作者维护插件和整合包内容，下游宿主或加载器负责安装和运行。Mojobox 负责连接两者，不替代插件作者、宿主安装器或皮肤加载器。

## 当前状态

- Mojobox 收录、静态检验、目录展示和原始下载框架已完成。
- 当前输入格式是官方 EAC Feature Pack v1 的薄 `.dshpack`。
- `function`、`appearance` 和 `workflow` 可以进入收录校验；公开分发范围由 [`distribution.json`](distribution.json) 控制。
- 皮肤与外观包只收录来源、组件、依赖、冲突和归档信息，不开发桌面端加载器。
- 正式目录现有 14 个功能包和 8 个独立皮肤包，演示样本与正式内容完全分离。
- 功能包包含 4 项必备组合、7 项日常减重版和会话、开发、记忆、团队、研究、办公、视觉、移动、迁移分类；原 7 个功能基底已升级至 `0.2.0`，Power Toolbox 扩充到 12 项。
- 已从 `dsh-skin-prompt-packages` 固定提交收录十套 `skin-prompt-package-v1` 皮肤资料；它们用于 AI 设计和复刻，不是可安装插件。
- 外观包与皮肤包是同一分类：网站皮肤包页统一展示 8 个皮肤归档和 10 套 Prompt 资料，并保留各自的下载方式；功能包页只展示功能组合。
- 自制包清单与重复打包命令位于 [`authoring/`](authoring/README.md)；选型参考[首批收录说明](docs/ecosystem-curation.md)与[插件常客记录](docs/plugin-shortlist.md)。
- 已只读解析 EAC/AIO 完整整合包 `dsh-plugin-suite@0.1.7`，核验 69 个内嵌组件并保存[来源候选与搭配分析](docs/eac-plugin-suite-analysis.md)；已完成[逐项筛选、减重与分类组合](docs/suite-curation.md)，上游原始 `.tgz` 尚未进入正式下载。

“结构已检验”不等于“宿主已安装”或“运行兼容”。运行证据必须绑定具体宿主、加载器、版本和测试环境。

## 这个项目解决什么问题？

| 对象 | Mojobox 提供什么 |
| --- | --- |
| 插件作者 | 一个公开、可追溯的来源入口 |
| 整合包作者 | 原始 `.dshpack` 的收录、检查和下载 |
| 皮肤作者 | 皮肤插件、加载器依赖、冲突和预览资料的目录记录 |
| 宿主市场 | 可读取的包信息、来源和 SHA-256 |
| 皮肤加载器 | 可查询的皮肤来源、版本和限制 |
| 普通用户 | 包说明、检查范围、来源链接和原始下载 |

Mojobox 不负责：

- 开发或修改插件、皮肤和素材；
- 在目录构建时执行插件或安装脚本；
- 实现桌面端皮肤发现、加载、切换或渲染；
- 自己实现 Profile 管理、依赖解析、快照、回滚和完整安装事务；
- 把源码覆盖项目伪装成标准插件；
- 用静态检查结果代替宿主运行证据。

长期定位和边界见[项目定位与发展路线](docs/project-positioning-and-roadmap.md)。

## 快速开始

要求 Node.js 22.12 或更新的受支持版本。

```bash
npm ci
npm test
npm run dev
```

`npm run dev` 会先根据当前收录记录生成目录，再启动 Vite 开发服务器。

### 查看演示目录

正式目录可以为空。需要查看完整页面流程时使用合成样本：

```bash
npm run build:demo
npm run preview:demo
```

演示输出写入 `dist-demo/`，页面会明确标记为测试样本，不能用于安装或发布。

### 构建静态站

```bash
npm run build
npm run verify:downloads
npm run preview
```

部署到 GitHub Pages 子路径时：

```bash
BASE_PATH=/dsh-mojobox/ npm run build
```

完整部署说明见[部署文档](docs/deployment.md)。

## 收录什么？

### 插件记录

插件记录描述一个可被宿主或加载器识别的独立插件，包括包名、版本、入口、来源、固定 revision、artifact、许可证和验证状态。

### 功能整合包

功能整合包通过 `pack.json` 声明一组需要一起使用的功能插件。Mojobox 接收开发者交付的薄包，检查并原样提供下载；宿主决定是否能在当前 Profile 中安装。

### 皮肤与外观包

外观包使用 `appearance` 分类，可以描述皮肤、主题、皮肤管理器和加载器依赖。Mojobox 保存这些来源资料并向下游供给，不执行皮肤加载，也不承诺多个皮肤可以同时启用。

皮肤包的特殊材料包括：

- 皮肤类型和加载方式；
- loader 名称、版本和来源；
- 皮肤 ID、主题注册点和已知冲突；
- 预览图来源；
- 代码、图片、音频等素材的许可证边界；
- 已验证的宿主和加载器版本。

皮肤 Prompt 资料包单独收纳 `manifest.json`、`prompt.md` 和 `README.md`，网站会展示其来源提交、许可证、目标界面、主题和文件摘要。Mojobox 不执行 Prompt，也不把这类资料转换成 `.dshpack`。

## 开发者如何提交整合包？

先阅读[整合包收录规范](docs/intake.md)和[文件结构说明](docs/author-pack-request.md)。开发者需要提供已经完成的薄 Feature Pack，Mojobox 不替作者临时拼装生产包。

最小归档结构：

```text
org.example.tools-1.0.0.dshpack
└── pack.json
```

`pack.json` 至少包含格式版本、稳定 ID、名称、版本和一个插件引用：

```json
{
  "formatVersion": 1,
  "id": "org.example.tools",
  "name": "开发工具包",
  "version": "1.0.0",
  "plugins": [
    { "ref": "@example/editor-tools", "version": "1.2.0" }
  ]
}
```

正式提交还需要：

1. 最终 `.dshpack` 文件；
2. HTTPS 来源页面；
3. 作者、许可证和简介；
4. 最终归档的 SHA-256；
5. 外观包额外提供 loader、皮肤 ID、冲突和预览资料。

将归档放入 `artifacts/`，并在 `catalog/feature-packs/` 添加同 ID 的收录记录：

```json
{
  "format": "eac-feature-pack-v1",
  "id": "org.example.tools",
  "version": "1.0.0",
  "category": "function",
  "source": "https://github.com/example/tools/releases/tag/v1.0.0",
  "author": "Example author",
  "license": "MIT",
  "sha256": "填写最终归档的64位小写SHA-256"
}
```

皮肤包把 `category` 设为 `appearance`，并填写 `appearance` 对象。这个对象是 Mojobox 的目录事实，不是皮肤加载器运行协议。

## 收录检查

```bash
npm run inspect:feature-pack -- artifacts/<id>-<version>.dshpack
npm run inspect:feature-pack -- artifacts/<id>-<version>.dshpack <sha256>
npm test
npm run build
npm run verify:downloads
npm run check:skin-prompts
```

检查器会验证：

- `pack.json` 是否符合 Feature Pack v1 Schema；
- ZIP 是否只包含允许的根文件；
- 是否存在重复路径、符号链接、危险路径或加密成员；
- 插件引用是否重复或使用不支持的格式；
- 归档身份、收录记录和 SHA-256 是否一致。

检查器不会解析或下载插件来源，不运行插件，也不判断许可证是否合法。报告会明确标记 `runtime: not-tested` 和 `references: not-resolved`。

## 仓库结构

| 路径 | 用途 |
| --- | --- |
| `catalog/plugins/` | 插件来源、版本和 artifact 事实 |
| `catalog/feature-packs/` | 当前 Feature Pack 收录记录 |
| `catalog/skin-prompt-packages/` | 固定来源的皮肤 Prompt 资料包 |
| `artifacts/` | 开发者提供的原始 `.dshpack` |
| `candidates/` | 尚未进入正式目录的候选来源资料 |
| `schemas/` | Mojobox 收录记录契约 |
| `schemas/skin-prompt-package.schema.json` | 皮肤 Prompt 资料包契约 |
| `vendor/eac/` | 固定的 Feature Pack 输入 Schema |
| `fixtures/intake/` | 正反测试样本，不是生产内容 |
| `scripts/feature-pack.mjs` | 归档检查器 |
| `scripts/build-catalog.mjs` | 目录、报告和下载生成器 |
| `scripts/verify-downloads.mjs` | 最终下载文件独立复核 |
| `site/` | 静态网站源码 |
| `docs/` | 收录规范、架构、部署和路线文档 |

`site/public/generated/`、`dist/`、`dist-demo/` 和 `.cache/` 都是生成物，不手工编辑或提交。

## 项目路线

当前按以下顺序推进：

```text
功能整合包收录与有限安装支持
        ↓
皮肤插件与皮肤整合包收纳
        ↓
真实包验证、冲突记录和规范沉淀
        ↓
面向宿主与加载器的下游接口
        ↓
面向开发者的动态提交与审核网站
```

其中：

- 功能包安装复用宿主已有的 Feature Pack 和安装接口；
- 皮肤包只收录、检查、归档和供给来源；
- 运行兼容性由宿主或皮肤加载器提供证据；
- 下游接口等收录格式稳定后再设计；
- 动态网站不执行插件，不修改用户桌面端。

## 相关文档

- [项目定位与发展路线](docs/project-positioning-and-roadmap.md)
- [开发者整合包收录规范](docs/intake.md)
- [整合包文件结构与最小示例](docs/author-pack-request.md)
- [皮肤包分支交接](docs/skin-pack-branch-handoff.md)
- [皮肤包来源复核](docs/skin-pack-source-review.md)
- [架构与扩展边界](docs/architecture.md)
- [静态构建与部署](docs/deployment.md)
- [框架验收记录](docs/framework-acceptance.md)
- [贡献指南](CONTRIBUTING.md)

## 参与贡献

使用独立分支提交 Pull Request。提交前至少运行：

```bash
npm test
npm run build
npm run verify:downloads
git diff --check
```

涉及目录数据时，只提交事实源，不提交生成目录。涉及协议时必须同时补充正例、反例和兼容影响说明。PR 标题和正文使用中文，命令、路径、字段名和 Conventional Commit 类型保留原文。

## License

[MIT](LICENSE)
