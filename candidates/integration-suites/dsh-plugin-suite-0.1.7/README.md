# EAC/AIO 完整整合包来源候选

来源：[EAC-Plugin-Integration-Pack v0.1.7](https://github.com/zouyuxuan122/EAC-Plugin-Integration-Pack/releases/tag/v0.1.7)。
固定提交 `58d020813bb565f7888b6f0b539ec0711733a519`；复核日期 2026-10-01。

当前收纳的是元数据、组件清单和选型资料，状态为 `source-only`。它不是正式 Feature Pack 收录，
不进入网站目录、下载目录或宿主索引。没有将其重新组合为 DSH-EAC 自制包。

## 本目录内容

| 文件 | 来源与用途 |
| --- | --- |
| `source.json` | 来源、版本、真实发布归档摘要、核验范围和收录限制 |
| `package.json` | 发布 `.tgz` 内的整合包清单原始字节，仅作快照 |
| `eac.json`、`aio.json`、`skins.json`、`retired.json` | 发布 `.tgz` 内套餐及退役清单原始字节 |
| `bundled-index.json` | 发布 `.tgz` 内 69 个组件的原始索引 |
| `component-facts.json` | Mojobox 从 69 个实际内嵌 `.tgz` 清单提取的身份、摘要、许可声明、依赖与平台信息，不是原始 package.json |

各快照 SHA-256 保存在 `source.json.snapshots`。本目录的 `package.json` 不作为本地可安装项目，
不运行其 scripts；本目录不含插件入口、可执行程序、皮肤素材或组件归档。

## 实际核验

发布文件 `dsh-plugin-suite-0.1.7.tgz` 为 125,909,484 字节，SHA-256：

```text
0799789791b02b2ee319c4e599789cf0b61a9c35f26bfa1dea6112cf53baebfc
```

归档只读解析结果：EAC 48 条、AIO 19 条、皮肤 10 条；EAC/AIO 共享 8 个组件，合计 69 个独立
组件。69 个内嵌 tarball 的真实摘要、大小和 package 身份均与包内索引匹配，目录没有缺少对应产物。
整合包 package.json、三套套餐清单与发布标签源码字节一致；Host 入口摘要也与源码一致。

原始大归档仅下载到被忽略的 `.cache/eac-suite-v0.1.7/` 用于检查，不随本目录提交或托管。
没有执行插件、安装脚本或生命周期脚本，没有修改用户 Profile，没有签发运行 Evidence。
上游运行报告主要绑定整合包 `0.1.6` 与官方内核 `0.2.0-rc.2`，不视为本次 `0.1.7` 的运行验收。

69 个组件文件内没有内嵌 `node_modules`。Better Sidebar 等组件仍声明普通 dependencies，
宿主可能从已有缓存或 registry 获取；本次不证明干净环境下的完整离线依赖闭包。

## 正式收录限制

现有检查器接收不超过 2 MiB、只含根 `pack.json` 与可选 `icon.png` 的薄 ZIP `.dshpack`。
本成品是携带插件代码、安装管理器和内嵌组件的 npm `.tgz`，不能通过改后缀、单纯提高大小上限，
或把 69 个组件改写为普通 npm 引用来保留其行为。多项 EAC 特制版本只在本成品中提供。

该文件也超过 GitHub 普通 Git 的 100 MiB 单文件上限。后续宜用独立的上游 Release 成品引用
记录版本、下载 URL、大小、摘要、内容清单与核验范围，不将安装器搬进 Mojobox。

许可不能统一继承整合包代码的 MIT：

- 私有桥 `@local/dsh-webui-statem-bridge@1.2.2` 的实际清单未声明 license，未发现常见署名文件；
  上游说明称其源为 private/UNLICENSED，需要可核验的再分发授权。
- `dsh-dafeiyu@0.1.0-alpha.6` 的素材告知明确排除 MIT，并写明不授予额外美术许可。
- 女仆皮肤是 `CC-BY-NC-SA-4.0`，须保留非商业、署名与相同方式共享条件。
- 其余组件的 license 字段与署名文件路径是来源事实，不等于完成了全部第三方权利审查。

按 [项目定位与发展路线](../../../docs/project-positioning-and-roadmap.md) 的许可边界，
许可不清时可记录候选来源，不默认允许 Mojobox 再分发。当前保存公开元数据和上游下载来源，
不复制或改写这些授权限制。

插件搭配、互斥和完整包设计参考见 [解析记录](../../../docs/eac-plugin-suite-analysis.md)。
