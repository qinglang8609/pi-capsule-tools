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

// Braille spinner shown in place of the arrow while a tool is still running.
const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const SPINNER_INTERVAL_MS = 90;

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
	private head: string;
	private readonly body: string | undefined;
	private cachedWidth: number | undefined;
	private cachedLines: string[] | undefined;

	constructor(head: string, body?: string) {
		this.head = head;
		this.body = body;
	}

	protected setHead(head: string): void {
		if (head === this.head) return;
		this.head = head;
		this.invalidate();
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
/** A capsule is green normally; only a failure turns it red. */
type Tone = "success" | "error";

function capsuleLine(
	theme: any,
	arrow: string,
	toolName: string,
	command: string,
	reason?: string,
	tone: Tone = "success",
): string {
	// A failed call colors only the arrow and the tool name; the command stays
	// green so the red reads as a status mark rather than a wall of color.
	const head = theme.fg(tone === "error" ? "error" : "success", arrow);
	const name = theme.fg(tone === "error" ? "error" : "toolTitle", theme.bold(toolName));
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
	tone: Tone = "success",
): Component {
	return new Capsule(capsuleLine(theme, arrow, toolName, command, reason, tone));
}

/**
 * A capsule that animates while the tool runs: it redraws itself on a timer and
 * advances the spinner one frame per tick.
 *
 * The timer starts lazily on the first render (there is no other hook), and
 * the result row stops it the moment the tool finishes, so redraws only cost
 * anything while a tool is actually running. `invalidate()` is pi's own
 * "redraw this row" hook — it comes from the render context.
 */
export class RunningCapsule extends Capsule {
	private makeLine: (frame: string, tone: Tone) => string;
	private requestRedraw: () => void;
	private timer: ReturnType<typeof setInterval> | undefined;
	private frame = 0;
	private running = true;

	constructor(makeLine: (frame: string, tone: Tone) => string, requestRedraw: () => void) {
		super(makeLine(SPINNER[0]!, "success"));
		this.makeLine = makeLine;
		this.requestRedraw = requestRedraw;
	}

	/**
	 * Re-point a live capsule at the current theme/args and redraw hook. Pi
	 * re-runs renderCall on every redraw, so this is how one capsule survives the
	 * whole call instead of a new timer being born on each frame.
	 */
	update(makeLine: (frame: string, tone: Tone) => string, ctx?: { invalidate?: () => void }): void {
		this.makeLine = makeLine;
		if (ctx?.invalidate) this.requestRedraw = () => ctx.invalidate?.();
		this.setHead(this.makeLine(this.running ? this.frameText() : COLLAPSED, "success"));
	}

	override render(width: number): string[] {
		// Only a live call animates — a stopped row must not restart the timer.
		if (this.running && this.timer === undefined) this.start();
		return super.render(width);
	}

	/**
	 * Stop the timer and repaint for the outcome: the arrow returns (a frozen
	 * spinner glyph reads as "still thinking"), colored red when the tool failed.
	 * Safe to call repeatedly.
	 */
	stop(failed = false): void {
		if (!this.running) return;
		this.running = false;
		if (this.timer !== undefined) clearInterval(this.timer);
		this.timer = undefined;
		this.setHead(this.makeLine(COLLAPSED, failed ? "error" : "success"));
	}

	private start(): void {
		this.timer = setInterval(() => {
			this.frame++;
			this.setHead(this.makeLine(this.frameText(), "success"));
			this.requestRedraw();
		}, SPINNER_INTERVAL_MS);
		// Node keeps a timer alive; an unref'd timer cannot hold the process open
		// if the session ends while a tool is still running.
		this.timer.unref?.();
	}

	private frameText(): string {
		return SPINNER[this.frame % SPINNER.length]!;
	}
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
			renderCall(args: any, theme: any, ctx: any) {
				const describe = detailsOf(toolName)!;
				const { command, reason } = describe(args, undefined, "call");
				const makeLine = (frame: string, tone: Tone) =>
					capsuleLine(theme, frame, toolName, command, reason, tone);

				// Pi's updateDisplay() re-runs renderCall on EVERY redraw and replaces
				// whatever it returns. Returning a fresh capsule each time would spawn
				// a new timer per frame — and because our own tick calls invalidate(),
				// that is a self-feeding loop that snowballs (measured: 64 live timers
				// and climbing within 600ms). Reuse the live component, exactly like
				// pi's own renderers do with `context.lastComponent`.
				const previous = ctx?.lastComponent;
				if (previous instanceof RunningCapsule) {
					previous.update(makeLine, ctx);
					return previous;
				}

				// HTML export passes a no-op invalidate; the result row stops the timer
				// either way (see renderResult).
				const row = new RunningCapsule(makeLine, () => ctx?.invalidate?.());
				if (ctx?.state) ctx.state.capsule = row;
				return row;
			},
			renderResult(result: any, { expanded, isPartial }: any, theme: any, ctx: any) {
				const row = capsuleResultRow(
					theme,
					toolName,
					ctx.args,
					result,
					expanded,
					isPartial ? "partial" : undefined,
					ctx.isError,
				);
				// The call row owns the spinner; the result row ends it. HTML export
				// always reports isPartial:false, so this also stops the export's timer
				// — an unstopped one would spin forever with nothing left to render.
				settleRunningRow(ctx?.state?.capsule, {
					isError: ctx.isError,
					expanded,
					settled: !isPartial || ctx.isError,
				});
				return row;
			},
		};
	});
}

// --- row builders ---------------------------------------------------------
// Exported so rows-check.ts asserts against the same code the resolver uses.

/**
 * The animated `⠋ tool command` line for a call that is still running.
 *
 * `invalidate` comes from the render context (pi's per-row redraw hook). It is
 * optional so the exported row builders stay callable from tests.
 */
export function runningRow(
	theme: any,
	toolName: string,
	command: string,
	reason: string | undefined,
	ctx?: { invalidate?: () => void; isError?: boolean },
): Component {
	if (ctx?.isError) return capsule(theme, COLLAPSED, toolName, command, reason, "error");
	const invalidate = ctx?.invalidate;
	if (!invalidate) return capsule(theme, COLLAPSED, toolName, command, reason, "success");
	return new RunningCapsule(
		(frame, tone) => capsuleLine(theme, frame, toolName, command, reason, tone),
		invalidate,
	);
}

/**
 * Stop an animated call row once its result has arrived. A failure repaints the
 * arrow and tool name red; a success keeps the frame it already shows so the
 * line does not jump.
 *
 * `settled` mirrors pi's own bash renderer: a completed result or an error ends
 * the work, even if `isPartial` is still set. Expanded rows are left alone — the
 * open output matters more than the color.
 */
export function settleRunningRow(
	last: any,
	opts: { isError?: boolean; expanded?: boolean; settled?: boolean },
): void {
	if (opts.expanded) return;
	if (opts.settled === false) return;
	if (last instanceof RunningCapsule) last.stop(Boolean(opts.isError));
}

/** The `▸ tool command` line drawn when the call starts. */
export function capsuleCallRow(
	theme: any,
	toolName: string,
	args: any,
	result: any,
	phase: "call" | "partial" | "done",
	ctx?: { isError?: boolean; invalidate?: () => void },
): Component {
	const describe = detailsOf(toolName);
	if (!describe) return new Text("", 0, 0);
	const { command, reason } = describe(args, result, phase, ctx);
	// Only a live call animates; a settled row keeps a fixed arrow.
	if (phase === "call" || phase === "partial") {
		return runningRow(theme, toolName, command, reason, ctx);
	}
	return capsule(theme, COLLAPSED, toolName, command, reason, ctx?.isError ? "error" : "success");
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
