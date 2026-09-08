import { After, Given, Then, When } from "@cucumber/cucumber";
import type { ExtensionAPI, ExtensionUIContext } from "@earendil-works/pi-coding-agent";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as cli from "../../extensions/tl/cli.js";
import { TaskLedgerOverlay } from "../../extensions/tl/task-summary-overlay.js";

// Add scenario-local state without replacing the board suite's World constructor.
interface CliWorld {
  cliFixture: {
    output: string;
    failure?: string;
    available?: boolean;
    version?: string | null;
    status?: string;
    cwd?: string;
  };
}

function fixturePi(world: CliWorld): ExtensionAPI {
  return {
    exec: async (_command: string, args: string[]) => {
      if (!args.includes("--version")) return { code: 0, stdout: "[]", stderr: "", killed: false };
      const { output, failure } = world.cliFixture;
      if (failure === "the executable is absent") throw new Error("spawn tl ENOENT");
      return {
        code: failure ? 1 : 0,
        stdout: output,
        stderr: failure ?? "",
        killed: failure === "the command times out",
      };
    },
  } as ExtensionAPI;
}

Given("the Task Ledger CLI reports version {string}", function (this: CliWorld, version: string) {
  this.cliFixture = { output: `tl version ${version}\n` };
});

Given("the Task Ledger CLI is unusable because {string}", function (this: CliWorld, reason: string) {
  this.cliFixture = { output: "", failure: reason };
});

Given("the Task Ledger CLI reports an unrecognized version", function (this: CliWorld) {
  this.cliFixture = { output: "tl version dev\n" };
});

When("the extension checks the CLI installation", async function (this: CliWorld) {
  const pi = fixturePi(this);
  const ctx = { cwd: process.cwd(), signal: undefined };
  this.cliFixture.available = await cli.isTlAvailable(pi, ctx);
  this.cliFixture.version = await cli.getTlVersion(pi, ctx);
});

When("the task summary refreshes", async function (this: CliWorld) {
  const cwd = mkdtempSync(join(tmpdir(), "pi-tl-cli-bdd-"));
  this.cliFixture.cwd = cwd;
  mkdirSync(join(cwd, ".tl"));
  const overlay = new TaskLedgerOverlay(fixturePi(this));
  await overlay.refresh({
    cwd,
    signal: undefined,
    hasUI: true,
    ui: {
      theme: { fg: (_color: string, text: string) => text },
      setStatus: (_key: string, text: string) => { this.cliFixture.status = text; },
      setWidget: () => {},
    } as ExtensionUIContext,
  });
  overlay.dispose();
});

Then("the CLI is reported as unavailable", function (this: CliWorld) {
  assert.equal(this.cliFixture.available, false);
});

Then("the CLI is reported as available", function (this: CliWorld) {
  assert.equal(this.cliFixture.available, true);
});

Then("the installed CLI version is unknown", function (this: CliWorld) {
  assert.equal(this.cliFixture.version, null);
});

Then("the task summary status includes {string}", function (this: CliWorld, label: string) {
  assert.ok(this.cliFixture.status?.includes(label));
});

Then("the task summary status is {string}", function (this: CliWorld, label: string) {
  assert.equal(this.cliFixture.status, label);
});

After({ tags: "@tl-cli" }, function (this: CliWorld) {
  if (this.cliFixture?.cwd) rmSync(this.cliFixture.cwd, { recursive: true, force: true });
});
