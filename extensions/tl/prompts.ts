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
3. When its not trivial new feature task. Create new BDD Feature first.
4. Make focused changes for the task.
5. Run relevant verification.
6. Add tl_note with meaningful progress/test results.
7. Close with tl_close only when done and verified; otherwise use tl_block, tl_pending, tl_cancel, or tl_release as appropriate.`;
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

export function buildTriagePrompt(): string {
	return `Perform a task ledger triage review.

Process:
1. Use tl_list --all to get a full picture of every task in the ledger.
2. For blocked and pending_human tasks, inspect each with tl_show and tl_history to understand why.
3. Identify:
   - Duplicate or overlapping tasks that should be merged or refined.
   - Gaps: behaviours, workflows, or error cases that have zero task coverage.
   - Tasks with unclear or missing scope (vague titles, empty bodies).
   - Tasks with stale priorities or statuses that no longer reflect reality.
   - Blocked tasks that may be unblockable now, or pending_human tasks that need a nudge.
   - Missing dependency links between related tasks.
4. Summarize your findings in a concise report:
   - Top 3-5 issues ranked by impact.
   - A table of every identified concern with the task id, the issue, and a suggested action.
5. Propose concrete follow-up tasks (using tl_create for new work, tl_refine for existing tasks) but do NOT create or edit any tasks yet. Ask me to confirm before making changes.`;
}
