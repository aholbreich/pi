import { After, Given, Then, When } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { createInitFixture } from "../../tests/init-fixture.mjs";

interface InitWorld {
  initOptions: { version?: string; missing?: boolean; confirm?: boolean };
  initFixture: ReturnType<typeof createInitFixture>;
}

Given("the initialization CLI version is {string}", function (this: InitWorld, version: string) {
  this.initOptions = { version };
  this.initFixture = createInitFixture(this.initOptions);
});

Given("the initialization CLI is unavailable", function (this: InitWorld) {
  this.initOptions = { missing: true };
  this.initFixture = createInitFixture(this.initOptions);
});

Given("the task ledger is already initialized", function (this: InitWorld) {
  this.initFixture.makeLedger();
});

When("the user confirms Task Ledger initialization", async function (this: InitWorld) {
  this.initOptions.confirm = true;
  await this.initFixture.run();
});

When("the user declines Task Ledger initialization", async function (this: InitWorld) {
  this.initOptions.confirm = false;
  await this.initFixture.run();
});

When("the user requests Task Ledger initialization", async function (this: InitWorld) {
  await this.initFixture.run();
});

Then("the user receives an upgrade warning mentioning {string}", function (this: InitWorld, minimum: string) {
  assert.ok(this.initFixture.notifications.some(({ message, level }) =>
    level === "warning" && /upgrade/i.test(message) && message.includes(minimum)));
});

Then("the user receives no compatibility warning", function (this: InitWorld) {
  assert.ok(!this.initFixture.notifications.some(({ level }) => level === "warning"));
});

Then("the user is told that CLI compatibility cannot be verified", function (this: InitWorld) {
  assert.ok(this.initFixture.notifications.some(({ message, level }) =>
    level === "warning" && /cannot verify.*compatibility/i.test(message)));
});

Then("the task ledger is initialized", function (this: InitWorld) {
  assert.equal(this.initFixture.initialized(), true);
  assert.equal(this.initFixture.initCalls().length, 1);
  assert.equal(this.initFixture.refreshCount(), 1);
});

Then("the task ledger is not initialized", function (this: InitWorld) {
  assert.equal(this.initFixture.initialized(), false);
  assert.equal(this.initFixture.initCalls().length, 0);
});

Then("the task ledger is not reinitialized", function (this: InitWorld) {
  assert.equal(this.initFixture.initCalls().length, 0);
  assert.equal(this.initFixture.confirmations.length, 0);
  assert.equal(this.initFixture.initialized(), true);
});

Then("the user receives official CLI installation guidance", function (this: InitWorld) {
  assert.ok(this.initFixture.notifications.some(({ message }) =>
    message.includes("https://github.com/aholbreich/tl#installation-options")));
  assert.equal(this.initFixture.confirmations.length, 0);
});

After({ tags: "@tl-init" }, function (this: InitWorld) {
  this.initFixture?.cleanup();
});
