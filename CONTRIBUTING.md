# 参与 Mojobox

资源投稿见[提交指南](docs/community-submissions.md)，代码结构与部署见[开发文档](docs/development.md)。

## 开始开发

使用 Node.js 22.12 或更新的受支持版本：

```bash
npm ci
npm run dev
```

从最新 `main` 创建分支，修改对应源码或收录记录。

## 提交前验证

```bash
npm test
npm run build
npm run verify:downloads
git diff --check
```

网站改动还需检查仓库子路径构建、桌面和窄屏交互、键盘焦点、空结果与加载失败。子路径配置见[部署说明](docs/deployment.md)。

修改 Schema 或校验器时补充合法与非法样本。发布新内容使用新版本和真实文件摘要，保留原始归档及已有验证记录。

提交后运行 `npm run check:submission -- origin/main` 检查增量。不提交生成目录、凭据、个人配置或本机报告。

## 发起 PR

使用中文标题，说明变更目的、用户可见行为、协议或兼容影响、验证结果和回退方式。保持修改集中，等待 CI 与维护者审核。

项目代码采用 [MIT](LICENSE)；第三方内容须保留原许可和署名。
