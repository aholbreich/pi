import type { ExtensionAPI, ExtensionContext, ExtensionUIContext, Theme } from "@earendil-works/pi-coding-agent";
import { getTlVersion, isTlAvailable, isTlVersionCompatible, runTl } from "./cli.js";
import { hasLedger } from "./ledger.js";
import { renderTaskLine, tasksFromJson, type RenderedLine, type TaskSummary } from "./tasks.js";

const TL_OVERLAY_WIDGET_KEY = "pi-tl-overlay";
const MAX_OVERLAY_LINES = 12;
const MAX_TASKS_PER_SECTION = 3;
const READY_ACTION_LEGEND = "Alt: i implement · r refine · p plan";

type TuiHandle = { requestRender(): void };
type OverlayColor = "accent" | "success" | "warning" | "error" | "muted" | "dim";

type OverlaySection = {
	label: string;
	icon: string;
	color: OverlayColor;
	tasks: TaskSummary[];
};

type OverlaySnapshot = {
	ready: TaskSummary[];
	inProgress: TaskSummary[];
	blocked: TaskSummary[];
	pendingHuman: TaskSummary[];
	stale: TaskSummary[];
	error?: string;
};

const EMPTY_SNAPSHOT: OverlaySnapshot = {
	ready: [],
	inProgress: [],
	blocked: [],
	pendingHuman: [],
	stale: [],
};
const FALLBACK_VERSION_LABEL = "tl";

type VersionState =
	| { kind: "not-found" }
	| { kind: "incompatible"; version: string | null }
	| { kind: "compatible"; version: string };

/**
 * Persistent Task Ledger summary shown above the editor.
 *
 * This intentionally keeps tl as the repository source of truth. Unlike a
 * session-local todo tool, each refresh shells out to `tl --json`, caches a
 * compact snapshot, and asks Pi to re-render the widget.
 */
export class TaskLedgerOverlay {
	private uiCtx: ExtensionUIContext | undefined;
	private widgetRegistered = false;
	private tui: TuiHandle | undefined;
	private snapshot: OverlaySnapshot = EMPTY_SNAPSHOT;
	private versionState: VersionState | undefined;
	// Incrementing serial that cancels stale async refreshes.
	// Each refresh() bumps this; the loadSnapshot callback checks it
	// after the await so a newer refresh won't be overwritten.
	private refreshSerial = 0;
	private hidden = false;

	constructor(private readonly pi: ExtensionAPI) {}

	/**
	 * Update the stored UI context. Called on every refresh and toggle.
	 * When the context changes (e.g., session restart), resets the widget
	 * registration so the next updateWidget call re-registers from scratch.
	 */
	setContext(ctx: Pick<ExtensionContext, "cwd"> & { ui: ExtensionUIContext }): void {
		if (ctx.ui !== this.uiCtx) {
			this.uiCtx = ctx.ui;
			this.widgetRegistered = false;
			this.tui = undefined;
		}
	}

	/**
	 * Main refresh entry point. Called after session events and successful
	 * tl tool executions. Loads fresh snapshot data, updates the footer
	 * status line, and re-renders the widget unless hidden.
	 */
	async refresh(ctx: Pick<ExtensionContext, "cwd" | "signal" | "hasUI"> & { ui: ExtensionUIContext }): Promise<void> {
		if (!ctx.hasUI) return;
		this.setContext(ctx);

		const state = await this.ensureVersionState(ctx);

		if (state.kind === "not-found") {
			this.snapshot = EMPTY_SNAPSHOT;
			this.uiCtx?.setStatus("pi-tl", this.uiCtx.theme.fg("error", "tl: not found"));
			this.hide();
			return;
		}

		if (state.kind === "incompatible") {
			this.snapshot = EMPTY_SNAPSHOT;
			this.uiCtx?.setStatus("pi-tl", this.uiCtx.theme.fg("warning", `${this.stateLabel()}: incompatible`));
			this.hide();
			return;
		}

		if (!hasLedger(ctx)) {
			this.snapshot = EMPTY_SNAPSHOT;
			this.uiCtx?.setStatus("pi-tl", this.uiCtx.theme.fg("dim", `${this.stateLabel()}: no ledger`));
			this.hide();
			return;
		}

		const serial = ++this.refreshSerial;
		const next = await this.loadSnapshot(ctx);
		if (serial !== this.refreshSerial) return;

		this.snapshot = next;
		this.updateStatus();
		if (this.hidden) {
			this.hide();
			return;
		}
		this.updateWidget();
	}

	/**
	 * Toggle the overlay visibility. Hidden state survives refreshes within
	 * a session. When shown, performs a full refresh to pick up current data.
	 */
	async toggle(ctx: Pick<ExtensionContext, "cwd" | "signal" | "hasUI"> & { ui: ExtensionUIContext }): Promise<void> {
		this.setContext(ctx);
		this.hidden = !this.hidden;
		if (this.hidden) {
			this.hide();
			ctx.ui.notify("Task Ledger overlay hidden", "info");
			return;
		}

		await this.refresh(ctx);
		ctx.ui.notify("Task Ledger overlay shown", "info");
	}

	dispose(): void {
		this.hide();
		this.uiCtx = undefined;
	}

	firstReadyTaskId(): string | undefined {
		const task = this.snapshot.ready.find((entry) => typeof entry.id === "string");
		return typeof task?.id === "string" ? task.id : undefined;
	}

	private async ensureVersionState(ctx: Pick<ExtensionContext, "cwd" | "signal">): Promise<VersionState> {
		if (this.versionState) return this.versionState;
		const available = await isTlAvailable(this.pi, ctx);
		if (!available) {
			this.versionState = { kind: "not-found" };
			return this.versionState;
		}
		const version = await getTlVersion(this.pi, ctx);
		const compatible = version !== null && isTlVersionCompatible(version);
		this.versionState = compatible
			? { kind: "compatible", version }
			: { kind: "incompatible", version };
		return this.versionState;
	}

	private stateLabel(): string {
		const state = this.versionState;
		if (!state || state.kind === "not-found") return FALLBACK_VERSION_LABEL;
		return state.version ? `tl ${state.version}` : FALLBACK_VERSION_LABEL;
	}

	private async loadSnapshot(ctx: Pick<ExtensionContext, "cwd" | "signal">): Promise<OverlaySnapshot> {
		try {
			const [ready, inProgress, blocked, pendingHuman, stale] = await Promise.all([
				this.listTasks(ctx, ["ready", "--json"]),
				this.listTasks(ctx, ["list", "--status", "in_progress", "--json"]),
				this.listTasks(ctx, ["list", "--status", "blocked", "--json"]),
				this.listTasks(ctx, ["list", "--status", "pending_human", "--json"]),
				this.listTasks(ctx, ["stale", "--json"]),
			]);

			return { ready, inProgress, blocked, pendingHuman, stale };
		} catch (error) {
			return { ...EMPTY_SNAPSHOT, error: error instanceof Error ? error.message : String(error) };
		}
	}

	private async listTasks(ctx: Pick<ExtensionContext, "cwd" | "signal">, args: string[]): Promise<TaskSummary[]> {
		const run = await runTl(this.pi, ctx, args, { parseJson: true, timeoutMs: 10_000 });
		if (run.exitCode !== 0) throw new Error(run.stderr.trim() || run.stdout.trim() || `${args[0]} failed with exit code ${run.exitCode}`);
		return tasksFromJson(run.json);
	}

	private updateStatus(): void {
		if (!this.uiCtx) return;
		const label = this.stateLabel();
		if (!this.hasVisibleContent()) {
			this.uiCtx.setStatus("pi-tl", this.uiCtx.theme.fg("dim", `${label}: 0r`));
			return;
		}
		if (this.snapshot.error) {
			this.uiCtx.setStatus("pi-tl", this.uiCtx.theme.fg("error", `${label}: !`));
			return;
		}

		const parts: string[] = [];
		if (this.snapshot.ready.length > 0) parts.push(this.uiCtx.theme.fg("accent", `○${this.snapshot.ready.length}`));
		if (this.snapshot.inProgress.length > 0) parts.push(this.uiCtx.theme.fg("success", `◐${this.snapshot.inProgress.length}`));
		if (this.snapshot.blocked.length > 0) parts.push(this.uiCtx.theme.fg("error", `▲${this.snapshot.blocked.length}`));
		if (this.snapshot.pendingHuman.length > 0) parts.push(this.uiCtx.theme.fg("warning", `?${this.snapshot.pendingHuman.length}`));
		if (this.snapshot.stale.length > 0) parts.push(this.uiCtx.theme.fg("warning", `◇${this.snapshot.stale.length}`));
		this.uiCtx.setStatus("pi-tl", `${this.uiCtx.theme.fg("success", `${label}:`)} ${parts.join(" ")}`);
	}

	private updateWidget(): void {
		if (!this.uiCtx) return;
		if (!this.hasVisibleContent()) {
			this.hide();
			return;
		}

		if (!this.widgetRegistered) {
			this.uiCtx.setWidget(
				TL_OVERLAY_WIDGET_KEY,
				(tui: TuiHandle, theme: Theme) => {
					this.tui = tui;
					return {
						render: (width: number) => this.render(theme, width),
						invalidate: () => {},
					};
				},
				{ placement: "aboveEditor" },
			);
			this.widgetRegistered = true;
			return;
		}

		this.tui?.requestRender();
	}

	private hide(): void {
		if (this.uiCtx) this.uiCtx.setWidget(TL_OVERLAY_WIDGET_KEY, undefined);
		this.widgetRegistered = false;
		this.tui = undefined;
	}

	private hasVisibleContent(): boolean {
		return Boolean(
			this.snapshot.error ||
				this.snapshot.ready.length > 0 ||
				this.snapshot.inProgress.length > 0 ||
				this.snapshot.blocked.length > 0 ||
				this.snapshot.pendingHuman.length > 0 ||
				this.snapshot.stale.length > 0,
		);
	}

	/**
	 * Render the passive overlay as an array of styled lines.
	 *
	 * Produces a header line with a section breakdown, then up to
	 * MAX_OVERLAY_LINES of task rows per section (capped at
	 * MAX_TASKS_PER_SECTION each), with overflow "N more …" indicators.
	 * The final visible task/overflow branch uses └─ for visual closure;
	 * the action legend is a subordinate line beneath its target task.
	 *
	 * @param theme  Pi theme for color styling
	 * @param width  Available terminal width in characters
	 */
	private render(theme: Theme, width: number): string[] {
		return renderOverlayLines(this.snapshot, theme, width, (section, task, w) =>
			this.renderTaskLine(theme, w, section, task),
		);
	}

	/**
	 * Format a single task row: "├─ <icon> <id> <priIcon> <title>".
	 * The section icon + id + title use the section color; only the priority
	 * icon gets its own distinct color (error/warning/dim). Truncates the
	 * title to fit within the available width.
	 */
	private renderTaskLine(theme: Theme, width: number, section: OverlaySection, task: TaskSummary): RenderedLine[] {
		return renderTaskLine(theme, {
			prefix: "├─ ",
			prefixColor: "dim",
			sectionIcon: section.icon,
			task,
			primaryColor: section.color,
			width,
		});
	}

	private sections(): OverlaySection[] {
		return overlaySections(this.snapshot);
	}
}

/**
 * Standalone render function — testable without instantiating TaskLedgerOverlay.
 * Used by TaskLedgerOverlay.render() and by unit tests directly.
 */
export function renderOverlayLines(
	snapshot: OverlaySnapshot,
	theme: Theme,
	width: number,
	renderTaskRow: (section: OverlaySection, task: TaskSummary, w: number) => RenderedLine[],
): string[] {
	if (snapshot.error) {
		return [
			fitStyled(theme, width, "error", "▲", `Task Ledger: ${snapshot.error}`),
		];
	}

	const sections = overlaySections(snapshot).filter((section) => section.tasks.length > 0);
	const total = sections.reduce((sum, section) => sum + section.tasks.length, 0);
	if (total === 0) return [];

	const summary = sections.map((section) => `${section.tasks.length} ${section.label.toLowerCase()}`).join(" · ");
	const lines = [fitStyled(theme, width, "accent", "●", `Task Ledger  ${summary}`)];

	let readyLegendShown = false;
	let legendIndex: number | undefined;
	let lastBranchIndex: number | undefined;
	for (const section of sections) {
		const visible = section.tasks.slice(0, MAX_TASKS_PER_SECTION);
		for (const task of visible) {
			if (lines.length >= MAX_OVERLAY_LINES) break;
			const rows = renderTaskRow(section, task, width);
			if (rows.length > 0) lastBranchIndex = lines.length;
			for (const row of rows) {
				if (lines.length >= MAX_OVERLAY_LINES) break;
				lines.push(row.text);
			}
			// Reserve a subordinate line after the target's complete wrapped title.
			// Its outer connector depends on whether another branch fits below it.
			if (section.label === "Ready" && !readyLegendShown) {
				if (rows.length > 0 && lines.length < MAX_OVERLAY_LINES) {
					legendIndex = lines.length;
					lines.push("");
				}
				readyLegendShown = true;
			}
		}
		const remaining = section.tasks.length - visible.length;
		if (remaining > 0 && lines.length < MAX_OVERLAY_LINES) {
			lastBranchIndex = lines.length;
			lines.push(fitStyled(theme, width, "dim", "├─", `${remaining} more ${section.label.toLowerCase()}`));
		}
		if (lines.length >= MAX_OVERLAY_LINES) break;
	}

	if (lastBranchIndex !== undefined) {
		lines[lastBranchIndex] = lines[lastBranchIndex].replace("├─", "└─");
	}
	if (legendIndex !== undefined) {
		const continued = lastBranchIndex !== undefined && lastBranchIndex > legendIndex;
		const prefix = continued ? "│    ↳ " : "     ↳ ";
		lines[legendIndex] = theme.fg("dim", truncateText(prefix + READY_ACTION_LEGEND, width));
	}
	return lines;
}

function overlaySections(snapshot: OverlaySnapshot): OverlaySection[] {
	return [
		{ label: "Active", icon: "◐", color: "success", tasks: snapshot.inProgress },
		{ label: "Blocked", icon: "▲", color: "error", tasks: snapshot.blocked },
		{ label: "Pending", icon: "?", color: "warning", tasks: snapshot.pendingHuman },
		{ label: "Ready", icon: "○", color: "accent", tasks: snapshot.ready },
		{ label: "Stale", icon: "◇", color: "warning", tasks: snapshot.stale },
	];
}

function fitStyled(theme: Theme, width: number, color: OverlayColor, prefix: string, text: string): string {
	const visiblePrefix = `${prefix} `;
	const budget = Math.max(1, width - visiblePrefix.length);
	return `${theme.fg("dim", prefix)} ${theme.fg(color, truncateText(text, budget))}`;
}


function truncateText(text: string, width: number): string {
	if (width <= 0) return "";
	if (text.length <= width) return text;
	if (width === 1) return "…";
	return `${text.slice(0, width - 1)}…`;
}
