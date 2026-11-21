# 整合包更新与精简（2026-11-21）

当前目录从主分支的 18 个整合包精简为 11 个：6 个功能场景、5 个外观主题。
功能包统一为 `0.4.0`，外观包统一为 `0.3.0`，目标内核为官方 DSH `0.2.2-rc.5`。

## 功能场景

| 整合包 | 组件数 | 内容与用途 |
| --- | ---: | --- |
| DSH 日常减重版 | 6 | 市场、上下文、会话、快照、开发侧栏与交互可视化；用于日常对话、编辑文件和查看改动 |
| DSH Power Toolbox | 11 | 日常工具、项目记忆、Agent Teams、ModSearch、BrowserSkill、Vision Router；用于开发、协作、联网研究和图像分析 |
| DSH 文档办公包 | 7 | Univer Office、GenUI 与文件及会话工具；用于表格、文档、演示文稿和交互页面的创建、编辑与审阅 |
| DSH 人设与常驻记忆包 | 3 | Soul MD、上下文面板和快照；用于人设卡、常驻记忆和配置恢复 |
| DSH 移动会话包 | 3 | Meow Smooth、会话管理和快照；用于移动布局、输入、通知与会话整理 |
| DSH 对话迁移包 | 3 | Chat Import、会话管理和快照；用于导入、归档和继续使用历史对话 |

## 外观主题

| 整合包 | 内容与用途 |
| --- | --- |
| Bloom 中国风主题 | 十五套莫兰迪配色、明暗主题、三种玻璃材质与星空背景 |
| Catppuccin 四色主题 | Latte、Frappé、Macchiato、Mocha 四款配色与磨砂玻璃 |
| OpenCode 护眼调色板 | 多款明暗配色与主题切换 |
| Wallpaper Engine 壁纸与玻璃界面 | 本机壁纸、玻璃外观与开发侧栏 |
| 鲸鱼娘皮肤系列 | 皮肤管理器、深海女仆工坊、虎鲸链路及个性化设置 |

各包的 `description`、收录 `introduction` 与外观说明直接介绍组件、效果和用途。

## 精简去向

| 原包 | 当前场景 |
| --- | --- |
| 必备工具包、会话效率包、开发工作台包 | 日常减重版 |
| 项目记忆包、团队协作包、联网研究包、视觉研究包 | Power Toolbox |

7 个原包的作者清单与收录记录保存在 `authoring/archive/20261121/`，原始 `.dshpack`
继续保存在 `artifacts/`。当前目录与官方标签只保留 11 个包。目录收起旧条目后，
已安装插件的启停与数据仍由用户和宿主管理。

## 来源与版本

本轮核验全部 23 个当前组件的精确 npm 元数据和原始 tarball，其中 19 个组件有新版。
与整合包共用的 11 张独立插件信息卡及其原始下载同步更新。完整版本、实际文件大小、
SHA-256、registry integrity、包身份与内核声明核对见
[`authoring/catalog-update-20261121.json`](../authoring/catalog-update-20261121.json)。

沿用主分支对 Navbar 和三个旧外观包的撤下决定，保留独立插件 25 条。

功能包选型来源保存在 `authoring/curation-sources.json`；历史 registry 观察保留原日期。
共享组件在所有当前包中使用同一精确版本。官方内核与兼容检查函数的来源及摘要已更新，
按 `engines.dsh` 优先、否则检查 DSH peer，且包含预发布版本的官方规则核对声明。

Project Memory 改为原作者 npm 精确发行 `@yolk_vat-y/dsh-project-memory@0.7.1`。
收录检查器补齐 npm scope 下划线支持，并验证 URL、路径及别名仍被拒绝；Feature Pack v1
和插件来源 v1 的字段保持一致。

## 使用条件与验证范围

目标内核要求 Node.js `>=24.9.0`。BrowserSkill 使用其外部 CLI、浏览器扩展及授权；
Office 使用其网关与浏览器环境；Vision Router 的模型服务和旧配置升级按作者说明配置。
移动通知按选用方式配置 HTTPS 与授权；Wallpaper Engine 使用本机应用与壁纸素材。
代码及美术素材分别遵循上游许可，鲸鱼娘美术采用 CC BY-NC-SA 4.0。

本轮核验发行字节、身份、摘要、内核声明、清单重建、目录构建与下载一致性。
实际插件安装、依赖闭包、运行功能、GPU 效果与既有配置升级仍需宿主验证。
外观预览沿用已有来源截图；此前官版 `0.2.2-rc.1` 的加载记录仅对应其原始版本。

验证命令：

```powershell
node authoring/build.mjs --check
npm test
npm run build
npm run verify:downloads
git diff --check
```

本地验证：11 个清单与归档重建一致；完整测试 190 项通过、2 项跳过、0 项失败；
生产构建和 34 个下载校验通过；演示构建和 1 个演示下载校验通过。

回退时恢复上一批收录记录、作者清单及标签，并重新构建目录；对应旧归档原样保留。
