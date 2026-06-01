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
1. Inspect context with tl show ${id} and tl history ${id}.
2. Claim the task with tl claim ${id} before editing.
3. When it's not a trivial new feature task, create a new BDD feature first.
4. Make focused changes for the task.
5. Run relevant verification.
6. Add tl note ${id} -m "..." with meaningful progress/test results.
7. Close with tl close ${id} only when done and verified; otherwise use tl block, tl pending, tl cancel, or tl release as appropriate.`;
	}

	if (action === "Refine task") {
		return `Refine task ${id}.

Review tl show ${id} and tl history ${id}. Improve title/body/priority/type/tags if useful. Present proposed refinements first if anything is ambiguous; then use tl refine for accepted changes. Do not edit repository files for this action.`;
	}

	if (action === "Review task") {
		return `Review task ${id} for completeness and readiness.

Inspect tl show ${id} and tl history ${id}. Look for missing acceptance criteria, blockers, duplicates, unclear scope, or stale context. Summarize findings and recommended next steps. Do not edit files or change the task unless asked.`;
	}

	return `Plan implementation for task ${id}.

Inspect tl show ${id} and tl history ${id}. Produce a concise implementation plan, likely files/areas to inspect, risks, and verification steps. Do not claim the task or edit files yet.`;
}

export function buildCapturePrompt(todos: string): string {
	return `Please turn these rough todos into clean tl task ledger tasks.

Process:
1. Review the rough todos below.
2. Deduplicate overlapping items and split unrelated work into separate tasks.
3. Infer clear titles, descriptions, priorities, types, and useful tags. 
4. Present the cleaned task list for confirmation before creating tasks if anything is ambiguous or if more than 5 tasks would be created.
5. After confirmation, use tl create for one task or tl_bulk_create for an approved batch. Do not create tasks silently.

Rough todos:

${todos}`;
}

export function buildTriagePrompt(): string {
	return `Perform a task ledger triage review.

Process:
1. Use tl list --all to get a full picture of every task in the ledger.
2. For blocked and pending_human tasks, inspect each with tl show and tl history to understand why.
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
5. Propose concrete follow-up tasks (using tl create for new work, tl refine for existing tasks, or tl_bulk_create for an approved batch) but do NOT create or edit any tasks yet. Ask me to confirm before making changes.`;
}
