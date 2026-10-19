---
tags: [source, pi, 性能, tui]
id: 2026-10-19-fullscreen-卡顿压测结论-用-pi
author: fanchao
updated: 2026-10-19
status: draft
---

# 来源：fullscreen 卡顿压测结论：用 pi 自己的 renderLayoutFrame 铺 2000 个折叠胶囊，每帧只要 0.56ms…

TITLE: fullscreen 卡顿压测结论：用 pi 自己的 renderLayoutFrame 铺 2000 个折叠胶囊，每帧只要 0.56ms，说明全量重算历史不是瓶颈；更可疑的是盲文转轮 ⠋⠙⠹… 在 Herdr 等终端上掉进回退字体、宽度超过一格，导致整行每 90ms 抖动。改用 ◐◓◑◒。

## 记录（实时暂存，Teardown 时提炼进 concepts/ 后本页可删）
- fullscreen 卡顿压测结论：用 pi 自己的 renderLayoutFrame 铺 2000 个折叠胶囊，每帧只要 0.56ms，说明全量重算历史不是瓶颈；更可疑的是盲文转轮 ⠋⠙⠹… 在 Herdr 等终端上掉进回退字体、宽度超过一格，导致整行每 90ms 抖动。改用 ◐◓◑◒。

## 关联连接
- [[fanchao]] — 本页沉淀者
（提炼成 concepts 规律页后，在此挂双链到该页）
