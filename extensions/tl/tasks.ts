export type TaskSummary = {
	id?: unknown;
	title?: unknown;
	status?: unknown;
	priority?: unknown;
	tags?: unknown;
};

export type TaskVisualColor = "accent" | "borderMuted" | "dim" | "error" | "muted" | "success" | "text" | "warning";

type TaskLineTheme = {
	fg(color: TaskVisualColor, text: string): string;
	bold(text: string): string;
};

export type RenderTaskLineOptions = {
	sectionIcon: string;
	sectionLabel?: string;
	task: TaskSummary;
	primaryColor: TaskVisualColor;
	width: number;
	leading?: string;
	prefix?: string;
	prefixColor?: TaskVisualColor;
	showTags?: boolean;
	tagColor?: TaskVisualColor;
	selected?: boolean;
};

/**
 * Map a task priority string to a visual icon + color pair.
 * Shared by board.ts and task-summary-overlay.ts so both UIs show
 * the same priority indicator shape with color conveying priority.
 */
export function priorityIcon(priority: unknown): { icon: string; color: "error" | "warning" | "dim" | "muted" } {
	if (typeof priority !== "string") return { icon: "▲", color: "muted" };
	const p = priority.toLowerCase();
	if (p === "high") return { icon: "▲", color: "error" };
	if (p === "medium") return { icon: "▲", color: "warning" };
	if (p === "low") return { icon: "▲", color: "dim" };
	return { icon: "▲", color: "muted" };
}

/**
 * Render a task row structurally instead of splitting a preformatted label.
 * Output shape: "<prefix><leading><section-icon> [section:] <id> <prio> <title> [#tags]".
 * Only the priority icon receives the priority color; all other task text uses
 * the section/selection color. The returned visibleLength excludes ANSI/style
 * escape codes and lets framed overlays pad correctly.
 */
export function renderTaskLine(theme: TaskLineTheme, options: RenderTaskLineOptions): { text: string; visibleLength: number } {
	const id = typeof options.task.id === "string" ? options.task.id : "unknown";
	const title = typeof options.task.title === "string" ? options.task.title : "(untitled)";
	const tags = options.showTags && Array.isArray(options.task.tags) && options.task.tags.length > 0 ? ` #${options.task.tags.join(" #")}` : "";
	const { icon: priIcon, color: priColor } = priorityIcon(options.task.priority);

	const prefix = options.prefix ?? "";
	const leading = options.leading ?? "";
	const sectionLabel = options.sectionLabel ? ` ${options.sectionLabel}:` : "";
	const beforePriority = `${leading}${options.sectionIcon}${sectionLabel} ${id} `;
	const afterTitle = tags;
	const usedWithoutTitle = prefix.length + beforePriority.length + priIcon.length + 1;
	const titleBudget = Math.max(1, options.width - usedWithoutTitle - afterTitle.length);
	const fittedTitle = truncateText(title, titleBudget);
	const hasTags = Boolean(tags) && fittedTitle.length === title.length;
	const visibleTags = hasTags ? afterTitle : "";
	const visibleLength = usedWithoutTitle + fittedTitle.length + visibleTags.length;

	const style = (color: TaskVisualColor, text: string): string => theme.fg(color, options.selected ? theme.bold(text) : text);
	return {
		text:
			style(options.prefixColor ?? "dim", prefix) +
			style(options.primaryColor, beforePriority) +
			style(priColor, priIcon) +
			style(options.primaryColor, ` ${fittedTitle}`) +
			style(options.tagColor ?? "muted", visibleTags),
		visibleLength,
	};
}

function truncateText(text: string, width: number): string {
	if (width <= 0) return "";
	if (text.length <= width) return text;
	if (width === 1) return "…";
	return `${text.slice(0, width - 1)}…`;
}

export function tasksFromJson(json: unknown): TaskSummary[] {
	return Array.isArray(json) ? (json as TaskSummary[]) : [];
}
