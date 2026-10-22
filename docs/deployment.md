# 静态构建与部署

使用 Node.js 22.12 或更新的受支持版本。先执行 `npm ci` 和 `npm test`。
根路径部署执行 `npm run build`；子路径在 PowerShell 中执行：

```powershell
$env:BASE_PATH = '/EAC-mojobox/'
npm run build
npm run verify:downloads
Remove-Item Env:BASE_PATH
```

Bash 中为 `BASE_PATH=/EAC-mojobox/ npm run build`，检查时也设置相同的 `BASE_PATH`。产物在 `dist/`，部署整个目录，保留
`generated/` 的相对关系。用 `npm run preview -- --host 127.0.0.1` 检查结果。

## 发布要求

- `check.yml` 在 PR 中校验和构建，不持有部署权限。
- 现有 `pages.yml` 在 main 或手动触发时部署；仓库仍需实际启用 Pages。
- Pages 构建与检查使用 `actions/configure-pages` 返回的实际站点路径；PR 检查按仓库名称生成子路径，避免仓库改名后仍引用旧资源路径。
- 失败构建不上传；目录与归档一起部署，不直接构建到正在服务的目录。
- 新版本使用新版本号与归档路径。自行托管时保留仍被引用的旧下载。
- 验证目录和归档链接、大小与 SHA-256，不能只检查首页。
- 目录使用短缓存；归档只有在 URL 不原地替换时才使用长缓存。

## 下载与缓存

默认构建只读本地收录记录和开发者归档，检查通过后原样复制下载文件，不联网解析插件。
`npm run verify:downloads` 独立检查最终 `dist/` 的入口资源路径及文件、下载、清单、报告和摘要，空目录合法。子路径检查必须设置与构建相同的 `BASE_PATH`，路径错误或入口资源缺失会阻止发布。

`npm run build:demo` 只生成 `dist-demo/`，`npm run preview:demo` 预览演示。
测试样本来自 `fixtures/intake/`，不写进正式目录；演示校验需要显式 `--allow-demo`。
发布工作流不使用该参数，也不上传演示目录。

子路径演示构建同样设置 `BASE_PATH`；预览时需匹配路径，例如
`npm run preview:demo -- --base /EAC-mojobox/`。旧 `.cache/artifacts/` 是 legacy 组件缓存，不属于当前构建输入。

恢复后的站点地址为 https://lanyun077.github.io/EAC-mojobox/ ，仓库为
[lanyun077/EAC-mojobox](https://github.com/lanyun077/EAC-mojobox)。Pages 来源选择 GitHub Actions；
工作流成功后仍须检查实际 HTTP 响应、下载摘要和插件索引，不能只凭构建结果宣称上线。
仓库迁移不改变子路径 `/EAC-mojobox/`，但下游必须更新域名，旧地址不会自动跳转。
静态构建成功不表示宿主导入通过验证，历史来源和原始归档不因迁移而改写。
