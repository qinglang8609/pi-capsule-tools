# 📋 Todo Board

## Todo

## Done

### 2026-11-08
- [x] mcp-error-no-compress [[fanchao]] — 查 MCP 工具报错时输出被压缩的来路，修成报错原文完整保留 — MCP 工具（mcp / mcp__*）也走胶囊：折叠行只留内层工具名（abs_task），报错时整行转红，正文 ctrl+o 看。自检 159 项全绿，resolve 检查确认胶囊渲染器在 pi 交互模式里压过适配器自带渲染。已把 pi 装机切到本地路径，等 /reload 看实际效果 【落地】 (完成 2026-11-08 01a1b9bb-59c3-70)
- [x] auto-hide-thinking [[fanchao]] — capsule-tools 加载时若 settings 没设过 hideThinkingBlock 就写 true，新机器不用手动设 — 1.2.3 已发；两台机器都装 1.2.3，md5 一致。FNOS 渲染器链路验证 ctx_execute 走胶囊。用户需重启 pi 【落地】 (完成 2026-11-08 01a1b97a-ee58-77)
- [x] release-patch [[fanchao]] — 提交剩余改动，npm version patch 发版，本地切回 npm 装版 — npm 有 1.2.1 和 1.2.2（同代码）；pi 装的是 1.2.2，md5 与工作树一致。staged publishing 和 pi 缓存旧包的坑已记进 publish 页 【落地】 (完成 2026-11-08 01a1b97a-ee58-77)
- [x] dead-code-cleanup [[fanchao]] — capsuleResult 的 toolName 参数没用；capsuleCallRow/runningRow 只有测试用。确认后删/合 — 删掉 capsuleResult 没用的 toolName 参数；runningRow/capsuleCallRow 加注释说明是测试接缝（产品 renderCall 要复用 lastComponent，不走这两个）。自检全绿 【落地】 (完成 2026-11-08 01a1b97a-ee58-77)
- [x] reuse-expanded-result-capsule [[fanchao]] — renderResult 展开时每次 new Capsule，detailBody 和换行缓存跨帧失效；量一下，然后像 call 行一样复用 lastComponent — 展开结果行按 content 数组复用 Capsule：2000 行 675µs→1.9µs，20000 行 6.9ms→17.8µs。内容/失败态变了才重建。自检全绿 【落地】 (完成 2026-11-08 01a1b97a-ee58-77)
- [x] fix-edit-diff-rescan [[fanchao]] — edit 结束后每次重绘都 split 整个 diff 数行数；确认 renderResult 是否每次重绘都跑，然后修掉 — 折叠结果行早退不碰 describe；countDiffLines 不 split 且按 details WeakMap 缓存。250KB diff：折叠 0.1µs，展开重复渲染 2.9µs，旧 split 362µs 【落地】 (完成 2026-11-08 01a1b97a-ee58-77)
- [x] perf-review-ctx-think [[fanchao]] — 审查 ctx_execute 胶囊和 think 折叠对性能的影响；重点：firstLine 用 split 会切整个 code 字符串 — firstLine 从 split 整段改成只看前 max+1 字符：1MB code 从 580µs/帧降到 4.4µs 完整渲染。think 折叠是减负。自检全绿 【落地】 (完成 2026-11-08 01a1b97a-ee58-77)
- [x] collapse-ctx-execute-and-think [[fanchao]] — ctx_execute 工具调用也要折叠成胶囊；think/思考块也要能自动折叠 — ctx_execute 进胶囊（语言+首行/file 路径）；hideThinkingBlock=true 默认折叠 think。自检全绿；装版切到本地路径，npm 旧版已卸避免两层胶囊 【落地】 (完成 2026-11-08 01a1b97a-ee58-77)
- [x] distill-sources [[fanchao]] — 把 3 条 source 提炼成 concept，处理 fanchao.md 草稿，清 lint — 3 条 source 提炼成 installed-pi-package-check 和 tui-spinner-glyph-compat；truncateToWidth 底色已在 tui-line-width-limit 里，补了崩溃 w= 取证；fanchao.md 转 active；lint 0 问题 【落地】 (完成 2026-11-08 01a1b97a-ee58-77)

### Archived
- [[log-2026-10-21]] 完成任务 1 条
- [[log-2026-10-19]] 完成任务 7 条
- [[log-2026-10-14]] 完成任务 1 条
- [[log-2026-10-11]] 完成任务 1 条
- [[log-2026-10-10]] 完成任务 1 条
- [[log-2026-10-09]] 完成任务 10 条
