# Mojobox 整合包：文件结构与最小示例

本文说明 Mojobox 首版接收的 **EAC Feature Pack v1 功能或外观整合包**。外观包与皮肤包在目录中统一使用 `appearance` 分类。

## 1. 整合包是什么文件？

整合包是一个扩展名为 `.dshpack` 的 **ZIP 压缩文件**，用于描述“一组需要一起使用的插件”，也可以描述一组皮肤插件或主题组件。

包内的清单告诉宿主：这个整合包叫什么、是什么版本、需要哪些插件。安装时，宿主根据清单找到插件并安装。插件代码保存在各自的发布来源中。

## 2. 整合包由什么组成？

最小整合包只包含一个文件：

```text
org.example.tools-1.0.0.dshpack     ZIP 文件
└── pack.json                     UTF-8 编码的 JSON 清单
```

`pack.json` 必须直接位于 ZIP 根目录。压缩时选中这个文件，不能把它所在的文件夹一起套进 ZIP。

可以另外包含一张图标：

```text
org.example.tools-1.0.0.dshpack
├── pack.json
└── icon.png                      可选 PNG 图标
```

使用图标时，在清单中增加 `"icon": "icon.png"`。首版归档内仅允许这两个文件；插件代码、依赖和使用说明放在开发者的发布仓库中。

## 3. 清单由什么组成？

新收录的最小清单必须包含下面六项：

| 字段 | 内容 | 示例 |
| --- | --- | --- |
| `formatVersion` | 文件格式版本，固定为数字 `1` | `1` |
| `id` | 整合包的稳定标识，用于区分不同包 | `"org.example.tools"` |
| `name` | 展示给用户的名称 | `"开发工具包"` |
| `version` | 整合包自身的版本 | `"1.0.0"` |
| `plugins` | 插件引用列表，至少一项 | 见下一节 |
| `requires.dsh` | 作者声明的内核版本范围 | `">=0.2.0-rc.2 <0.3.0-0"` |

`id` 长度为 3–64，只使用小写字母、数字、点、下划线或连字符，并以字母或数字开头。升级整合包时保留 `id`，修改 `version`。

还可以填写：

| 字段 | 用途 |
| --- | --- |
| `description` | 一句话说明整合包的功能 |
| `author` | 作者名称 |
| `license` | 许可证，例如 `"MIT"` |
| `icon` | 包内图标文件名，首版固定为 `"icon.png"` |

外观包的分类和加载器资料写在仓库外的收录记录中，不放入 `.dshpack` 的 `pack.json`：

```json
{
  "category": "appearance",
  "appearance": {
    "kind": "skin",
    "loader": {
      "id": "@dsh-eac/ui-skin-loader",
      "version": "1.1.0",
      "source": "https://github.com/DSH-EAC/dsh-ui-skin-loader"
    },
    "skinIds": ["maid-atelier"],
    "conflicts": ["bodyAttr:theme"]
  }
}
```

这些字段用于目录展示和下游读取。Mojobox 不安装、加载、切换或验证皮肤运行兼容性。

作者和许可证可以不写入最小清单，但正式收录时必须另外提供。新收录及更新版本必须填写
`requires.dsh`，使用合法、非空的 SemVer 范围；未知兼容范围先作为候选提交，不编造版本。
`*` 表示作者明确声明不限制内核，不能用来替代未知。此要求是 Mojobox 收录策略，不是改写上游格式。

## 4. 插件列表里的每一项是什么？

每一项是一个 JSON 对象，表示“引用一个插件包”：

```json
{ "ref": "@example/editor-tools", "version": "1.2.0" }
```

- `ref`：必填。告诉宿主到哪里找到插件。
- `version`：npm 和 GitHub 引用必填，使用精确 SemVer 版本，例如 `1.2.0`、`1.2.0-rc.2`。
  不接受 `latest`、`*`、`^`、`~` 或区间。`builtin:` 由宿主提供，上游只核验其存在，可以不填写版本；
  如填写也须为精确版本，但不能据此声称锁定了宿主内置组件。

`ref` 支持三种写法：

| 写法 | 指向什么 |
| --- | --- |
| `@example/editor-tools` | npm 上的插件包；也支持不带组织前缀的包名 |
| `github:example/editor-tools` | GitHub 上符合目标宿主插件要求的仓库 |
| `builtin:dsh-terminal` | 目标宿主已经自带的插件，冒号后是其资源目录名 |

一个整合包可以引用一个或多个插件包，同一引用不能重复。一个插件包本身也可以提供多个功能。

**插件引用只是地址声明。** 被引用的插件包通常包含自己的 `package.json`、入口代码、依赖声明，以及目标宿主要求的插件元数据；这些文件由插件作者维护，不放进这里的薄整合包。插件内部结构遵循对应宿主的插件规范，Mojobox 不另定义一套。

要实际安装，引用必须能被目标宿主解析，插件也必须符合该宿主要求。Mojobox 的结构检查不会自动证明来源存在或指定版本已被正确安装。
精确版本也不等于插件产物已锁定；尤其 `github:owner/repo` 不携带固定提交。内核范围只检查
语法，不与构建电脑的内核比对，不承诺运行兼容。历史包的精确例外和迁移见[版本声明策略](intake-version-policy.md)。

## 5. 最简完整示例

创建一个名为 `pack.json` 的文件，写入：

```json
{
  "formatVersion": 1,
  "id": "org.example.tools",
  "name": "开发工具包",
  "version": "1.0.0",
  "requires": { "dsh": ">=0.2.0-rc.2 <0.3.0-0" },
  "plugins": [
    { "ref": "@example/editor-tools", "version": "1.2.0" }
  ]
}
```

上面的 npm 名称仅为示例，交付时替换为自己的真实插件来源。

将这个文件压缩为 ZIP，命名为 `org.example.tools-1.0.0.dshpack`，就是一个最小整合包。整合包版本 `1.0.0` 和插件版本 `1.2.0` 是两件事，可以不同。

首版限制：归档不超过 2 MiB，清单不超过 1 MiB，可选图标不超过 512 KiB。暂不包含 preset、skill 或覆盖文件；`overrides` 字段可以省略，填写时必须是空数组。

## 6. 交给 Mojobox 时需要什么？

文件结构之外，收录还需要来源信息。请一起提供：

1. 最终的 `.dshpack` 文件。
2. 对应的 HTTPS 仓库或 Release 页面。
3. 作者、许可证、功能简介。
4. 最终 `.dshpack` 文件的 SHA-256。

这些信息用于建立 Mojobox 目录记录，不需要再塞进 ZIP。作者和许可证若同时写在清单中，两处应一致。

Windows 计算摘要：

```powershell
Get-FileHash .\org.example.tools-1.0.0.dshpack -Algorithm SHA256
```

Mojobox 收纳并检查这些文件，提供展示和下载。开发者维护整合包与插件；宿主负责安装运行。已有搭载测试结果可以一并提供，未测试则如实注明。
