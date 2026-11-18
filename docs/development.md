# Mojobox 开发文档

网站、资源目录与静态构建在本仓库维护；客户端安装和组件管理在 [Mojobox Installer](https://github.com/lanyun077/Mojobox-Installer) 维护。

## 本地运行

使用 Node.js 22.12 或更新的受支持版本，按 lockfile 安装依赖。

```bash
npm ci
npm run dev
```

`npm run build` 生成 `dist/`，`npm run preview` 预览构建结果。开发和构建都会从收录记录生成网站目录；不手改 `site/public/generated/`、`dist/` 或 `.cache/`。

## 仓库结构

| 路径 | 内容 |
| --- | --- |
| `catalog/plugin-listings/` | 插件信息卡 |
| `catalog/feature-packs/` | 功能包、外观包收录记录 |
| `catalog/previews/`、`catalog/website-tags.json` | 预览图与网站标签 |
| `artifacts/` | 作者原始归档 |
| `site/` | 静态网站源码 |
| `scripts/` | 校验、目录生成、发布与统计脚本 |
| `schemas/`、`fixtures/`、`policies/` | 数据约束、测试样本与收录策略 |
| `authoring/` | 仓库维护的整合包清单与构建工具 |
| `.github/workflows/` | 贡献检查、网站发布与定时统计 |

网站与安装器使用相同分类：`appearance` 为外观包，`function` 和 `workflow` 为功能包。分类取自收录元数据，不改作者归档，详见[分类与标签](catalog-tags.md)。

## 提交前检查

```bash
node authoring/build.mjs --check
npm test
npm run build
npm run verify:downloads
npm run build:demo
npm run verify:downloads -- dist-demo --allow-demo
git diff --check
```

网站改动还需设置 `BASE_PATH=/dsh-mojobox/` 重新构建，核对根路径与子路径下的桌面、窄屏、键盘操作及空态、失败提示。提交后运行 `npm run check:submission -- origin/main` 检查本次提交边界。

包 ID、版本和摘要必须对应真实原始文件；更新内容须递增版本，保留既有归档及下载地址。网站下载量来自 GitHub Release 附件，发布与统计流程见下方文档。

## 详细资料

| 任务 | 文档 |
| --- | --- |
| 提交代码 | [贡献指南](../CONTRIBUTING.md) |
| 投稿与审核 | [投稿流程](community-submissions.md) · [收录规范](intake.md) |
| 架构与协议 | [架构说明](architecture.md) · [插件来源接口](plugin-source-api-v1.md) |
| 发布与统计 | [静态发布操作](static-cloud-release.md) · [部署说明](deployment.md) |
| 维护检查 | [维护清单](maintainer-checks.md) |
