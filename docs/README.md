# 文档索引

当前主线是收纳、静态检验、展示和原始下载。内容由作者维护，安装与运行由下游宿主或 loader
负责。历史交接、旧计划和候选阻塞不作为当前执行规范。

## 提交与使用

- [README 角色入口](../README.md#从这里开始)：先了解项目，再选择浏览、投递、消费或开发。
- [外部作者提交与审核](community-submissions.md)：提交材料、标签、介绍、图片、PR 与审核合并。
- [插件轻量收录](plugin-intake.md)：最小信息卡、兼容与冲突边界、原始下载、Skill 预留。
- [插件来源接口 v1](plugin-source-api-v1.md)：26 条插件快照、公开入口、摘要核验与下游接入。
- [整合包文件结构与最小示例](author-pack-request.md)：理解 `.dshpack` 和 `pack.json`。
- [收录规范](intake.md)：支持范围、字段、检验结论与下载构建。
- [版本声明策略](intake-version-policy.md)：新提交门禁、精确历史例外、迁移和 Issue 回复草稿。
- [贡献指南](../CONTRIBUTING.md)：开发环境、修改类型和最低验证。
- [静态部署](deployment.md)：构建、下载校验和 GitHub Pages。

## 维护与边界

- [审核与 CI 门禁](maintainer-checks.md)：PR 检查、分支保护、人工审核与 Pages 发布的职责。
- [项目定位与路线](project-positioning-and-roadmap.md)：长期方向和上下游职责。
- [EAC 供货导出器](eac-supply-export.md)：本地草稿、正式批次、历史与撤回，尚未部署；用户转述两轮草稿可以通过，不再要求逐批反馈。
- [开发代理指南](agent-guide.md)：任务模板；执行约束以 [AGENTS.md](../AGENTS.md) 为准。
- [架构与扩展边界](architecture.md)：职责边界，历史 Pack/Lock 设计已明确标记。
- [宿主接入核对](host-adapter.md)、[legacy Pack/Lock 格式](pack-format.md)：维护已有历史实现，不扩展为当前收录协议。
- [框架验收记录](framework-acceptance.md)：固定日期的框架验证，不代替今天重新运行测试。
- [插件目录与来源接口验收](plugin-catalog-acceptance-20261010.md)：本轮构建、HTTP 与桌面/窄屏检查，以及已知限制。

## 来源与选型

- [首批收录](ecosystem-curation.md)、[插件常客与候选](plugin-shortlist.md)。
- [EAC/AIO 候选解析](eac-plugin-suite-analysis.md)、[减重与分类](suite-curation.md)。
- [皮肤来源复核](skin-pack-source-review.md)、[Power Toolbox 首版审查](power-toolbox-review.md)。
- [END-EAC 候选核验](candidate-audit-end-eac-v1.1.0.md)：保留固定版本的来源判断，不自动提升为正式内容。
- [自制包事实源与打包](../authoring/README.md)：区分我们维护的组合与第三方原始整合包。

## 历史资料

已结束阶段的交接和旧计划统一放在 [archive/](archive/README.md)。保留原始背景和验证记录，
不再作为新会话启动或当前验收入口。没有删除生产 Evidence、原始归档、来源快照或上游协议。
