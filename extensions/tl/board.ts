import type { ExtensionAPI, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import { runTl } from "./cli.js";
import { isArrowUp, isArrowDown, isEscape, isEnter } from "./keys.js";
import { renderTaskLine, tasksFromJson, type TaskSummary, type TaskVisualColor } from "./tasks.js";

const BOARD_MAX_VISIBLE_TASKS = 8;
const BOARD_OVERLAY_WIDTH = 80;

type BoardAction = "implement" | "refine" | "review" | "plan" | "cancel" | "remove";
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

export async function openTaskLedgerBoard(pi: ExtensionAPI, ctx: ExtensionContext, execCtx?: Pick<ExtensionContext, "cwd" | "signal">): Promise<BoardSelection | undefined> {
	const sections = await loadBoardSections(pi, execCtx ?? ctx);
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
				width: BOARD_OVERLAY_WIDTH,
				maxHeight: "80%",
				anchor: "center",
			},
		},
	);
}

async function loadBoardSections(pi: ExtensionAPI, ctx: Pick<ExtensionContext, "cwd" | "signal">): Promise<BoardSection[]> {
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

export class TaskLedgerBoardComponent {
	private readonly focusedEntries: BoardEntry[];
	private readonly allEntries: BoardEntry[];
	private readonly sections: BoardSection[];
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
	) {
		this.sections = sections;
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
			? `esc/b back • c cancel • x remove • i implement • r refine • v review • p plan`
			: `esc close • ↑/k ↓/j navigate • enter/d details • ${toggleHint} • i implement • r refine • v review • p plan`;
		const lines = [
			this.borderTop(width, title),
			this.emptyLine(width),
			this.summaryLine(width),
			this.emptyLine(width),
			this.separatorLine(width),
		];

		if (this.mode === "details") {
			lines.push(...this.renderDetails(width));
		} else {
			lines.push(...this.renderList(width));
		}
		lines.push(this.separatorLine(width));
		lines.push(this.emptyLine(width));
		lines.push(...this.footerLines(width, helpText));
		lines.push(this.borderBottom(width));
		return lines;
	}

	handleInput(data: string): void {
		if (isEscape(data)) {
			if (this.mode === "details") this.backToList();
			else this.done(undefined);
			return;
		}
		if (data === "q") {
			if (this.mode === "details") this.backToList();
			else this.done(undefined);
			return;
		}
		if (this.mode === "details" && data === "b") {
			this.backToList();
			return;
		}
		if (this.mode === "details" && data === "c") {
			const selected = this.selectedEntry();
			if (selected) this.done({ action: "cancel", id: selected.id });
			return;
		}
		if (this.mode === "details" && data === "x") {
			const selected = this.selectedEntry();
			if (selected) this.done({ action: "remove", id: selected.id });
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
		if (isEnter(data) || data === "d") {
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
			const pointer = isSelected ? "▸" : "·";
			const color = isSelected ? "accent" : this.colorForSection(entry.section);
			const innerWidth = Math.max(0, width - 4);
			const rows = renderTaskLine(this.theme, {
				prefix: `${pointer} `,
				prefixColor: isSelected ? "accent" : "dim",
				sectionIcon: entry.icon,
				task: entry.task,
				primaryColor: color,
				width: innerWidth,
				selected: isSelected,
			});
			for (const row of rows) lines.push(this.panelStyledLine(width, row.text, row.visibleLength));
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
		const lines: string[] = [];
		if (selected) {
			const rows = renderTaskLine(this.theme, {
				sectionIcon: selected.icon,
				task: selected.task,
				primaryColor: "accent",
				width: Math.max(0, width - 4),
				selected: true,
			});
			for (const row of rows) lines.push(this.panelStyledLine(width, row.text, row.visibleLength));
		} else {
			lines.push(this.panelLine(width, header, "accent", true));
		}
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

	private summaryLine(fullWidth: number): string {
		const sections = (this.viewMode === "all" ? this.sections : this.sections.slice(0, 5))
			.map((section) => ({ ...section, count: section.tasks.filter((task) => typeof task.id === "string").length }))
			.filter((section) => section.count > 0);
		if (sections.length === 0) return this.panelLine(fullWidth, "No visible tasks", "dim");

		let visibleLength = 0;
		const rawParts: string[] = [];
		const styledParts: string[] = [];
		for (const section of sections) {
			const raw = `${section.icon} ${section.label} ${section.count}`;
			if (styledParts.length > 0) {
				rawParts.push(" · ");
				styledParts.push(this.theme.fg("dim", " · "));
				visibleLength += 3;
			}
			rawParts.push(raw);
			styledParts.push(this.theme.fg(this.colorForSection(section.label), raw));
			visibleLength += raw.length;
		}

		const innerWidth = Math.max(0, fullWidth - 4);
		if (visibleLength > innerWidth) return this.panelLine(fullWidth, rawParts.join(""), "dim");
		return this.panelStyledLine(fullWidth, styledParts.join(""), visibleLength);
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

	private centerLine(fullWidth: number, styledInner: string, visibleLength: number): string {
		const innerWidth = Math.max(0, fullWidth - 4); // center within the same padded content area as rows
		const padding = Math.max(0, innerWidth - visibleLength);
		const leftPad = Math.floor(padding / 2);
		const rightPad = padding - leftPad;
		const left = this.theme.fg("borderMuted", "│");
		const right = this.theme.fg("borderMuted", "│");
		return this.theme.bg("customMessageBg", `${left} ${" ".repeat(leftPad)}${styledInner}${" ".repeat(rightPad)} ${right}`);
	}

	private footerLines(fullWidth: number, helpText: string): string[] {
		const innerWidth = Math.max(1, fullWidth - 4);
		const parts = helpText.split(" • ");
		const rows: string[] = [];
		let current = "";
		for (const part of parts) {
			const next = current ? `${current} • ${part}` : part;
			if (next.length <= innerWidth || current.length === 0) {
				current = next;
				continue;
			}
			rows.push(current);
			current = part;
		}
		if (current) rows.push(current);
		return rows.map((row) => {
			const fitted = this.fitPlain(innerWidth, row);
			return this.centerLine(fullWidth, this.theme.fg("dim", fitted), fitted.length);
		});
	}

	private emptyLine(width: number): string {
		return this.theme.bg("customMessageBg", `${this.theme.fg("borderMuted", "│")}${" ".repeat(Math.max(0, width - 2))}${this.theme.fg("borderMuted", "│")}`);
	}

	private borderTop(width: number, title: string): string {
		const innerWidth = Math.max(0, width - 2);
		const titleText = this.fitPlain(innerWidth, ` ${title} `);
		const borderLen = Math.max(0, innerWidth - titleText.length);
		const leftLen = Math.floor(borderLen / 2);
		const rightLen = borderLen - leftLen;
		return this.theme.bg(
			"customMessageBg",
			`${this.theme.fg("borderMuted", `╭${"─".repeat(leftLen)}`)}${this.theme.fg("text", this.theme.bold(titleText))}${this.theme.fg("borderMuted", `${"─".repeat(rightLen)}╮`)}`,
		);
	}

	private borderBottom(width: number): string {
		return this.theme.bg("customMessageBg", this.theme.fg("borderMuted", `╰${"─".repeat(Math.max(0, width - 2))}╯`));
	}

	private separatorLine(width: number): string {
		return this.theme.bg("customMessageBg", this.theme.fg("borderMuted", `├${"─".repeat(Math.max(0, width - 2))}┤`));
	}

	private fitPlain(width: number, text: string): string {
		if (width <= 0) return "";
		if (text.length <= width) return text;
		if (width <= 1) return "…";
		return `${text.slice(0, width - 1)}…`;
	}
}
