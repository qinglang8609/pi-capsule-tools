# pi-capsule-tools

把 pi 的工具调用渲染成**一行绿色胶囊**，`ctrl+o` 展开/折叠。

```
▸ bash  git status --short
▸ read  src/index.ts:1-50
▸ edit  src/foo.ts  +12 -3
▸ bash  npm test  exit 1
```

展开后（`ctrl+o`）：

```
▾ bash  git status --short
  M src/foo.ts
  ?? src/bar.ts
```

## 安装

```bash
cp capsule-tools.ts ~/.pi/agent/extensions/
```

然后在 pi 里 `/reload`。删除该文件即可完全还原。

## 覆盖范围

- **内置工具**：bash、read、edit、write、grep、find、ls —— 胶囊渲染。**执行逻辑完全不碰**（本扩展不调用 `registerTool`）。
- **其他工具**（mcp、其他扩展的工具）：**不动**，保留它们自己的渲染。

## 为什么用 `registerToolRenderer` 而不是 `registerTool`

这是踩过的坑，改动前先看这段：

`registerTool()` 用同名工具覆盖内置定义，**渲染上不赢**。原因是 pi 的交互模式这样取渲染器
（`interactive-mode.js:1706`）：

```js
resolveToolRenderers(name, () => withBuiltInRenderers(name, this.session.getToolDefinition(name)))
```

最外层又套了一次 `withBuiltInRenderers`，把你通过 `registerTool` 塞进去的 `renderCall` 盖掉了。
症状：扩展加载成功、7 个工具都注册了、零报错，**但画面上一点变化都没有**。

`registerToolRenderer` 是 `resolveToolRenderers` 里的**第一环**，跑在那个内置包装之前，所以能真的接管。

另外注意解析器的返回值语义：返回 `{}` **不等于“什么都不做”**，而是“我提供渲染器”——它会阻止链继续往下走，
把下游结果一起吞掉。未知工具必须 `return next()` 显式透传。

## 要点

- 胶囊头部**必然只占一行**：pi 的 TUI 在渲染行超过终端宽度时会抛异常（`crashes.json` 里就有这种记录），所以 `Capsule` 自己截断，宽度越窄截得越狠。
- `renderShell: "self"` 关掉 pi 默认的工具方框，否则胶囊外面还会套一层框。
- 展开状态由 pi 的 `expanded` 标志驱动，当前绑定在 `ctrl+o`。

## 测试

```bash
node --experimental-strip-types check.ts          # 27 项：宽度/折行/缓存
node --experimental-strip-types resolve-check.ts  # 18 项：渲染器真的接管了吗
```

`resolve-check.ts` 是关键那个 —— 它按 pi 的方式走一遍解析器链，断言 7 个内置工具都落到胶囊渲染器上，
且未知工具正确透传。**“没效果”这类回归只有它能拦住。**

## 已知限制

- **鼠标点击展开做不到（当前配置下）**。pi 的 regular 模式把鼠标事件交给终端，组件收不到点击。只有 `tuiMode: "fullscreen"` 才会把事件路由给组件（`MouseRegion`），代价是失去终端原生滚动回看。
- 展开/折叠用 pi 的 `expanded` 标志，当前绑在 **`ctrl+o`**。
