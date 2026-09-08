import assert from "node:assert/strict";
import { test } from "node:test";
import { setImmediate } from "node:timers/promises";
import { loadTlModule } from "./helpers.mjs";

function loadBoard() { return loadTlModule("board.ts"); }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function task(id, overrides = {}) {
	return { id, title: `Task ${id}`, status: "open", priority: "medium", tags: ["test"], ...overrides };
}

function section(label, icon, ids) {
	return { label, icon, args: [], tasks: ids.map((id) => task(id)) };
}

const theme = {
	fg: (_c, t) => t,
	bg: (_c, t) => t,
	bold: (t) => t,
};

function tui() {
	let renders = 0;
	return { requestRender: () => { renders++; }, renders: () => renders };
}

function createComponent({ sections, loadDetails, done }) {
	const t = tui();
	const { TaskLedgerBoardComponent } = loadBoard();
	const c = new TaskLedgerBoardComponent(
		t,
		theme,
		sections,
		loadDetails ?? (async () => "(no details)"),
		done ?? (() => {}),
	);
	// Attach tui for assertion
	c._tui = t;
	return c;
}

/** Collect all rendered lines as a single string for pattern matching. */
function renderLines(component, width = 80) {
	return component.render(width).join("\n");
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

test("board renders title line with 'Task Ledger Board'", () => {
	const c = createComponent({ sections: [section("Ready", "○", ["t1"])] });
	assert.match(renderLines(c), /Task Ledger Board/);
});

test("board renders help line with navigation hints in list mode", () => {
	const c = createComponent({ sections: [section("Ready", "○", ["t1"])] });
	assert.match(renderLines(c), /↑.*↓.*nav/);
});

test("board renders top and bottom borders", () => {
	const c = createComponent({ sections: [section("Ready", "○", ["t1"])] });
	const lines = renderLines(c);
	assert.match(lines, /╭/);
	assert.match(lines, /╰/);
});

test("first task is selected in list mode", () => {
	const c = createComponent({ sections: [section("Ready", "○", ["t1", "t2"])] });
	assert.match(renderLines(c), /▸.*t1/);
});

test("unselected tasks use dot pointer", () => {
	const c = createComponent({ sections: [section("Ready", "○", ["t1", "t2"])] });
	assert.match(renderLines(c), /·.*t2/);
});

// ---------------------------------------------------------------------------
// Navigation — arrow down / j
// ---------------------------------------------------------------------------

test("arrow down moves selection to next task", () => {
	const c = createComponent({ sections: [section("Ready", "○", ["t1", "t2", "t3"])] });
	c.handleInput("\x1b[B"); // legacy CSI down
	const lines = renderLines(c);
	assert.match(lines, /▸.*t2/);
	assert.match(lines, /·.*t1/);
});

test("\"j\" key moves selection to next task", () => {
	const c = createComponent({ sections: [section("Ready", "○", ["t1", "t2"])] });
	c.handleInput("j");
	assert.match(renderLines(c), /▸.*t2/);
});

test("arrow down clamped at last task", () => {
	const c = createComponent({ sections: [section("Ready", "○", ["t1", "t2"])] });
	c.handleInput("\x1b[B");
	c.handleInput("\x1b[B");
	c.handleInput("\x1b[B");
	assert.match(renderLines(c), /▸.*t2/);
});

// ---------------------------------------------------------------------------
// Navigation — arrow up / k
// ---------------------------------------------------------------------------

test("arrow up moves selection to previous task", () => {
	const c = createComponent({ sections: [section("Ready", "○", ["t1", "t2"])] });
	c.handleInput("\x1b[B");
	c.handleInput("\x1b[A");
	assert.match(renderLines(c), /▸.*t1/);
});

test("\"k\" key moves selection to previous task", () => {
	const c = createComponent({ sections: [section("Ready", "○", ["t1", "t2"])] });
	c.handleInput("j");
	c.handleInput("k");
	assert.match(renderLines(c), /▸.*t1/);
});

test("arrow up clamped at first task", () => {
	const c = createComponent({ sections: [section("Ready", "○", ["t1", "t2"])] });
	c.handleInput("\x1b[A");
	assert.match(renderLines(c), /▸.*t1/);
});

// ---------------------------------------------------------------------------
// Scroll behavior
// ---------------------------------------------------------------------------

test("scroll offset tracks selection past visible window", () => {
	// BOARD_MAX_VISIBLE_TASKS = 8, create 10 tasks
	const ids = Array.from({ length: 10 }, (_, i) => `t${i + 1}`);
	const c = createComponent({ sections: [section("Ready", "○", ids)] });
	// Move to task 9 (index 8)
	for (let i = 0; i < 8; i++) c.handleInput("j");
	const lines = renderLines(c);
	assert.match(lines, /Showing 2-9 of 10/);
	assert.match(lines, /▸.*t9/);
});

test("scroll resets when moving back to top", () => {
	const ids = Array.from({ length: 10 }, (_, i) => `t${i + 1}`);
	const c = createComponent({ sections: [section("Ready", "○", ids)] });
	// Move down 8 times: selection at index 8 (t9), scroll shows 2-9
	for (let i = 0; i < 8; i++) c.handleInput("j");
	assert.match(renderLines(c), /Showing 2-9 of 10/);
	assert.match(renderLines(c), /▸.*t9/);
	// Move back up 8 times
	for (let i = 0; i < 8; i++) c.handleInput("k");
	// Back at top: selection=t1, scroll at 0
	assert.match(renderLines(c), /Showing 1-8 of 10/);
	assert.match(renderLines(c), /▸.*t1/);
});

// ---------------------------------------------------------------------------
// Enter / d — open details
// ---------------------------------------------------------------------------

test("Enter key opens details mode", async () => {
	const c = createComponent({ sections: [section("Ready", "○", ["t1"])] });
	c.handleInput("\r");
	await setImmediate();
	// Details mode shows the task row as header (when a task is selected) + loaded content
	assert.match(renderLines(c), /\(no details\)/);
	assert.match(renderLines(c), /esc\/b back/); // details help line
});

test("\"d\" key opens details mode", async () => {
	const c = createComponent({ sections: [section("Ready", "○", ["t1"])] });
	c.handleInput("d");
	await setImmediate();
	assert.match(renderLines(c), /\(no details\)/);
	assert.match(renderLines(c), /esc\/b back/);
});

test("details mode shows loading state initially", () => {
	const c = createComponent({ sections: [section("Ready", "○", ["t1"])] });
	c.handleInput("\r");
	assert.match(renderLines(c), /Loading task details/);
});

test("details mode shows loaded content after async resolve", async () => {
	let resolveLoad;
	const loadDetails = () => new Promise((r) => { resolveLoad = r; });
	const c = createComponent({ sections: [section("Ready", "○", ["t1"])], loadDetails });
	c.handleInput("\r");
	// still loading
	assert.match(renderLines(c), /Loading/);
	// resolve
	resolveLoad("t1 full details here");
	await setImmediate();
	assert.match(renderLines(c), /t1 full details here/);
});

test("details mode help line shows back and lifecycle hints", async () => {
	const c = createComponent({ sections: [section("Ready", "○", ["t1"])] });
	c.handleInput("\r");
	await setImmediate();
	const lines = renderLines(c);
	assert.match(lines, /back/);
	assert.match(lines, /cancel/);
	assert.match(lines, /remove/);
});

// ---------------------------------------------------------------------------
// Details mode scrolling
// ---------------------------------------------------------------------------

function longDetails(lineCount = 40) {
	return Array.from({ length: lineCount }, (_, i) => `DETAIL-LINE-${i + 1}`).join("\n");
}

test("long details are clipped with a position indicator", async () => {
	const c = createComponent({ sections: [section("Ready", "○", ["t1"])], loadDetails: async () => longDetails() });
	c.handleInput("\r");
	await setImmediate();
	const lines = renderLines(c);
	assert.match(lines, /DETAIL-LINE-1/);
	assert.doesNotMatch(lines, /DETAIL-LINE-40/);
	assert.match(lines, /Showing 1-18 of 40 lines/);
});

test("\"j\" scrolls long details down", async () => {
	const c = createComponent({ sections: [section("Ready", "○", ["t1"])], loadDetails: async () => longDetails() });
	c.handleInput("\r");
	await setImmediate();
	c.handleInput("j");
	const lines = renderLines(c);
	assert.match(lines, /DETAIL-LINE-19/);
	assert.match(lines, /Showing 2-19 of 40 lines/);
});

test("arrow down scrolls long details down", async () => {
	const c = createComponent({ sections: [section("Ready", "○", ["t1"])], loadDetails: async () => longDetails() });
	c.handleInput("\r");
	await setImmediate();
	c.handleInput("\x1b[B");
	const lines = renderLines(c);
	assert.match(lines, /DETAIL-LINE-19/);
	assert.match(lines, /Showing 2-19 of 40 lines/);
});

test("\"k\" and arrow up scroll back toward the top", async () => {
	const c = createComponent({ sections: [section("Ready", "○", ["t1"])], loadDetails: async () => longDetails() });
	c.handleInput("\r");
	await setImmediate();
	c.handleInput("j");
	c.handleInput("j");
	c.handleInput("k");
	assert.match(renderLines(c), /Showing 2-19 of 40 lines/);
	c.handleInput("\x1b[A");
	assert.match(renderLines(c), /Showing 1-18 of 40 lines/);
});

test("details scroll clamps at the last line", async () => {
	const c = createComponent({ sections: [section("Ready", "○", ["t1"])], loadDetails: async () => longDetails() });
	c.handleInput("\r");
	await setImmediate();
	for (let i = 0; i < 100; i++) c.handleInput("j");
	const lines = renderLines(c);
	assert.match(lines, /DETAIL-LINE-40/);
	assert.match(lines, /Showing 23-40 of 40 lines/);
});

test("short details show no scroll indicator", async () => {
	const c = createComponent({ sections: [section("Ready", "○", ["t1"])], loadDetails: async () => "short details" });
	c.handleInput("\r");
	await setImmediate();
	const lines = renderLines(c);
	assert.match(lines, /short details/);
	assert.doesNotMatch(lines, /Showing \d+-\d+ of \d+ lines/);
});

// ---------------------------------------------------------------------------
// Escape — back to list / close
// ---------------------------------------------------------------------------

test("Escape in list mode calls done with undefined", () => {
	let result = "not-called";
	const c = createComponent({
		sections: [section("Ready", "○", ["t1"])],
		done: (r) => { result = r; },
	});
	c.handleInput("\x1b");
	assert.equal(result, undefined);
});

test("Escape in details mode returns to list", async () => {
	let result = "not-called";
	const c = createComponent({
		sections: [section("Ready", "○", ["t1"])],
		done: (r) => { result = r; },
	});
	c.handleInput("\r");
	await setImmediate();
	c.handleInput("\x1b");
	assert.match(renderLines(c), /↑.*↓.*nav/); // back in list mode
	assert.equal(result, "not-called"); // done was NOT called
});

// ---------------------------------------------------------------------------
// q — back to list / close
// ---------------------------------------------------------------------------

test("\"q\" in list mode calls done with undefined", () => {
	let result = "not-called";
	const c = createComponent({
		sections: [section("Ready", "○", ["t1"])],
		done: (r) => { result = r; },
	});
	c.handleInput("q");
	assert.equal(result, undefined);
});

test("\"q\" in details mode returns to list, does not close", async () => {
	let result = "not-called";
	const c = createComponent({
		sections: [section("Ready", "○", ["t1"])],
		done: (r) => { result = r; },
	});
	c.handleInput("\r");
	await setImmediate();
	c.handleInput("q");
	assert.match(renderLines(c), /↑.*↓.*nav/);
	assert.equal(result, "not-called");
});

// ---------------------------------------------------------------------------
// b — back to list (details only)
// ---------------------------------------------------------------------------

test("\"b\" in details mode returns to list", async () => {
	const c = createComponent({ sections: [section("Ready", "○", ["t1"])] });
	c.handleInput("\r");
	await setImmediate();
	c.handleInput("b");
	assert.match(renderLines(c), /↑.*↓.*nav/);
});

test("\"b\" in list mode has no effect", () => {
	let result = "not-called";
	const c = createComponent({
		sections: [section("Ready", "○", ["t1"])],
		done: (r) => { result = r; },
	});
	c.handleInput("b");
	assert.equal(result, "not-called");
	assert.match(renderLines(c), /↑.*↓.*nav/);
});

// ---------------------------------------------------------------------------
// Mode toggle — a
// ---------------------------------------------------------------------------

test("\"a\" toggles from focused to all-mode", () => {
	const c = createComponent({
		sections: [
			section("Ready", "○", ["t1", "t3"]),
			section("Done", "✓", ["t2"]),
		],
	});
	c.handleInput("a");
	assert.match(renderLines(c), /a[ ]+focused/); // help line: a → toggle to focused
	assert.match(renderLines(c), /✓/); // Done section icon visible
});

test("\"a\" toggles back from all-mode to focused", () => {
	const c = createComponent({
		sections: [
			section("Ready", "○", ["t1", "t3"]),
			section("Done", "✓", ["t2"]),
		],
	});
	c.handleInput("a");
	c.handleInput("a");
	assert.match(renderLines(c), /a show all/); // help line indicates focused mode
});

test("mode toggle resets selection to first task", () => {
	const c = createComponent({
		sections: [
			section("Ready", "○", ["t1", "t2", "t3"]),
			section("Done", "✓", ["t4"]),
		],
	});
	// Select t2
	c.handleInput("j");
	assert.match(renderLines(c), /▸.*t2/);
	// Toggle to all-mode
	c.handleInput("a");
	assert.match(renderLines(c), /▸.*t1/); // reset to first
});

// ---------------------------------------------------------------------------
// Action dispatch — i, r, v, p
// ---------------------------------------------------------------------------

test("\"i\" dispatches implement action for selected task", () => {
	let selection;
	const c = createComponent({
		sections: [section("Ready", "○", ["task-abc"])],
		done: (r) => { selection = r; },
	});
	c.handleInput("i");
	assert.deepEqual(selection, { action: "implement", id: "task-abc" });
});

test("\"r\" dispatches refine action", () => {
	let selection;
	const c = createComponent({
		sections: [section("Ready", "○", ["task-xyz"])],
		done: (r) => { selection = r; },
	});
	c.handleInput("r");
	assert.deepEqual(selection, { action: "refine", id: "task-xyz" });
});

test("\"v\" dispatches review action", () => {
	let selection;
	const c = createComponent({
		sections: [section("Ready", "○", ["task-1"])],
		done: (r) => { selection = r; },
	});
	c.handleInput("v");
	assert.deepEqual(selection, { action: "review", id: "task-1" });
});

test("\"p\" dispatches plan action", () => {
	let selection;
	const c = createComponent({
		sections: [section("Ready", "○", ["task-2"])],
		done: (r) => { selection = r; },
	});
	c.handleInput("p");
	assert.deepEqual(selection, { action: "plan", id: "task-2" });
});

test("action dispatches the currently selected task after navigation", () => {
	let selection;
	const c = createComponent({
		sections: [section("Ready", "○", ["t1", "t2", "t3"])],
		done: (r) => { selection = r; },
	});
	c.handleInput("j"); // select t2
	c.handleInput("j"); // select t3
	c.handleInput("i");
	assert.deepEqual(selection, { action: "implement", id: "t3" });
});

// ---------------------------------------------------------------------------
// Details mode lifecycle — cancel / remove in details view
// ---------------------------------------------------------------------------

test("\"c\" in details dispatches cancel action via done", async () => {
	let selection;
	const c = createComponent({
		sections: [section("Ready", "○", ["t1"])],
		done: (r) => { selection = r; },
	});
	c.handleInput("\r");
	await setImmediate();
	c.handleInput("c");
	assert.deepEqual(selection, { action: "cancel", id: "t1" });
});

test("\"x\" in details dispatches remove action via done", async () => {
	let selection;
	const c = createComponent({
		sections: [section("Ready", "○", ["t1"])],
		done: (r) => { selection = r; },
	});
	c.handleInput("\r");
	await setImmediate();
	c.handleInput("x");
	assert.deepEqual(selection, { action: "remove", id: "t1" });
});

test("\"c\" and \"x\" have no effect in list mode", () => {
	let selection;
	const c = createComponent({
		sections: [section("Ready", "○", ["t1"])],
		done: (r) => { selection = r; },
	});
	c.handleInput("c");
	c.handleInput("x");
	assert.equal(selection, undefined);
});

// ---------------------------------------------------------------------------
// All-mode shows Done/Cancelled sections
// ---------------------------------------------------------------------------

test("focused view includes waiting and stale sections but excludes closed tasks", () => {
	// Filtering is by section meaning, not a fixed number of sections.
	const c = createComponent({
		sections: [
			section("Ready", "○", ["t1"]),
			section("Waiting", "◌", ["t8"]),
			section("In progress", "◐", ["t2"]),
			section("Blocked", "▲", ["t3"]),
			section("Pending human", "?", ["t4"]),
			section("Stale claims", "◇", ["t5"]),
			section("Done", "✓", ["t6"]),
			section("Cancelled", "✗", ["t7"]),
		],
	});
	assert.match(renderLines(c), /◌.*t8/);
	assert.match(renderLines(c), /◇.*t5/);
	assert.doesNotMatch(renderLines(c), /✓.*t6/);
	assert.doesNotMatch(renderLines(c), /✗.*t7/);
	// Toggle to all-mode
	c.handleInput("a");
	assert.match(renderLines(c), /✓.*t6/);
	assert.match(renderLines(c), /✗.*t7/);
});

// ---------------------------------------------------------------------------
// Empty sections
// ---------------------------------------------------------------------------

test("board with no tasks renders empty state gracefully", () => {
	const c = createComponent({ sections: [] });
	assert.match(renderLines(c), /Task Ledger Board/);
	assert.match(renderLines(c), /No visible tasks/);
});

test("board with section that has zero tasks renders empty state", () => {
	const c = createComponent({ sections: [section("Ready", "○", [])] });
	assert.match(renderLines(c), /No visible tasks/);
});

// ---------------------------------------------------------------------------
// Narrow terminal widths
// ---------------------------------------------------------------------------

test("render at width 60 does not exceed line width", () => {
	const c = createComponent({ sections: [section("Ready", "○", ["t1", "t2"])] });
	const lines = c.render(60);
	for (const line of lines) {
		assert.ok(line.length <= 60, `line exceeds width 60: ${line.length} chars`);
	}
});

test("render at width 60 still shows selected task pointer", () => {
	const c = createComponent({ sections: [section("Ready", "○", ["t1", "t2"])] });
	const lines = c.render(60).join("\n");
	assert.match(lines, /▸/);
	assert.match(lines, /t1/);
});

test("render at width 40 does not exceed line width", () => {
	const c = createComponent({ sections: [section("Ready", "○", ["t1"])] });
	const lines = c.render(40);
	for (const line of lines) {
		assert.ok(line.length <= 40, `line exceeds width 40: ${line.length} chars`);
	}
});

test("render at width 40 still shows borders and title", () => {
	const c = createComponent({ sections: [section("Ready", "○", ["t1"])] });
	const lines = c.render(40).join("\n");
	assert.match(lines, /╭/);
	assert.match(lines, /╰/);
	assert.match(lines, /Task Ledger Board/);
});

test("long title wraps instead of truncating at narrow width", () => {
	const ids = ["task-with-very-long-id"];
	const c = createComponent({
		sections: [section("Ready", "○", ids)],
	});
	const lines = c.render(50).join("\n");
	// Task ID appears verbatim; title wraps to multiple lines without ellipsis.
	assert.match(lines, /task-with-very-long-id/);
	assert.doesNotMatch(lines, /…/); // no truncation ellipsis
});

test("details mode key footer rows align to the exact right edge even with fewer items", async () => {
	const c = createComponent({ sections: [section("Ready", "○", ["t1"])] });
	c.handleInput("\r");
	await setImmediate();
	const lines = c.render(80);
	
	const keyLine1 = lines[lines.length - 3];
	const keyLine2 = lines[lines.length - 2];
	
	const stripTags = (s) => s.replace(/\[\/?.*?\]/g, "").replace(/<\/?.*?>/g, "");
	assert.equal(stripTags(keyLine1).length, 80);
	assert.equal(stripTags(keyLine2).length, 80);
	assert.ok(stripTags(keyLine1).endsWith(" │"));
	assert.ok(stripTags(keyLine2).endsWith(" │"));
});
