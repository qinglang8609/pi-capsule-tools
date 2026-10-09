# 20261009 改造成标准 pi 包并发布 npm

## 目标

把 `pi-capsule-tools` 从「手动 cp 到 `~/.pi/agent/extensions/`」改成**标准 pi 包**，
可通过 `pi install npm:pi-capsule-tools` 安装。

发布流程照搬 `/Users/fanchao/Code/agent_brain_sync`（已跑通 v1.17.0）：
`npm version patch` → `npm run pack:check` → `npm publish`。

## 现状 vs 标准（调研结论）

| 项 | 现状 | 标准要求 |
|---|---|---|
| 文件名 | 根目录 `capsule-tools.ts` | `extensions/*.ts` 或 `pi.extensions` 指过去 |
| `pi` 字段 | 无 | `{"pi": {"extensions": [...]}}` |
| host 依赖 | `@earendil-works/pi-tui` / `pi-coding-agent` 当普通 import | 必须列 `peerDependencies` + `"*"`，**不能进 `dependencies`** |
| `keywords` | 无 | 加 `"pi-package"`（进官方画廊的条件）|
| `private` | `true` | 去掉才能发 |
| `files` | 无 | 白名单，控制发布产物 |
| 版本管理 | 手写 `1.0.0` | `npm version` 驱动 |

**官方最强调的一条**：5 个 host 包（`pi-ai` / `pi-agent-core` / `pi-coding-agent` / `pi-tui` / `typebox`）
**必须**放 `peerDependencies`，放 `dependencies` 会物理拷贝一份、绕过 pi 的扩展模块映射，
产生**重复的类与注册表**，pi 会报扩展警告。

## 改动清单

### 1. `package.json`

```json
{
  "name": "pi-capsule-tools",
  "version": "1.0.0",
  "type": "module",
  "description": "...",
  "license": "MIT",
  "keywords": ["pi-package", "pi", "extension", "tui", "capsule"],
  "pi": { "extensions": ["./capsule-tools.ts"] },
  "files": ["capsule-tools.ts", "README.md"],
  "peerDependencies": {
    "@earendil-works/pi-coding-agent": "*",
    "@earendil-works/pi-tui": "*"
  },
  "peerDependenciesMeta": {
    "@earendil-works/pi-coding-agent": { "optional": true },
    "@earendil-works/pi-tui": { "optional": true }
  },
  "devDependencies": { "@earendil-works/pi-coding-agent": "...", "typescript": "..." },
  "scripts": { ... 加 pack:check }
}
```

注意：
- **去掉 `private: true`**（现在有，会阻止发布）
- **去掉 `install-extension`**（cp 方式不再需要）→ 换成 `pi install ./` 或 npm
- 测试脚本保留
- 5 个 host 包里本项目只用到 2 个（`pi-coding-agent`、`pi-tui`），只列用到的

### 2. `files` 白名单要带测试文件吗

**不带**。`check.ts` / `rows-check.ts` / `resolve-check.ts` / `real-data-check.ts` 是开发期验证，
不进 npm 产物。但要注意：`capsule-tools.ts` 里 `export` 了 `Capsule` / `shortenPath` 等给测试用，
**这些 export 保留**（不影响运行时，且开发时有用）。

### 3. 挂载方式变更

| | 旧 | 新 |
|---|---|---|
| 开发中 | `npm run install-extension`（cp） | `pi install ./`（本地路径，直接加载） |
| 用户安装 | 手动 cp | `pi install npm:pi-capsule-tools` |
| 卸载 | `rm` 文件 | `pi remove npm:pi-capsule-tools` |

**过渡注意**：`~/.pi/agent/extensions/capsule-tools.ts` 这个旧副本**必须删掉**，
否则会和 npm 包装的**同时加载**（两份胶囊渲染器）。官方文档明确说 pi 靠包名/路径去重，
但 cp 版没有包身份，去不掉。

### 4. README 更新

- 安装章节：`cp` → `pi install npm:pi-capsule-tools`
- 加发布章节（照 agent_brain_sync 的格式）
- 保留现有「各工具显示什么」「测试」「已知限制」

### 5. `.gitignore` / `.npmignore`

- `.gitignore` 加 `*.tgz`（`npm pack` 产物）和 `node_modules/`（现在有没有待确认）
- `.npmignore` 不建，靠 `files` 白名单（更可靠）

### 6. 发布流程文档化

照 agent_brain_sync 的做法写进 README：

```bash
npm version patch    # 自动打 tag，别手改 version
npm run pack:check   # 预览产物
npm publish          # 发布
```

## 验证方式

- **复现路径**：`npm pack --dry-run` 看产物只含 `capsule-tools.ts` + `README.md`
- **回归路径**：`npm run check` 全量（75 项）+ `npm run typecheck` 干净
- **边界**：`npm pack` 后解包，确认没有 `node_modules`、没有测试文件
- **真实安装**：`pi install ./`（本地）→ 确认胶囊生效；再删旧 cp 副本确认不重复

## 风险与前提

1. **发布需要 npm 账号**：`npm whoami` 已确认是 `fanchao8609`（与 agent_brain_sync 同账号）。
   包名 `pi-capsule-tools` 是否被占用**必须先查** `npm view pi-capsule-tools`。
2. **删旧 cp 副本会让插件短暂失效**：若 npm 安装出问题，需能退回 cp 方式。保留备份。
3. **`pi install` 的确切行为未实测**（是 npm install 到 `~/.pi/agent/npm/` 还是别的）。
   本地方案 `pi install ./` 最安全，先用它验证，npm 发布后再验一次。
4. **`.ts` 扩展在 npm 包里的可加载性未验证**：现有其他包（ponytail/pi-subagents）发的都是
   编译后的 `.js`。pi 用 jiti 加载 TS，理论上 `.ts` 可以，但**这是本次最大的不确定点**，
   必须实测。

## 实施顺序

1. 查包名是否被占 + 确认 `pi install ./` 能加载当前形态（**先验证前提，再改**）
2. 改 `package.json`
3. 测 `npm pack --dry-run` 产物
4. 删旧 cp 副本，用 `pi install ./` 验证胶囊仍生效
5. 更新 README
6. 跑全量测试 + typecheck
7. 发布（`npm version patch` → `pack:check` → `publish`）——**这步等用户确认**

## 实测结果（已做）

### 前提验证

| 项 | 结果 |
|---|---|
| 包名 `pi-capsule-tools` | ✅ 未被占用（404） |
| `pi install` 命令 | ✅ 存在，支持 `./local/path` |
| **`.ts` 扩展能被加载** | ✅ **验证通过**（最大的不确定点已排除）|
| npm 账号 | ✅ `fanchao8609` |

### 安装实测

```
$ pi install ./
Installing ./...
Installed ./
```
→ `settings.json` 写入 `"../../Code/pi-capsule-tools"`，`pi list` 解析为绝对路径。

`resolve-check.ts` 20 项全过 —— **证明 `.ts` 通过包路径加载成功**（`capsule extension loaded` +
7 个工具 `renderer wins`）。

### 产物

```
npm pack --dry-run →
  3.7kB README.md
  9.9kB capsule-tools.ts
  1.3kB package.json     共 3 文件，5.7KB
```
无 `node_modules`、无测试文件。

### 门禁

`npm run check` 75 项全绿；`npm run typecheck` 干净。

### 与方案的偏差

- `devDependencies` 原写 `"*"`，改为实测版本号（`^1.1.0` / `^7.0.2`）。
- 方案里怀疑 `@typescript/native-preview` 需要声明——实测它是 `typescript@7` 的配套二进制包，
  **不是直接依赖**，不列。
- 新增 `.gitignore`（原仓没有），加 `node_modules/` 与 `*.tgz`。

### 旧 cp 副本处置

已删 `~/.pi/agent/extensions/capsule-tools.ts`（备份在 `/tmp/capsule-cp-backup.ts`）。
现只走包路径，不会重复加载。

## 待做

无。发布已完成：`pi-capsule-tools@1.0.1` 已在 npm 上。

## 发布结果（2026-10-09）

```
$ npm view pi-capsule-tools version
1.0.1
```

### 踩到的坑：首次发布返回 202

第一次 `npm publish` 返回 **202 Accepted**（不是 201），包被放进 **staged publishing** 等 2FA 证明。
终端警告：`npm tokens that bypass 2FA are being restricted ... direct publishing`。

`~/.npmrc` 里的 `_authToken` 正是被限制的方式。用户完成 `npm login --auth-type=web` 后重发成功。

期间 `npm view` 显示的是占位包 `0.0.0-stage`（"Temporary package placeholder for staged publishing"），
不是我们的版本 —— **这是正常现象**，正式发布后被取代。

### 本地 npm 安装实测（已做）

```
$ pi install npm:pi-capsule-tools
Installed npm:pi-capsule-tools

加载位置: ~/.pi/agent/npm/node_modules/pi-capsule-tools/capsule-tools.ts
加载错误: []
bash/read/edit/ls: ✅ 胶囊接管
```

**结论：`.ts` 经 npm 包分发可被 pi 直接加载，无需编译成 `.js`。**
这是本次最大的不确定点，现已排除。
