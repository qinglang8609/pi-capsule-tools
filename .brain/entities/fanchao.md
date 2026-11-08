---
tags: [entity, person]
id: fanchao
author: fanchao
updated: 2026-11-08
status: active
---

# fanchao

## 技术栈
- TypeScript + Node.js；写 pi 扩展与 TUI 渲染（`@earendil-works/pi-tui`）。
- 包发布走 npm + GitHub（[qinglang8609/pi-capsule-tools](https://github.com/qinglang8609/pi-capsule-tools)）。
- 用 abs（.brain/ 图谱）做跨会话记忆与任务看板。
- 常用终端包括 Herdr（转轮字形、滚轮事件那类终端差异都从它身上暴露）。

## 特点 / 工作习惯
- 改完要过代码评审和全量自检（2026-10-19 那轮 126 项全绿才算完）。
- 性能问题先压测量数据，不按体感猜瓶颈（fullscreen 卡顿那轮先铺 2000 个胶囊量帧耗时）。
- 出问题要归因到真凶，不接受「按目录猜」「按经验大概是」。
- 会话收尾留 Next Session Hook：没做完的、待确认的、没动的，下回接得上。

## 名下踩过的坑
（本页被 [[todo]] / [[log]] 里的作者标记引用；沉淀经验时在此挂双链）

- [[pi-tool-renderer-override]] — 接管内置工具渲染
- [[pi-tool-renderer-animation]] — 转轮定时器雪球、lastComponent 按行分开
- [[tui-line-width-limit]] — 行超宽抛异常、截断打掉背景色
- [[pi-call-result-double-row]] — call/result 各画一次导致重复
- [[test-handmade-data-hides-key-mismatch]] — 手造测试数据一起猜错键名
- [[publish-pi-package-to-npm]] — 发 npm 包、2FA staged publishing
- [[git-proxy-troubleshooting]] — git push 代理 503
- [[installed-pi-package-check]] — 已装版体检、node 24 类型剥离限制
- [[tui-spinner-glyph-compat]] — 盲文转轮字体兼容、fullscreen 卡顿排查
- [[capsule-hot-path-perf]] — 胶囊热路径性能（firstLine / diff / 展开复用）
