import type { ExtensionAPI, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import { runTl } from "./cli.js";
import { renderTaskLine, tasksFromJson, type TaskSummary, type TaskVisualColor } from "./tasks.js";

const BOARD_MAX_VISIBLE_TASKS = 14;

// Arrow key escape sequences across terminal protocols:
// - Legacy CSI:   \x1b[A  / \x1b[B
// - SS3:          \x1bOA  / \x1bOB
// - Kitty CSI-u:  \x1b[1;<mod>A / \x1b[1;<mod>B  (mod=1 is no modifier)
// - Kitty CSI-u with event type: \x1b[1;<mod>:<event>A/B
const ARROW_UP_RE = /^\x1b\[A$|^\x1bOA$|^\x1b\[1;\d+(?::\d+)?A$/;
const ARROW_DOWN_RE = /^\x1b\[B$|^\x1bOB$|^\x1b\[1;\d+(?::\d+)?B$/;

function isArrowUp(data: string): boolean { return ARROW_UP_RE.test(data); }
function isArrowDown(data: string): boolean { return ARROW_DOWN_RE.test(data); }

type BoardAction = "implement" | "refine" | "review" | "plan";
type BoardMode = "list" | "details";
type BoardViewMode = "focused" | "all";

export type BoardSelection = {
	action: BoardAction;
	id: string;
};

type BoardEntry = {
	kind: "task";
	section: string;
	icon: string;
	id: string;
	task: TaskSummary;
};

type BoardSection = {
	label: string;
	icon: string;
	args: string[];
	tasks: TaskSummary[];
};

type BoardTui = { requestRender(): void };

type PanelColor = TaskVisualColor;

export async function openTaskLedgerBoard(pi: ExtensionAPI, ctx: ExtensionContext): Promise<BoardSelection | undefined> {
	const sections = await loadBoardSections(pi, ctx);
	const entries = sections.flatMap((section) => section.tasks.map((task) => taskEntry(section, task))).filter((entry): entry is BoardEntry => entry !== undefined);
	if (entries.length === 0) {
		ctx.ui.notify("No ready, in-progress, blocked, pending, or stale task ledger tasks found.", "info");
		return undefined;
	}

	const loadDetails = async (id: string): Promise<string> => {
		const run = await runTl(pi, ctx, ["show", id], { color: "never" });
		return run.stdout.trim() || run.stderr.trim() || `tl show ${id} exited with ${run.exitCode}`;
	};

	return ctx.ui.custom<BoardSelection | undefined>(
		(tui, theme, _keybindings, done) => new TaskLedgerBoardComponent(tui, theme, sections, loadDetails, done, async (action, id) => {
			if (action === "cancel") {
				const confirmed = await ctx.ui.confirm("Cancel task?", `Cancel ${id}? This will mark the task as cancelled.`);
				if (!confirmed) return false;
				const reason = await ctx.ui.input("Reason for cancellation", "cancelled from board");
				const run = await runTl(pi, ctx, ["cancel", id, "--message", reason || "cancelled from board"]);
				ctx.ui.notify(run.exitCode === 0 ? `Cancelled ${id}.` : run.stderr.trim() || `Cancel failed`, run.exitCode === 0 ? "info" : "error");
				return run.exitCode === 0;
			}
			const confirmed = await ctx.ui.confirm("Remove task?", `Remove ${id}? This cannot be undone.`);
			if (!confirmed) return false;
			const run = await runTl(pi, ctx, ["remove", id]);
			ctx.ui.notify(run.exitCode === 0 ? `Removed ${id}.` : run.stderr.trim() || `Remove failed`, run.exitCode === 0 ? "info" : "error");
			return run.exitCode === 0;
		}),
		{
			overlay: true,
			overlayOptions: {
				width: "85%",
				maxHeight: "80%",
				anchor: "center",
				margin: 2,
			},
		},
	);
}

async function loadBoardSections(pi: ExtensionAPI, ctx: ExtensionContext): Promise<BoardSection[]> {
	const definitions: Array<Omit<BoardSection, "tasks">> = [
		{ label: "Ready", icon: "○", args: ["ready", "--json"] },
		{ label: "In progress", icon: "◐", args: ["list", "--status", "in_progress", "--json"] },
		{ label: "Blocked", icon: "▲", args: ["list", "--status", "blocked", "--json"] },
		{ label: "Pending human", icon: "?", args: ["list", "--status", "pending_human", "--json"] },
		{ label: "Stale claims", icon: "◇", args: ["stale", "--json"] },
		{ label: "Done", icon: "✓", args: ["list", "--status", "done", "--json"] },
		{ label: "Cancelled", icon: "✗", args: ["list", "--status", "cancelled", "--json"] },
	];

	return Promise.all(
		definitions.map(async (definition) => {
			const run = await runTl(pi, ctx, definition.args, { parseJson: true });
			return { ...definition, tasks: run.exitCode === 0 ? tasksFromJson(run.json) : [] };
		}),
	);
}

function taskEntry(section: BoardSection, task: TaskSummary): BoardEntry | undefined {
	const id = typeof task.id === "string" ? task.id : undefined;
	if (!id) return undefined;
	return { kind: "task", section: section.label, icon: section.icon, id, task };
}

class TaskLedgerBoardComponent {
	private readonly focusedEntries: BoardEntry[];
	private readonly allEntries: BoardEntry[];
	private selectedTaskIndex = 0;
	private scrollOffset = 0;
	private mode: BoardMode = "list";
	private viewMode: BoardViewMode = "focused";
	private detailsTaskId: string | undefined;
	private detailsText: string | undefined;
	private detailsLoading = false;

	constructor(
		private readonly tui: BoardTui,
		private readonly theme: Theme,
		sections: BoardSection[],
		private readonly loadDetails: (id: string) => Promise<string>,
		private readonly done: (result: BoardSelection | undefined) => void,
		private readonly onLifecycle?: (action: "cancel" | "remove", id: string) => Promise<boolean>,
	) {
		this.focusedEntries = sections
			.slice(0, 5)
			.flatMap((section) =>
				section.tasks.map((task) => taskEntry(section, task)).filter((e): e is BoardEntry => e !== undefined),
			);
		this.allEntries = sections.flatMap((section) =>
			section.tasks.map((task) => taskEntry(section, task)).filter((e): e is BoardEntry => e !== undefined),
		);
	}

	render(width: number): string[] {
		const selected = this.selectedEntry();
		const title = `Task Ledger Board${selected ? ` - ${selected.id}` : ""}`;
		const toggleHint = this.viewMode === "all" ? "a focused view" : "a show all";
		const helpText = this.mode === "details"
			? `b/esc back • c cancel • x remove • i implement • r refine • v review • p plan • q close`
			: `↑/k ↓/j navigate • enter/d details • ${toggleHint} • i implement • r refine • v review • p plan • esc/q close`;
		const lines = [
			this.borderTop(width),
			this.panelLine(width, title, "accent", true),
			this.panelLine(width, helpText, "dim"),
			this.separatorLine(width),
		];

		if (this.mode === "details") {
			lines.push(...this.renderDetails(width));
		} else {
			lines.push(...this.renderList(width));
		}
		lines.push(this.borderBottom(width));
		return lines;
	}

	handleInput(data: string): void {
		if (data === "q") {
			this.done(undefined);
			return;
		}
		if (data === "\u001b") {
			if (this.mode === "details") this.backToList();
			else this.done(undefined);
			return;
		}
		if (this.mode === "details" && data === "b") {
			this.backToList();
			return;
		}
		if (this.mode === "details" && data === "c") {
			void this.runLifecycle("cancel");
			return;
		}
		if (this.mode === "details" && data === "x") {
			void this.runLifecycle("remove");
			return;
		}
		if (this.mode === "list" && data === "a") {
			this.toggleViewMode();
			return;
		}
		if (this.mode === "list" && (isArrowUp(data) || data === "k")) {
			this.move(-1);
			return;
		}
		if (this.mode === "list" && (isArrowDown(data) || data === "j")) {
			this.move(1);
			return;
		}
		if (data === "\r" || data === "\n" || data === "d") {
			void this.showDetails();
			return;
		}
		if (data === "i") this.finish("implement");
		if (data === "r") this.finish("refine");
		if (data === "v") this.finish("review");
		if (data === "p") this.finish("plan");
	}

	invalidate(): void {}

	private move(delta: number): void {
		const total = this.taskEntries().length;
		this.selectedTaskIndex = Math.max(0, Math.min(total - 1, this.selectedTaskIndex + delta));
		this.clampScroll();
		this.tui.requestRender();
	}

	private async showDetails(): Promise<void> {
		const selected = this.selectedEntry();
		if (!selected) return;
		this.mode = "details";
		this.detailsTaskId = selected.id;
		this.detailsLoading = true;
		this.detailsText = "Loading task details…";
		this.tui.requestRender();

		try {
			const text = await this.loadDetails(selected.id);
			if (this.detailsTaskId !== selected.id) return;
			this.detailsText = text;
		} catch (error) {
			this.detailsText = error instanceof Error ? error.message : String(error);
		} finally {
			if (this.detailsTaskId === selected.id) this.detailsLoading = false;
			this.tui.requestRender();
		}
	}

	private backToList(): void {
		this.mode = "list";
		this.detailsTaskId = undefined;
		this.detailsText = undefined;
		this.detailsLoading = false;
		this.tui.requestRender();
	}

	private finish(action: BoardAction): void {
		const selected = this.selectedEntry();
		if (!selected) return;
		this.done({ action, id: selected.id });
	}

	private selectedEntry(): BoardEntry | undefined {
		return this.taskEntries()[this.selectedTaskIndex];
	}

	private renderList(width: number): string[] {
		this.clampScroll();
		const selected = this.selectedEntry();
		const lines: string[] = [];
		for (const entry of this.visibleTaskEntries()) {
			const isSelected = entry.id === selected?.id;
			const pointer = isSelected ? "▶" : " ";
			const color = isSelected ? "accent" : this.colorForSection(entry.section);
			const innerWidth = Math.max(0, width - 4);
			const row = renderTaskLine(this.theme, {
				leading: `${pointer} `,
				sectionIcon: entry.icon,
				task: entry.task,
				primaryColor: color,
				width: innerWidth,
				showTags: true,
				tagColor: "muted",
				selected: isSelected,
			});
			lines.push(this.panelStyledLine(width, row.text, row.visibleLength));
		}

		const total = this.taskEntries().length;
		if (total > BOARD_MAX_VISIBLE_TASKS) {
			const end = Math.min(total, this.scrollOffset + BOARD_MAX_VISIBLE_TASKS);
			lines.push(this.panelLine(width, `Showing ${this.scrollOffset + 1}-${end} of ${total}`, "dim"));
		}
		return lines;
	}

	private renderDetails(width: number): string[] {
		const selected = this.selectedEntry();
		const header = "Task details";
		let headerLine: string;
		if (selected) {
			const row = renderTaskLine(this.theme, {
				sectionIcon: selected.icon,
				task: selected.task,
				primaryColor: "accent",
				width: Math.max(0, width - 4),
				showTags: true,
				tagColor: "muted",
				selected: true,
			});
			headerLine = this.panelStyledLine(width, row.text, row.visibleLength);
		} else {
			headerLine = this.panelLine(width, header, "accent", true);
		}
		const lines: string[] = [headerLine];
		const detailLines = (this.detailsText ?? "").split(/\r?\n/).slice(0, 18);
		for (const line of detailLines) lines.push(this.panelLine(width, this.detailsLoading ? line : line, this.detailsLoading ? "warning" : "text"));
		return lines;
	}

	private visibleTaskEntries(): BoardEntry[] {
		return this.taskEntries().slice(this.scrollOffset, this.scrollOffset + BOARD_MAX_VISIBLE_TASKS);
	}

	private taskEntries(): BoardEntry[] {
		return this.viewMode === "all" ? this.allEntries : this.focusedEntries;
	}

	private toggleViewMode(): void {
		this.viewMode = this.viewMode === "focused" ? "all" : "focused";
		this.selectedTaskIndex = 0;
		this.scrollOffset = 0;
		this.tui.requestRender();
	}

	private async runLifecycle(action: "cancel" | "remove"): Promise<void> {
		if (!this.onLifecycle) return;
		const selected = this.selectedEntry();
		if (!selected) return;
		const ok = await this.onLifecycle(action, selected.id);
		if (ok) this.backToList();
	}

	private clampScroll(): void {
		if (this.selectedTaskIndex < this.scrollOffset) this.scrollOffset = this.selectedTaskIndex;
		if (this.selectedTaskIndex >= this.scrollOffset + BOARD_MAX_VISIBLE_TASKS) {
			this.scrollOffset = this.selectedTaskIndex - BOARD_MAX_VISIBLE_TASKS + 1;
		}
	}

	private colorForSection(section: string): PanelColor {
		if (section === "Ready") return "accent";
		if (section === "In progress") return "success";
		if (section === "Blocked") return "error";
		if (section === "Pending human" || section === "Stale claims") return "warning";
		if (section === "Done" || section === "Cancelled") return "dim";
		return "muted";
	}

	private panelLine(fullWidth: number, text: string, color: PanelColor, selected = false): string {
		const innerWidth = Math.max(0, fullWidth - 4); // 2 chars left ("│ ") + 2 chars right (" │")
		const fitted = this.fitPlain(innerWidth, text);
		const inner = selected ? this.theme.bold(fitted) : fitted;
		return this.panelStyledLine(fullWidth, this.theme.fg(color, inner), fitted.length);
	}

	private panelStyledLine(fullWidth: number, styledInner: string, visibleLength: number): string {
		const innerWidth = Math.max(0, fullWidth - 4); // 2 chars left ("│ ") + 2 chars right (" │")
		const padLen = Math.max(0, innerWidth - visibleLength);
		const left = this.theme.fg("borderMuted", "│");
		const right = this.theme.fg("borderMuted", "│");
		return this.theme.bg("customMessageBg", `${left} ${styledInner}${" ".repeat(padLen)} ${right}`);
	}

	private borderTop(width: number): string {
		return this.theme.bg("customMessageBg", this.theme.fg("borderMuted", `┌${"─".repeat(Math.max(0, width - 2))}┐`));
	}

	private borderBottom(width: number): string {
		return this.theme.bg("customMessageBg", this.theme.fg("borderMuted", `└${"─".repeat(Math.max(0, width - 2))}┘`));
	}

	private separatorLine(width: number): string {
		return this.theme.bg("customMessageBg", this.theme.fg("borderMuted", `├${"─".repeat(Math.max(0, width - 2))}┤`));
	}


	private fitPlain(width: number, text: string): string {
		if (text.length <= width) return text;
		if (width <= 1) return "…";
		return `${text.slice(0, width - 1)}…`;
	}
}
