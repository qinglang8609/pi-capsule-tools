# 📋 Todo Board

## Todo
- [ ] [进行中] push-v1.1.0 [[fanchao]] — 推送 v1.1.0 到 GitHub（3 提交 + tag），等代理可用 (认领 2026-10-10 01a12608-4ed4-73)
  ↳ 断点: 下一步：git push origin HEAD --tags（本地 3 提交 + v1.1.0 tag）

## Done

### 2026-10-10
- [x] tool-call-animation [[fanchao]] — 为 bash/read/edit 工具调用加动效：运行中字符动画、失败红色 — 工具行加动效：运行中转轮、失败红箭头；经验沉淀到 pi-tool-renderer-animation 【落地】 (完成 2026-10-10 01a12608-4ed4-73)

### 2026-10-09
- [x] fix-todo-panel-jitter [[fanchao]] — 改全局 ~/.pi/agent/extensions/abs.ts：todo 面板 aboveEditor → belowEditor，避开 pi 工作指示器占用的 status 行。改完需 /reload 看效果 — belowEditor 实测不行（输入框被挤上去），已还原 【否决】 (完成 2026-10-09 01a120e4-953c-76)
- [x] publish-to-github [[fanchao]] — 推 pi-capsule-tools 到 GitHub（qinglang8609/pi-capsule-tools）：配 remote、补 package.json 链接字段、推 main + tag v1.0.1 — 已推 GitHub：main + tag v1.0.1 【落地】 (完成 2026-10-09 01a120e4-953c-76)
- [x] package-for-npm-release [[fanchao]] — 把 pi-capsule-tools 改造成标准 pi 包可发 npm：pi 字段 + peerDependencies（5 个 host 包）+ keywords pi-package + files + publishConfig；挂载方式从手动 cp 改成 pi install npm:；照搬 agent_brain_sync 发布流程（npm version patch → pack:check → publish） — 已发 npm 1.0.1，本地 npm 安装实测通过 【落地】 (完成 2026-10-09 01a120e4-953c-76)
- [x] write-audit-findings-page [[fanchao]] — 把「手造测试数据 → 实现与测试一起猜错」这条经验落成概念页，并修正 audit-whole-project 状态 — 经验落成概念页 + 图谱 lint 干净 【落地】 (完成 2026-10-09 01a120e4-953c-76)
- [x] audit-whole-project [[fanchao]] — 全面审查 pi-capsule-tools：胶囊渲染正确性、边界情况、测试覆盖漏洞、可维护性、与 pi 内部 API 耦合风险 — 审查完成，5 项已修并反向验证 【落地】 (完成 2026-10-09 01a120e4-953c-76)
- [x] fix-audit-findings [[fanchao]] — 修审查发现的 5 项：bash exit 改用 context.isError、edit 从 details.diff 数 +/−、shortenPath 加分隔符判断、content 加 Array.isArray 守卫、缓存返回副本。新增 real-data-check.ts 用真实工具结果测 — 审查 5 项全修：bash/edit 键名修正、shortenPath、缓存副本 【落地】 (完成 2026-10-09 01a120e4-953c-76)
- [x] fix-powershell-missing [[fanchao]] — powershell 是 pi 第 8 个内置工具（与 bash 共用 renderer），但 detailsOf() 没覆盖它，胶囊不生效。加别名复用 bash 逻辑 + 测试断言 + README 表格 — 补 powershell 胶囊 + 修正 README 测试项数 【落地】 (完成 2026-10-09 01a120e4-953c-76)
- [x] audit-render-perf [[fanchao]] — 审查 capsule-tools 对 pi 运行速度的影响：渲染热路径、每帧开销、缓存是否有效、有无重复解析 — 性能审查完成：实测 500 个工具调用每帧全树 render 仅 0.004ms（16ms 预算的 0.02%），缓存有效；解析器链每工具调用只跑一次（构造时），不在帧循环里。结论：无感知影响，不需优化 【仅方案】 (完成 2026-10-09 01a120e4-953c-76)
- [x] split-readme-to-brain [[fanchao]] — README 只留工具介绍（是什么/安装/覆盖范围/胶囊长相）；踩坑经验（registerToolRenderer、单行截断、双行 bug、toolTitle）搬进 .brain 概念页；测试说明归到工具介绍侧 — README 只留工具介绍，踩坑搬进三条概念页 【落地】 (完成 2026-10-09 01a120e4-953c-76)
- [x] fix-capsule-tool-name [[fanchao]] — 胶囊头缺工具名：read/write/ls 都是纯路径，画出来一模一样，分不清。给 capsuleLine/capsule/capsuleResult 加 toolName 透传，rows-check 加回归断言。验证：npm run typecheck + npm run check — 胶囊头加工具名，对齐 pi 内置渲染器 【落地】 (完成 2026-10-09 01a120e4-953c-76)
