export type TaskSummary = {
	id?: unknown;
	title?: unknown;
	status?: unknown;
	priority?: unknown;
	tags?: unknown;
};

/**
 * Convert one task object from `tl ready --json` into a compact label for the
 * interactive picker. The `unknown` checks keep us safe if tl changes output.
 */
export function taskLabel(task: TaskSummary): string {
	const id = typeof task.id === "string" ? task.id : "unknown";
	const priority = typeof task.priority === "string" ? task.priority : "?";
	const status = typeof task.status === "string" ? task.status : "?";
	const title = typeof task.title === "string" ? task.title : "(untitled)";
	const tags = Array.isArray(task.tags) && task.tags.length > 0 ? ` #${task.tags.join(" #")}` : "";
	return `${id} [${priority}/${status}] ${title}${tags}`;
}

export function tasksFromJson(json: unknown): TaskSummary[] {
	return Array.isArray(json) ? (json as TaskSummary[]) : [];
}
