/**
 * Capsule Tools — render built-in tool calls as one-line green capsules.
 *
 * Collapsed (default):  ▸ bash  git status --short
 * Expanded (ctrl+o):    ▸ bash  git status --short
 *                         <full output>
 *
 * Only the call line is drawn while collapsed, so long bash/read output
 * costs one row until the user expands it.
 *
 * Usage: copy to ~/.pi/agent/extensions/ (or `pi -e ./capsule-tools.ts`).
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Text, truncateToWidth, type Component } from "@earendil-works/pi-tui";
import { homedir } from "node:os";

const COLLAPSED = "▸";
const EXPANDED = "▾";

export function shortenPath(path: string): string {
	const home = homedir();
	// The separator matters: `/Users/me-other` must not become `~-other`.
	if (path === home) return "~";
	return path.startsWith(`${home}/`) ? `~${path.slice(home.length)}` : path;
}

/** First line only — the capsule must never wrap. */
function firstLine(text: string, max = 120): string {
	const line = String(text).split("\n")[0] ?? "";
	return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

/**
 * A capsule: one line, always. The head is truncated to the available width;
 * the optional body is handed to Text, which wraps it.
 *
 * Pi's TUI rejects a rendered line wider than the terminal, so the head has to
 * be truncated here instead of relying on wrapping.
 */
export class Capsule implements Component {
	private readonly head: string;
	private readonly body: string | undefined;
	private cachedWidth: number | undefined;
	private cachedLines: string[] | undefined;

	constructor(head: string, body?: string) {
		this.head = head;
		this.body = body;
	}

	render(width: number): string[] {
		if (this.cachedLines && this.cachedWidth === width) return [...this.cachedLines];
		const head = truncateToWidth(this.head, Math.max(1, width - 1), "…");
		const lines = this.body
			? [head, ...new Text(this.body, 0, 0).render(width)]
			: [head];
		this.cachedWidth = width;
		this.cachedLines = lines;
		// A copy: pi (or any caller) mutating the returned array would poison the cache.
		return [...lines];
	}

	invalidate(): void {
		this.cachedWidth = undefined;
		this.cachedLines = undefined;
	}
}

/**
 * The tool name is part of the head so `read`/`write`/`ls` stay distinguishable
 * — all three render as a bare path. Pi's own built-in renderers all use the
 * same `toolTitle` + bold name shape, so the capsule matches them.
 */
function capsuleLine(
	theme: any,
	arrow: string,
	toolName: string,
	command: string,
	reason?: string,
): string {
	const head = theme.fg("success", arrow);
	const name = theme.fg("toolTitle", theme.bold(toolName));
	const cmd = theme.fg("success", theme.bold(command));
	const tail = reason ? theme.fg("dim", `  ${reason}`) : "";
	return `${head} ${name}  ${cmd}${tail}`;
}

function capsule(
	theme: any,
	arrow: string,
	toolName: string,
	command: string,
	reason?: string,
): Component {
	return new Capsule(capsuleLine(theme, arrow, toolName, command, reason));
}

/**
 * The result row. Collapsed it is empty: `renderCall` already drew the capsule
 * for this tool call, and drawing a second one doubled every row. Pi keeps the
 * call and result rows separate, so the detail only appears once expanded.
 *
 * The body carries the reason (exit code and similar) on its first line so the
 * information is not lost, only deferred.
 */
function capsuleResult(
	theme: any,
	toolName: string,
	command: string,
	result: any,
	expanded: boolean,
	reason?: string,
	partialReason?: string,
): Component {
	if (!expanded) return new Text("", 0, 0);

	const lines: string[] = [];
	const notice = reason ?? partialReason;
	if (notice) lines.push(theme.fg("dim", notice));

	const body = (Array.isArray(result?.content) ? result.content : [])
		.filter((c: any) => c?.type === "text")
		.map((c: any) => c.text)
		.join("\n")
		.trim();
	if (body) {
		lines.push(
			...body.split("\n").map((line: string) => theme.fg("toolOutput", line)),
		);
	}

	// The capsule head is repeated so the expanded block still says what ran.
	return new Capsule(
		capsuleLine(theme, EXPANDED, toolName, command),
		lines.length ? lines.join("\n") : undefined,
	);
}

/**
 * What the capsule shows for a tool, by tool name. `describe` runs for both
 * the call and the result so the line stays stable once output arrives.
 *
 * `isError` comes from pi's render context — the tool result's own `details`
 * does not carry the exit status (bash only sets `details` when it truncates).
 *
 * Tools missing from this map fall through to the next resolver.
 */
type Describe = (
	args: any,
	result: any,
	phase: "call" | "partial" | "done",
	ctx?: { isError?: boolean },
) => { command: string; reason?: string };

/** Count changed lines from a unified diff (`+`/`-` prefixes). */
function countDiffLines(diff: unknown): { added: number; removed: number } | undefined {
	if (typeof diff !== "string" || diff.length === 0) return undefined;
	let added = 0;
	let removed = 0;
	for (const line of diff.split("\n")) {
		if (line.startsWith("+")) added++;
		else if (line.startsWith("-")) removed++;
	}
	return { added, removed };
}

function firstLineOf(text: unknown, max = 120): string {
	return firstLine(String(text ?? "..."), max);
}

function detailsOf(toolName: string): Describe | undefined {
	switch (toolName) {
		// bash and powershell share one renderer in pi; the capsule treats them
		// the same, and `exit N` is the status both report.
		case "bash":
		case "powershell":
			return (args, _result, phase, ctx) => {
				const command = firstLineOf(args?.command);
				if (phase === "partial") return { command, reason: "running…" };
				// pi only sets bash `details` when output is truncated, so the exit
				// status is not there. `isError` is the signal reachable from the
				// render context.
				return { command, reason: ctx?.isError ? "failed" : undefined };
			};
		case "read":
			return (args, _result, phase) => {
				let command = shortenPath(args?.path ?? "...");
				if (args?.offset !== undefined || args?.limit !== undefined) {
					const start = args.offset ?? 1;
					const end = args.limit !== undefined ? start + args.limit - 1 : "";
					command += `:${start}${end ? `-${end}` : ""}`;
				}
				return { command, reason: phase === "partial" ? "reading…" : undefined };
			};
		case "edit":
			return (args, result, phase) => {
				const command = shortenPath(args?.path ?? "...");
				if (phase === "partial") return { command, reason: "editing…" };
				// details carries `diff`/`patch`/`firstChangedLine` — no added/removed counts.
				const counts = countDiffLines(result?.details?.diff);
				return {
					command,
					reason: counts ? `+${counts.added} -${counts.removed}` : undefined,
				};
			};
		case "write":
			return (args, _result, phase) => ({
				command: shortenPath(args?.path ?? "..."),
				reason: phase === "partial" ? "writing…" : undefined,
			});
		case "grep":
			return (args, _result, phase) => ({
				command: firstLineOf(args?.pattern),
				reason: phase === "partial" ? "searching…" : undefined,
			});
		case "find":
			return (args, _result, phase) => ({
				command: firstLineOf(args?.pattern ?? args?.path),
				reason: phase === "partial" ? "finding…" : undefined,
			});
		case "ls":
			return (args, _result, phase) => ({
				command: shortenPath(args?.path ?? "."),
				reason: phase === "partial" ? "listing…" : undefined,
			});
		default:
			return undefined;
	}
}

export default function (pi: ExtensionAPI) {

	// Pi wraps its own built-in renderers around the registered tool definition,
	// so overriding `renderCall` through registerTool() loses for built-ins such
	// as bash. registerToolRenderer is asked first, before that wrapper, so the
	// capsules are resolved here instead. Execution is never touched.
	pi.registerToolRenderer((toolName: string, next: () => any) => {
		const known = detailsOf(toolName);
		// Unknown tools keep whatever they already had (MCP servers, other
		// extensions). Only the built-ins we know get capsules; everything else
		// falls through to the next resolver.
		if (!known) return next();
		return {
			renderShell: "self" as const,
			renderCall(args: any, theme: any) {
				return capsuleCallRow(theme, toolName, args, undefined, "call");
			},
			renderResult(result: any, { expanded, isPartial }: any, theme: any, ctx: any) {
				return capsuleResultRow(
					theme,
					toolName,
					ctx.args,
					result,
					expanded,
					isPartial ? "partial" : undefined,
					ctx.isError,
				);
			},
		};
	});
}

// --- row builders ---------------------------------------------------------
// Exported so rows-check.ts asserts against the same code the resolver uses.

/** The `▸ tool command` line drawn when the call starts. */
export function capsuleCallRow(
	theme: any,
	toolName: string,
	args: any,
	result: any,
	phase: "call" | "partial" | "done",
	ctx?: { isError?: boolean },
): Component {
	const describe = detailsOf(toolName);
	if (!describe) return new Text("", 0, 0);
	const { command, reason } = describe(args, result, phase, ctx);
	return capsule(theme, COLLAPSED, toolName, command, reason);
}

/**
 * The result row. Empty while collapsed — the call row already drew the
 * capsule, and drawing it again doubled every tool call on screen.
 */
export function capsuleResultRow(
	theme: any,
	toolName: string,
	args: any,
	result: any,
	expanded: boolean,
	partialPhase?: "partial",
	isError?: boolean,
): Component {
	const describe = detailsOf(toolName);
	if (!describe) return new Text("", 0, 0);
	const phase = partialPhase ?? "done";
	const { command, reason } = describe(args, result, phase, { isError });
	return capsuleResult(
		theme,
		toolName,
		command,
		result,
		expanded,
		phase === "done" ? reason : undefined,
		phase === "partial" ? reason : undefined,
	);
}
