# 20261009 修复审查发现的四项问题

## 背景

全面审查 `pi-capsule-tools` 发现：README 承诺的两项显示内容**从未生效**，根因是**键名靠猜、没对 pi 类型定义**。另有 3 个健壮性缺口。

## 调研结论（关键，改动前必读）

### `renderResult` 能拿到什么

`tool-execution.js:244` 明确只传两个字段给渲染器：

```js
resultRenderer({ content: this.result.content, details: this.result.details }, ...)
```

**`structuredContent` 不可达** —— 所以不能读 `structuredContent.exit_code`。

### 可用的正确信号

`getRenderContext()`（`tool-execution.js:74-93`）填了完整 context，其中：

```js
isError: this.result?.isError ?? false,      // ← 第 90 行，可用
durationMs: this.isPartial ? undefined : this.result?.durationMs,
```

`ToolRenderContext` 类型（types.d.ts:348-381）包含 `isError` / `durationMs` / `showImages` / `lastComponent` / `state`。

### bash 的真实 details

`bash.js:233-252` 的 `formatOutput` **只在 `truncation.truncated` 为真时**才给 details。不截断时 `details === undefined`（实测 `exit 3` 得到 `details: undefined`）。

退出码去向：`structuredContent.exit_code`（不可达）；错误文本进 `content`（可达但不可靠）。
**结论：改用 `context.isError`。**

### edit 的真实 details

实测键为 `['diff', 'patch', 'firstChangedLine']` —— **没有 `addedLines` / `removedLines`**。
`details.diff` 可数：`lines.filter(l => l.startsWith("+")).length`，实测 `+3 -2` 正确。

## 改动清单

| # | 问题 | 改法 | 文件 |
|---|---|---|---|
| 1 | bash `exit N` 从未显示 | 删掉读 `details.exitCode`，改用 `context.isError` → 显示 `failed` | capsule-tools.ts |
| 2 | edit `+N -M` 从未显示 | 改从 `details.diff` 数 +/− 行 | capsule-tools.ts |
| 3 | `shortenPath` 前缀误伤 | 加 `path === home \|\| path.startsWith(home + "/")` 判断 | capsule-tools.ts |
| 4 | `content` 非数组抛异常 | 加 `Array.isArray()` 守卫 | capsule-tools.ts |
| 5 | 缓存返回同一数组引用 | 返回副本 `[...cachedLines]` | capsule-tools.ts |

### 签名变化

`describe` 需要 `context` 才能拿到 `isError`：

```ts
type Describe = (args, result, phase, ctx?) => { command: string; reason?: string };
```

`capsuleResultRow` / `capsuleCallRow` 增加 `isError` 参数；`resolveToolRenderer` 里从 `ctx.isError` 传入。

### 测试

1. **新增 `real-data-check.ts`**（已做，13 项）—— 用 `createBashTool().execute()` / `createEditTool().execute()` 取**真实 result**，喂给胶囊。这是补上"手造数据 → 实现与测试一起猜错"的盲区。
2. 更新 `rows-check.ts` 现有断言（它用了假的 `details.exitCode`）。已改为断言 `failed` 提示。
3. `resolve-check.ts` 无需改动（签名变化是可选参数，向后兼容）。

## 实际改动与方案的偏差

- `shortenPath` 需 `export` 才能被 `real-data-check.ts` 断言。
- `capsuleCallRow` / `capsuleResultRow` 的 `ctx` / `isError` 做成**可选参数**，所以 `resolve-check.ts` 和既有调用点无需改。
- `edit` 的统计函数 `countDiffLines` 单独抽出，便于测试；实测 `+`/`-` 按首字符数即可（diff 每行都有行号前缀）。

## 验证结果（已跑）

| 层 | 命令 | 结果 |
|---|---|---|
| 全量 | `npm run check` | 4 套全绿（24 / 16 / 20 / 13 项）|
| 类型 | `npm run typecheck` | 干净 |
| 反向验证 A | edit 改回 `addedLines` | ✗ 断言 FAIL |
| 反向验证 B | bash 改回 `details.exitCode` | ✗ 断言 FAIL |
| 反向验证 C | shortenPath 改回只 `startsWith` | ✗ 断言 FAIL |

## 不在本次范围

- `#6` read offset/limit 显示打磨（最低优先，仅显示难看）
- 折叠态"正在运行"提示（功能缺失，非 bug）
- 未用 `context.lastComponent`（性能实测无问题）
