# Pack、Lock 与下载格式

> **历史格式维护**：本文描述 Mojobox 自定义 Pack/Lock/`.dshpack` 链路，已冻结为 legacy。
> 当前收录采用薄 Feature Pack v1，见 [收录规范](intake.md)；两种格式不互转，也不共用安装入口。

字段以 `schemas/pack.schema.json`、`schemas/pack-lock.schema.json` 为准。本轮未改变 wire
版本；保留外观包和工作流分类。外观包与皮肤包统一归类为 `appearance`，当前收录策略见
[项目定位与发展路线](project-positioning-and-roadmap.md)。

## 新包示例

保存为 `catalog/packs/org.example.productivity.pack.json`。示例引用已有组件，不代表已在你的
宿主验证通过；说明和兼容要求应由维护者根据实际组合补充。

```json
{
  "$schema": "https://mojobox.dev/schemas/pack-v1alpha1.json",
  "apiVersion": "packs.mojobox.dev/v1alpha1",
  "kind": "Pack",
  "metadata": {
    "id": "org.example.productivity",
    "version": "0.1.0",
    "name": "工作辅助包",
    "description": "提供查找辅助功能的示例组合。",
    "category": "function"
  },
  "components": [
    { "id": "dev.aio.dsh-find-plugin", "version": "0.3.7", "required": true }
  ]
}
```

执行 `npm run lock:pack -- catalog/packs/org.example.productivity.pack.json`，再运行 `npm test`
和 `npm run build`。工具只写入对应 Lock，不联网，不覆盖其他 Pack 或 Evidence。

## 维护约定

- ID 与文件名一致，组件不能重复；发布内容变化要增加版本。
- 当前组件来源只支持精确 npm 版本，不接受 latest、版本范围、嵌套包或任意安装脚本。
- `required: false` 表示可选组件，归档仍包含它；宿主决定如何让用户选择。
- `requires.platforms` 是声明限制，缺省不表示已验证所有平台。
- `requires.hostCapabilities` 仅在实际依赖时填写，新包不默认要求快照或试启动。
- 维护者、许可来源和测试环境先在 PR 与组件来源中交代，不编造不存在的 Schema 字段。

Lock 保存精确 `source`、Manifest 路径和两项 SHA-256。工具计算 Manifest 真实字节摘要，
artifact 摘要来自目录；构建验证实际 tarball。Lock 不包含本机路径和用户状态。

## `.dshpack` 内容

```text
pack.json
pack.lock.json
objects/sha256/<manifest digest hex>
objects/sha256/<artifact digest hex>
```

归档是 ZIP。根清单采用 Mojobox `packs.mojobox.dev/v1alpha1`，不是 EAC `formatVersion: 1`。
读取器须先识别格式，再检查 Lock 和对象摘要，不依据扩展名决定安装行为。
归档包含选定插件文件，未保证包含全部传递依赖，完整断网安装需要另行验收。

使用 `npm run inspect:pack -- <文件.dshpack>` 可独立检查 Pack/Lock、组件 Manifest、来源和
对象摘要，拒绝缺失、重复、未引用或非约定路径的 ZIP 条目。读取不需要本仓库的 Catalog，
不会下载依赖或解压到用户目录。检查器输出的是格式与完整性结果，不是宿主运行结果。

整体归档摘要仍应与可信目录比对：文件内部自己声明的摘要不能证明发布者身份。

## 生成目录

`generated/catalog.json` 保留 `apiVersion`、`specifications`、`plugins`、`packs`，新增
`distribution`。每个 Pack 保留清单、`lock`、`packUrl`、`lockUrl`、`archiveUrl`，新增
`archiveSize`（字节数）、`archiveDigest`（`sha256:` 加归档摘要）。

URL 相对于站点根基路径解析，部署到 `/dsh-mojobox/` 时应保留前缀。公开插件列表只包含当前
发布包引用的组件，不是仓库全部资料。消费者应容忍新增字段。
