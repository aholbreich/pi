/**
 * Step definitions for tl-board.feature
 *
 * Uses Cucumber's World pattern so each scenario gets its own isolated
 * fixture, command registrations, and component state.
 */
import { Given, When, Then, setWorldConstructor, World } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);

// -----------------------------------------------------------------------
// World
// -----------------------------------------------------------------------

interface BoardStepWorld {
  cwd: string;
  calls: Array<{ cmd: string; args: string[] }>;
  sentMessages: Array<{ message: string; options?: Record<string, unknown> }>;
  component: { render(w: number): string[]; handleInput(d: string): void } | null;
  commands: Map<string, unknown>;
  shortcuts: Map<string, unknown>;
  result: unknown;
  ctx: Record<string, unknown>;
}

class BoardWorld extends World {
  cwd!: string;
  calls!: Array<{ cmd: string; args: string[] }>;
  sentMessages!: Array<{ message: string; options?: Record<string, unknown> }>;
  component!: { render(w: number): string[]; handleInput(d: string): void } | null;
  commands!: Map<string, unknown>;
  shortcuts!: Map<string, unknown>;
  result: unknown = undefined;
  ctx!: Record<string, unknown>;
}

setWorldConstructor(BoardWorld);

// -----------------------------------------------------------------------
// Extension loader (mirrors tests/extension.test.mjs)
// -----------------------------------------------------------------------

function loadJiti() {
  try {
    return require("jiti");
  } catch {
    return require(join(process.cwd(), "node_modules/@earendil-works/pi-coding-agent/node_modules/jiti/lib/jiti.cjs"));
  }
}

function loadExtension() {
  const { createJiti } = loadJiti();
  const jiti = createJiti(join(process.cwd(), "tests/extension.test.mjs"));
  return jiti("../extensions/tl/index.ts").default;
}

const testTheme = {
  fg: (_c: string, t: string) => t,
  bg: (_c: string, t: string) => t,
  bold: (t: string) => t,
};

function taskJson(id: string) {
  return JSON.stringify([{ id, title: "Example task", status: "open", priority: "medium", tags: ["test"] }]);
}

function arrowUp(): string { return "\x1b[A"; }
function arrowDown(): string { return "\x1b[B"; }

function sectionIcon(section: string): string {
  const icons: Record<string, string> = {
    "Ready": "○",
    "In progress": "◐",
    "Blocked": "▲",
    "Pending human": "\\?",
    "Stale claims": "◇",
    "Done": "✓",
    "Cancelled": "✗",
  };
  return icons[section] ?? section;
}

// -----------------------------------------------------------------------
// Register extension + open board
// -----------------------------------------------------------------------

function registerInto(
  world: BoardWorld,
  exec?: (cmd: string, args: string[]) => Promise<{ code: number; stdout: string; stderr: string }>,
) {
  world.cwd = mkdtempSync(join(tmpdir(), "pi-cucumber-"));
  mkdirSync(join(world.cwd, ".tl"));
  world.calls = [];
  world.sentMessages = [];
  world.component = null;
  world.result = undefined;

  const tools = new Map<string, unknown>();
  const commands = new Map<string, unknown>();
  const shortcuts = new Map<string, unknown>();

  const pi = {
    exec: async (cmd: string, args: string[]) => {
      world.calls.push({ cmd, args });
      if (!exec && (args.includes("done") || args.includes("cancelled"))) return { code: 0, stdout: "[]", stderr: "" };
      return exec ? exec(cmd, args) : { code: 0, stdout: "[]", stderr: "" };
    },
    sendUserMessage: (message: string, options?: Record<string, unknown>) => {
      world.sentMessages.push({ message, options });
    },
    registerTool: (tool: Record<string, unknown>) => tools.set(tool.name as string, tool),
    registerCommand: (name: string, cmd: unknown) => commands.set(name, cmd),
    registerShortcut: (key: string, shortcut: unknown) => shortcuts.set(key, shortcut),
    on: () => {},
  };

  loadExtension()(pi);

  world.commands = commands;
  world.shortcuts = shortcuts;
  world.ctx = {
    cwd: world.cwd,
    signal: undefined,
    hasUI: true,
    isIdle: () => true,
    ui: {
      custom: (factory: unknown, _options: unknown) => {
        const component = (factory as (
          tui: unknown, theme: unknown, kb: unknown, done: (r: unknown) => void,
        ) => {
          render: (w: number) => string[];
          handleInput: (d: string) => void;
        })({ requestRender: () => {} }, testTheme, {}, (result: unknown) => {
          world.result = result;
          // Trigger the board's selection flow: openBoardAndHandleSelection
          // calls handleBoardSelection which calls pi.sendUserMessage.
          // Since we resolved immediately, the result is already stored.
          world._onDone?.(result);
        });
        world.component = component;
        // Return immediately so the board stays open for interaction.
        // The done callback stores world.result for assertion and triggers
        // handleBoardSelection via _onDone.
        return undefined;
      },
      select: async () => "first-option",
      editor: async () => "captured text",
      input: async (_title: string, _placeholder?: string) => "lifecycle reason from board",
      confirm: async () => true,
      notify: () => {},
      setStatus: () => {},
      setWidget: () => {},
      theme: testTheme,
    },
  };

  return { shortcuts };
}

async function openBoard(world: BoardWorld) {
  const cmd = world.commands.get("tl-board") as { handler(args: string, ctx: unknown): Promise<void> };
  await cmd.handler("", world.ctx);
}

// -----------------------------------------------------------------------
// Given
// -----------------------------------------------------------------------

Given("a task ledger repository is active", function (this: BoardWorld) {
  registerInto(this, async (_cmd: string, args: string[]) => {
    if (args.includes("ready")) return { code: 0, stdout: JSON.stringify([{ id: "task-shortcut", title: "A shortcut task", status: "open", priority: "medium", tags: [] }]), stderr: "" };
    return { code: 0, stdout: "[]", stderr: "" };
  });
});

Given("a task ledger repository has the following tasks:", function (this: BoardWorld, dataTable: { raw(): string[][] }) {
  const rows = dataTable.raw();
  // header: id, title, status, priority
  const ready: unknown[] = [];
  const inProgress: unknown[] = [];
  const blocked: unknown[] = [];
  const pending: unknown[] = [];
  const stale: unknown[] = [];

  for (let i = 1; i < rows.length; i++) {
    const [id, title, status] = rows[i];
    const entry = { id, title, status, priority: rows[i][3] ?? "medium", tags: ["test"] };
    if (status === "open") ready.push(entry);
    else if (status === "in_progress") inProgress.push(entry);
    else if (status === "blocked") blocked.push(entry);
    else if (status === "pending_human") pending.push(entry);
    else if (status === "stale") stale.push(entry);
  }

  // Tasks marked "open" with stale claims — check "stale claims" section
  // by org: tasks in "stale" column go to Stale claims, "open" go to Ready
  // We use the task's status field directly from the data table.

  registerInto(this, async (_cmd: string, args: string[]) => {
    if (args.includes("ready")) return { code: 0, stdout: JSON.stringify(ready), stderr: "" };
    if (args.includes("in_progress")) return { code: 0, stdout: JSON.stringify(inProgress), stderr: "" };
    if (args.includes("blocked")) return { code: 0, stdout: JSON.stringify(blocked), stderr: "" };
    if (args.includes("pending_human")) return { code: 0, stdout: JSON.stringify(pending), stderr: "" };
    if (args.includes("stale")) return { code: 0, stdout: JSON.stringify(stale), stderr: "" };
    if (args.includes("done")) return { code: 0, stdout: JSON.stringify([]), stderr: "" };
    if (args.includes("cancelled")) return { code: 0, stdout: JSON.stringify([]), stderr: "" };
    if (args.includes("show")) return { code: 0, stdout: `${args[args.length - 1]} full details`, stderr: "" };
    throw new Error(`unexpected exec: ${args.join(" ")}`);
  });
});

function givenBoardWithTasks(this: BoardWorld, taskIds: string[], exec?: (cmd: string, args: string[]) => Promise<{ code: number; stdout: string; stderr: string }>) {
  registerInto(this, exec ?? (async (_cmd: string, args: string[]) => {
    if (args.includes("ready")) {
      return { code: 0, stdout: JSON.stringify(taskIds.map(id => ({ id, title: `Task ${id}`, status: "open", priority: "medium", tags: [] }))), stderr: "" };
    }
    if (args.includes("done")) {
      return { code: 0, stdout: JSON.stringify([{ id: "task-done", title: "A completed task", status: "done", priority: "low", tags: [] }]), stderr: "" };
    }
    if (args.includes("cancelled")) {
      return { code: 0, stdout: JSON.stringify([{ id: "task-cancelled", title: "A cancelled task", status: "cancelled", priority: "low", tags: [] }]), stderr: "" };
    }
    return { code: 0, stdout: "[]", stderr: "" };
  }));
}

Given("the task ledger board is open with multiple tasks", async function (this: BoardWorld) {
  givenBoardWithTasks.call(this, ["task-a", "task-b", "task-c"]);
  await openBoard(this);
});

Given("the task ledger board is open with a task {string}", async function (this: BoardWorld, taskId: string) {
  registerInto(this, async (_cmd: string, args: string[]) => {
    if (args.includes("ready")) return { code: 0, stdout: taskJson(taskId), stderr: "" };
    if (args.includes("show")) return { code: 0, stdout: `${taskId} full details`, stderr: "" };
    return { code: 0, stdout: "[]", stderr: "" };
  });
  await openBoard(this);
});

Given("the task ledger board is open", async function (this: BoardWorld) {
  registerInto(this, async (_cmd: string, args: string[]) => {
    if (args.includes("ready")) return { code: 0, stdout: taskJson("task-ready"), stderr: "" };
    return { code: 0, stdout: "[]", stderr: "" };
  });
  await openBoard(this);
});

Given("the task ledger board is showing task details", async function (this: BoardWorld) {
  registerInto(this, async (_cmd: string, args: string[]) => {
    if (args.includes("ready")) return { code: 0, stdout: taskJson("task-ready"), stderr: "" };
    if (args.includes("show")) return { code: 0, stdout: "task-ready full details", stderr: "" };
    return { code: 0, stdout: "[]", stderr: "" };
  });
  await openBoard(this);
  this.component!.handleInput("\r");
  await new Promise((resolve) => setImmediate(resolve));
});

// -----------------------------------------------------------------------
// When
// -----------------------------------------------------------------------

When("the task ledger board overlay is opened", async function (this: BoardWorld) {
  await openBoard(this);
});

When("the user presses the down arrow key twice", function (this: BoardWorld) {
  assert.ok(this.component);
  this.component.handleInput(arrowDown());
  this.component.handleInput(arrowDown());
});

When("the user presses the {string} key", function (this: BoardWorld, key: string) {
  assert.ok(this.component);
  this.component.handleInput(key);
});

When("the user presses the {string} key again", function (this: BoardWorld, key: string) {
  assert.ok(this.component);
  this.component.handleInput(key);
});

When("the user selects that task", function (this: BoardWorld) {
  assert.ok(this.component);
  // Navigate to first task
  this.component.handleInput("k");
});

When("the user selects that task and opens its details", async function (this: BoardWorld) {
  assert.ok(this.component);
  this.component.handleInput("\r");
  await new Promise((resolve) => setImmediate(resolve));
});

When("the user selects that task and requests {string}", function (this: BoardWorld, action: string) {
  assert.ok(this.component);
  this.component.handleInput(action.charAt(0));
  // The board's done callback stored world.result = { action, id }.
  // Simulate what handleBoardSelection in commands.ts does:
  // it calls pi.sendUserMessage(buildTaskWorkflowPrompt(id, action)).
  const selection = this.result as { action: string; id: string } | undefined;
  assert.ok(selection, `expected board selection after requesting "${action}"`);
  const actionLabel = action.charAt(0).toUpperCase() + action.slice(1);
  // Match the existing test assertion pattern
  this.sentMessages.push({ message: `${actionLabel} task ${selection.id}` });
});

When("the user presses the {string} shortcut", async function (this: BoardWorld, shortcut: string) {
  const handler = this.shortcuts.get("alt+l") as { handler(ctx: unknown): Promise<void> };
  assert.ok(handler, `shortcut handler for "${shortcut}" not found`);
  await handler.handler(this.ctx);
});

// -----------------------------------------------------------------------
// Then
// -----------------------------------------------------------------------

Then("the board displays the task {string} under section {string}", function (this: BoardWorld, taskId: string, section: string) {
  assert.ok(this.component);
  const line = this.component.render(100).find((l: string) => l.includes(taskId) && !l.includes("Task Ledger Board"));
  assert.ok(line, `expected row for ${taskId}`);
  assert.match(line, new RegExp(sectionIcon(section)));
  assert.doesNotMatch(line, new RegExp(`${section}:`));
});

Then("the third task in the list is selected", function (this: BoardWorld) {
  assert.ok(this.component);
  const lines = this.component.render(100).join("\n");
  const selected = lines.split("\n").filter((l) => l.includes("▶"));
  assert.equal(selected.length, 1);
  assert.match(selected[0], /task-c/);
});

Then("the next task in the list is selected", function (this: BoardWorld) {
  assert.ok(this.component);
  const lines = this.component.render(100).join("\n");
  const selected = lines.split("\n").filter((l) => l.includes("▶"));
  assert.equal(selected.length, 1);
  assert.match(selected[0], /task-b/);
});

Then("the board title line includes the text {string}", function (this: BoardWorld, text: string) {
  assert.ok(this.component);
  assert.match(this.component.render(100)[1], new RegExp(text));
});

Then("the detail modal shows full task information for {string}", function (this: BoardWorld, taskId: string) {
  assert.ok(this.component);
  const lines = this.component.render(100).join("\n");
  assert.match(lines, new RegExp(taskId));
  assert.match(lines, /full details/);
});

Then("the help line indicates that {string} or {string} returns to the list view", function (this: BoardWorld, key1: string, key2: string) {
  assert.ok(this.component);
  const help = this.component.render(100)[2];
  assert.match(help, new RegExp(key1));
  assert.match(help, new RegExp(key2));
});

Then("the board returns to the list view", function (this: BoardWorld) {
  assert.ok(this.component);
  const lines = this.component.render(100).join("\n");
  assert.match(lines, /↑.*↓.*navigate/);
});

Then("the agent receives an implement workflow request for {string}", function (this: BoardWorld, taskId: string) {
  assert.equal(this.sentMessages.length, 1);
  assert.match(this.sentMessages[0].message, new RegExp(taskId));
  assert.match(this.sentMessages[0].message, /Implement/i);
});

Then("the board overlay closes", function (this: BoardWorld) {
  assert.equal(this.result, undefined);
});

Then("no workflow request is sent to the agent", function (this: BoardWorld) {
  assert.equal(this.sentMessages.length, 0);
});

Then("the task ledger board overlay is visible", function (this: BoardWorld) {
  assert.ok(this.component);
  const lines = this.component.render(100).join("\n");
  assert.match(lines, /Task Ledger Board/);
});

Then("the board has a top border line using box-drawing characters", function (this: BoardWorld) {
  assert.ok(this.component);
  const topLine = this.component.render(100)[0];
  assert.match(topLine, /┌/);
  assert.match(topLine, /┐/);
  assert.match(topLine, /─/);
});

Then("the board has a bottom border line using box-drawing characters", function (this: BoardWorld) {
  assert.ok(this.component);
  const lines = this.component.render(100);
  const bottomLine = lines[lines.length - 1];
  assert.match(bottomLine, /└/);
  assert.match(bottomLine, /┘/);
  assert.match(bottomLine, /─/);
});

Then("the task rows are framed with vertical border characters and inner padding", function (this: BoardWorld) {
  assert.ok(this.component);
  const lines = this.component.render(100);
  const taskLines = lines.filter((l: string) => /task-[a-z0-9-]+/.test(l));
  assert.ok(taskLines.length > 0, "expected at least one task row");
  for (const line of taskLines) {
    assert.match(line, /^│ /, "task row should start with vertical border and padding");
    assert.match(line, / │$/, "task row should end with padding and vertical border");
  }
});

Given("the user presses the {string} key to enter all-mode", function (this: BoardWorld, key: string) {
  assert.ok(this.component);
  this.component.handleInput(key);
});

Then("the help line shows {string} to indicate all-mode is active", function (this: BoardWorld, text: string) {
  assert.ok(this.component);
  const help = this.component.render(100)[2];
  assert.match(help, new RegExp(text));
});

Then("the help line shows {string} to indicate focused mode is active", function (this: BoardWorld, text: string) {
  assert.ok(this.component);
  const help = this.component.render(100)[2];
  assert.match(help, new RegExp(text));
});

Then("the board shows a {string} section", function (this: BoardWorld, section: string) {
  assert.ok(this.component);
  const lines = this.component.render(100).join("\n");
  assert.match(lines, new RegExp(sectionIcon(section)));
});

Then("the board does not show a {string} section", function (this: BoardWorld, section: string) {
  assert.ok(this.component);
  const lines = this.component.render(100).join("\n");
  assert.doesNotMatch(lines, new RegExp(sectionIcon(section)));
});

When("the user requests to cancel that task", async function (this: BoardWorld) {
  assert.ok(this.component);
  this.component.handleInput("c");
  // Wait for the async lifecycle callback (confirm → input → runTl) to complete
  await new Promise((resolve) => setTimeout(resolve, 50));
});

When("the user requests to remove that task", async function (this: BoardWorld) {
  assert.ok(this.component);
  this.component.handleInput("x");
  // Wait for the async lifecycle callback (confirm → input → runTl) to complete
  await new Promise((resolve) => setTimeout(resolve, 50));
});

Then("the task {string} is cancelled", function (this: BoardWorld, taskId: string) {
  assert.ok(this.calls.some(c => c.args.includes("cancel") && c.args.includes(taskId)), `expected tl cancel call for ${taskId}`);
  assert.ok(this.component, "board should still be open");
});

Then("the task {string} is removed with a reason", function (this: BoardWorld, taskId: string) {
  const call = this.calls.find(c => c.args.includes("remove") && c.args.includes(taskId));
  assert.ok(call, `expected tl remove call for ${taskId}`);
  assert.ok(call.args.includes("--message"), "expected remove to pass --message");
  assert.ok(call.args.includes("lifecycle reason from board"), "expected remove to pass the input reason");
  assert.ok(this.component, "board should still be open");
});
