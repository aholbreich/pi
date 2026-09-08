import { Given, Then, When } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import type { ExtensionAPI, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import { openTaskLedgerBoard, type TaskLedgerBoardComponent } from "../../extensions/tl/board.js";

const WIDTH = 80;
const LONG_TITLE = "Improve task dependency visibility and explain blocked prerequisites so developers can inspect waiting work and coordinate safe implementation without opening every task detail";
const tasks = Array.from({ length: 10 }, (_, index) => ({
  id: `task-${String(index + 1).padStart(2, "0")}`,
  title: index === 0 ? "Document setup" : `${LONG_TITLE} for workflow ${index + 1}`,
  status: "in_progress",
  priority: "medium",
}));

// Mark styles rather than relying on terminal/theme colors. Board layout uses
// visible lengths independently of these markers, just as it does with ANSI.
const theme = {
  fg: (color: string, text: string) => `<fg-${color}>${text}</fg-${color}>`,
  bg: (_color: string, text: string) => text,
  bold: (text: string) => `<bold>${text}</bold>`,
} as Theme;

const plain = (line: string) => line.replace(/<\/?(?:fg-[A-Za-z]+|bold)>/g, "");

type Snapshot = {
  selected: string;
  entries: Map<string, string[]>;
  indicator: string;
};

interface WrapWorld {
  wrap: {
    component: TaskLedgerBoardComponent;
    subject: typeof tasks[number];
    rows: string[];
    navigation: Snapshot[];
  };
}

function snapshot(world: WrapWorld): Snapshot {
  const rendered = world.wrap.component.render(WIDTH);
  const dividers = rendered.flatMap((line, index) => /^│ ─+ │$/.test(plain(line)) ? [index] : []);
  assert.equal(dividers.length, 2, "expected list between the board dividers");
  const entries = new Map<string, string[]>();
  let current: string[] | undefined;
  let selected = "";
  let indicator = "";
  for (const styled of rendered.slice(dividers[0] + 1, dividers[1])) {
    const line = plain(styled);
    assert.equal(line.length, WIDTH, "task rows must stay within the board frame");
    if (line.includes("Showing ")) {
      indicator = line.slice(2, -2).trim();
      continue;
    }
    const match = /^│ ([▸·]) ◐ (task-\d+) ▲ /.exec(line);
    if (match) {
      assert.ok(!entries.has(match[2]), "a task prefix must appear only once per entry");
      current = [];
      entries.set(match[2], current);
      if (match[1] === "▸") {
        assert.equal(selected, "", "only one task may be selected");
        selected = match[2];
      }
    }
    assert.ok(current, `unexpected task row: ${line}`);
    current.push(styled);
  }
  assert.ok(selected, "expected a selected task in the visible list");
  return { selected, entries, indicator };
}

function rowsFor(state: Snapshot, id: string): string[] {
  const rows = state.entries.get(id);
  assert.ok(rows?.length, `expected visible rows for ${id}`);
  return rows;
}

function titleColumn(rows: string[]): number {
  const prefix = /^│ [▸·] ◐ task-\d+ ▲ /.exec(plain(rows[0]));
  assert.ok(prefix, "expected the task metadata before its title");
  return prefix[0].length;
}

function chunks(rows: string[]): string[] {
  const column = titleColumn(rows);
  return rows.map((row) => plain(row).slice(column, -2).trimEnd());
}

function observe(world: WrapWorld, index: number): void {
  world.wrap.subject = tasks[index];
  world.wrap.rows = rowsFor(snapshot(world), tasks[index].id);
}

Given("the task ledger board overlay is open", async function (this: WrapWorld) {
  let component: TaskLedgerBoardComponent | undefined;
  const pi = {
    exec: async (command: string, args: string[]) => {
      assert.equal(command, "tl");
      const operation = args.slice(2);
      const inventory = operation.join(" ") === "list --all --json";
      assert.ok(inventory || ["ready --json", "stale --json"].includes(operation.join(" ")));
      return { code: 0, stdout: JSON.stringify(inventory ? tasks : []), stderr: "" };
    },
  } as ExtensionAPI;
  const ctx = {
    cwd: process.cwd(), signal: undefined,
    ui: {
      custom: async (factory: Function) => {
        component = factory({ requestRender: () => {} }, theme, {}, () => assert.fail("board unexpectedly closed"));
        return undefined;
      },
      notify: (message: string) => assert.fail(message),
    },
  } as unknown as ExtensionContext;
  await openTaskLedgerBoard(pi, ctx);
  assert.ok(component, "expected the actual board component to open");
  this.wrap = { component, subject: tasks[0], rows: [], navigation: [] };
});

Given("at least one task has a title longer than the available line width", function (this: WrapWorld) {
  assert.ok(tasks[1].title.length > WIDTH);
  assert.ok(rowsFor(snapshot(this), tasks[1].id).length > 1, "the fixture must exercise wrapping");
});

When(/^a task title fits within the remaining line width after prefix \(icon, id, priority\)$/, function (this: WrapWorld) {
  observe(this, 0);
});

When("a task title exceeds the remaining line width after prefix", function (this: WrapWorld) {
  observe(this, 1);
});

When("a title wraps to continuation lines", function (this: WrapWorld) {
  observe(this, 1);
});

When("a task with a wrapped title is selected", function (this: WrapWorld) {
  const before = rowsFor(snapshot(this), tasks[1].id);
  assert.ok(before.every((row) => !row.includes("<bold>")), "the task starts unselected");
  this.wrap.component.handleInput("\x1b[B");
  assert.equal(snapshot(this).selected, tasks[1].id);
  observe(this, 1);
});

When("some entries wrap to multiple lines", function (this: WrapWorld) {
  this.wrap.navigation = [snapshot(this)];
  // Cross both ends of the eight-entry window, including boundary clamping.
  const keys = ["\x1b[A", ...Array(10).fill("\x1b[B"), ...Array(10).fill("\x1b[A")];
  for (const key of keys) {
    this.wrap.component.handleInput(key);
    this.wrap.navigation.push(snapshot(this));
  }
});

Then("the title is shown in full on one line", function (this: WrapWorld) {
  assert.deepEqual(chunks(this.wrap.rows), [this.wrap.subject.title]);
});

Then("no continuation lines are rendered", function (this: WrapWorld) {
  assert.equal(this.wrap.rows.length, 1);
});

Then("the title is split at word boundaries", function (this: WrapWorld) {
  const fragments = chunks(this.wrap.rows);
  assert.ok(fragments.length > 1);
  assert.ok(fragments.every((fragment) => fragment.length > 0));
  assert.deepEqual(fragments.flatMap((fragment) => fragment.split(" ")), this.wrap.subject.title.split(" "));
});

Then("continuation lines are indented to align with the title start position", function (this: WrapWorld) {
  const column = titleColumn(this.wrap.rows);
  assert.ok(this.wrap.rows.length > 1);
  for (const row of this.wrap.rows.slice(1)) {
    const line = plain(row);
    assert.equal(line.slice(2).search(/\S/), column - 2);
    assert.equal(line.slice(2, column), " ".repeat(column - 2));
  }
});

Then(/^no ellipsis \(`…`\) truncation is applied$/, function (this: WrapWorld) {
  assert.ok(this.wrap.rows.every((row) => !plain(row).includes("…")));
  assert.equal(chunks(this.wrap.rows).join(" "), this.wrap.subject.title);
});

Then("continuation lines show only the wrapped title text with indent spacing", function (this: WrapWorld) {
  const fragments = chunks(this.wrap.rows);
  const indent = " ".repeat(titleColumn(this.wrap.rows) - 2);
  assert.ok(fragments.length > 1);
  assert.equal(fragments.join(" "), this.wrap.subject.title);
  this.wrap.rows.slice(1).forEach((row, index) => {
    assert.equal(plain(row).slice(2, -2).trimEnd(), indent + fragments[index + 1]);
  });
});

Then("continuation lines do NOT show the section icon, task ID, or priority icon again", function (this: WrapWorld) {
  assert.ok(this.wrap.rows.length > 1);
  for (const row of this.wrap.rows.slice(1)) assert.doesNotMatch(plain(row), /◐|▲|task-\d+|▸|·/);
});

Then("all lines of that entry are highlighted with the accent color", function (this: WrapWorld) {
  const fragments = chunks(this.wrap.rows);
  assert.ok(fragments.length > 1);
  this.wrap.rows.forEach((row, index) => {
    // The priority icon retains its own color; the title carries selection color.
    assert.ok(row.includes(`<fg-accent><bold>${fragments[index]}</bold></fg-accent>`));
    assert.ok(!row.includes("<fg-success>"), "selected title must not retain its unselected section color");
  });
});

Then("continuation lines are styled consistently with the first line", function (this: WrapWorld) {
  const fragments = chunks(this.wrap.rows);
  const indent = " ".repeat(titleColumn(this.wrap.rows) - 2);
  assert.ok(this.wrap.rows.length > 1);
  this.wrap.rows.forEach((row, index) => {
    assert.ok(row.includes(`<fg-accent><bold>${fragments[index]}</bold></fg-accent>`));
    if (index > 0) assert.ok(row.includes(`<fg-accent><bold>${indent}</bold></fg-accent>`));
  });
});

Then(/^navigation \(up\/down\) moves between entries as before$/, function (this: WrapWorld) {
  const ids = tasks.map((task) => task.id);
  assert.deepEqual(this.wrap.navigation.map((state) => state.selected), [
    ids[0], ids[0], ...ids.slice(1), ids[9], ...ids.slice(0, 9).reverse(), ids[0],
  ]);
});

Then("the scroll offset is entry-based, not line-based", function (this: WrapWorld) {
  const states = this.wrap.navigation;
  const ids = tasks.map((task) => task.id);
  // Initial/up clamp and first seven down steps keep the initial window.
  const starts = [...Array(9).fill(0), 1, ...Array(9).fill(2), 1, 0, 0];
  assert.equal(states.length, starts.length);
  states.forEach((state, index) => {
    const start = starts[index];
    assert.deepEqual([...state.entries.keys()], ids.slice(start, start + 8));
    assert.equal(state.indicator, `Showing ${start + 1}-${start + 8} of 10`);
    assert.ok([...state.entries.values()].flat().length > 8, "window must contain multiline entries");
    for (const [id, rows] of state.entries) {
      assert.equal(chunks(rows).join(" "), tasks.find((task) => task.id === id)!.title,
        "scrolling must preserve whole titles, not cut off continuation lines");
    }
  });
});
