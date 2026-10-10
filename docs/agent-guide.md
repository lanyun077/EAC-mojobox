# 使用 coding agent 开发 Mojobox

先读根目录 `AGENTS.md`、[收录规范](intake.md)及[作者提交指南](community-submissions.md)，检查分支和已有改动。当前目标为收纳、检验、展示和下载；发展方向见[项目路线](project-positioning-and-roadmap.md)。旧计划和阶段交接已移入[历史归档](archive/README.md)，不作为当前任务入口。

## 收录任务模板

```text
目标：收录开发者已经提供的 <id>@<version> 整合包。
输入：开发者来源页面、原始归档、作者及许可证声明。
允许修改：catalog/feature-packs/、artifacts/ 及直接相关文档。
核验：实际字节的 SHA-256、归档清单身份、来源、作者和许可证。
遇到格式不支持时输出具体差异，不静默重打包，不伪造安装证据。
完成：npm test、npm run build、npm run verify:downloads。
报告：检查范围、未验证的来源解析和运行兼容。
```

生产记录与测试样本分开：`fixtures/intake/` 不会自动进入正式收录。没有生产样本时允许空目录，用显式演示构建验证框架。

## 适配任务模板

```text
目标：让指定开发者整合包符合当前收录规范。
先列出原包与 intake.md 的具体差异，判断是元数据补齐还是需要修改产物。
任何产物改动都保留原始来源、原始摘要和改动说明；新字节重新计算摘要。
不要把薄清单检查通过写成插件来源可解析或运行通过。
不新增 Mojobox 安装器、Profile 管理或静默格式桥接。
```

## 网站与构建任务

网站只消费生成目录，不读取用户环境、不安装插件。运行：

```bash
npm test
npm run build
npm run verify:downloads
npm run build:demo
npm run verify:downloads -- dist-demo --allow-demo
```

另做根路径和子路径构建、桌面/窄屏、键盘操作、中文输入、空目录、损坏目录与下载字节检查。构建下载是开发者原始文件；同一输入不会重写归档内容。

## 事实源与边界

- `catalog/feature-packs/`：当前收录记录。
- `artifacts/`：开发者原始产物。
- `schemas/intake.schema.json`：目录记录契约。
- `vendor/eac/`：固定输入格式，不直接依赖外层宿主仓库。
- `scripts/feature-pack.mjs`：结构、布局和摘要检查。
- `scripts/build-catalog.mjs`：生成目录、报告、清单、原样下载。
- `scripts/verify-downloads.mjs`：独立复核最终发布树。
- `site/`：网站界面。
- `catalog/packs/`、Pack/Lock 和旧 adapter：legacy，保持历史测试，不作为当前默认输入。

目录、下载、报告必须来自相同归档。自动检验不解析插件来源，不签发运行 Evidence。需要真实运行结果时，在隔离环境调用宿主已有能力；不能使用日常 Profile 做试验。

## 交付检查

说明实现、实际命令、未验证项和残余风险。检查 `git diff --check` 与工作区，生成物不提交。
遵守用户对分支、阶段提交及外部操作的授权；用户未授权时不推送、不发布、不部署。

框架验收记录见 [framework-acceptance.md](framework-acceptance.md)。
