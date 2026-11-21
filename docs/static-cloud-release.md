# 静态站发布、统计与回退

2026-11-16。架构见[方案 V2](static-cloud-plan-v2.md)。北京时间 2026-11-16 00:26 完成首次正式发布：
主仓 [PR #11](https://github.com/lanyun077/EAC-mojobox/pull/11) 与安装器
[PR #1](https://github.com/lanyun077/Mojobox-Installer/pull/1) 已合并，
[发布任务](https://github.com/lanyun077/EAC-mojobox/actions/runs/43735255949)成功。
正式域名为 `https://mojobox.cn`，首发内容提交为 `9458cd9605a6744d6513d4c4a0a34c2712bb4b18`；
当前部署以正式 `generated/release.json` 为准，后续提交会更新该标记。

本地验收：主仓 187 项测试通过、2 项既有跳过；安装器类型检查与 87 项测试通过。
根路径、仓库子路径和演示构建的下载校验通过；1440、390、320 像素页面验证了搜索、
标签筛选、时间／下载排序、URL 恢复、Release 链接，以及统计延迟／失败不阻塞浏览下载。
工作流语法检查与 Wrangler 4.50.0 纯静态 `--dry-run` 通过。
真实 Token、18 个整合包 Release 附件、统计分支写入、Cloudflare 部署及线上字节验证已通过。
18 个整合包均取得可核验的 GitHub 投稿／更新者；安装器实际下载代码已从正式站读取目录，
逐包下载全部 18 个 Release 附件并核对身份和摘要，未操作宿主或用户 Profile。
安装器 PR 与合并后 main 的 Windows／Linux CI 均通过。
首发产物保留在该 Actions 的 artifact；旧站 149 个公开文件已备份，未随代码提交。
七日采集和官版客户端完整安装业务尚未验收；`www.mojobox.cn` 尚未解析，当前使用根域名。

## 平台配置与首发

主仓 `cloudflare-production` environment 只允许 `main`，需设置：

| 类型 | 名称 | 值 |
| --- | --- | --- |
| Secret | `CLOUDFLARE_API_TOKEN` | 目标账户的 Workers Scripts Edit 与 Account Settings Read Token |
| Variable | `CLOUDFLARE_ACCOUNT_ID` | 目标账户 ID |
| Variable | `CLOUDFLARE_WORKER_NAME` | `mojobox` |
| Variable | `MOJOBOX_SITE_ORIGIN` | `https://mojobox.cn` |

自定义域在 Cloudflare 控制台管理，不将域名路由写入 Wrangler 配置或授予 Token DNS 修改权限。
Token 的账户级权限覆盖该账户的 Worker，不能描述为仅能修改 Mojobox 单个 Worker。
不设置 IP 白名单限制到开发机 IP，因为实际部署运行于 GitHub 托管 runner。

1. 审查并合入主仓改造；安装器改造在其独立仓库审查、构建和验收。
2. 停止其他手动上传／自动构建入口。备份当前线上可回退产物与 Worker 域名配置。
3. 在仓库 Settings → Secrets and variables → Actions → Variables 设置仓库变量
   `MOJOBOX_STATIC_HOST=cloudflare`。不要把它仅放到 environment，因为 job 条件在进入 environment 前求值。
4. 从 `main` 手动运行“发布 Cloudflare 静态目录”。GitHub Pages 自动发布会跳过。
5. 检查每一步结果及正式 `generated/release.json`，再检查网页搜索、详情、下载和安装器。
   工作流成功、内容合并和用户客户端安装成功是不同验收项。

当前工作流会创建主仓 Releases、创建／更新 `metrics-data` 分支并发布 Worker。
只有受信 main 发布 job 获得 `contents: write`、`pull-requests: read`；Fork PR 不参与发布，也没有生产密钥。
仓库规则如果禁止统计分支或 Release tag 写入，任务会报错；仅为指定发布流程调整规则，不整体关闭审核门禁。

## 发布过程

`.github/workflows/cloudflare.yml` 在 main 更新、手动触发及每日定时运行。
定时计划为 UTC 03:41，即北京时间约 11:41；GitHub 可能延迟或跳过，不能视为准点任务。
长期无活动的公开仓库定时任务可能被 GitHub 停用；维护者需检查 Actions 状态，必要时重新启用或手动运行。

所有生产运行使用同一个并发组，不取消正在进行的任务；排队后重新读取 main，避免将事件触发时的旧目录重新发布。
工作流执行：

1. 安装锁定依赖，运行测试、构建和本地下载校验。
2. 从完整 Git 历史与 GitHub 已合并 PR 采集投稿者。
3. 为每个当前整合包建立 `pack-<id>-v<version>` Release 与原始附件，下载复核大小和 SHA-256。
   创建新 Release 时先用 draft，上传后公开，不将整合包版本设为仓库 latest 产品版本。
4. 读取独立统计分支的历史映射与快照；读取所有已登记历史附件的计数，写回新快照。
5. 将网页 Catalog 中整合包 `archiveUrl` 改为 Release 地址；保留旧 `generated/downloads` 字节。
   插件来源接口 v1 的路径、结构和字节规则保持原样。
6. 生成同次发布的 `contributors.json`、`release-assets.json`、`rankings.json` 与 `release.json`，保存整个 `dist/` artifact。
7. Wrangler 向已有 Worker 发布纯静态资产，不新增 API、数据库或 Workers 运行脚本。
8. 从正式域名检查首页、入口脚本和样式、元数据、插件原始文件，并从 GitHub 检查整合包附件，最后复核发布标记。

发布后验收失败时，间隔 20 秒重试，最多 6 次；整个验收步骤最多运行 5 分钟。
重试只执行现有验收，不重复上传或发布，用于等待新版本传播及应对短暂网络失败。
超过次数或时限仍未通过时任务报错，需核对实际线上状态。

统计计数失败时使用上一份快照，页面显示原时间；已有映射的统计保存失败也可继续用旧数据发布。
新附件身份无法保存、目录／归档校验失败、投稿者采集失败时停止发布，线上保留上一版。
发布期间 GitHub 全面不可用时不保证能发布新内容；已上线的静态网页继续服务。

同一版本重跑必须复用同一附件 ID 与相同字节。附件丢失、被替换或内容不同会报错，
不自动删除／覆盖历史附件。不用机器人向 main 提交生成文件；统计分支写入后由同次任务显式发布，
不依赖 `GITHUB_TOKEN` 的 push 再触发其他工作流。

## 数据与统计口径

| 数据 | 位置 | 说明 |
| --- | --- | --- |
| 内容与原始包 | main 的 `catalog/`、`artifacts/` | 可审核事实源 |
| 附件身份与下载快照 | `metrics-data` 分支的 `history.json` | 独立 Git 根提交，长期保存，不依赖 Actions 缓存 |
| 下载文件 | GitHub Releases | 发行副本，保持原始大小及 SHA-256 |
| 网页与静态索引 | Cloudflare Worker | 可从事实源和快照重建 |
| 发布产物 | Actions artifact，30 天 | 有限期留存，需要长期回退的版本另存 |

累计下载汇总同一个稳定包 ID 的已登记历史版本附件，不包含迁移前的静态文件下载。
计数包括重复下载、安装预览实际取包和 CI 自动校验；它不是用户数、成功安装量或去重点击。
新版本、旧版本和自动校验均使用相同下载入口，不将包下载量分摊到包含的插件。

七日下载使用最近一次成功计数减去约 7～8 天前的有效基线。返回实际 `window_start` 与 `data_as_of`，
不伪造每日样本；尚未积累基线或采集中断导致窗口不合适时为 null，显示“数据不足”。
每天保留首个基线及最近一次计数；同一天多次发布不会清空首个基线。
计数回退或旧附件查询异常时整次采集失败并保留上次成功结果，不写成零。
公开静态统计不包含用户 ID、IP、Cookie 或安装日志。

最近收录与最近更新使用目录 Git 首次引入和版本切换提交时间；这不是作者发行时间。
说明、图片、标签调整不刷新版本时间。无法从历史确认的时间为 null，本地未提交的新版本不冒称已收录时间。
独立插件支持时间与相关性排序，暂不展示没有统计来源的下载榜。

## 排障与回退

| 现象 | 操作 |
| --- | --- |
| Token 权限错误 | 确认环境名称、账户 ID、Token 目标账户及 Scripts Edit 权限；不将 Token 写进日志或 Issue |
| 写统计分支／Release 失败 | 检查 job 权限、仓库规则及实际 API 错误，修复后重跑，不删除历史分支 |
| Release 已上传但后续失败 | 重跑同一受信流程；任务检查已有字节与附件身份后继续 |
| 七日榜未出现数字 | 检查是否已积累约七天基线，未知数不是故障零值 |
| 网页数据过时 | 检查最近成功定时运行、页面统计时间及正式发布标记 |
| 发布后验证失败 | 不能断言线上未变；先核实实际发布标记、Worker 名称、域名及 Cloudflare 自动改写／缓存 |
| 下载慢 | 分别检查 Cloudflare 网页、GitHub 附件和 npm 插件来源，静态站迁移不会修复 npm 链路 |

网站回退前暂停自动发布，使用保留的已验证 `dist/`，用相同 Wrangler 配置和 Token 重新部署，
或在确认静态资产受支持时使用 Cloudflare 控制台已有版本回退；回退后检查正式域名。
不要重跑旧源码的发布流程代替回退，它会重新采集／写入统计，且当前流程会读取最新 main。
回退不删除 Release、统计历史或用户本机安装记录，旧网站引用的附件必须继续保留。

旧 GitHub Pages 站点保留上次版本。需要手动更新备用站时，在暂停 Cloudflare 自动发布并明确维护窗口后
临时切换发布选择；它不是同时自动更新的第二个正式站。

## 可选服务器备份

服务器暂不部署 PostgreSQL 或公开 API。由朋友授权的备份账号主动拉取：

1. 完整主仓 Git 历史，包括 `metrics-data` 分支；可使用 Git mirror／bundle，并保留有日期的快照。
2. 逐附件 ID 增量下载 Releases 原始文件，保存附件清单及 SHA-256，不能只 clone Git 仓库。
3. 长期需要保留的生产 `dist/`、域名／Worker 配置说明；Token 独立保存在密码管理器。

每天一次、保留最近七份成功快照作为起点，按附件体积调整容量；不把源端删除同步为所有历史备份删除。
首次备份后，在新目录核对 Git 可恢复、统计 JSON 可读和附件摘要一致。
真实服务器账号、定时任务和恢复演练尚未配置，不依赖它完成网站上线。
