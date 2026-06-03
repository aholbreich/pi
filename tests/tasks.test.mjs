import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTlModule } from "./helpers.mjs";

function loadTasks() { return loadTlModule("tasks.ts"); }

// ---------------------------------------------------------------------------
// Theme mocks
// ---------------------------------------------------------------------------

/** Identity theme: raw text passes through unchanged. Good for content assertions. */
const identityTheme = {
	fg: (_color, text) => text,
	bold: (text) => text,
};

/** Marked theme: wraps text with color/bold markers. Good for style assertions. */
const markedTheme = {
	fg: (color, text) => `[${color}]${text}[/${color}]`,
	bold: (text) => `<b>${text}</b>`,
};

// ---------------------------------------------------------------------------
// priorityIcon
// ---------------------------------------------------------------------------

test("priorityIcon returns error for high", () => {
	const { priorityIcon } = loadTasks();
	assert.deepEqual(priorityIcon("high"), { icon: "▲", color: "error" });
});

test("priorityIcon returns warning for medium", () => {
	const { priorityIcon } = loadTasks();
	assert.deepEqual(priorityIcon("medium"), { icon: "▲", color: "warning" });
});

test("priorityIcon returns dim for low", () => {
	const { priorityIcon } = loadTasks();
	assert.deepEqual(priorityIcon("low"), { icon: "▲", color: "dim" });
});

test("priorityIcon is case-insensitive", () => {
	const { priorityIcon } = loadTasks();
	assert.deepEqual(priorityIcon("HIGH"), { icon: "▲", color: "error" });
	assert.deepEqual(priorityIcon("Medium"), { icon: "▲", color: "warning" });
});

test("priorityIcon returns muted for unknown string", () => {
	const { priorityIcon } = loadTasks();
	assert.deepEqual(priorityIcon("critical"), { icon: "▲", color: "muted" });
	assert.deepEqual(priorityIcon(""), { icon: "▲", color: "muted" });
});

test("priorityIcon returns muted for non-string types", () => {
	const { priorityIcon } = loadTasks();
	assert.deepEqual(priorityIcon(null), { icon: "▲", color: "muted" });
	assert.deepEqual(priorityIcon(undefined), { icon: "▲", color: "muted" });
	assert.deepEqual(priorityIcon(5), { icon: "▲", color: "muted" });
	assert.deepEqual(priorityIcon(true), { icon: "▲", color: "muted" });
	assert.deepEqual(priorityIcon({}), { icon: "▲", color: "muted" });
});

// ---------------------------------------------------------------------------
// renderTaskLine — basic structure
// ---------------------------------------------------------------------------

const baseTask = { id: "task-1", title: "Fix login bug", priority: "medium", tags: ["ux", "auth"] };
const baseOptions = {
	sectionIcon: "○",
	task: baseTask,
	primaryColor: "accent",
	width: 80,
};

test("renderTaskLine produces non-empty text", () => {
	const { renderTaskLine } = loadTasks();
	const result = renderTaskLine(identityTheme, baseOptions);
	assert.ok(result.text.length > 0);
	assert.ok(result.visibleLength > 0);
});

test("renderTaskLine includes task id and title", () => {
	const { renderTaskLine } = loadTasks();
	const result = renderTaskLine(identityTheme, baseOptions);
	assert.match(result.text, /task-1/);
	assert.match(result.text, /Fix login bug/);
});

test("renderTaskLine includes section icon", () => {
	const { renderTaskLine } = loadTasks();
	const result = renderTaskLine(identityTheme, { ...baseOptions, sectionIcon: "◐" });
	assert.match(result.text, /◐/);
});

test("renderTaskLine includes section label when provided", () => {
	const { renderTaskLine } = loadTasks();
	const result = renderTaskLine(identityTheme, { ...baseOptions, sectionLabel: "Ready" });
	assert.match(result.text, /Ready/);
});

test("renderTaskLine shows tags when showTags is true", () => {
	const { renderTaskLine } = loadTasks();
	const result = renderTaskLine(identityTheme, { ...baseOptions, showTags: true });
	assert.match(result.text, /#ux/);
	assert.match(result.text, /#auth/);
});

test("renderTaskLine hides tags when showTags is false or omitted", () => {
	const { renderTaskLine } = loadTasks();
	const result = renderTaskLine(identityTheme, { ...baseOptions, showTags: false });
	assert.doesNotMatch(result.text, /#ux/);

	const result2 = renderTaskLine(identityTheme, baseOptions);
	assert.doesNotMatch(result2.text, /#ux/);
});

test("renderTaskLine hides tags when width is too narrow to fit them", () => {
	const { renderTaskLine } = loadTasks();
	// Very narrow width: tags should be dropped to fit id+title
	const result = renderTaskLine(identityTheme, { ...baseOptions, showTags: true, width: 20 });
	assert.doesNotMatch(result.text, /#ux/);
	assert.match(result.text, /task-1/); // id still present
});

test("renderTaskLine includes prefix when provided", () => {
	const { renderTaskLine } = loadTasks();
	const result = renderTaskLine(identityTheme, { ...baseOptions, prefix: "▸ " });
	assert.match(result.text, /▸/);
});

test("renderTaskLine includes leading when provided", () => {
	const { renderTaskLine } = loadTasks();
	const result = renderTaskLine(identityTheme, { ...baseOptions, leading: "├─ " });
	assert.match(result.text, /├─/);
});

// ---------------------------------------------------------------------------
// renderTaskLine — width truncation
// ---------------------------------------------------------------------------

test("renderTaskLine fits within width budget", () => {
	const { renderTaskLine } = loadTasks();
	for (const w of [20, 30, 40, 60, 80, 120]) {
		const result = renderTaskLine(identityTheme, { ...baseOptions, width: w, showTags: true });
		assert.ok(result.visibleLength <= w, `visibleLength ${result.visibleLength} > width ${w}`);
	}
});

test("renderTaskLine truncates long title with ellipsis", () => {
	const { renderTaskLine } = loadTasks();
	const longTask = { ...baseTask, title: "A".repeat(200) };
	const result = renderTaskLine(identityTheme, { ...baseOptions, task: longTask, width: 40, showTags: false });
	assert.ok(result.text.includes("…"), "expected ellipsis in truncated title");
	assert.ok(result.visibleLength <= 40);
});

test("renderTaskLine handles minimum width of 1", () => {
	const { renderTaskLine } = loadTasks();
	const result = renderTaskLine(identityTheme, { ...baseOptions, width: 1, showTags: false });
	// At width=1 the title budget is clamped to 1, but prefix + id + icon
	// alone exceed 1, so visibleLength will be > 1. The function never crashes.
	assert.ok(result.text.length >= 1);
	assert.ok(result.visibleLength > 1, "minimum width=1 still renders full id + icon");
});

test("renderTaskLine preserves id even when title is truncated to empty", () => {
	const { renderTaskLine } = loadTasks();
	const result = renderTaskLine(identityTheme, { ...baseOptions, width: 10, showTags: false });
	assert.match(result.text, /task-1/);
});

// ---------------------------------------------------------------------------
// renderTaskLine — missing fields
// ---------------------------------------------------------------------------

test("renderTaskLine uses 'unknown' for missing id", () => {
	const { renderTaskLine } = loadTasks();
	const task = { title: "No ID" };
	const result = renderTaskLine(identityTheme, { ...baseOptions, task, showTags: false });
	assert.match(result.text, /unknown/);
});

test("renderTaskLine uses '(untitled)' for missing title", () => {
	const { renderTaskLine } = loadTasks();
	const task = { id: "t1" };
	const result = renderTaskLine(identityTheme, { ...baseOptions, task, showTags: false });
	assert.match(result.text, /\(untitled\)/);
});

test("renderTaskLine handles null title gracefully", () => {
	const { renderTaskLine } = loadTasks();
	const task = { id: "t2", title: null };
	const result = renderTaskLine(identityTheme, { ...baseOptions, task, showTags: false });
	assert.match(result.text, /\(untitled\)/);
});

test("renderTaskLine handles non-string id gracefully", () => {
	const { renderTaskLine } = loadTasks();
	const task = { id: 42, title: "Numeric ID" };
	const result = renderTaskLine(identityTheme, { ...baseOptions, task, showTags: false });
	assert.match(result.text, /unknown/);
});

test("renderTaskLine handles missing tags gracefully", () => {
	const { renderTaskLine } = loadTasks();
	const task = { id: "t3", title: "No tags" };
	const result = renderTaskLine(identityTheme, { ...baseOptions, task, showTags: true });
	assert.doesNotMatch(result.text, /#/);
});

test("renderTaskLine handles non-array tags gracefully", () => {
	const { renderTaskLine } = loadTasks();
	const task = { id: "t4", title: "Bad tags", tags: "not-an-array" };
	const result = renderTaskLine(identityTheme, { ...baseOptions, task, showTags: true });
	assert.doesNotMatch(result.text, /#/);
});

// ---------------------------------------------------------------------------
// renderTaskLine — selection / styling
// ---------------------------------------------------------------------------

test("renderTaskLine applies primaryColor to id and title text", () => {
	const { renderTaskLine } = loadTasks();
	const result = renderTaskLine(markedTheme, { ...baseOptions, showTags: false });
	assert.match(result.text, /\[accent\]/);
	assert.match(result.text, /task-1/);
	assert.match(result.text, /Fix login bug/);
});

test("renderTaskLine applies prefixColor to prefix", () => {
	const { renderTaskLine } = loadTasks();
	const result = renderTaskLine(markedTheme, { ...baseOptions, prefix: "▸ ", prefixColor: "dim" });
	assert.match(result.text, /\[dim\]▸ /);
});

test("renderTaskLine applies priority color to priority icon", () => {
	const { renderTaskLine } = loadTasks();
	// medium → warning
	const result = renderTaskLine(markedTheme, { ...baseOptions, showTags: false });
	assert.match(result.text, /\[warning\]▲/);
});

test("renderTaskLine applies tagColor to tags", () => {
	const { renderTaskLine } = loadTasks();
	const result = renderTaskLine(markedTheme, { ...baseOptions, showTags: true, tagColor: "dim" });
	// Tags are wrapped: [dim] #ux #auth[/dim]
	assert.match(result.text, /\[dim\].*#ux.*#auth.*\[\/dim\]/);
});

test("renderTaskLine applies bold when selected", () => {
	const { renderTaskLine } = loadTasks();
	const result = renderTaskLine(markedTheme, { ...baseOptions, selected: true, showTags: false });
	assert.match(result.text, /<b>/);
	assert.match(result.text, /task-1/);
});

test("renderTaskLine does not apply bold when not selected", () => {
	const { renderTaskLine } = loadTasks();
	const result = renderTaskLine(markedTheme, { ...baseOptions, selected: false, showTags: false });
	assert.doesNotMatch(result.text, /<b>/);
});

// ---------------------------------------------------------------------------
// tasksFromJson
// ---------------------------------------------------------------------------

test("tasksFromJson parses valid JSON array", () => {
	const { tasksFromJson } = loadTasks();
	const result = tasksFromJson([{ id: "t1", title: "Task 1" }, { id: "t2", title: "Task 2" }]);
	assert.equal(result.length, 2);
	assert.equal(result[0].id, "t1");
	assert.equal(result[1].title, "Task 2");
});

test("tasksFromJson returns empty array for non-array input", () => {
	const { tasksFromJson } = loadTasks();
	assert.deepEqual(tasksFromJson(null), []);
	assert.deepEqual(tasksFromJson(undefined), []);
	assert.deepEqual(tasksFromJson({}), []);
	assert.deepEqual(tasksFromJson("not-an-array"), []);
	assert.deepEqual(tasksFromJson(42), []);
	assert.deepEqual(tasksFromJson(true), []);
});

test("tasksFromJson returns empty array for empty array", () => {
	const { tasksFromJson } = loadTasks();
	assert.deepEqual(tasksFromJson([]), []);
});

test("tasksFromJson preserves tasks with missing fields", () => {
	const { tasksFromJson } = loadTasks();
	const result = tasksFromJson([{ id: "t1" }, { title: "Only title" }, {}]);
	assert.equal(result.length, 3);
	assert.equal(result[0].id, "t1");
	assert.equal(result[0].title, undefined);
	assert.equal(result[1].id, undefined);
	assert.equal(result[1].title, "Only title");
});
