# 🗒 Activity Log
## [2026-10-19 20:17] [[fanchao]] dev | 完成 6 项：折叠行耗时右对齐、展开分命令/结果两层、绿底恢复（renderShell 改回 default）、截断行底色修复、点击展开（tuiMode=fullscreen）、盲文转轮换 ◐◓◑◒；全量自检 126 项绿
## [2026-10-19 18:13] [[fanchao]] note | fullscreen 卡顿压测结论：用 pi 自己的 renderLayoutFrame 铺 2000 个折叠胶囊，每帧只要 0.56ms，说明全量重算历史不是瓶颈；更可疑的是盲文转轮 ⠋⠙⠹… 在 Herdr 等终端上掉进回退字体、宽度超过一格，导致整行每 90ms 抖动。改用 ◐◓◑◒。
## [2026-10-19 17:36] [[fanchao]] note | pi-tui 的 truncateToWidth 会在省略号前插一个完整 SGR 重置 \x1b[0m，它连 pi 外壳给的背景色一起清掉，导致 … 之后变成终端本色；修法是截断后把 theme.getBgAnsi(bg) 重新贴到每个重置后面。
## [2026-10-14 06:53] [[fanchao]] note | pi-capsule-tools 已装版体检方法：装的是 npm:pi-capsule-tools@1.1.1，源码与 ~/.pi/agent/npm/node_modules/ 下字节一致(md5 核对)。踩坑：node 24 无法对 node_modules 内 .ts 剥类型(ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING)，实测要在项目目录内 import 项目源码，依赖解析借项目 devDependencies 的 pi-tui 1.2.0。crash 归因教训：pi-tui-crash.log 里越宽行是 abs 的 todo 状态栏('📋 todo (1) — fanchao' 36宽>35终端)，不是 capsule-tools(它的行全 w=35)——看崩溃日志要逐行看 w= 值定位真凶，别按 cwd 猜。
## [2026-10-09 22:35] [[fanchao]] dev | pi-capsule-tools 推上 GitHub（qinglang8609/pi-capsule-tools）：main + tag v1.0.1；package.json 补 repository/homepage/bugs/author
## [2026-10-09 22:21] [[fanchao]] dev | pi-capsule-tools 发成标准 pi 包并上 npm（1.0.1）：pi 字段 + peerDependencies + pi-package 关键词；挂载从手动 cp 改成 pi install npm:；本地 npm 安装实测零错误加载。发布流程落成概念页 publish-pi-package-to-npm（含首次发布 202+2FA 这个坑）
## [2026-10-09 22:04] [[fanchao]] dev | 审查 5 项全修 + 新增 real-data-check.ts（用 pi 真实工具结果测，堵住「手造数据→实现与测试一起猜错」盲区）。75 项全绿，反向验证逐项确认
## [2026-10-09 21:45] [[fanchao]] dev | README 只留工具介绍（是什么/安装/覆盖范围/显示什么/测试/限制），踩坑经验搬进 .brain 三条概念页

<!-- 每条一行：## [YYYY-MM-DD HH:MM] [[作者]] kind | 正文（kind: note|dev|concept|ingest） -->
