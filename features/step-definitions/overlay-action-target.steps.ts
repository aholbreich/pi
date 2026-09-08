import { Given, When, Then, type DataTable } from "@cucumber/cucumber";
import type { Theme } from "@earendil-works/pi-coding-agent";
import assert from "node:assert/strict";
import { renderOverlayLines } from "../../extensions/tl/task-summary-overlay.js";
import { renderTaskLine } from "../../extensions/tl/tasks.js";

type Snapshot = Parameters<typeof renderOverlayLines>[0];
interface ActionWorld {
  actionOverlay: { snapshot: Snapshot; lines: string[] };
}

const theme = {
  fg: (color: string, text: string) => `<${color}>${text}</${color}>`,
  bold: (text: string) => text,
} as Theme;
const plain = (text: string) => text.replace(/<\/?[a-z]+>/g, "");
const legendText = "Alt: i implement · r refine · p plan";

Given("the action overlay contains these tasks:", function (this: ActionWorld, table: DataTable) {
  const snapshot: Snapshot = { ready: [], inProgress: [], blocked: [], pendingHuman: [], stale: [] };
  for (const row of table.hashes()) {
    assert.ok(["Ready", "Pending"].includes(row.section));
    const list = row.section === "Ready" ? snapshot.ready : snapshot.pendingHuman;
    list.push({ id: row.id, title: row.title, priority: "medium" });
  }
  this.actionOverlay = { snapshot, lines: [] };
});

When("the action overlay is rendered", function (this: ActionWorld) {
  this.actionOverlay.lines = renderOverlayLines(this.actionOverlay.snapshot, theme, 100, (section, task, width) =>
    renderTaskLine(theme, { prefix: "├─ ", sectionIcon: section.icon, task, primaryColor: section.color, width }),
  );
});

Then("the dim action legend is nested beneath {string}", function (this: ActionWorld, id: string) {
  const { lines } = this.actionOverlay;
  const legends = lines.filter((line) => plain(line).includes(legendText));
  assert.equal(legends.length, 1);
  const index = lines.indexOf(legends[0]);
  assert.ok(index > 0);
  assert.ok(plain(lines[index - 1]).includes(id));
  assert.match(plain(legends[0]), /^[│ ]    ↳ Alt:/);
  assert.doesNotMatch(plain(legends[0]), /^[├└]─/);
  assert.ok(legends[0].includes(`<dim>${plain(legends[0])}</dim>`), "entire action line stays dim");
});

Then("the action legend continues the outer tree toward the next task", function (this: ActionWorld) {
  const legend = this.actionOverlay.lines.map(plain).find((line) => line.includes(legendText));
  assert.ok(legend?.startsWith("│    ↳ "));
});

Then("the action legend has no dangling outer tree connector", function (this: ActionWorld) {
  const legend = this.actionOverlay.lines.map(plain).find((line) => line.includes(legendText));
  assert.ok(legend?.startsWith("     ↳ "));
});

Then("the final task branch belongs to {string}", function (this: ActionWorld, id: string) {
  const finalBranches = this.actionOverlay.lines.map(plain).filter((line) => line.startsWith("└─"));
  assert.equal(finalBranches.length, 1);
  assert.ok(finalBranches[0].includes(id));
});

Then("the action overlay shows no action legend", function (this: ActionWorld) {
  assert.ok(this.actionOverlay.lines.every((line) => !plain(line).includes("Alt:")));
});
