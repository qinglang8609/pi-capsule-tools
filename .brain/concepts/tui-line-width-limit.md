---
tags: [concept]
id: tui-line-width-limit
author: fanchao
updated: 2026-10-09
status: active
---

# 概念：pi TUI 渲染行超宽会抛异常

## 触发场景
在 pi 里自定义渲染工具调用 / 消息行，且内容长度由外部输入决定时（命令原文、文件路径、搜索结果）。
凡是「长度不可控」的渲染行都要想起这条。

## ❌ 表现
渲染行宽度超过终端宽度时 pi 的 TUI **直接抛异常**（不是自动折行、也不是静默裁剪）。
`crashes.json` 里就有这种记录。

## 🛠 解法
**根因**：pi 的 TUI 不接受渲染行超过终端宽度，它指望组件保证这一点。

**修复**：组件自己截断，别指望外层折行。

```ts
const head = truncateToWidth(this.head, Math.max(1, width - 1), "…");
```

要点：
- 用 `truncateToWidth`（来自 `@earendil-works/pi-tui`），它按**可见宽度**算，ANSI 转义码不占宽。
- 留 1 列余量（`width - 1`）。
- 终端可能窄到荒谬（1/2/5 列），边界要能扛住。
- 渲染结果有缓存时，**缓存 key 必须含宽度**，否则换宽度不重画。

## 验证
按多个宽度渲染，断言没有一行可见宽度超过该宽度：

```bash
node --experimental-strip-types check.ts   # 27 项：宽度/折行/缓存
```

判据：`visibleWidth(line) <= width` 对 1/2/5/20/40/80/120/300 全部成立；
折叠态恒为一行；换宽度后确实重画（缓存没串）。

## 关联连接
- [[pi-call-result-double-row]] — 展开态同样受宽度约束
- [[fanchao]] — 本页沉淀者
