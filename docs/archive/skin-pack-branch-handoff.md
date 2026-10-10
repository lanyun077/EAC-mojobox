# 皮肤包开发分支交接文档

> 历史归档：该阶段分支已合并，本文的空目录、版本、测试数量和候选选择不代表当前状态。
> 新的皮肤收录任务使用 [作者提交指南](../community-submissions.md) 和 [收录规范](../intake.md)。

> 本文保留当时交接的边界：该会话只处理社区皮肤包的候选整理、薄 Feature Pack 交付和收录准备，不扩展 Mojobox 本体，也不修改宿主安装器。

项目长期定位和五阶段路线见[项目定位与发展路线](../project-positioning-and-roadmap.md)。本文件只保留皮肤包分支当时的执行边界和启动任务。

## 1. 当前基线

| 项目 | 当前事实 |
| --- | --- |
| 仓库 | `https://github.com/DSH-EAC/dsh-mojobox` |
| 本地目录 | `<workspace>/dsh-mojobox`（本机路径已脱敏） |
| 建议分支起点 | `origin/main`，提交 `a273be4` |
| 分支创建目的 | `feat/skin-pack-development` |
| 上一阶段基线 | `feat/mojobox-visual-refresh`，提交 `d8ff4d0` |
| 参考 PR | [PR #6](https://github.com/DSH-EAC/dsh-mojobox/pull/6)，提交 `9316d69`，已合并 |
| 框架状态 | 收纳、静态检验、展示、下载已完成；正式收录仍为空 |
| 当前验证基线 | `npm test`：85 项通过、1 项 Windows 权限跳过 |

开始工作前必须重新运行：

```powershell
git status --short --branch
npm test
```

保留已有修改，不覆盖其他会话的文件。不要把父仓库 `<workspace>` 的无关改动混入本分支。

## 2. 本分支唯一目标

为社区皮肤准备一个可以被 Mojobox 收纳的 **薄 Feature Pack v1**，优先验证鲸鱼娘系列：

```text
鲸鱼娘皮肤管理器 + 深海女仆工坊 + 虎鲸链路
```

本分支的完成结果应是：

1. 得到上游明确交付的 `pack.json` 或完整 `.dshpack`；
2. 记录精确插件引用、版本、来源、作者和许可证；
3. 通过 Mojobox 的静态收录检查；
4. 形成一份清楚标记为“结构已检验、宿主未测试”或“已完成实测”的交接结果。

如果上游没有提供最终归档，不要把本地临时生成的 ZIP 当成正式开发者产物提交。临时包只能放在测试目录或缓存中，并明确标记为演示样本。

## 3. 严格边界

### 允许做

- 在 `artifacts/` 和 `catalog/feature-packs/` 增加皮肤包的正式收录文件，但前提是已有真实、可追溯的上游归档。
- 在 `docs/` 增加皮肤包来源、组件组成、冲突和验证记录。
- 在临时目录生成测试 ZIP，验证现有检查器能否接收薄包。
- 检查上游发布页、npm 包元数据、固定 Git revision、许可证和 SHA-256。
- 在隔离环境中执行已经存在的检查命令；不得使用用户日常 Profile。

### 禁止做

- 不修改 `scripts/feature-pack.mjs`、`scripts/build-catalog.mjs`、`schemas/intake.schema.json`、网站主流程或发布策略。
- 不为皮肤包新增安装器、loader、Profile 管理、回滚逻辑或 EAC bridge。
- 不把插件源码、皮肤素材、壁纸、`node_modules` 或构建产物塞进 `.dshpack`。
- 不把社区皮肤仓库源码覆盖安装转换成 Mojobox 支持的插件。
- 不擅自修改上游插件的 `package.json`、`cordis.patch.yml`、`skin.json` 或源码。
- 不把静态 Schema 通过写成“宿主兼容”或“运行安全”。
- 不修改 `dsh-desktop`、`tauri-shell` 或父仓库其他项目。
- 不把 PR #6 的插件目录记录误当作已经完成的整合包。

如果工作被 `appearance` 分类缺失、GitHub 引用解析、loader 依赖或宿主能力阻塞，记录阻塞原因并停止在皮肤分支内扩展框架。该问题应单独开 Mojobox 协议或宿主适配任务。

## 4. PR #6 中可以使用的事实

PR #6 只提供候选来源资料和插件投影，没有正式 `.dshpack`。可引用的组件如下：

| 组件 | 来源 | 当前判断 |
| --- | --- | --- |
| `@smalltailqwq/dsh-client-ui-skin-deep-whale-manager` | npm `0.1.6` | 可作为管理器组件，未完成宿主实测 |
| `@smalltailqwq/dsh-client-ui-skin-maid-atelier` | npm `0.1.7` | 可作为鲸鱼娘女仆皮肤组件，未完成宿主实测 |
| `@smalltailqwq/dsh-client-ui-skin-orca-link` | npm `0.1.7` | 可作为虎鲸皮肤组件，未完成宿主实测 |
| `@dsh-external/dsh-client-ui-skin-deep-whale-day-night` | GitHub Release `0.1.12` | 必须单独成包；与 `maid-atelier` 有 `skin id/bodyAttr` 冲突风险 |
| `dsh-client-liang-intensity-skin` | GitHub Release `0.1.7` | 许可证为 `NOASSERTION`，先不要正式收录 |
| `dsh-theme-endfield` | 固定 Git revision `1.1.5` | 没有已核验的精确 artifact，先保留候选 |
| 美女系列源码覆盖项目 | GitHub 源码 | 当前没有根插件入口，不能作为 `plugins[].ref` |

`@dsh-eac/ui-skin-loader` 在 PR #6 中是 `not-verified`。除非上游明确给出可安装的插件引用和版本，不要假定它已经存在或自动加入皮肤包。

## 5. 目标薄包结构

正式归档只能是 ZIP，扩展名为 `.dshpack`，根目录最少包含：

```text
dev.example.deep-whale-appearance-1.0.0.dshpack
└── pack.json
```

`pack.json` 应遵循现有 `vendor/eac/feature-pack-pack.schema.json`，至少包含：

```json
{
  "formatVersion": 1,
  "id": "dev.example.deep-whale-appearance",
  "name": "鲸鱼娘外观包",
  "version": "1.0.0",
  "description": "鲸鱼娘管理器、深海女仆工坊和虎鲸链路",
  "author": "Small-tailqwq",
  "license": "MIT AND CC-BY-NC-SA-4.0",
  "requires": { "dsh": ">=0.1.7-rc.1 <0.3.0-0" },
  "plugins": [
    { "ref": "@smalltailqwq/dsh-client-ui-skin-deep-whale-manager", "version": "0.1.6" },
    { "ref": "@smalltailqwq/dsh-client-ui-skin-maid-atelier", "version": "0.1.7" },
    { "ref": "@smalltailqwq/dsh-client-ui-skin-orca-link", "version": "0.1.7" }
  ]
}
```

不要在清单中加入当前检查器不支持的 `payload`、非空 `overrides`、preset、skill 或源码文件。皮肤资源由被引用的插件自己发布，不由 Mojobox 重新打包。

## 6. 组件选择规则

1. 鲸鱼娘三件套作为首个试点包；管理器、女仆工坊和虎鲸链路一起验证。
2. 昼夜工坊必须使用独立 Pack ID，不能与女仆工坊放进同一个包。
3. Liang 皮肤要先确认公开发布和再分发许可，再考虑收录。
4. Endfield 先等待可核验的 Release artifact；固定源码地址不能替代归档摘要。
5. 美女系列必须由上游改造成有根 `package.json`、入口和可安装产物的插件，皮肤分支不负责改造源码覆盖安装脚本。

## 7. 收录文件与验证流程

拿到真实 `.dshpack` 后，按以下顺序执行：

```powershell
npm run inspect:feature-pack -- artifacts/<id>-<version>.dshpack
npm test
npm run build
npm run verify:downloads
git diff --check
git status --short
```

正式收录记录放在 `catalog/feature-packs/<id>.json`，至少填写：

```json
{
  "format": "eac-feature-pack-v1",
  "id": "dev.example.deep-whale-appearance",
  "version": "1.0.0",
  "source": "https://上游发布页",
  "author": "Small-tailqwq",
  "license": "MIT AND CC-BY-NC-SA-4.0",
  "sha256": "最终 .dshpack 文件的 64 位小写 SHA-256"
}
```

构建产生的 `site/public/generated/`、`dist/`、`dist-demo/` 和 `.cache/` 不提交。静态检查只证明归档结构、身份和摘要一致，不证明插件来源在线、宿主能安装或皮肤能运行。

## 8. 宿主实测边界

宿主安装、重启、皮肤切换、卸载、回滚和冲突验证属于后续搭载阶段。若获得明确的隔离测试条件，只能使用新建的测试 home/profile，至少记录：

- DSH 和 loader 的准确版本；
- 安装前后的插件版本；
- 首次启动和重启后的皮肤状态；
- 管理器切换结果；
- 与另一皮肤同时安装时的冲突表现；
- 卸载和失败后的残留情况。

不要把一次本地成功启动写成通用兼容承诺，也不要修改宿主仓库来绕过失败。

## 9. 新会话启动任务

新会话按以下顺序推进：

1. 阅读本文件、`AGENTS.md`、`docs/intake.md` 和 `docs/author-pack-request.md`。
2. 检查工作区和分支，不覆盖已有改动。
3. 复核 PR #6 中鲸鱼娘三件套的最终来源、版本、许可证和上游交付状态。
4. 向上游索取或确认最终薄 `.dshpack`；没有真实归档时只做临时验证，不进入正式目录。
5. 用现有检查器验证归档；仅在验证通过后新增皮肤专用收录记录。
6. 运行完整测试和下载复核，汇报未验证项和阻塞项。

本分支完成的判定是：**皮肤包归档和收录资料准备完整，改动只涉及皮肤包事实与文档，Mojobox 本体、宿主安装器和其他项目没有被扩展。**
