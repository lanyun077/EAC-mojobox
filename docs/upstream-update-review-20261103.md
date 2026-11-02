# 官方内核与现有组件更新核对

核对时间：2026-11-03 00:05（Asia/Shanghai）。基线为分类合并提交 `cca4b92`。
范围为 22 个整合包、26 张独立插件信息卡；核对 npm 正式 registry 元数据和两个既有 GitHub 引用。
本轮交付更新清单，未改组件版本、内核范围或原始归档，未安装、执行插件或做宿主运行验证。

## 结论与优先级

- 整合包共引用 27 个不同组件，其中 25 个有新版；仅 Navbar 与 Meow Smooth 未发现更新。
- 26 张独立插件信息卡中，19 个有新版。合并去重后共核对 38 个组件，31 个有新版。
- 14 个功能包的 `requires.dsh` 都精确固定在 `0.2.0-rc.2`。迁往 RC5 要发布新包版本，不能只替换插件或改写旧归档。
- 优先处理 Agent Teams、Sidebar 与共用底座，再处理专项插件；8 个历史外观包还需要补齐新版本的整体内核声明、素材许可和加载条件。

## 官方内核与判定规则

官方 [`@deepseek-ai/dsh`](https://registry.npmjs.org/%40deepseek-ai%2Fdsh) 当前标签为：

| 渠道 | 版本 | 本轮用途 |
| --- | --- | --- |
| `latest` / `next` | `0.2.1-rc.5` | 本轮静态兼容核对目标，仍是 RC 发行 |
| `alpha` | `0.2.2-alpha.2` | 单独的 alpha 通道，不混入默认更新候选 |

已下载官方 [`dsh-app-boot@0.2.1-rc.5`](https://registry.npmjs.org/%40deepseek-ai%2Fdsh-app-boot/0.2.1-rc.5)
原始 tarball，核对 registry SHA-512 integrity 后只读源码，未执行该包：

- 归档：117,797 字节；SHA-256 `162843e7b18a63a7bbb64dfacfef0a530320bc3e708f10fbe76f70584a797b15`。
- `package/lib/index.js`：203,572 字节；SHA-256 `5135179ac810e4f626f32ec3bdc3293dc7d2028e8aa92e5e0c006f1a33b78e76`。
- `evaluatePluginCompatibility` 优先读取顶层 `engines.dsh`；存在时不再用 peers 判定内核版本。
  否则逐个判断 `@deepseek-ai/dsh` / `@deepseek-ai/dsh-*` peer，使用 `includePrerelease: true`。
  peer 中的 `workspace:^`、`workspace:~`、`workspace:*` 按当前内核处理。

下表候选的 registry 版本声明按上述规则与 RC5 比对均未发现版本失配。
没有声明也会产生空的失配集合；这不证明 API、服务、依赖闭包、界面或实际运行兼容。
除上述官方规则包及既有 Agent Teams 归档外，本次未重新核验候选 tarball 的身份、许可全文与字节。

## 功能整合包的 17 个组件

候选链接指向精确 npm 版本元数据。影响数只计算 14 个功能包。

| 组件 | 当前包内版本 | 候选版本 | 影响功能包数 |
| --- | --- | --- | ---: |
| `dshmarket` | `1.66.8` | [1.73.8](https://registry.npmjs.org/dshmarket/1.73.8) | 10 |
| `dsh-context` | `0.62.3` | [0.79.0](https://registry.npmjs.org/dsh-context/0.79.0) | 12 |
| `dsh-session-manager` | `0.6.2` | [0.7.5](https://registry.npmjs.org/dsh-session-manager/0.7.5) | 13 |
| `dsh-undo-savepoint` | `0.4.10` | [0.5.0](https://registry.npmjs.org/dsh-undo-savepoint/0.5.0) | 14 |
| `dsh-better-sidebar` | `0.24.1` | [0.28.2](https://registry.npmjs.org/dsh-better-sidebar/0.28.2) | 8 |
| `@vlln/dsh-navbar` | `0.4.0` | [0.4.0，未更新](https://registry.npmjs.org/%40vlln%2Fdsh-navbar/0.4.0) | 9 |
| Project Memory，GitHub 引用 | `0.5.14` | [npm 0.6.9](https://registry.npmjs.org/%40yolk_vat-y%2Fdsh-project-memory/0.6.9) | 3 |
| `@nanmicoder/dsh-agent-teams` | `0.1.22` | [0.1.28](https://registry.npmjs.org/%40nanmicoder%2Fdsh-agent-teams/0.1.28) | 2 |
| `dsh-chat-import` | `0.24.0` | [0.26.3](https://registry.npmjs.org/dsh-chat-import/0.26.3) | 1 |
| `meow-smooth` | `0.8.1` | [0.8.1，未更新](https://registry.npmjs.org/meow-smooth/0.8.1) | 1 |
| `dsh-univer-office` | `0.3.6` | [0.4.0](https://registry.npmjs.org/dsh-univer-office/0.4.0) | 1 |
| `@changfenhuang/dsh-genui` | `0.11.3` | [0.15.0](https://registry.npmjs.org/%40changfenhuang%2Fdsh-genui/0.15.0) | 1 |
| `@nagi-ovo/dsh-visualize` | `0.1.4` | [0.1.7](https://registry.npmjs.org/%40nagi-ovo%2Fdsh-visualize/0.1.7) | 2 |
| `@liustack/modsearch` | `5.10.5` | [5.10.11](https://registry.npmjs.org/%40liustack%2Fmodsearch/5.10.11) | 2 |
| `@wxg-prc-cpg/browser-skill-dsh-plugin` | `0.3.2` | [0.4.1](https://registry.npmjs.org/%40wxg-prc-cpg%2Fbrowser-skill-dsh-plugin/0.4.1) | 3 |
| `dsh-vision-router` | `3.0.1` | [3.1.1](https://registry.npmjs.org/dsh-vision-router/3.1.1) | 2 |
| `dsh-soul-md` | `0.9.1` | [0.11.0](https://registry.npmjs.org/dsh-soul-md/0.11.0) | 1 |

需要一同处理的具体变化：

1. **Agent Teams**：已从仓内原始 `0.1.22` tarball 读取 `package.json`；其 DSH peers
   是含 `0.2.0-rc.2` 的精确版本枚举，不接受 `0.2.1-rc.5`。影响团队协作包与 Power Toolbox。
   `0.1.28` 新增 `engines.dsh: >=0.1.2-alpha.2`，按 RC5 规则没有版本阻断；仍需核验新归档及实际服务适配。
2. **Sidebar**：`0.28.2` 的 DSH peers 要求 `^0.2.1-rc.1`，旧 RC2 不满足；另有
   `@huanlin/dsh-plugin-better-locale: ^0.1.0` peer，应保留这项外部依赖，不能只升级版本号。
   它也出现在壁纸外观包中，所以涉及 9 个整合包。
3. **Node.js**：新 Context、Agent Teams、GenUI、Vision Router 的声明为
   `^22.19.0 || >=24`（部分写作 `>=24.0.0`），不能只按本仓构建所需的 Node 22.12 推断安装环境满足。
4. **Project Memory**：GitHub 固定观察提交
   [`378b62422f1c98d3dba356087966f3379984e003`](https://github.com/00080000/dsh-project-memory/blob/378b62422f1c98d3dba356087966f3379984e003/package.json)
   的包名为 `@yolk_vat-y/dsh-project-memory`、版本 `0.6.9`，与 npm 候选身份一致。
   现有薄包使用 `github:00080000/dsh-project-memory`，仍不能锁 commit 或保证未来安装字节。
5. **Office**：registry 报告新版解包文件合计 162,371,937 字节，体积明显增加。
   该值不是压缩下载体积；本轮没有下载此候选，也不能据此声称已通过独立插件 8 MiB 归档门槛。
6. **Soul MD**：独立信息卡仍为 `0.9.0`，功能包是 `0.9.1`；若实施更新，应同时核对这两处，
   保留旧归档。新版明确声明 RC5 的兼容范围，但属于作者声明，非本仓运行证据。

## 外观整合包

Sidebar 的更新见上表；其余 10 个外观组件如下。8 个旧包仍缺整体 `requires.dsh`，
仅靠某一个插件的 peer 或“没有失配”不能给整包编造范围；新版本不继承历史摘要例外。

| 组件 | 当前包内版本 | 候选版本 |
| --- | --- | --- |
| `dsh-bloom-theme` | `0.16.0` | [0.20.1](https://registry.npmjs.org/dsh-bloom-theme/0.20.1) |
| `@nonamelego/dsh-catppuccin` | `0.5.8` | [0.6.6](https://registry.npmjs.org/%40nonamelego%2Fdsh-catppuccin/0.6.6) |
| `dsh-dream-skin` | `9.29.0` | [11.2.0](https://registry.npmjs.org/dsh-dream-skin/11.2.0) |
| `github:ymh0000123/dsh-theme-endfield` | `1.1.5` | [1.2.3，GitHub 观察版本](https://github.com/ymh0000123/dsh-theme-endfield/blob/ada9396a957633a40bdad89ff084b0136b9515b4/package.json) |
| `open-sea-skin` | `1.2.3` | [1.2.7](https://registry.npmjs.org/open-sea-skin/1.2.7) |
| `dsh-opencode-palette` | `2.0.10` | [2.1.12](https://registry.npmjs.org/dsh-opencode-palette/2.1.12) |
| `dsh-plugin-wallpaper-engine` | `1.1.0` | [1.4.0](https://registry.npmjs.org/dsh-plugin-wallpaper-engine/1.4.0) |
| `@smalltailqwq/dsh-client-ui-skin-deep-whale-manager` | `0.1.6` | [0.1.8](https://registry.npmjs.org/%40smalltailqwq%2Fdsh-client-ui-skin-deep-whale-manager/0.1.8) |
| `@smalltailqwq/dsh-client-ui-skin-maid-atelier` | `0.1.7` | [0.1.9](https://registry.npmjs.org/%40smalltailqwq%2Fdsh-client-ui-skin-maid-atelier/0.1.9) |
| `@smalltailqwq/dsh-client-ui-skin-orca-link` | `0.1.7` | [0.1.9](https://registry.npmjs.org/%40smalltailqwq%2Fdsh-client-ui-skin-orca-link/0.1.9) |

Catppuccin `0.6.6` 的作者内核范围为 `>=0.1.7-rc.1`；壁纸引擎 `1.4.0` 的
`engines.dsh` 为 `^0.2.0-rc.1`。这些可以作为下一轮声明来源，但更新前仍要核对成品。
Maid Atelier 与 Orca Link 都声明 `SEE LICENSE IN LICENSE`，需要重新查看新版本代码与素材许可。
终末地仍是可变 GitHub 引用；观察到的仓库版本不是已核验的固定安装产物。
壁纸插件独立信息卡是 `1.2.0`，与包内 `1.1.0` 不同，应一并更新或明确保留原因。

## 独立插件中未出现在整合包的 11 项

其余 15 张信息卡与上表组件重合。此表不表示将这些插件加入任何整合包。

| 组件 | 当前信息卡版本 | 候选版本 | RC5 版本声明核对／限制 |
| --- | --- | --- | --- |
| `dsh-status-rotator` | `0.34.1` | [0.38.0](https://registry.npmjs.org/dsh-status-rotator/0.38.0) | 无 DSH 版本约束，运行未知 |
| `dsh-web-mobile-fix` | `1.0.6` | [1.0.6，未更新](https://registry.npmjs.org/dsh-web-mobile-fix/1.0.6) | 不替代移动布局实测 |
| `dsh-find-plugin` | `0.4.0` | [0.4.0，未更新](https://registry.npmjs.org/dsh-find-plugin/0.4.0) | DSH tools peer 不接受 RC5 |
| `computer-user` | `0.3.7` | [0.5.9](https://registry.npmjs.org/computer-user/0.5.9) | 新版 DSH peer 没有版本失配；桌面能力仍需宿主验证 |
| `dsh-unified-market` | `0.4.1` | [0.4.1，未更新](https://registry.npmjs.org/dsh-unified-market/0.4.1) | 无 DSH 版本约束，运行未知 |
| `picturereader` | `3.3.3` | [3.3.3，未更新](https://registry.npmjs.org/picturereader/3.3.3) | DSH llm/settings peers 不接受 RC5 |
| `dsh-whale-widget` | `0.3.18` | [0.4.2](https://registry.npmjs.org/dsh-whale-widget/0.4.2) | 无 DSH 版本约束；外部媒体与服务限制保留 |
| `dsh-drag-and-drop` | `0.1.6` | [0.1.6，未更新](https://registry.npmjs.org/dsh-drag-and-drop/0.1.6) | 宿主路径桥接条件保留 |
| `dsh-pet` | `0.3.1` | [0.4.1](https://registry.npmjs.org/dsh-pet/0.4.1) | 原为仅来源；新版解包文件合计约 74 MB，未核验归档体积与字节 |
| `dsh-dafeiyu` | `0.1.14` | [0.1.23](https://registry.npmjs.org/dsh-dafeiyu/0.1.23) | 原为仅来源；新版解包文件合计约 242 MB，需核对 `ASSET_LICENSE.md` |
| `dsh-meme` | `0.1.44` | [0.1.76](https://registry.npmjs.org/dsh-meme/0.1.76) | DSH tools peer 为 `*`；外部图库许可仍需单独核对 |

## 实施更新时的验收范围

先固定目标 RC5 与精确组件版本，下载候选原始归档核对 registry integrity、身份、Bundle、
许可及新增依赖；更新选型来源快照和共享版本约束。功能包递增版本，创建新归档及摘要，
同步有关独立信息卡；保留所有旧版本字节。外观包声明不足的继续保留旧版，不扩展历史例外。

实施后运行自制包重建检查、全量测试、构建及下载复核；真实安装运行另用隔离宿主验收。
本次只有核对报告及交接导航变化，复用分类调整已有测试证据；提交后检查增量门禁。
