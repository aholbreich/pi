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

test("renders the compact action legend below the first ready task only", () => {
	const lines = render({ ...EMPTY, ready: [task("t1", "First ready"), task("t2", "Second ready")] });
	const joined = lines.join("\n");
	assert.match(joined, /Alt: i implement · r refine · p plan/);
	assert.doesNotMatch(joined, /\[Alt\+i\]Impl/);
	// Legend appears once (right after t1, not again after t2).
	const legendIndex = lines.findIndex((line) => line.includes("Alt: i implement"));
	assert.ok(legendIndex > 0);
	assert.match(lines[legendIndex - 1], /t1/);
	assert.equal(lines.filter((line) => line.includes("Alt: i implement")).length, 1);
});

test("does not render the action legend when there are no ready tasks", () => {
	const lines = render({ ...EMPTY, inProgress: [task("t1", "Active task")] });
	assert.doesNotMatch(lines.join("\n"), /Alt: i implement/);
});

test("screenshot layout nests actions beneath the first Ready task, not Pending or the next Ready", () => {
	const lines = render({
		...EMPTY,
		pendingHuman: [task("task-pjt", "Plan tree feature support")],
		ready: [task("task-ccv", "Human review"), task("task-ll9", "Layout testing")],
	});
	assert.deepEqual(lines.slice(1), [
		"├─ ? task-pjt ▲ Plan tree feature support",
		"├─ ○ task-ccv ▲ Human review",
		"│    ↳ Alt: i implement · r refine · p plan",
		"└─ ○ task-ll9 ▲ Layout testing",
	]);
});

test("the legend follows the complete wrapped target without claiming the last task branch", () => {
	const title = "Review all task actions and their complete end-to-end behavior including keyboard shortcuts";
	const lines = render({ ...EMPTY, ready: [task("t1", title)] }, 55);
	const legendIndex = lines.findIndex((line) => line.includes("Alt:"));
	assert.ok(legendIndex > 2, "fixture must wrap the target title");
	assert.match(lines[1], /^└─ ○ t1/);
	assert.equal(lines.slice(1, legendIndex).map((line) => line.slice(10).trim()).join(" "), title);
	assert.match(lines[legendIndex], /^     ↳ Alt:/);
	assert.ok(lines.every((line) => line.length <= 55));
});

test("the legend keeps a connector when a later section or overflow entry follows", () => {
	const lines = render({
		...EMPTY,
		ready: [task("t1", "Review")],
		stale: Array.from({ length: 4 }, (_, i) => task(`s${i}`, "Expired claim")),
	});
	assert.equal(lines[2], "│    ↳ Alt: i implement · r refine · p plan");
	assert.match(lines.at(-1), /^└─ 1 more stale$/);
});

test("a legend at the line limit is nested and does not leave a dangling outer connector", () => {
	const lines = render({
		ready: [task("t1", "Review"), task("t2", "Later")],
		inProgress: Array.from({ length: 3 }, (_, i) => task(`a${i}`, "Active")),
		blocked: Array.from({ length: 3 }, (_, i) => task(`b${i}`, "Blocked")),
		pendingHuman: Array.from({ length: 3 }, (_, i) => task(`p${i}`, "Pending")),
		stale: [],
	});
	assert.equal(lines.length, 12);
	assert.match(lines[10], /^└─ ○ t1/);
	assert.equal(lines[11], "     ↳ Alt: i implement · r refine · p plan");
	assert.ok(!lines.some((line) => line.includes("t2")));
});

test("a Ready task hidden by the line limit does not leave an orphan legend", () => {
	const lines = render({
		...EMPTY,
		inProgress: [task("a1", "Review pending implementation work ".repeat(30))],
		ready: [task("t1", "Review")],
	});
	assert.equal(lines.length, 12);
	assert.doesNotMatch(lines.join("\n"), /Alt:|t1/);
});

test("nested legend stays dim and truncates within narrow widths", () => {
	const { renderOverlayLines } = loadOverlay();
	const markedTheme = { ...theme, fg: (color, text) => `<${color}>${text}</${color}>` };
	for (const width of [20, 30, 40, 80]) {
		const lines = renderOverlayLines({ ...EMPTY, ready: [task("t1", "Review")] }, markedTheme, width, renderTaskRow);
		const legend = lines.at(-1);
		assert.match(legend, /^<dim>     ↳ Alt:.*<\/dim>$/);
		const text = legend.replace(/<\/?dim>/g, "");
		assert.ok(text.length <= width);
		if (width < 41) assert.ok(text.endsWith("…"));
	}
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

test("the last task branch closes above its subordinate action legend", () => {
	const lines = render({ ...EMPTY, ready: [task("t1", "Single task")] });
	assert.match(lines[1], /^└─ ○ t1/);
	assert.equal(lines[2], "     ↳ Alt: i implement · r refine · p plan");
	assert.doesNotMatch(lines.join("\n"), /├─/);
});

// ---------------------------------------------------------------------------
// Priority icon
// ---------------------------------------------------------------------------

test("renders priority icon for high priority task", () => {
	const lines = render({ ...EMPTY, ready: [task("t1", "Critical task", "high")] });
	assert.match(lines.join("\n"), /▲/);
});
