/**
 * Guards the double-row bug: a collapsed tool call must render its capsule
 * exactly once.
 *
 * What went wrong before: renderCall drew the capsule, and renderResult drew
 * the same capsule again. Pi shows the call and result rows separately, so
 * every tool call appeared twice. The fix is for the result row to stay empty
 * while collapsed.
 *
 * Run: node --experimental-strip-types rows-check.ts
 */

import { Capsule } from "./capsule-tools.ts";

let failures = 0;
function check(label: string, ok: boolean, detail = ""): void {
	if (ok) return void console.log(`  ok   ${label}`);
	failures++;
	console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
}

const theme = {
	fg: (_token: string, text: string) => text,
	bold: (text: string) => text,
};

// Rebuild the two rows the way the extension's resolver does, so the assertion
// tracks the real rendering path rather than a copy of it.
const { capsuleCallRow, capsuleResultRow } = await import("./capsule-tools.ts");

const args = { command: "seq 1 400 | awk '{print $1}'" };
const result = { content: [{ type: "text", text: "line 1\nline 2" }], details: { exitCode: 0 } };

const collapsedCall = capsuleCallRow(theme, "bash", args, result, "call");
const collapsedResult = capsuleResultRow(theme, "bash", args, result, false);

const callRows = collapsedCall.render(80);
const resultRows = collapsedResult.render(80);

check("call row is one line", callRows.length === 1, `got ${callRows.length}`);
check(
	"collapsed result row is empty",
	resultRows.length === 0 || !resultRows.join("").trim(),
	`got ${JSON.stringify(resultRows)}`,
);

const visibleCollapsed = [...callRows, ...resultRows].filter((l) => l.trim());
check(
	"collapsed call shows exactly one row",
	visibleCollapsed.length === 1,
	`got ${visibleCollapsed.length}: ${JSON.stringify(visibleCollapsed)}`,
);

// Expanded must bring the output back, and still respect the width limit.
const expanded = capsuleResultRow(theme, "bash", args, result, true);
const expandedRows = expanded.render(80);
check("expanded shows output", expandedRows.length > 1, `got ${expandedRows.length}`);

for (const width of [20, 60]) {
	const rows = capsuleResultRow(theme, "bash", args, result, true).render(width);
	const { visibleWidth } = await import("@earendil-works/pi-tui");
	const tooWide = rows.filter((l) => visibleWidth(l) > width);
	check(`expanded width=${width} fits`, tooWide.length === 0);
}

// The failure notice must survive expansion instead of being dropped. It comes
// from the render context's `isError` — bash's own `details` is only set when
// the output is truncated, so it never carried the exit status.
const failed = { content: [{ type: "text", text: "boom" }], details: undefined };
const failedExpanded = capsuleResultRow(theme, "bash", args, failed, true, undefined, true)
	.render(80)
	.join("\n");
check("expanded shows the failure notice", failedExpanded.includes("failed"));

// A successful call must not claim failure.
const okExpanded = capsuleResultRow(theme, "bash", args, failed, true, undefined, false)
	.render(80)
	.join("\n");
check("success shows no failure notice", !okExpanded.includes("failed"));

// And it must NOT leak into the collapsed row (that is what caused the dupe).
const failedCollapsed = capsuleResultRow(theme, "bash", args, failed, false).render(80).join("");
check("collapsed stays empty even on failure", failedCollapsed.trim() === "");

// Each built-in tool must resolve to a capsule, so a tool missing from
// detailsOf() (powershell was) fails here instead of silently rendering raw.
for (const name of ["bash", "powershell", "read"]) {
	const head = capsuleCallRow(theme, name, { command: "x", path: "/tmp/x" }, {}, "call").render(80)[0] ?? "";
	check(`${name} gets a capsule`, head.includes(name), `got ${JSON.stringify(head)}`);
}

// The head must carry the tool name. read/write/ls all render as a bare path,
// so without the name three different tools draw the same line.
const pathArgs = { path: "/tmp/x.ts" };
const heads = ["read", "write", "ls"].map((name) =>
	capsuleCallRow(theme, name, pathArgs, {}, "call").render(80)[0] ?? "",
);
for (const [i, name] of ["read", "write", "ls"].entries()) {
	check(`head shows the tool name: ${name}`, heads[i].includes(name), `got ${JSON.stringify(heads[i])}`);
}
check("path tools are distinguishable", new Set(heads).size === 3, `got ${JSON.stringify(heads)}`);

console.log(failures === 0 ? "\nall row checks passed" : `\n${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
