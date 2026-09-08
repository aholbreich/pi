import assert from "node:assert/strict";
import { test } from "node:test";
import { loadTlModule } from "./helpers.mjs";

const theme = { fg: (_c, t) => t, bg: (_c, t) => t, bold: (t) => t };
const task = (id, status = "open", depends_on = []) => ({ id, title: id, status, depends_on });

async function openBoard(tasks, { ready = [], stale = [], failure, malformed } = {}) {
	let component;
	const calls = [];
	const notifications = [];
	const { openTaskLedgerBoard } = loadTlModule("board.ts");
	await openTaskLedgerBoard({
		exec: async (_cmd, args) => {
			calls.push(args);
			if (args.includes(failure)) return { code: 1, stdout: "", stderr: "Ledger unavailable" };
			if (args.includes(malformed)) return { code: 0, stdout: "not JSON", stderr: "" };
			let result = [];
			if (args.includes("--all")) result = tasks;
			else if (args.includes("ready")) result = ready;
			else if (args.includes("stale")) result = stale;
			else if (args.includes("--status")) result = tasks.filter((t) => t.status === args[args.indexOf("--status") + 1]);
			return { code: 0, stdout: JSON.stringify(result), stderr: "" };
		},
	}, {
		cwd: "/repo",
		ui: {
			notify: (message, level) => notifications.push({ message, level }),
			custom: async (factory) => {
				component = factory({ requestRender() {} }, theme, {}, () => {});
			},
		},
	});
	return { component, calls, notifications };
}

function selectedIds(component) {
	const ids = [];
	for (let i = 0; i < 100; i++) {
		const header = component.render(120)[0];
		const id = header.match(/Task Ledger Board - (\S+)/)?.[1];
		if (!id || ids.at(-1) === id) return ids;
		ids.push(id);
		component.handleInput("j");
	}
	assert.fail("Board navigation did not reach its end");
}

test("all board inventory contains all 15 rssb-like tasks instead of only 11", async () => {
	const ready = Array.from({ length: 6 }, (_, i) => task(`task-ready-${i}`));
	const waiting = Array.from({ length: 4 }, (_, i) => task(`task-waiting-${i}`, "open", [ready[0].id]));
	const done = Array.from({ length: 5 }, (_, i) => task(`task-done-${i}`, "done"));
	const inventory = [...ready, ...waiting, ...done];
	const { component, calls } = await openBoard(inventory, { ready });
	assert.ok(component);
	assert.match(component.render(120).join("\n"), /Waiting 4/);
	assert.match(component.render(120).join("\n"), /of 10/);
	component.handleInput("a");
	assert.match(component.render(120).join("\n"), /of 15/);
	assert.deepEqual(selectedIds(component).sort(), inventory.map((t) => t.id).sort());
	assert.ok(calls.some((args) => args.includes("--all")));
});

test("stale tasks appear once even when also listed as in progress", async () => {
	const stale = task("task-stale", "in_progress");
	const ready = task("task-ready");
	const { component } = await openBoard([stale, ready], { ready: [ready], stale: [stale] });
	assert.match(component.render(120).join("\n"), /◇ task-stale/);
	component.handleInput("a");
	assert.deepEqual(selectedIds(component).sort(), ["task-ready", "task-stale"]);
});

test("completed prerequisites do not turn a ready task into a waiting task", async () => {
	const completed = task("task-completed", "done");
	const ready = [task("task-followup", "open", [completed.id]), task("task-other")];
	const { component } = await openBoard([...ready, completed], { ready });
	assert.match(component.render(120).join("\n"), /○ task-followup/);
	assert.doesNotMatch(component.render(120).join("\n"), /Waiting/);
});

test("unknown statuses remain reachable in all view", async () => {
	const inventory = [task("task-ready"), task("task-waiting"), task("task-future", "scheduled")];
	const { component } = await openBoard(inventory, { ready: [inventory[0]] });
	component.handleInput("a");
	assert.deepEqual(selectedIds(component).sort(), inventory.map((t) => t.id).sort());
});

test("closed-only ledger opens in all view rather than an empty focused board", async () => {
	const { component } = await openBoard([task("task-done", "done")]);
	assert.ok(component);
	assert.match(component.render(120).join("\n"), /✓ task-done/);
});

for (const query of ["--all", "ready", "stale"]) {
	test(`failed ${query} query reports an error rather than a misleading partial board`, async () => {
		const ready = task("task-ready");
		const { component, notifications } = await openBoard([ready], { ready: [ready], failure: query });
		assert.equal(component, undefined);
		assert.equal(notifications[0]?.level, "error");
		assert.match(notifications[0].message, /Ledger unavailable/);
	});
}

test("invalid inventory JSON reports an error rather than an empty board", async () => {
	const { component, notifications } = await openBoard([], { malformed: "--all" });
	assert.equal(component, undefined);
	assert.equal(notifications[0]?.level, "error");
});
