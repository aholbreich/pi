import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTlModule } from "./helpers.mjs";

function loadOverlay() { return loadTlModule("task-summary-overlay.ts"); }

const theme = {
	fg: (_c, t) => t,
	bg: (_c, t) => t,
	bold: (t) => t,
};

function task(id, title, priority = "medium", tags = []) {
	return { id, title, status: "open", priority, tags };
}

/** Minimal task row renderer for tests — mirrors the private renderTaskLine. */
function renderTaskRow(section, task, width) {
	const { renderTaskLine } = loadTlModule("tasks.ts");
	return renderTaskLine(theme, {
		prefix: "├─ ",
		prefixColor: "dim",
		sectionIcon: section.icon,
		task,
		primaryColor: section.color,
		width,
	});
}

function render(snapshot, width = 80) {
	const { renderOverlayLines } = loadOverlay();
	return renderOverlayLines(snapshot, theme, width, renderTaskRow);
}

const EMPTY = { ready: [], inProgress: [], blocked: [], pendingHuman: [], stale: [] };

// ---------------------------------------------------------------------------
// Empty / error state
// ---------------------------------------------------------------------------

test("empty snapshot renders empty array", () => {
	assert.deepEqual(render(EMPTY), []);
});

test("error snapshot renders error message", () => {
	const lines = render({ ...EMPTY, error: "tl command not found" });
	assert.equal(lines.length, 1);
	assert.match(lines[0], /tl command not found/);
});

// ---------------------------------------------------------------------------
// Basic rendering
// ---------------------------------------------------------------------------

test("renders header with task counts", () => {
	const lines = render({
		...EMPTY,
		ready: [task("t1", "Deploy")],
		inProgress: [task("t2", "Fix bug")],
		blocked: [task("t3", "Blocked task")],
	});
	assert.match(lines[0], /Task Ledger/);
	assert.match(lines[0], /1 active/);
	assert.match(lines[0], /1 blocked/);
	assert.match(lines[0], /1 ready/);
});

test("does not show sections with zero tasks in header", () => {
	const lines = render({ ...EMPTY, ready: [task("t1", "Only ready")] });
	assert.match(lines[0], /1 ready/);
	assert.doesNotMatch(lines.join("\n"), /0 active/);
});

test("renders task rows with section icons", () => {
	const lines = render({
		...EMPTY,
		ready: [task("t1", "Deploy")],
		inProgress: [task("t2", "Fix bug")],
	});
	assert.match(lines.join("\n"), /◐/);
	assert.match(lines.join("\n"), /○/);
	assert.match(lines.join("\n"), /t1/);
	assert.match(lines.join("\n"), /t2/);
});

test("renders task title", () => {
	const lines = render({ ...EMPTY, ready: [task("task-abc", "Fix login redirect loop")] });
	assert.match(lines.join("\n"), /Fix login redirect loop/);
});

test("renders Alt+i/Alt+r action hint on first ready task only", () => {
	const lines = render({ ...EMPTY, ready: [task("t1", "First ready"), task("t2", "Second ready")] });
	const joined = lines.join("\n");
	assert.match(joined, /t1.*\[Alt\+i\]Impl \[Alt\+r\]Ref/);
	assert.doesNotMatch(joined, /t2.*\[Alt\+i\]Impl \[Alt\+r\]Ref/);
});

test("does not render Alt+i/Alt+r action hint when there are no ready tasks", () => {
	const lines = render({ ...EMPTY, inProgress: [task("t1", "Active task")] });
	assert.doesNotMatch(lines.join("\n"), /\[Alt\+i\]Impl \[Alt\+r\]Ref/);
});

// ---------------------------------------------------------------------------
// Width variations
// ---------------------------------------------------------------------------

test("renders within width 80", () => {
	const lines = render({
		...EMPTY,
		ready: Array.from({ length: 4 }, (_, i) => task(`t${i}`, `Task ${i}`)),
	}, 80);
	for (const line of lines) {
		assert.ok(line.length <= 80, `line exceeds width 80: "${line}"`);
	}
});

test("renders within width 60", () => {
	const lines = render({
		...EMPTY,
		ready: Array.from({ length: 3 }, (_, i) => task(`t${i}`, `Task number ${i}`)),
		inProgress: [task("t99", "A reasonably long task title for testing")],
	}, 60);
	for (const line of lines) {
		assert.ok(line.length <= 60, `line exceeds width 60: "${line}"`);
	}
});

test("renders within width 40 (narrow terminal)", () => {
	const lines = render({ ...EMPTY, ready: [task("t1", "Deploy staging")] }, 40);
	for (const line of lines) {
		assert.ok(line.length <= 40, `line exceeds width 40: "${line}"`);
	}
	assert.ok(lines.length >= 1);
});

// ---------------------------------------------------------------------------
// Overflow / truncation
// ---------------------------------------------------------------------------

test("caps at MAX_OVERLAY_LINES (12)", () => {
	const tasks = Array.from({ length: 20 }, (_, i) => task(`t${i}`, `Task ${i}`));
	const lines = render({ ...EMPTY, ready: tasks });
	assert.ok(lines.length <= 13, `expected <=13 lines (12+header), got ${lines.length}`);
});

test("shows 'N more' indicator for sections with excess tasks", () => {
	const tasks = Array.from({ length: 6 }, (_, i) => task(`t${i}`, `Task ${i}`));
	const lines = render({ ...EMPTY, ready: tasks });
	assert.match(lines.join("\n"), /3 more/);
});

test("last visible line uses └─ instead of ├─", () => {
	const lines = render({ ...EMPTY, ready: [task("t1", "Single task")] });
	assert.match(lines[lines.length - 1], /└─/);
	assert.doesNotMatch(lines[lines.length - 1], /├─/);
});

// ---------------------------------------------------------------------------
// Priority icon
// ---------------------------------------------------------------------------

test("renders priority icon for high priority task", () => {
	const lines = render({ ...EMPTY, ready: [task("t1", "Critical task", "high")] });
	assert.match(lines.join("\n"), /▲/);
});
