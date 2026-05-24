import type { BoardSelection } from "./board.js";

export type TaskWorkflowAction = "Start implementation" | "Refine task" | "Review task" | "Plan only";

export function workflowActionForBoardSelection(action: BoardSelection["action"]): TaskWorkflowAction {
	if (action === "implement") return "Start implementation";
	if (action === "refine") return "Refine task";
	if (action === "review") return "Review task";
	return "Plan only";
}

export function buildTaskWorkflowPrompt(id: string, action: TaskWorkflowAction): string {
	if (action === "Start implementation") {
		return `Implement task ${id}.

Workflow:
1. Inspect context with tl_show ${id} and tl_history ${id}.
2. Claim the task with tl_claim before editing.
3. Make focused changes for the task.
4. Run relevant verification.
5. Add tl_note with meaningful progress/test results.
6. Close with tl_close only when done and verified; otherwise use tl_block, tl_pending, tl_cancel, or tl_release as appropriate.`;
	}

	if (action === "Refine task") {
		return `Refine task ${id}.

Review tl_show ${id} and tl_history ${id}. Improve title/body/priority/type/tags if useful. Present proposed refinements first if anything is ambiguous; then use tl_refine for accepted changes. Do not edit repository files for this action.`;
	}

	if (action === "Review task") {
		return `Review task ${id} for completeness and readiness.

Inspect tl_show ${id} and tl_history ${id}. Look for missing acceptance criteria, blockers, duplicates, unclear scope, or stale context. Summarize findings and recommended next steps. Do not edit files or change the task unless asked.`;
	}

	return `Plan implementation for task ${id}.

Inspect tl_show ${id} and tl_history ${id}. Produce a concise implementation plan, likely files/areas to inspect, risks, and verification steps. Do not claim the task or edit files yet.`;
}

export function buildCapturePrompt(todos: string): string {
	return `Please turn these rough todos into clean tl task ledger tasks.

Process:
1. Review the rough todos below.
2. Deduplicate overlapping items and split unrelated work into separate tasks.
3. Infer clear titles, descriptions, priorities, types, and useful tags.
4. Present the cleaned task list for confirmation before creating tasks if anything is ambiguous or if more than 5 tasks would be created.
5. After confirmation, use tl_create for each task. Do not create tasks silently.

Rough todos:

${todos}`;
}
