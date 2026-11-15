# Mojobox 网站隐私说明

本说明对应 Mojobox 的 GitHub＋Cloudflare 静态架构，正式域名为 `mojobox.cn`。
网站不提供账号登录，不维护用户数据库，不上报下载点击或用户安装记录。

## 浏览与下载

无需登录即可搜索、查看详情和下载原始文件。搜索词与筛选在浏览器处理，保存在可分享的 URL 中，
不上传到搜索服务器。静态托管商会处理请求网络信息，其规则适用对应服务商的隐私政策。

网站将原作者声明与 GitHub 投稿者分开展示。投稿者信息取自公开已合并 PR，包含 GitHub 数字 ID、
用户名与 PR 链接，随网站静态发布；这不要求投稿者注册本站，也不表示本站认证了其版权身份。

## GitHub 与 Cloudflare

网页与目录由 Cloudflare 托管，整合包附件通过 GitHub Releases 下载；部分插件和图片仍来自其声明的来源。
这些服务商为处理请求而接触网络信息，其隐私政策分别适用：
[Cloudflare](https://www.cloudflare.com/privacypolicy/) 与 [GitHub](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)。

网站不设置登录 Cookie、匿名访客标识或浏览器指纹，也不集成第三方行为分析脚本。
托管商的基础日志、安全防护或实际账户设置可能影响其处理的信息，不能据此声称所有网络访问绝对匿名。
投稿、咨询和反馈会跳转到 GitHub，由 GitHub 提供其平台登录；本站不会接收其登录凭据或 OAuth token。

## 热度统计与保留

GitHub 维护 Release 附件的累计下载次数。受信 GitHub Actions 定时读取这些公开计数，
将附件 ID、包 ID、版本、计数和采集时间写入公开统计分支，生成网页使用的静态排行。

统计不包含下载者身份、IP、Cookie 或安装结果。它包括重复下载与自动校验，不代表用户数或成功安装量。
历史计数长期保留以计算期间增量；采集或排行不可用不阻止用户下载。

安装器的任务记录和用户主动保存的诊断位于用户本机，不由本网站自动上传。
计划中的服务器备份仅包含公开仓库、统计和附件，不接收用户本机 Profile。

## 联系与纠错

可通过[主仓 Issues](https://github.com/lanyun077/EAC-mojobox/issues)联系维护者；请勿公开令牌、Cookie、私人配置或未脱敏日志。
公开 PR 署名属于内容来源记录，纠错需提供来源依据；GitHub 平台数据处理请求由相应平台受理。
