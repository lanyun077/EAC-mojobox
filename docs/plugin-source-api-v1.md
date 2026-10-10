# 插件来源接口 v1

Mojobox 为下游提供一份静态、版本化的插件索引。下游读取它即可取得插件信息、精确版本、
完整兼容/冲突/限制声明，以及经过静态核验的原始发行下载。无需解析网站 DOM，也无需把
作者的软件包改成 Mojobox 格式。网站与接口使用同一份收录事实源。

2026-10-10 的本地目录有 26 个插件条目：24 个原始发行下载、2 个仅来源条目。
代码和数据随本次开发分支提交；本文定义构建输出与消费契约，合并和公网部署须独立确认。
用户转述前两轮草稿可以通过，本轮不要求下游继续提供验收回执；该消息不代表下游已实现这个新入口。

## 入口与格式

构建完成后，站点根目录有以下文件：

```text
generated/api/v1/plugins.json
generated/api/v1/schemas/plugin-index.schema.json
generated/api/v1/schemas/plugin-listing.schema.json
```

例如站点部署在 `/EAC-mojobox/`，入口就是 `/EAC-mojobox/generated/api/v1/plugins.json`。
这是普通 JSON 文件，GitHub Pages 或任意静态托管均可提供；不需要后端端口或登录。
生产消费使用明确配置的 HTTPS 站点源；本机联调可以使用 loopback HTTP。

| 字段 | 消费方式 |
| --- | --- |
| `schemaVersion` | 必须是 `plugins.mojobox.dev/v1`，不按网页 Catalog 或 EAC supply 解析 |
| `sourceId` | 必须是 `dsh-eac.mojobox`；只是来源标识，不是密码、签名或认证 |
| `revision` | 当前条目数组的确定性内容指纹；不变可跳过重复导入，不表示时间顺序或防回滚 |
| `demo` | 生产必须为 `false`；测试演示不得当作正式资源源 |
| `plugins` | 按稳定 ID 排序的当前全量快照，按 `listing.id` 或 `packageName` 更新目录 |

每个条目包含：

```json
{
  "listing": {
    "format": "mojobox-plugin-listing-v1",
    "id": "org.example.tools",
    "packageName": "@example/tools",
    "name": "工具插件",
    "version": "1.0.0",
    "summary": "提供工具能力。",
    "source": { "url": "https://example.org/releases/1.0.0" },
    "license": null,
    "compatibility": { "dsh": null, "basis": "unknown" },
    "conflicts": null
  },
  "checks": "metadata-only",
  "runtime": "not-tested",
  "dependencies": "not-resolved",
  "download": null,
  "report": null
}
```

以上是来源条目示例，不是实际发行。`listing` 保留完整轻量信息卡，包括可选的
`author`、`maintainedBy`、`limitations`、`links` 和 `artifact`；不静默删掉未知或冲突信息。
未填写 `maintainedBy` 时按 `registry-maintained` 展示，不能标成作者提交或作者背书。
`conflicts: null` 是未知，`[]` 是未报告，均不代表实测无冲突。

有下载时，`checks` 为 `artifact-checked`，`download` 与 `report` 都是以下对象：

```json
{
  "url": "../../downloads/org.example.tools-1.0.0.tgz",
  "sha256": "64位小写十六进制摘要",
  "size": 12345
}
```

示例摘要是文字占位，不能用于校验。**所有相对 URL 都以实际获取的 `plugins.json` URL 为基准**，
通过 `new URL(file.url, indexUrl)` 解析。不要以网页地址、API 目录或站点根自行拼接。
报告的路径为 `../../reports/<id>.plugin.json`。`download` 的摘要/大小与 `listing.artifact`
完全相同；`listing.artifact.url` 是上游原始发行地址，`download.url` 是 Mojobox 镜像地址。
来源条目没有 `artifact`，且 `download`、`report` 必须为 `null`，不能推测下载地址。

## 下游一次需要接什么

1. 配置 Mojobox 索引入口，识别版本并校验 Schema；索引读取限制建议 8 MiB。
2. 保留 `listing` 的兼容、冲突、限制和原始来源，并在界面显示“运行未测试”。
3. 下载条目按大小与 SHA-256 校验实际响应字节；限长读取，不先执行、安装或解包到宿主目录。
4. 再按下游自身规则检查原始 `package/package.json`、Bundle、平台、依赖、权限和安装资格。
5. 用一次完整的合法快照更新目录；网络失败、Schema 错误、摘要失败时保留上一次成功快照。

`packageName + version` 标识软件发行，`listing.id` 是目录 ID。更新版本时不能原地替换旧发行
字节；元数据补充可能改变 `revision`，但不因此改变软件版本。索引中不再出现的条目只是当前
不供给，下游可以隐藏其来源；不能据此自动卸载用户已装插件或其他来源的副本。

当前快照不提供历史序号、撤回原因账本、依赖闭包或签名。需要严格发布顺序/撤回交易的消费者
继续使用既有 EAC 批次契约；不能拿内容指纹假装有这些能力。

报告的 `packageMetadata` 是投影，不是原始 `package.json` 字节。需要原始元数据证据时，
从摘要校验后的 `.tgz` 内只读取得 `package/package.json`，不要把投影重新序列化冒充原始文件。
包内附带 Skill 仍是插件内容，本接口不提供独立 Skill 资源。

## 与现有 EAC 供货的关系

前两轮 `supply.eac/v1` 草稿与本接口并行存在，旧 Schema、样本和批次导出不变。
已有 EAC 导入器不会自动读新插件索引。本接口是 Mojobox 自己的通用资源源，下游只需一次
增加该格式的读取/转换，将其映射到自己的市场记录；无需给 Mojobox 持续反馈或参与每次收录。

之所以暂不把这 26 条硬塞进旧 supply：旧协议没有通用插件冲突、限制字段，删掉边界会让
“来源信息”被误解成“安装许可”。日后需要合流，应明确协商版本/扩展并保留全部字段，
不能悄悄改变已经通过的草稿。

## 本地验证与发布

在 Mojobox 仓库执行：

```bash
npm test
npm run build
npm run verify:downloads
npm run preview -- --host 127.0.0.1 --port 4192 --strictPort
```

根路径构建时入口为 `http://127.0.0.1:4192/generated/api/v1/plugins.json`。
子路径构建须先按部署文档设置 `BASE_PATH`，并在地址中保留该路径。
`127.0.0.1` 只是访问者自己的电脑，不是对方可远程访问的接口。

维护者检查信息卡与许可，提交事实源，通过本地验证与 PR 审核后，由发布工作流复核并发布完整 `dist/`，
保证索引、报告与下载属于同一次构建。发布后逐项 HTTP 校验，再给下游固定入口。
旧版本归档保留于版本发布或专门的归档存储；本地构建会清理生成目录，**当前静态目录不承诺
永久保存旧版本 URL**。不要把临时预览地址或示例域名当成生产源。

v1 固定入口与必需字段语义；破坏性变化使用新版本路径。当前数据规模不需要分页、搜索服务、
数据库或自动安装端点。中量采集只做候选发现、精确发行核验和人工许可/用途审核，
不要把全网搜索结果未经筛选直接变成正式目录。

## 本轮验证记录：2026-10-10

- `npm test`：153 项，151 通过、2 项因 Windows 文件符号链接权限跳过，0 失败。
- 根路径、`/EAC-mojobox/` 子路径构建与下载复核通过；46 个归档、10 套皮肤资料。
- 演示构建与显式 `--allow-demo` 复核通过；正式接口拒绝演示标记。
- HTTP 逐项核对 24 个插件下载、24 份报告与两份 Schema；摘要和大小一致。
- 桌面 1440、移动 390、窄屏 320 像素页面：26 卡片、2 个来源筛选、来源详情、Skill 隔离及无横向溢出通过。
- 接口确定性重建、未知状态/限制保留、错误地址、摘要、身份重复与报告篡改的定向测试通过。

以上是本地收录与接口验证，不是下游新接口验收、公网可用性或插件运行验证。
