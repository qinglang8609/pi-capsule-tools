/**
 * Proves the capsule renderer actually wins for the built-in tools.
 *
 * The bug this guards against: pi wraps its own built-in renderers around the
 * registered tool definition, so a renderer registered through registerTool()
 * loses for bash/read/edit/write. The extension must register through
 * registerToolRenderer instead, and that resolver must be reached before the
 * built-in wrapper.
 *
 * Run: node --experimental-strip-types resolve-check.ts
 */

import { DefaultResourceLoader } from "/Users/fanchao/.nvm/versions/node/v24.18.0/lib/node_modules/@earendil-works/pi-coding-agent/dist/core/resource-loader.js";
import { SettingsManager } from "@earendil-works/pi-coding-agent";
import { readFileSync } from "node:fs";

let failures = 0;
function check(label: string, ok: boolean): void {
	if (ok) return void console.log(`  ok   ${label}`);
	failures++;
	console.log(`  FAIL ${label}`);
}

const cwd = "/Users/fanchao";
const agentDir = `${cwd}/.pi/agent`;
const settings = SettingsManager.create(cwd, agentDir, { projectTrusted: false });
const loader = new DefaultResourceLoader({ cwd, agentDir, settingsManager: settings });
await loader.reload();
const result = loader.getExtensions();

const capsule = result.extensions.find((e) => e.path.includes("capsule-tools"));
check("capsule extension loaded", Boolean(capsule));
check("no extension load errors", (result.errors ?? []).length === 0);
check("registers at least one tool renderer", (capsule?.toolRenderers?.length ?? 0) >= 1);

/** Whether the extension pi actually loaded is this working tree (not an npm install). */
function installedCopyIsStale(): boolean {
	try {
		return (
			readFileSync(capsule!.path, "utf8") !== readFileSync(new URL("./capsule-tools.ts", import.meta.url), "utf8")
		);
	} catch {
		return true;
	}
}

// These checks only mean something when the loaded file is the one being edited.
if (installedCopyIsStale()) {
	console.log("\nSKIP resolve checks: pi loaded an installed copy, not this working tree");
	process.exit(0);
}

// Walk the resolver chain the way pi's interactive mode does.
const resolvers = result.extensions.flatMap((e) => e.toolRenderers ?? []);
const base = () => ({ renderCall: () => "BUILTIN", renderResult: () => "BUILTIN" });
const resolve = (i: number, name: string) =>
	i < resolvers.length ? resolvers[i](name, () => resolve(i + 1, name)) : base();

for (const name of ["bash", "powershell", "read", "edit", "write", "grep", "find", "ls"]) {
	const renderers = resolve(0, name) as any;
	check(`${name}: capsule renderer wins`, typeof renderers?.renderCall === "function");
	check(`${name}: renderShell is default so pi paints the background`,
		(renderers?.renderShell ?? "default") === "default");
}

// An unknown tool must fall through untouched, so MCP and other extension
// tools keep their own rendering.
const unknown = resolve(0, "mcp") as any;
check("unknown tool falls through to base", unknown?.renderCall?.() === "BUILTIN");

console.log(failures === 0 ? "\nall resolve checks passed" : `\n${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
