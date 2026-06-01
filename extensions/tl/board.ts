import type { ExtensionAPI, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import { runTl } from "./cli.js";
import { taskLabel, tasksFromJson, type TaskSummary } from "./tasks.js";

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
		(tui, theme, _keybindings, done) => new TaskLedgerBoardComponent(tui, theme, sections, loadDetails, done),
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
	private readonly entries: BoardEntry[];
	private selectedTaskIndex = 0;
	private scrollOffset = 0;
	private mode: BoardMode = "list";
	private detailsTaskId: string | undefined;
	private detailsText: string | undefined;
	private detailsLoading = false;

	constructor(
		private readonly tui: BoardTui,
		private readonly theme: Theme,
		sections: BoardSection[],
		private readonly loadDetails: (id: string) => Promise<string>,
		private readonly done: (result: BoardSelection | undefined) => void,
	) {
		this.entries = sections.flatMap((section) =>
			section.tasks.map((task) => taskEntry(section, task)).filter((entry): entry is BoardEntry => entry !== undefined),
		);
	}

	render(width: number): string[] {
		const selected = this.selectedEntry();
		const title = `Task Ledger Board${selected ? ` — ${selected.id}` : ""}`;
		const lines = [
			this.panelLine(width, title, "accent", true),
			this.panelLine(width, this.mode === "details" ? "b/esc back • i implement • r refine • v review • p plan • q close" : "↑/k ↓/j navigate • enter/d details • i implement • r refine • v review • p plan • esc/q close", "dim"),
			this.panelLine(width, "─".repeat(Math.max(1, Math.min(width, 80))), "borderMuted"),
		];

		if (this.mode === "details") return [...lines, ...this.renderDetails(width)];
		return [...lines, ...this.renderList(width)];
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
			const label = `${pointer} ${entry.icon} ${entry.section}: ${taskLabel(entry.task)}`;
			lines.push(this.panelLine(width, label, color, isSelected));
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
		const header = selected ? `${selected.icon} ${selected.section}: ${taskLabel(selected.task)}` : "Task details";
		const lines = [this.panelLine(width, header, "accent", true)];
		const detailLines = (this.detailsText ?? "").split(/\r?\n/).slice(0, 18);
		for (const line of detailLines) lines.push(this.panelLine(width, this.detailsLoading ? line : line, this.detailsLoading ? "warning" : "text"));
		return lines;
	}

	private visibleTaskEntries(): BoardEntry[] {
		return this.taskEntries().slice(this.scrollOffset, this.scrollOffset + BOARD_MAX_VISIBLE_TASKS);
	}

	private taskEntries(): BoardEntry[] {
		return this.entries;
	}

	private clampScroll(): void {
		if (this.selectedTaskIndex < this.scrollOffset) this.scrollOffset = this.selectedTaskIndex;
		if (this.selectedTaskIndex >= this.scrollOffset + BOARD_MAX_VISIBLE_TASKS) {
			this.scrollOffset = this.selectedTaskIndex - BOARD_MAX_VISIBLE_TASKS + 1;
		}
	}

	private colorForSection(section: string): "muted" | "success" | "error" | "warning" | "dim" {
		if (section === "In progress") return "success";
		if (section === "Blocked") return "error";
		if (section === "Pending human" || section === "Stale claims") return "warning";
		return "muted";
	}

	private panelLine(width: number, text: string, color: "accent" | "borderMuted" | "dim" | "error" | "muted" | "success" | "text" | "warning", selected = false): string {
		const fitted = this.fitPlain(width, text).padEnd(width, " ");
		const foreground = this.theme.fg(color, selected ? this.theme.bold(fitted) : fitted);
		return this.theme.bg("customMessageBg", foreground);
	}

	private fitPlain(width: number, text: string): string {
		if (text.length <= width) return text;
		if (width <= 1) return "…";
		return `${text.slice(0, width - 1)}…`;
	}
}
