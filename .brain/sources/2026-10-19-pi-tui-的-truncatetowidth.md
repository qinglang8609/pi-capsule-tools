---
tags: [source, pi-tui, tui, ansi]
id: 2026-10-19-pi-tui-的-truncatetowidth
author: fanchao
updated: 2026-10-19
status: draft
---

# 来源：pi-tui 的 truncateToWidth 会在省略号前插一个完整 SGR 重置 \x1b[0m，它连 pi 外壳给的背景色一起清掉，导致 ……

TITLE: pi-tui 的 truncateToWidth 会在省略号前插一个完整 SGR 重置 \x1b[0m，它连 pi 外壳给的背景色一起清掉，导致 … 之后变成终端本色；修法是截断后把 theme.getBgAnsi(bg) 重新贴到每个重置后面。

## 记录（实时暂存，Teardown 时提炼进 concepts/ 后本页可删）
- pi-tui 的 truncateToWidth 会在省略号前插一个完整 SGR 重置 \x1b[0m，它连 pi 外壳给的背景色一起清掉，导致 … 之后变成终端本色；修法是截断后把 theme.getBgAnsi(bg) 重新贴到每个重置后面。

## 关联连接
- [[fanchao]] — 本页沉淀者
（提炼成 concepts 规律页后，在此挂双链到该页）
