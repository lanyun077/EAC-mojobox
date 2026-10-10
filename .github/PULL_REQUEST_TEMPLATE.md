## 变更目的

<!-- 说明要解决的问题和可观察结果。 -->

## 变更类型

- [ ] 开发者整合包收录 / 原始产物
- [ ] 独立插件信息卡 / 原始发行 / 插件来源接口
- [ ] 皮肤 Prompt 资料收录 / 预览图 / 展示信息
- [ ] 历史 Plugin Catalog / Pack / Pack Lock
- [ ] Evidence / Host Profile
- [ ] Schema / Fixture / Validator
- [ ] Static Web
- [ ] Build / Release
- [ ] Documentation

## 实现说明

<!-- 列出修改的事实源、关键决策及未采用的方案。 -->

## 协议与兼容性

<!--
是否改变 wire format、固定 revision、组件版本或摘要？
是否需要迁移既有 Catalog、Lock、Evidence 或 Host Adapter？
不涉及时写“不涉及”。
-->

<!-- 外部收录请先填写下列材料；纯代码或文档 PR 可以写“不涉及”。 -->

## 外部作者收录材料

- 包 ID / 版本 / 分类：
- 上游仓库 / 固定提交或发行页：
- 作者身份或代提交授权依据：
- 归档 / 资料文件 SHA-256：
- 许可证，以及第三方代码、素材与截图许可边界：
- 简介、标签与包含内容：
- 作者声明的宿主 / loader 版本、已知冲突和限制：
- 预览图来源、对应包 / 宿主版本、主题（无截图请注明）：
- 真实运行测试结果（未测试请写“未测试”，不以 CI 代替）：

- [ ] 已核对来源和再分发许可，没有泄漏凭据、聊天或其他私人资料
- [ ] 未改写旧版本归档；字节更新已递增版本，Prompt 更新已刷新来源 commit 与摘要
- [ ] 外部收录不需要改安装器、loader、上游 Schema 或 CI 规则

## 本地验证

- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run verify:downloads`
- [ ] `npm run build:demo` 与 `npm run verify:downloads -- dist-demo --allow-demo`（框架或网站改动）
- [ ] `BASE_PATH=/dsh-mojobox/ npm run build` 与相同 `BASE_PATH` 的下载检查（网站改动）
- [ ] `git diff --check`
- [ ] `npm run check:submission -- origin/main`（提交后检查已提交的 PR 增量）

实际命令与结果：

```text

```

## 数据与证据检查

- [ ] 未提交 `dist/`、`dist-demo/`、`.cache/`、`site/public/generated/` 或其他生成物
- [ ] 未提交凭据、用户数据或本机绝对路径
- [ ] Manifest、artifact、suite 和 Host Descriptor 摘要已按需更新
- [ ] Evidence 等级与真实验证范围一致
- [ ] 没有把 fixture 或 Schema 通过描述成生产兼容或安全认证

## 未验证项与风险

<!-- 没有则写“无”。 -->

## 回退方式

<!-- 如何撤销本次目录、协议、构建或页面变化？ -->
