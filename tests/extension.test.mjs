import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function loadJiti() {
	try {
		return require("jiti");
	} catch {
		// pi itself depends on jiti to load TypeScript extensions. This fallback keeps
		// the test suite dependency-light while still using the same loader style.
		return require(join(process.cwd(), "node_modules/@earendil-works/pi-coding-agent/node_modules/jiti/lib/jiti.cjs"));
	}
}

function loadExtension() {
	const { createJiti } = loadJiti();
	const jiti = createJiti(join(process.cwd(), "tests/extension.test.mjs"));
	return jiti("../extensions/tl/index.ts").default;
}

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

	assert.deepEqual([...commands.keys()], ["tl-capture", "tl-board", "tl-init"]);
	assert.ok(!commands.has("tl-ready"));
	assert.ok(!commands.has("tl-show"));
	assert.ok(!commands.has("tl-list-all"));
	assert.ok(!commands.has("tl-dashboard"));
	assert.ok(!commands.has("tl-clear"));
	assert.ok(!commands.has("tl-clean"));
	assert.ok(!commands.has("tl-history"));

	assert.equal(tools.size, 19);
	assert.ok(tools.has("tl_list"));
	assert.equal(tools.get("tl_create").label, "tl:create");
	assert.equal(tools.get("tl_bulk_create").label, "tl:bulk:create");
	assert.equal(tools.get("tl_dep_add").label, "tl:dep:add");
	assert.ok(tools.has("tl_history")); // still useful as an agent tool, just not a slash command
	assert.equal(shortcuts.size, 2);
	assert.equal(shortcuts.get("alt+l").description, "Open Task Ledger board");
	assert.equal(shortcuts.get("alt+t").description, "Toggle Task Ledger overlay");
	assert.deepEqual(handlers.map((h) => h.event), [
		"session_start",
		"before_agent_start",
		"tool_execution_end",
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

test("session start renders a live task ledger overlay when a ledger exists", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "pi-tl-test-"));
	mkdirSync(join(cwd, ".tl"));
	const calls = [];
	const { handlers } = registerExtension({
		exec: async (cmd, args) => {
			calls.push({ cmd, args });
			if (args.includes("--version")) return { code: 0, stdout: "tl version 0.6.0-test", stderr: "" };
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

	assert.equal(calls.length, 6);
	assert.ok(calls.every((call) => call.args[1] === "never"));
	assert.deepEqual(statuses.at(-1), { key: "pi-tl", value: "tl 0.6.0-test: ○1 ◐1" });
	const widget = widgets.get("pi-tl-overlay");
	assert.equal(widget.options.placement, "aboveEditor");
	const component = widget.value({ requestRender: () => {} }, testTheme);
	const lines = component.render(100);
	assert.match(lines.join("\n"), /Task Ledger/);
	assert.match(lines.join("\n"), /Active: task-active/);
	assert.match(lines.join("\n"), /Ready: task-ready/);
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
	assert.match(sentMessages[0].message, /use tl_create/i);
	assert.deepEqual(notifications, [{ message: "Sent captured todos to the agent for refinement.", level: "info" }]);
});

test("tl-board opens keyboard navigable overlay and sends selected action", async () => {
	const calls = [];
	const sentMessages = [];
	let rendered = [];
	const { commands } = registerExtension({
		exec: async (cmd, args) => {
			calls.push({ cmd, args });
			if (args.includes("ready")) return { code: 0, stdout: taskJson("task-board"), stderr: "" };
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

	assert.equal(calls.length, 5);
	assert.match(rendered.join("\n"), /Task Ledger Board/);
	assert.match(rendered.join("\n"), /task-board/);
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
			if (args.includes("ready")) return { code: 0, stdout: taskJson("task-shortcut"), stderr: "" };
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
	assert.equal(calls.length, 5);
});

test("tl-board shows task details inside the modal", async () => {
	const calls = [];
	let rendered = [];
	const { commands } = registerExtension({
		exec: async (cmd, args) => {
			calls.push({ cmd, args });
			if (args.includes("ready")) return { code: 0, stdout: taskJson("task-detail"), stderr: "" };
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

	assert.equal(calls.length, 6);
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

test("agent tools keep color disabled by default", async () => {
	const calls = [];
	const { tools } = registerExtension({
		exec: async (cmd, args) => {
			calls.push({ cmd, args });
			return { code: 0, stdout: "[]", stderr: "" };
		},
	});
	const ctx = { cwd: "/repo" };

	await tools.get("tl_list").execute("tool-call", { all: true }, undefined, undefined, ctx);

	assert.deepEqual(calls[0].args, ["--color", "never", "list", "--json", "--all"]);
});
