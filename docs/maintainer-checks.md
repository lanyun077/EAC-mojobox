# 审核与 CI 门禁

PR 审核是维护者判断，CI 是自动验证，静态发布是合并后的部署。三者分别负责不同阶段。

## 当前验收策略

2026-11-21 起，主仓与安装器采用相同的维护者合并策略：

| 身份 | PR 检查与合并 |
| --- | --- |
| 仓库所有者、具有 Write / Maintain / Admin 权限的协作者 | CI 照常运行；验收后可在 PR 合并界面选择跳过检查和审核要求，无须等待 CI 或另一人批准 |
| 外部贡献者、只有 Read / Triage 权限的账号 | 可以提交 PR，不能直接推送或合并；由上述维护者验收合并 |

默认仍要求 CI 与一个审核批准；豁免仅适用于 PR 合并，不允许直接推送 main。
main 的禁止强推、禁止删除规则独立配置，无豁免者。新增有写权限的协作者也会获得 PR 豁免，应按此职责分配权限。
跳过合并检查不会跳过 main 的构建或发布检查，也不会将未通过的检查显示为成功。

主仓必需状态为 GitHub Actions 的 `check`；安装器为 `check (windows-latest)` 与 `check (ubuntu-latest)`。
不要求 PR 分支更新到最新 main，不启用自动合并。远端规则通过 GitHub Rulesets 配置，文档本身不会修改权限。

## 历史记录

2026-10-11 复核时，PR #21 已合并，Pages 发布成功；main 没有分支保护或规则集，
贡献检查工作流曾被删除。本次按用户要求恢复 `check.yml` 并配置审核门禁。
2026-10-11 已通过 GitHub API 配置 main 保护：一个批准、撤销过期批准、严格必需
`check`（绑定 GitHub Actions）、解决审核对话、管理员也受约束、禁止强推与删除。
同日调整：账号 `lanyun077` 可豁免他人批准，自行合并自己的 PR；豁免不关闭必需 CI。
此段为历史策略，当前以本文“当前验收策略”及远端回读为准；当时工作流的真实运行见 PR #22。

以上为旧仓库的历史记录。2026-10-22 项目恢复到 `lanyun077/EAC-mojobox`，
原仓库的权限、审核和 Pages 设置不会随 Git 自动迁移；新仓库必须分别配置并回读验证，
不能把旧记录当成新仓库保护已经生效的证据。

新仓库在 2026-10-22 曾使用两组 active Rulesets 配置并回读验证：

- `main-ci-and-history`（`25649631`）：main 严格必需 GitHub Actions 的 `check`，禁止非快进与删除，无豁免者。
- `main-pr-review`（`25649633`）：PR 默认需一个批准、撤销过期批准并解决审核对话；管理员仅在 PR 合并时可豁免此组，不豁免上一组必需 CI。

2026-11-21 的策略将历史保护与 CI 分开，并为 CI 和审核规则增加维护者 PR 豁免；上面的无 CI 豁免策略不再适用。
配置时唯一有写权限的账号为 `lanyun077`。
新仓库使用 Rulesets；经典分支保护接口返回 404 不等于没有保护，应同时检查实际分支规则。

## PR 的自动检查

`.github/workflows/check.yml` 在 `pull_request`、`merge_group`、推送 main 和手动触发时运行。
`check` job 使用 Node.js 22、只读仓库权限，不保留 checkout 凭据，不部署 PR，不使用
`pull_request_target` 执行外部代码。

检查顺序：安装本工程依赖 → 已提交增量边界 → 自制包原始字节 → 全量测试 → 子路径站点构建
→ 下载和插件索引复核 → 演示构建与显式演示复核。生成检查报告保存为 Actions artifact，供审核使用。
首次 Fork 的 Actions 可能需要维护者批准；依赖安装不是安装收录资源。

## main 的审核规则

维护者在 GitHub 的分支保护中核对：

- 必须通过 PR，默认至少一个审核批准；有新提交撤销旧批准，解决审核对话。
- 默认必需状态 `check`，不强制分支更新到最新 main。
- 所有者及有写权限的协作者可仅在 PR 合并时跳过 CI 与审核要求，由合并者负责验收。
- 禁止强推与删除 main，此组规则不提供豁免。
- 不启用自动合并、不改标签或发布历史。

当前没有 CODEOWNERS，因此不设置“必须代码所有者批准”。Merge Queue 的事件已支持，
队列是否启用由管理员按团队需求另行配置。不要把“已写工作流”误认为“远端保护已生效”。

只读核对命令：

```bash
gh api repos/lanyun077/EAC-mojobox/branches/main/protection
gh api repos/lanyun077/EAC-mojobox/rulesets
gh api repos/lanyun077/EAC-mojobox/rules/branches/main
gh workflow list --repo lanyun077/EAC-mojobox
gh pr checks <number> --repo lanyun077/EAC-mojobox
```

## 人工审核与发布

人工审核来源和提交身份、许可及第三方素材边界、用途、冲突依据、真实测试范围、图片隐私。
CI 通过只证明机器检查覆盖的结构和字节，不证明安全、许可合规、已安装或无冲突。

验收并合并后，由 `.github/workflows/cloudflare.yml` 再次测试、构建和复核下载，再发布完整站点；未启用 Cloudflare 时使用 Pages 入口。
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
