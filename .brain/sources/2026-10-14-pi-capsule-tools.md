---
tags: [source, pi-extension, performance, tui, crash]
id: 2026-10-14-pi-capsule-tools
author: fanchao
updated: 2026-10-14
status: draft
---

# 来源：pi-capsule-tools 已装版体检方法：装的是 npm:pi-capsule-tools@1.1.1，源码与 ~/…

TITLE: pi-capsule-tools 已装版体检方法：装的是 npm:pi-capsule-tools@1.1.1，源码与 ~/.pi/agent/npm/node_modules/ 下字节一致(md5 核对)。踩坑：node 24 无法对 node_modules 内 .ts 剥类型(ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING)，实测要在项目目录内 import 项目源码，依赖解析借项目 devDependencies 的 pi-tui 1.2.0。crash 归因教训：pi-tui-crash.log 里越宽行是 abs 的 todo 状态栏('📋 todo (1) — fanchao' 36宽>35终端)，不是 capsule-tools(它的行全 w=35)——看崩溃日志要逐行看 w= 值定位真凶，别按 cwd 猜。

## 记录（实时暂存，Teardown 时提炼进 concepts/ 后本页可删）
- pi-capsule-tools 已装版体检方法：装的是 npm:pi-capsule-tools@1.1.1，源码与 ~/.pi/agent/npm/node_modules/ 下字节一致(md5 核对)。踩坑：node 24 无法对 node_modules 内 .ts 剥类型(ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING)，实测要在项目目录内 import 项目源码，依赖解析借项目 devDependencies 的 pi-tui 1.2.0。crash 归因教训：pi-tui-crash.log 里越宽行是 abs 的 todo 状态栏('📋 todo (1) — fanchao' 36宽>35终端)，不是 capsule-tools(它的行全 w=35)——看崩溃日志要逐行看 w= 值定位真凶，别按 cwd 猜。

## 关联连接
- [[fanchao]] — 本页沉淀者
（提炼成 concepts 规律页后，在此挂双链到该页）
