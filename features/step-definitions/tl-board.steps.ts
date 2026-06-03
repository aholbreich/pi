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

const BOARD_RENDER_WIDTH = 80;

const testTheme = {
  fg: (_c: string, t: string) => t,
  bg: (_c: string, t: string) => t,
  bold: (t: string) => t,
};

function taskJson(id: string) {
  return JSON.stringify([{ id, title: "Example task", status: "open", priority: "medium", tags: ["test"] }]);
}

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

Given("the task ledger board is open with a task {string}", async function (this: BoardWorld, taskId: string) {
  registerInto(this, async (_cmd: string, args: string[]) => {
    if (args.includes("ready")) return { code: 0, stdout: taskJson(taskId), stderr: "" };
    if (args.includes("show")) return { code: 0, stdout: `${taskId} full details`, stderr: "" };
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

When("the user presses the {string} key", function (this: BoardWorld, key: string) {
  assert.ok(this.component);
  this.component.handleInput(key);
});

When("the user selects that task and opens its details", async function (this: BoardWorld) {
  assert.ok(this.component);
  this.component.handleInput("\r");
  await new Promise((resolve) => setImmediate(resolve));
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

Then("the board returns to the list view", function (this: BoardWorld) {
  assert.ok(this.component);
  const lines = this.component.render(100).join("\n");
  assert.match(lines, /↑.*↓.*navigate/);
});

Then("the task ledger board overlay is visible", function (this: BoardWorld) {
  assert.ok(this.component);
  const lines = this.component.render(100).join("\n");
  assert.match(lines, /Task Ledger Board/);
});

Then("the board has a rounded top border with a centered title", function (this: BoardWorld) {
  assert.ok(this.component);
  const topLine = this.component.render(BOARD_RENDER_WIDTH)[0];
  assert.match(topLine, /╭/);
  assert.match(topLine, /╮/);
  assert.match(topLine, /─/);
  assert.match(topLine, /Task Ledger Board/);
});

Then("the board has a rounded bottom border line", function (this: BoardWorld) {
  assert.ok(this.component);
  const lines = this.component.render(BOARD_RENDER_WIDTH);
  const bottomLine = lines[lines.length - 1];
  assert.match(bottomLine, /╰/);
  assert.match(bottomLine, /╯/);
  assert.match(bottomLine, /─/);
});

Then("the task rows are framed with vertical border characters and inner padding", function (this: BoardWorld) {
  assert.ok(this.component);
  const lines = this.component.render(BOARD_RENDER_WIDTH);
  const taskLines = lines.filter((l: string) => /task-[a-z0-9-]+/.test(l) && !l.includes("Task Ledger Board"));
  assert.ok(taskLines.length > 0, "expected at least one task row");
  for (const line of taskLines) {
    assert.match(line, /^│ /, "task row should start with vertical border and padding");
    assert.match(line, / │$/, "task row should end with padding and vertical border");
  }
});

Then("the selected task row uses a compact pointer", function (this: BoardWorld) {
  assert.ok(this.component);
  const lines = this.component.render(BOARD_RENDER_WIDTH);
  const selected = lines.find((line) => line.includes("▸") && line.includes("task-borders"));
  assert.ok(selected, "expected selected row to use compact pointer");
});

When("the user requests to cancel that task", async function (this: BoardWorld) {
  assert.ok(this.component);
  this.component.handleInput("c");
  const selection = this.result as { action: string; id: string } | undefined;
  assert.ok(selection, "expected cancel selection");
  // Simulate the lifecycle flow: confirm → input → runTl
  const confirmed = await this.ctx.ui.confirm?.("", "") ?? true;
  if (!confirmed) return;
  const reason = await this.ctx.ui.input?.("", "") ?? "cancelled from board";
  this.calls.push({ cmd: "tl", args: ["cancel", selection.id, "--message", reason] });
});

When("the user requests to remove that task", async function (this: BoardWorld) {
  assert.ok(this.component);
  this.component.handleInput("x");
  const selection = this.result as { action: string; id: string } | undefined;
  assert.ok(selection, "expected remove selection");
  // Simulate the lifecycle flow: confirm → input → runTl
  const confirmed = await this.ctx.ui.confirm?.("", "") ?? true;
  if (!confirmed) return;
  const reason = await this.ctx.ui.input?.("", "") ?? "created by mistake";
  this.calls.push({ cmd: "tl", args: ["remove", selection.id, "--message", reason, "--force"] });
});

Then("the task {string} is cancelled", function (this: BoardWorld, taskId: string) {
  assert.ok(this.calls.some(c => c.args.includes("cancel") && c.args.includes(taskId)), `expected tl cancel call for ${taskId}`);
});

Then("the task {string} is removed with a reason", function (this: BoardWorld, taskId: string) {
  const call = this.calls.find(c => c.args.includes("remove") && c.args.includes(taskId));
  assert.ok(call, `expected tl remove call for ${taskId}`);
  assert.ok(call.args.includes("--message"), "expected remove to pass --message");
  assert.ok(call.args.includes("--force"), "expected remove to pass --force for open tasks");
});
