# pi-capsule-tools

把 pi 的工具调用渲染成**一行绿色胶囊**，`ctrl+o` 展开/折叠。

```
▸ bash   git status --short
▸ read   src/index.ts:1-50
▸ edit   src/foo.ts  +12 -3
▸ bash   npm test  failed
```

展开后（`ctrl+o`）：

```
▾ bash   git status --short
  M src/foo.ts
  ?? src/bar.ts
```

折叠态一行只占一个终端行，长的 bash / read 输出不展开就不占地方。

## 安装

```bash
pi install npm:pi-capsule-tools
```

然后 `/reload`。装的路径是 `~/.pi/agent/npm/node_modules/pi-capsule-tools/`。

卸载：

```bash
pi remove npm:pi-capsule-tools
```

### 开发中（本仓库）

```bash
pi install ./        # 本地路径指向仓库，改完直接生效
```

本地路径写进 `settings.json`，`pi list` 解析成绝对路径。

### 别用 cp 方式

「拷 `capsule-tools.ts` 到 `~/.pi/agent/extensions/`」已弃用 —— 那份副本**没有包身份**，
pi 靠包名/路径去重，cp 版去不掉。两份同时加载会让**每个工具调用出现两层胶囊**。

若之前 cp 过，先删掉再装：

```bash
rm ~/.pi/agent/extensions/capsule-tools.ts
```

## 覆盖范围

- **内置工具**：bash、powershell、read、edit、write、grep、find、ls —— 胶囊渲染。**执行逻辑完全不碰**。
- **其他工具**（MCP、其他扩展的工具）：**不动**，保留它们自己的渲染。

## 各工具显示什么

| 工具 | 头部 | 尾部 |
|---|---|---|
| `bash` | 命令首行 | `failed`（命令返回非 0 时） |
| `powershell` | 同 `bash`（pi 里两者共用一套渲染） | `failed` |
| `read` | 路径 + `:起-止` 行号 | — |
| `edit` | 路径 | `+新增 -删除`（从 diff 数） |
| `write` | 路径 | — |
| `grep` | 搜索模式 | — |
| `find` | 模式 / 路径 | — |
| `ls` | 路径 | — |

运行中会显示 `running…` / `reading…` 之类的状态尾。

## 发布

```bash
npm version patch    # 自动打 tag。别手改 package.json 的 version
npm run pack:check   # 预览产物（只应含 capsule-tools.ts + README.md）
npm publish
```

`keywords` 里的 `pi-package` 让包能被 [Pi 包画廊](https://pi.dev/packages) 发现。

发布后 `npm view` 有缓存延迟，必要时 `npm cache clean --force` 再验。

### 依赖约定

pi 自带 `@earendil-works/pi-coding-agent` / `pi-tui` / `pi-ai` / `pi-agent-core` / `typebox`，
所以它们必须放在 **`peerDependencies`**，**不能进 `dependencies`** —— 放进 dependencies 会物理拷一份、
绕过 pi 的扩展模块映射，产生重复的类与注册表。

## 测试

```bash
npm run check        # 全量
npm run typecheck    # tsc --strict
```

单独跑：

```bash
node --experimental-strip-types check.ts           # 宽度/折行/缓存
node --experimental-strip-types rows-check.ts      # 双行 bug + 工具名头
node --experimental-strip-types resolve-check.ts   # 渲染器真的接管了吗
node --experimental-strip-types real-data-check.ts # 用真实工具结果测
```

`resolve-check.ts` 是关键那个 —— 它按 pi 的方式走一遍解析器链，断言内置工具都落到胶囊渲染器上，
且未知工具正确透传。**「改了但没效果」这类回归只有它能拦住。**

`real-data-check.ts` 用 pi 真实工具的 `execute()` 输出来断言。其余测试的结果对象都是手造的，
所以一旦胶囊读了 pi 根本不设的键（历史上读过 `details.exitCode` 和 `details.addedLines`），
**测试和实现会一起猜错、一直绿**。新加的显示逻辑请往这里加断言。

## 已知限制

- **鼠标点击展开做不到（当前配置下）**。pi 的 regular 模式把鼠标事件交给终端，组件收不到点击。
  只有 `tuiMode: "fullscreen"` 才会把事件路由给组件（`MouseRegion`），代价是失去终端原生滚动回看。
- 展开/折叠用 pi 的 `expanded` 标志，当前绑在 **`ctrl+o`**。
