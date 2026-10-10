# 宿主接入与安装边界

> **历史实现维护**：本文件保留早期自定义格式与实验 CLI 的核对记录，不是当前收录门槛。
> 当前采用薄 Feature Pack v1 收纳与下载，安装与运行归下游；不新增 EAC Adapter、格式桥接或
> `dsh-eac://` 深链接。当前规范见 [收录规范](intake.md)，旧安装计划见 [历史归档](archive/README.md)。

## 已确认的差异

Mojobox 使用 `packs.mojobox.dev/v1alpha1` 的 Pack、独立 Lock 和按摘要保存的对象。
本次检查的 EAC Feature Pack 使用 `formatVersion: 1`、`plugins[].ref` 与可选 payload。
它们共享 `.dshpack` 后缀，但清单与安装语义不相同。

已按远端 commit `e7da2db37a53ca87c7fb1e00de6b5060e6a220ae` 核对：

- [Schema](https://github.com/DSH-EAC/DSH-Desktop-EAC/blob/e7da2db37a53ca87c7fb1e00de6b5060e6a220ae/docs/schemas/feature-pack-pack.json)
  要求顶层 `formatVersion/id/name/version`。
- [核心实现](https://github.com/DSH-EAC/DSH-Desktop-EAC/blob/e7da2db37a53ca87c7fb1e00de6b5060e6a220ae/dsh-desktop/lib/desktop/feature-pack.ts)
  的 `parsePackZip()` 读取清单后直接调用 `validateManifest()`，目前会拒绝 Mojobox 清单。
- [CLI](https://github.com/DSH-EAC/DSH-Desktop-EAC/blob/e7da2db37a53ca87c7fb1e00de6b5060e6a220ae/dsh-desktop/scripts/feature-pack-cli.ts)
  在命令分派前初始化 Profile 和保护中心，不能把其 `inspect` 当作无副作用的诊断执行。

最小接入位置是宿主解析边界：识别 Mojobox 格式、只读校验与计划，然后复用安装执行链。
仍须验证安装接口能消费已校验的本地 npm artifact，不能简单转成包名重新下载而丢失字节锁定。
此前只做源码核查；本轮已通过下述隔离 smoke 验证官方 CLI 的本地 artifact 安装。

已有面向官方 CLI 的实验薄接入；尚无 EAC UI 的导入实现。网站仅提供下载，不展示旧
`dsh-eac://mojobox/...` 入口。历史 Profile 和 Evidence fixture 不证明新版本支持该协议。

本体已提供 `scripts/inspect-pack.mjs` 的只读 `inspectPack(file)` 和 `inspect:pack` 命令。
它不依赖 Catalog，读取归档并校验协议、组件和摘要，可作为后续宿主读取边界的参考。它没有
查询本机插件或执行安装；调用方仍需验证可信目录提供的归档摘要和本机兼容条件。

## 官方 CLI 实验接入

`adapters/official-cli.mjs` 只支持 `@deepseek-ai/dsh 0.1.7-alpha.1` 的官方 bin 文件，要求
Node 22.19+ 或 24+ 和 PATH 中的 pnpm。Node 22.17 不支持该 CLI 的 `import.meta.main`，可能
退出 0 却没有动作，因此安装还会复核包身份、版本和 Bundle 登记。

```text
npm run host:pack -- plan <archive.dshpack> --home <绝对DSH_HOME> --profile <已有profile>
npm run host:pack -- install <archive.dshpack> --home <绝对DSH_HOME> --profile <已有profile> --cli <绝对dsh/lib/bin.js> --confirm
```

目录必须已存在，不能指向符号链接转移的位置；`desktop` 是官方 Electron 专用，明确不支持。
计划直接读取 Profile 与已装 package.json，不调用会初始化环境的 `dsh plugin list`。
安装前从归档提取并复核 tarball 内实际 name/version 和 bundle 声明，再调用官方
`dsh plugin --profile <name> add file:<绝对tgz>`。源码基线是
`c36a83ff6bb95e3f82cf79f9be7c724270a8aa61` 的 CLI 与 plugin-manager operations。

已验证的 tarball 持久保存到显式 home 下 `mojobox/artifacts/<sha256>.tgz`，因为 pnpm 会保留
file 来源；安装后不可删除这些文件。同版本保持，包括用户禁用状态；不同版本或外部本地来源
暂时阻断，不提供自动覆盖。部分失败逐项报告，不宣称事务回滚。

当前 CLI 未提供 Pack 声明的快照与试启动能力，这类包会阻断。三个生产包目前都有此要求，
因此实验安装流程用独立合成 Bundle 验证，不能借此标记生产包已兼容。纯展示元数据不等于
tarball 内已存在官方 bundle 声明，旧插件可能仍需作者适配。

## 可复现隔离验证

```text
node scripts/official-cli.smoke.mjs <绝对dsh/lib/bin.js>
```

该命令在 `.cache/official-smoke-*` 新建专用 home，用无依赖、空 patch 的合成 Bundle 验证
只读计划、本地归档安装、官方 Bundle 登记、重复安装不写盘、保留禁用状态。不会读取或修改
日常 Profile；结果及隔离目录保留便于检查，不计作生产 Evidence。

实际通过组合：Node 24.19.0、官方 CLI 0.1.7-alpha.1、pnpm 11.7.0、Windows x64。
另用新进程执行隔离 Profile 的 `--dump-config` 成功。没有进行生产插件交互、EAC UI 或 Linux
验收，空 Bundle 的配置加载不能代替这些测试。

## 接入顺序

1. 选定明确发行版本，确认宿主公开安装、查询和启停接口及生命周期。
2. 显式识别 Mojobox 格式，校验 Pack、Lock、对象摘要和必要平台/能力。
3. 查询已有插件，生成只读计划供用户确认。
4. 调用宿主安装能力，显示逐项结果与是否需重启。
5. 在干净环境实测后，才为相应版本开放安装入口。

不静默转换成另一种同后缀格式。若转换丢失精确版本、摘要、必需/可选或能力要求，需要明确
说明并验证，不能宣称等价。接口不稳定时保持下载功能，不修改宿主内核来绕过。

## 安装计划约定

| 现状 | 默认处理 |
| --- | --- |
| 组件不存在 | 安装 |
| 同身份、同版本存在 | 跳过 |
| 同身份、不同版本存在 | 展示差异，明确确认后替换 |
| 已有组件被用户禁用 | 保留禁用状态 |
| 本地 link/file 或用户分叉 | 保留并提示人工处理 |
| 平台或必要能力不满足 | 安装前拒绝并说明 |

身份来自宿主实际包名与来源，不按显示名去重。没有宿主事务能力时不承诺整包原子安装，部分
失败保留逐项结果。暂不提供整包卸载，避免删除用户或其他包共用的插件。

宿主私有路径、RPC、快照 ID、日志与安装锁不进入公共 Pack。快照和试启动由宿主提供；包
明确依赖时检查，未要求时不人为增加前置条件。

## 真实验收

固定宿主、内核、操作系统、架构；验证首次安装、实际功能、重启可用、重复安装跳过、不同
版本确认、保留禁用状态和单项失败结果。Windows 的结果不能代替 Linux 或其他宿主。
只有真实执行后才签发新的 Evidence。
