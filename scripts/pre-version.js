#!/usr/bin/env node
/**
 * Pre-version hook — validates the repo is ready for `npm version`.
 * Called by npm's `preversion` lifecycle (runs BEFORE the version bump,
 * unlike `version` which runs after npm already modified package.json).
 *
 * Checks:
 *   1. On main branch
 *   2. Working tree is clean (no unstaged or uncommitted changes)
 *   3. Up to date with origin (no unpushed commits)
 */

import { execSync } from "node:child_process";

function fail(msg) {
  console.error(`\n  ✗ ${msg}\n`);
  process.exit(1);
}

// 1. Must be on main
const branch = execSync("git branch --show-current", { encoding: "utf-8" }).trim();
if (branch !== "main") {
  fail(`Must be on 'main' branch to version. Currently on '${branch}'.`);
}

// 2. Working tree must be clean
const status = execSync("git status --porcelain", { encoding: "utf-8" }).trim();
if (status) {
  console.error(status);
  fail("Working tree is not clean. Commit or stash changes first.");
}

// 3. In sync with origin (nothing unpushed)
try {
  const behind = execSync("git rev-list --count HEAD..@{u} 2>/dev/null || echo 0", {
    encoding: "utf-8",
  }).trim();
  if (behind !== "0") {
    fail(`Branch is behind origin by ${behind} commit(s). Pull first.`);
  }
} catch {
  // No upstream configured — warn but don't block
  console.warn("  ⚠  No upstream branch configured. Push after versioning.");
}

console.log("  ✓ On main, tree clean — ready to version\n");
