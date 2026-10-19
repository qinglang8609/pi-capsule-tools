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
import { formatDuration, capsuleHead } from "./capsule-tools.ts";
import { visibleWidth } from "@earendil-works/pi-tui";

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

// The call row above already prints the command; the result row repeating it
// printed every command twice once expanded.
check(
	"expanded result row does not repeat the head command twice",
	!expandedRows[0]!.includes("seq 1 400"),
	JSON.stringify(expandedRows[0]),
);

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

// The expanded body must be two labelled layers: the command that ran, then the
// result. Without them a long command stays truncated in the head forever.
const layered = capsuleResultRow(theme, "bash", args, result, true).render(80).join("\n");
check("expanded body labels the command layer", layered.includes("命令"), layered);
check("expanded body labels the result layer", layered.includes("结果"), layered);
check(
	"command layer precedes the result layer",
	layered.indexOf("命令") < layered.indexOf("结果"),
	layered,
);

// The elapsed time sits at the right edge, and never pushes the line past the
// terminal width — pi refuses to render a wider line.
check("duration formatting", formatDuration(0) === "0ms" && formatDuration(1234) === "1.2s", String(formatDuration(1234)));
{
	const row = capsuleCallRow(theme, "bash", { command: "sleep 5" }, undefined, "done", {
		durationMs: 1234,
	}).render(60)[0]!;
	check("finished row shows the elapsed time", row.includes("1.2s"), row);
	check("elapsed time is right-aligned", row.trimEnd().endsWith("1.2s"), JSON.stringify(row));
	check("elapsed time row fits the width", visibleWidth(row) === 60, String(visibleWidth(row)));
}
const tight = capsuleHead("▸ bash  " + "x".repeat(80), "12.3s", 20);
check("narrow row drops the label instead of overflowing", visibleWidth(tight) <= 20, String(visibleWidth(tight)));
// The \x00 split marker must never survive into a rendered line.
check(
	"no split marker leaks into a rendered row",
	!capsuleResultRow(theme, "bash", args, result, true).render(80).join("").includes("\x00"),
	JSON.stringify(capsuleResultRow(theme, "bash", args, result, true).render(80)[0]),
);

// Truncation must not punch a hole in the block's background: `truncateToWidth`
// emits a full SGR reset before the ellipsis, so the capsule has to re-assert
// the background after every reset.
{
	const BG = "\x1b[48;5;22m";
	const theme2 = {
		...theme,
		getBgAnsi: () => BG,
	};
	const long = "git log --oneline --graph --decorate --all --max-count=200 and-more";
	const row: any = capsuleCallRow(theme2, "bash", { command: long }, undefined, "done", {
		durationMs: 1234,
	});
	row.bgAnsi = BG;
	const line = row.render(40)[0]!;
	const tail = line.slice(line.indexOf("…"));
	check(
		"background survives the ellipsis",
		!(tail.match(/\x1b\[0m(?!\x1b\[48;5;22m)/g) ?? []).length,
		JSON.stringify(tail),
	);
	check("every reset re-asserts the background", line.includes(`\x1b[0m${BG}`), JSON.stringify(line));
}

// The expanded body is immutable after construction, so its wrapping must be
// cached per width — otherwise every redraw re-wraps the whole output.
{
	const big = Array.from({ length: 200 }, (_, i) => `line ${i}`).join("\n");
	const { Capsule: C } = await import("./capsule-tools.ts");
	const c = new C("", big);
	const first = c.render(80);
	const second = c.render(80);
	check("body render is cached between identical widths", first[3] === second[3]);
	const wider = c.render(100);
	check("changing the width recomputes the body", wider !== first);
}

console.log(failures === 0 ? "\nall row checks passed" : `\n${failures} failed`);
process.exit(failures === 0 ? 0 : 1);
