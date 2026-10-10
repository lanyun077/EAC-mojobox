# 审核与 CI 门禁

PR 审核是维护者判断，CI 是自动验证，Pages 是合并后的发布。三者分别负责不同阶段。
2026-10-11 复核时，PR #21 已合并，Pages 发布成功；main 没有分支保护或规则集，
贡献检查工作流曾被删除。本次按用户要求恢复 `check.yml` 并配置审核门禁。
2026-10-11 已通过 GitHub API 配置 main 保护：一个批准、撤销过期批准、严格必需
`check`（绑定 GitHub Actions）、解决审核对话、管理员也受约束、禁止强推与删除。
同日调整：账号 `lanyun077` 可豁免他人批准，自行合并自己的 PR；豁免不关闭必需 CI。
后续变更以远端回读结果为准；本次工作流的真实运行见 PR #22。

## PR 的自动检查

`.github/workflows/check.yml` 在 `pull_request`、`merge_group`、推送 main 和手动触发时运行。
`check` job 使用 Node.js 22、只读仓库权限，不保留 checkout 凭据，不部署 PR，不使用
`pull_request_target` 执行外部代码。

检查顺序：安装本工程依赖 → 已提交增量边界 → 自制包原始字节 → 全量测试 → 子路径站点构建
→ 下载和插件索引复核 → 演示构建与显式演示复核。生成检查报告保存为 Actions artifact，供审核使用。
首次 Fork 的 Actions 可能需要维护者批准；依赖安装不是安装收录资源。

## main 的审核规则

维护者在 GitHub 的分支保护中核对：

- 必须通过 PR，至少一个审核批准；有新提交撤销旧批准。
- 必需状态 `check`，合并前分支必须基于最新 main。
- 所有审核对话已解决，禁止强推与删除 main。
- 规则对管理员也生效；`lanyun077` 可豁免他人批准，但仍须通过必需 CI。
- 不启用自动合并、不改标签或发布历史。

当前没有 CODEOWNERS，因此不设置“必须代码所有者批准”。Merge Queue 的事件已支持，
队列是否启用由管理员按团队需求另行配置。不要把“已写工作流”误认为“远端保护已生效”。

只读核对命令：

```bash
gh api repos/DSH-EAC/EAC-mojobox/branches/main/protection
gh workflow list --repo DSH-EAC/EAC-mojobox
gh pr checks <number> --repo DSH-EAC/EAC-mojobox
```

## 人工审核与发布

人工审核来源和提交身份、许可及第三方素材边界、用途、冲突依据、真实测试范围、图片隐私。
CI 通过只证明机器检查覆盖的结构和字节，不证明安全、许可合规、已安装或无冲突。

批准并合并后，`.github/workflows/pages.yml` 再次测试、构建和复核下载，再发布完整站点。
索引、报告和下载必须来自同一次构建；发布失败不宣称资源已上线。
不要为修复检查而改写旧归档、编造兼容范围或编辑生成物。

## README 的结构参考

本次实际阅读 GitHub README，采用“一句定位 → 使用入口 → 贡献入口 → 详细文档”的分层，
没有复制项目运行模式或安装承诺。

| 项目 | 参考的结构 |
| --- | --- |
| [Homebrew Core](https://github.com/Homebrew/homebrew-core) | 目录仓库一句定位、消费入口和贡献文档分开 |
| [Scoop Extras](https://github.com/ScoopInstaller/Extras) | “如何使用 / 如何提交”作为直接入口 |
| [Flathub](https://github.com/flathub/flathub) | 资源来源用法、贡献和项目职责边界 |
| [Open VSX](https://github.com/eclipse-openvsx/openvsx) | 公开资源服务、作者发布、部署和开发按角色区分 |
| [VS Code](https://github.com/microsoft/vscode) | 项目与发行区别、贡献入口分类、细节下沉指南 |
| [GitHub CLI](https://github.com/cli/cli) | 简短用途说明、文档导航、开发与发行路径分离 |
