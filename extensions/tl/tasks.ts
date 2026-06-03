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

export type RenderedLine = { text: string; visibleLength: number };

/**
 * Render a task row structurally instead of splitting a preformatted label.
 * Returns one or more lines — long titles wrap to continuation lines instead
 * of being truncated with an ellipsis.
 *
 * First line shape: "<prefix><icon> <id> <prio> <title-start> [#tags]".
 * Continuation line shape: "<indent><title-continuation>".
 * Tags are only shown when the full title fits on one line.
 */
export function renderTaskLine(theme: TaskLineTheme, options: RenderTaskLineOptions): RenderedLine[] {
	const id = typeof options.task.id === "string" ? options.task.id : "unknown";
	const title = typeof options.task.title === "string" ? options.task.title : "(untitled)";
	const tags = options.showTags && Array.isArray(options.task.tags) && options.task.tags.length > 0 ? ` #${options.task.tags.join(" #")}` : "";
	const { icon: priIcon, color: priColor } = priorityIcon(options.task.priority);

	const prefix = options.prefix ?? "";
	const leading = options.leading ?? "";
	const sectionLabel = options.sectionLabel ? ` ${options.sectionLabel}:` : "";
	const beforePriority = `${leading}${options.sectionIcon}${sectionLabel} ${id} `;
	const usedWithoutTitle = prefix.length + beforePriority.length + priIcon.length + 1;

	const style = (color: TaskVisualColor, text: string): string => theme.fg(color, options.selected ? theme.bold(text) : text);

	// Build the styled prefix portion shared by the first line.
	const firstPrefix =
		style(options.prefixColor ?? "dim", prefix) +
		style(options.primaryColor, beforePriority) +
		style(priColor, priIcon) +
		style(options.primaryColor, " ");

	// Indent for continuation lines: visible spaces to align with title start.
	const contIndent = " ".repeat(usedWithoutTitle);
	const contIndentStyled = style(options.primaryColor, contIndent);

	// Does the whole entry (title + tags) fit on one line?
	const fullWidth = usedWithoutTitle + title.length + tags.length;
	if (fullWidth <= options.width) {
		return [{
			text: firstPrefix + style(options.primaryColor, title) + style(options.tagColor ?? "muted", tags),
			visibleLength: usedWithoutTitle + title.length + tags.length,
		}];
	}

	// Title wraps — split into chunks, drop tags.
	const firstBudget = Math.max(1, options.width - usedWithoutTitle);
	const contBudget = Math.max(1, options.width - usedWithoutTitle);
	const chunks = wrapText(title, firstBudget, contBudget);

	return chunks.map((chunk, i) =>
		i === 0
			? { text: firstPrefix + style(options.primaryColor, chunk), visibleLength: usedWithoutTitle + chunk.length }
			: { text: contIndentStyled + style(options.primaryColor, chunk), visibleLength: usedWithoutTitle + chunk.length },
	);
}

/** Split text at word boundaries into chunks that fit the given budgets. */
function wrapText(text: string, firstBudget: number, contBudget: number): string[] {
	const chunks: string[] = [];
	let remaining = text;
	let isFirst = true;

	while (remaining.length > 0) {
		const budget = isFirst ? firstBudget : contBudget;
		if (remaining.length <= budget) {
			chunks.push(remaining);
			break;
		}

		// Prefer breaking at a word boundary (space) within the budget.
		let breakAt = budget;
		for (let i = budget; i > Math.max(0, budget - 20); i--) {
			if (remaining[i] === " ") {
				breakAt = i;
				break;
			}
		}

		chunks.push(remaining.slice(0, breakAt).trimEnd());
		remaining = remaining.slice(breakAt).trimStart();
		isFirst = false;
	}

	return chunks;
}

export function tasksFromJson(json: unknown): TaskSummary[] {
	return Array.isArray(json) ? (json as TaskSummary[]) : [];
}
