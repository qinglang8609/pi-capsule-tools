# 📋 Todo Board

## Todo
- [ ] [进行中] git-commit [[fanchao]] — 提交当前改动到 git (认领 2026-10-21 01a15c2c-bdf2-72)

## Done

### 2026-10-19
- [x] release-1-2-0 [[fanchao]] — 提交 git、发新版本到 npm、本地重新装到新版本 — 1.2.0 已发 npm；本地切回 npm 安装 1.2.0，settings 只留一条；git 三个提交未推送（代理全挂，GitHub 直连超时） 【落地】 (完成 2026-10-19 01a15376-01bc-71)
- [x] review-capsule-tools [[fanchao]] — 对 pi-capsule-tools 做代码审查与效率优化：冗余代码、缓存、渲染开销、测试速度 — 展开态正文按宽度缓存换行、折叠态返回共享空组件、去掉重复的 describe 查找、动画测试等待 3.1s→2.1s 【落地】 (完成 2026-10-19 01a15376-01bc-71)
  - [x] 巳完：展开态正文按宽度缓存换行、折叠态结果行返回共享空组件、describe 查找去重、调短动画测试等待。未改：edit 的 +N -M 已验证直接用 pi 的 details.diff 计数正确（不是 diff 原文，无文件头行）。
- [x] debug-click-no-response [[fanchao]] — fullscreen 模式下点工具块仍无反应：查鼠标追踪序列是否发出、事件是否送达 MouseRegion、是否有扩展拦截 — 点击已可用（tuiMode=fullscreen 生效）；顺带修掉展开后命令重复：结果行不再重画胶囊头 【落地】 (完成 2026-10-19 01a15376-01bc-71)
- [x] click-to-expand-one [[fanchao]] — 开启 fullscreen 模式让工具块可点，并实现只展开鼠标点中的那一条（其余保持原样） — 开启 tuiMode=fullscreen；pi 自带的 MouseRegion 让工具块可点击展/收，扩展代码无需改动 【落地】 (完成 2026-10-19 01a15376-01bc-71)
  - [x] 已核实：TuiMainScreen 无鼠标解析代码，只有 TuiAltScreen 收 SGR 鼠标事件；tool-execution.js:113 已用 MouseRegion 绑定左键展/收，但 setExpanded 是全局的。下一步要确认能不能做单条展开。
  - [x] 核实：pi 点工具块调 setExpanded 只改未地一条，但下一次 ctrl+o 会被全局 toolOutputExpanded 覆盖回统一状态。用户拍定用原生全展/收。
- [x] verify-bg-in-live-tui [[fanchao]] — 重启后实测：绿底是否生效、耗时右对齐、展开两层、是否有双层胶囊 — 实测抓到并修好：截断行 … 之后丢背景（truncateToWidth 的 SGR 重置所致），已重贴背景并加断言 【落地】 (完成 2026-10-19 01a15376-01bc-71)
- [x] restore-tool-block-bg [[fanchao]] — 把 renderShell 从 self 改回默认外壳，让 pi 自动套 toolSuccessBg/toolErrorBg 整块绿底，并处理 padding 少 2 列的影响 — renderShell 改回默认外壳，绿底由 pi 的 Box 上；resolve-check 在加载的是旧安装时打 SKIP 而非假绿；卸载重复的 npm 版安装，settings 只留仓库路径；README 补两处踩坑 【落地】 (完成 2026-10-19 01a15376-01bc-71)
- [x] tool-call-collapsed-ui [[fanchao]] — 工具调用折叠后只显示一行：改成绿色背景更醒目，并分两层展示（1 命令 2 返回结果） — 折叠行右对齐显示耗时；展开分「命令/结果」两层；修了行尾 \x00 泄漏；121 项自检全绿 【落地】 (完成 2026-10-19 01a15376-01bc-71)
  - [x] 已核实：pi 的 ToolExecutionComponent 默认用 Box(1,1, theme.bg(toolPendingBg/toolSuccessBg)) 给整块加背景；本扩展设 renderShell:"self" 后自动背景被绕过，所以折叠行只有前景色。另 ctx 自带 durationMs（结束后有值，运行中 undefined）。

### Archived
- [[log-2026-10-14]] 完成任务 1 条
- [[log-2026-10-11]] 完成任务 1 条
- [[log-2026-10-10]] 完成任务 1 条
- [[log-2026-10-09]] 完成任务 10 条
