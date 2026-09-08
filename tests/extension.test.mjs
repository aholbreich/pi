import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { test } from "node:test";
import { loadTlModule } from "./helpers.mjs";
import { loadJiti } from "./helpers.mjs";
import { join } from "node:path";

function loadExtension() {
	const { createJiti } = loadJiti();
	const jiti = createJiti(join(process.cwd(), "tests/extension.test.mjs"));
	return jiti("../extensions/tl/index.ts").default;
}

function loadTlTasks() { return loadTlModule("tasks.ts"); }

function registerExtension(overrides = {}) {
	const tools = new Map();
	const commands = new Map();
	const handlers = [];
	const shortcuts = new Map();
	const pi = {
		on: (event, handler) => handlers.push({ event, handler }),
		registerTool: (tool) => tools.set(tool.name, tool),
		registerCommand: (name, command) => commands.set(name, command),
		registerShortcut: (key, shortcut) => shortcuts.set(key, shortcut),
		...overrides,
	};

	loadExtension()(pi);
	return { tools, commands, handlers, shortcuts };
}

const testTheme = {
	fg: (_color, text) => text,
	bg: (_color, text) => text,
	bold: (text) => text,
};

const markedTheme = {
	fg: (color, text) => `[${color}]${text}[/${color}]`,
	bg: (_color, text) => text,
	bold: (text) => `<b>${text}</b>`,
};

function makeCommandContext({ hasUI = true, selectChoice, selectChoices, editorText = "- rough todo" } = {}) {
	const choices = [...(selectChoices ?? [])];
	const widgets = new Map();
	const notifications = [];
	return {
		ctx: {
			cwd: "/repo",
			signal: undefined,
			hasUI,
			isIdle: () => true,
			ui: {
				theme: testTheme,
				select: async (_title, labels) => choices.shift() ?? selectChoice ?? labels[0],
				editor: async () => editorText,
				confirm: async () => true,
				notify: (message, level) => notifications.push({ message, level }),
				setStatus: () => {},
				setWidget: (key, value) => widgets.set(key, value),
			},
		},
		widgets,
		notifications,
	};
}

function taskJson(id = "task-abc") {
	return JSON.stringify([
		{
			id,
			title: "Example task",
			status: "open",
			priority: "medium",
			tags: ["ux"],
		},
	]);
}

test("extension registers current tools, slash commands, and shortcuts", () => {
	const { tools, commands, handlers, shortcuts } = registerExtension();

	assert.deepEqual([...commands.keys()], ["tl-capture", "tl-triage", "tl-board", "tl-init"]);
	assert.ok(!commands.has("tl-ready"));
	assert.ok(!commands.has("tl-show"));
	assert.ok(!commands.has("tl-list-all"));
	assert.ok(!commands.has("tl-dashboard"));
	assert.ok(!commands.has("tl-clear"));
	assert.ok(!commands.has("tl-clean"));
	assert.ok(!commands.has("tl-history"));

	assert.deepEqual([...tools.keys()], ["tl_bulk_create"]);
	assert.equal(tools.get("tl_bulk_create").label, "tl:bulk:create");
	assert.equal(shortcuts.size, 5);
	assert.equal(shortcuts.get("alt+l").description, "Open Task Ledger board");
	assert.equal(shortcuts.get("alt+t").description, "Toggle Task Ledger overlay");
	assert.equal(shortcuts.get("alt+i").description, "Implement top ready Task Ledger task");
	assert.equal(shortcuts.get("alt+r").description, "Refine top ready Task Ledger task");
	assert.equal(shortcuts.get("alt+p").description, "Plan top ready Task Ledger task");
	assert.deepEqual(handlers.map((h) => h.event), [
		"session_start",
		"before_agent_start",
		"turn_end",
		"session_compact",
		"session_tree",
		"session_shutdown",
	]);
});

test("Alt+T toggles the live task ledger overlay", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "pi-tl-test-"));
	mkdirSync(join(cwd, ".tl"));
	const calls = [];
	const { handlers, shortcuts } = registerExtension({
		exec: async (cmd, args) => {
			calls.push({ cmd, args });
			if (args.includes("--version")) return { code: 0, stdout: "tl version 1.0.0", stderr: "" };
			if (args.includes("ready")) return { code: 0, stdout: taskJson("task-ready"), stderr: "" };
			if (args.includes("in_progress") || args.includes("blocked") || args.includes("pending_human") || args.includes("stale")) return { code: 0, stdout: "[]", stderr: "" };
			throw new Error(`unexpected args: ${args.join(" ")}`);
		},
	});
	const widgets = new Map();
	const notifications = [];
	const ctx = {
		cwd,
		signal: undefined,
		hasUI: true,
		ui: {
			theme: testTheme,
			setStatus: () => {},
			notify: (message, level) => notifications.push({ message, level }),
			setWidget: (key, value, options) => widgets.set(key, { value, options }),
		},
	};

	await handlers.find((h) => h.event === "session_start").handler({}, ctx);
	assert.notEqual(widgets.get("pi-tl-overlay").value, undefined);
	const component = widgets.get("pi-tl-overlay").value({ requestRender: () => {} }, testTheme);
	component.invalidate();

	await shortcuts.get("alt+t").handler(ctx);
	assert.equal(widgets.get("pi-tl-overlay").value, undefined);
	assert.deepEqual(notifications.at(-1), { message: "Task Ledger overlay hidden", level: "info" });

	await handlers.find((h) => h.event === "session_compact").handler({}, ctx);
	assert.equal(widgets.get("pi-tl-overlay").value, undefined);

	await shortcuts.get("alt+t").handler(ctx);
	assert.notEqual(widgets.get("pi-tl-overlay").value, undefined);
	assert.deepEqual(notifications.at(-1), { message: "Task Ledger overlay shown", level: "info" });
});

test("Alt+i claims and sends implement request for top ready task from overlay snapshot", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "pi-tl-test-"));
	mkdirSync(join(cwd, ".tl"));
	const calls = [];
	const sentMessages = [];
	const { handlers, shortcuts } = registerExtension({
		exec: async (cmd, args) => {
			calls.push({ cmd, args });
			if (args.includes("--version")) return { code: 0, stdout: "tl version 1.0.0", stderr: "" };
			if (args.includes("ready")) return { code: 0, stdout: taskJson("task-top"), stderr: "" };
			if (args.includes("claim")) return { code: 0, stdout: "Claimed task-top", stderr: "" };
			return { code: 0, stdout: "[]", stderr: "" };
		},
		sendUserMessage: (message, options) => sentMessages.push({ message, options }),
	});
	const { ctx, notifications } = makeCommandContext();
	ctx.cwd = cwd;

	await handlers.find((h) => h.event === "session_start").handler({}, ctx);
	await shortcuts.get("alt+i").handler(ctx);

	const claimCall = calls.find((call) => call.args.includes("claim") && call.args.includes("task-top"));
	assert.ok(claimCall, "expected tl claim call for top ready task");
	assert.equal(sentMessages.length, 1);
	assert.match(sentMessages[0].message, /Implement task task-top/);
	assert.deepEqual(notifications.at(-1), { message: "Claimed task-top and sent implement request to the agent.", level: "info" });
});

test("Alt+r sends refine request for top ready task without claiming", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "pi-tl-test-"));
	mkdirSync(join(cwd, ".tl"));
	const calls = [];
	const sentMessages = [];
	const { handlers, shortcuts } = registerExtension({
		exec: async (cmd, args) => {
			calls.push({ cmd, args });
			if (args.includes("--version")) return { code: 0, stdout: "tl version 1.0.0", stderr: "" };
			if (args.includes("ready")) return { code: 0, stdout: taskJson("task-refine"), stderr: "" };
			return { code: 0, stdout: "[]", stderr: "" };
		},
		sendUserMessage: (message, options) => sentMessages.push({ message, options }),
	});
	const { ctx, notifications } = makeCommandContext();
	ctx.cwd = cwd;

	await handlers.find((h) => h.event === "session_start").handler({}, ctx);
	await shortcuts.get("alt+r").handler(ctx);

	assert.equal(calls.some((call) => call.args.includes("claim")), false);
	assert.equal(sentMessages.length, 1);
	assert.match(sentMessages[0].message, /Refine task task-refine/);
	assert.deepEqual(notifications.at(-1), { message: "Sent refine request for task-refine to the agent.", level: "info" });
});

test("Alt+p sends plan request for top ready task without claiming", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "pi-tl-test-"));
	mkdirSync(join(cwd, ".tl"));
	const calls = [];
	const sentMessages = [];
	const { handlers, shortcuts } = registerExtension({
		exec: async (cmd, args) => {
			calls.push({ cmd, args });
			if (args.includes("--version")) return { code: 0, stdout: "tl version 1.0.0", stderr: "" };
			if (args.includes("ready")) return { code: 0, stdout: taskJson("task-plan"), stderr: "" };
			return { code: 0, stdout: "[]", stderr: "" };
		},
		sendUserMessage: (message, options) => sentMessages.push({ message, options }),
	});
	const { ctx, notifications } = makeCommandContext();
	ctx.cwd = cwd;

	await handlers.find((h) => h.event === "session_start").handler({}, ctx);
	await shortcuts.get("alt+p").handler(ctx);

	assert.equal(calls.some((call) => call.args.includes("claim")), false);
	assert.equal(sentMessages.length, 1);
	assert.match(sentMessages[0].message, /Plan implementation for task task-plan/);
	assert.deepEqual(notifications.at(-1), { message: "Sent plan request for task-plan to the agent.", level: "info" });
});

test("Alt+i notifies when cached overlay snapshot has no ready task", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "pi-tl-test-"));
	mkdirSync(join(cwd, ".tl"));
	const sentMessages = [];
	const { handlers, shortcuts } = registerExtension({
		exec: async (_cmd, args) => {
			if (args.includes("--version")) return { code: 0, stdout: "tl version 1.0.0", stderr: "" };
			return { code: 0, stdout: "[]", stderr: "" };
		},
		sendUserMessage: (message, options) => sentMessages.push({ message, options }),
	});
	const { ctx, notifications } = makeCommandContext();
	ctx.cwd = cwd;

	await handlers.find((h) => h.event === "session_start").handler({}, ctx);
	await shortcuts.get("alt+i").handler(ctx);

	assert.equal(sentMessages.length, 0);
	assert.deepEqual(notifications.at(-1), { message: "No ready task available for Alt+i.", level: "info" });
});

test("session start renders a live task ledger overlay when a ledger exists", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "pi-tl-test-"));
	mkdirSync(join(cwd, ".tl"));
	const calls = [];
	const { handlers } = registerExtension({
		exec: async (cmd, args) => {
			calls.push({ cmd, args });
			if (args.includes("--version")) return { code: 0, stdout: "tl version 1.0.0", stderr: "" };
			if (args.includes("ready")) return { code: 0, stdout: taskJson("task-ready"), stderr: "" };
			if (args.includes("in_progress")) return { code: 0, stdout: taskJson("task-active"), stderr: "" };
			if (args.includes("blocked") || args.includes("pending_human") || args.includes("stale")) return { code: 0, stdout: "[]", stderr: "" };
			throw new Error(`unexpected args: ${args.join(" ")}`);
		},
	});
	const widgets = new Map();
	const statuses = [];
	const ctx = {
		cwd,
		signal: undefined,
		hasUI: true,
		ui: {
			theme: testTheme,
			setStatus: (key, value) => statuses.push({ key, value }),
			setWidget: (key, value, options) => widgets.set(key, { value, options }),
		},
	};

	await handlers.find((h) => h.event === "session_start").handler({}, ctx);

	assert.equal(calls.length, 7);
	assert.ok(calls.every((call) => call.args[1] === "never"));
	assert.deepEqual(statuses.at(-1), { key: "pi-tl", value: "tl 1.0.0: ○1 ◐1" });
	const widget = widgets.get("pi-tl-overlay");
	assert.equal(widget.options.placement, "aboveEditor");
	const component = widget.value({ requestRender: () => {} }, testTheme);
	const lines = component.render(100);
	assert.match(lines.join("\n"), /Task Ledger/);
	assert.match(lines.join("\n"), /task-active/);
	assert.match(lines.join("\n"), /task-ready/);
	assert.doesNotMatch(lines.join("\n"), /\/open/);
});

test("shared task row renderer omits status words and colors tags separately", () => {
	const { renderTaskLine } = loadTlTasks();
	const row = renderTaskLine(markedTheme, {
		leading: "▶ ",
		sectionIcon: "○",
		sectionLabel: undefined,
		task: { id: "task-board", title: "Example task", status: "open", priority: "medium", tags: ["ux"] },
		primaryColor: "accent",
		width: 80,
		showTags: true,
		tagColor: "muted",
	});

	assert.doesNotMatch(row[0].text, /Ready:|\/open/);
	assert.match(row[0].text, /\[accent\]▶ ○ task-board /);
	assert.match(row[0].text, /\[warning\]▲\[\/warning\]/);
	assert.match(row[0].text, /\[muted\] #ux\[\/muted\]/);
});

test("tl-capture sends rough todos to the agent without creating tasks", async () => {
	const sentMessages = [];
	const { commands } = registerExtension({
		sendUserMessage: (message, options) => sentMessages.push({ message, options }),
		exec: async () => {
			throw new Error("tl-capture should not run tl commands directly");
		},
	});
	const { ctx, notifications } = makeCommandContext({ editorText: "fix docs\ntriage flaky tests high" });

	await commands.get("tl-capture").handler("", ctx);

	assert.equal(sentMessages.length, 1);
	assert.equal(sentMessages[0].options, undefined);
	assert.match(sentMessages[0].message, /Please turn these rough todos into clean tl task ledger tasks/);
	assert.match(sentMessages[0].message, /fix docs/);
	assert.match(sentMessages[0].message, /triage flaky tests high/);
	assert.match(sentMessages[0].message, /tl create/i);
	assert.deepEqual(notifications, [{ message: "Sent captured todos to the agent for refinement.", level: "info" }]);
});

test("tl-board opens keyboard navigable overlay and sends selected action", async () => {
	const calls = [];
	const sentMessages = [];
	let rendered = [];
	const { commands } = registerExtension({
		exec: async (cmd, args) => {
			calls.push({ cmd, args });
			if (args.includes("ready") || args.includes("--all")) return { code: 0, stdout: taskJson("task-board"), stderr: "" };
			return { code: 0, stdout: "[]", stderr: "" };
		},
		sendUserMessage: (message, options) => sentMessages.push({ message, options }),
	});
	const { ctx, notifications } = makeCommandContext();
	ctx.ui.custom = async (factory, options) => {
		assert.equal(options.overlay, true);
		const component = factory(
			{ requestRender: () => {} },
			testTheme,
			{},
			(result) => {
				ctx.ui.customResult = result;
			},
		);
		rendered = component.render(100);
		component.handleInput("i");
		return ctx.ui.customResult;
	};

	await commands.get("tl-board").handler("", ctx);

	assert.equal(calls.length, 3);
	assert.match(rendered.join("\n"), /Task Ledger Board/);
	assert.match(rendered.join("\n"), /○ task-board ▲ Example task/);
	assert.doesNotMatch(rendered.join("\n"), /#ux/);
	assert.doesNotMatch(rendered.join("\n"), /\/open/);
	assert.equal(sentMessages.length, 1);
	assert.match(sentMessages[0].message, /Implement task task-board/);
	assert.deepEqual(notifications, [{ message: "Sent implement request for task-board to the agent.", level: "info" }]);
});

test("Task Ledger board shortcut opens modal", async () => {
	const calls = [];
	let opened = false;
	const { shortcuts } = registerExtension({
		exec: async (cmd, args) => {
			calls.push({ cmd, args });
			if (args.includes("ready") || args.includes("--all")) return { code: 0, stdout: taskJson("task-shortcut"), stderr: "" };
			return { code: 0, stdout: "[]", stderr: "" };
		},
	});
	const { ctx } = makeCommandContext();
	ctx.ui.custom = async (factory, options) => {
		opened = true;
		assert.equal(options.overlay, true);
		const component = factory(
			{ requestRender: () => {} },
			testTheme,
			{},
			(result) => {
				ctx.ui.customResult = result;
			},
		);
		assert.match(component.render(100).join("\n"), /task-shortcut/);
		component.handleInput("q");
		return ctx.ui.customResult;
	};

	await shortcuts.get("alt+l").handler(ctx);

	assert.equal(opened, true);
	assert.equal(calls.length, 3);
});

test("tl-board remove lifecycle force-removes open tasks", async () => {
	const calls = [];
	let removed = false;
	const { commands } = registerExtension({
		exec: async (cmd, args) => {
			calls.push({ cmd, args });
			if (args.includes("ready") || args.includes("--all")) return { code: 0, stdout: removed ? "[]" : taskJson("task-remove"), stderr: "" };
			if (args.includes("remove")) {
				removed = true;
				return { code: 0, stdout: "Removed task-remove", stderr: "" };
			}
			return { code: 0, stdout: "[]", stderr: "" };
		},
	});
	const { ctx } = makeCommandContext();
	ctx.ui.custom = async (_factory, options) => {
		assert.equal(options.overlay, true);
		return { action: "remove", id: "task-remove" };
	};
	ctx.ui.confirm = async () => true;
	ctx.ui.input = async () => "created by mistake";

	await commands.get("tl-board").handler("", ctx);

	const removeCall = calls.find((call) => call.args.includes("remove") && call.args.includes("task-remove"));
	assert.ok(removeCall, "expected tl remove call");
	assert.ok(removeCall.args.includes("--message"), "remove should include --message");
	assert.ok(removeCall.args.includes("created by mistake"), "remove should include input reason");
	assert.ok(removeCall.args.includes("--force"), "remove should include --force for open tasks");
	assert.equal(removed, true);
});

test("tl-board shows task details inside the modal", async () => {
	const calls = [];
	let rendered = [];
	const { commands } = registerExtension({
		exec: async (cmd, args) => {
			calls.push({ cmd, args });
			if (args.includes("ready") || args.includes("--all")) return { code: 0, stdout: taskJson("task-detail"), stderr: "" };
			if (args.includes("show")) return { code: 0, stdout: "task-detail full details", stderr: "" };
			return { code: 0, stdout: "[]", stderr: "" };
		},
	});
	const { ctx, widgets } = makeCommandContext();
	ctx.ui.custom = async (factory, options) => {
		assert.equal(options.overlay, true);
		const component = factory(
			{ requestRender: () => {} },
			{ ...testTheme, bg: (_color, text) => `[bg]${text}` },
			{},
			(result) => {
				ctx.ui.customResult = result;
			},
		);
		component.handleInput("\r");
		await new Promise((resolve) => setImmediate(resolve));
		rendered = component.render(100);
		return ctx.ui.customResult;
	};

	await commands.get("tl-board").handler("", ctx);

	assert.equal(calls.length, 4);
	assert.deepEqual(calls.at(-1).args, ["--color", "never", "show", "task-detail"]);
	assert.match(rendered.join("\n"), /task-detail full details/);
	assert.match(rendered.join("\n"), /\[bg\]/);
	assert.equal(widgets.has("pi-tl"), false);
});

test("tl_bulk_create creates tasks sequentially and reports partial failures", async () => {
	const calls = [];
	const { tools } = registerExtension({
		exec: async (cmd, args) => {
			calls.push({ cmd, args });
			const title = args[args.indexOf("--title") + 1];
			if (title === "fail me") return { code: 1, stdout: "", stderr: "boom" };
			return { code: 0, stdout: JSON.stringify({ id: `task-${calls.length}`, title }), stderr: "" };
		},
	});
	const ctx = { cwd: "/repo" };

	const result = await tools.get("tl_bulk_create").execute(
		"tool-call",
		{
			actor: "tester",
			tasks: [
				{ title: "first", priority: "high", tags: ["a"] },
				{ title: "fail me" },
			],
		},
		undefined,
		undefined,
		ctx,
	);

	assert.equal(calls.length, 2);
	assert.deepEqual(calls[0].args, ["--color", "never", "create", "--title", "first", "--json", "--priority", "high", "--actor", "tester", "--tag", "a"]);
	assert.deepEqual(calls[1].args, ["--color", "never", "create", "--title", "fail me", "--json", "--actor", "tester"]);
	assert.equal(result.details.created.length, 1);
	assert.equal(result.details.failed.length, 1);
	assert.equal(result.isError, true);
	assert.match(result.content[0].text, /Created 1\/2 task\(s\)\./);
});

test("tl_bulk_create keeps color disabled by default", async () => {
	const calls = [];
	const { tools } = registerExtension({
		exec: async (cmd, args) => {
			calls.push({ cmd, args });
			return { code: 0, stdout: JSON.stringify({ id: "task-1", title: "one" }), stderr: "" };
		},
	});
	const ctx = { cwd: "/repo" };

	await tools.get("tl_bulk_create").execute("tool-call", { tasks: [{ title: "one" }] }, undefined, undefined, ctx);

	assert.deepEqual(calls[0].args, ["--color", "never", "create", "--title", "one", "--json"]);
});
