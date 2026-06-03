#!/usr/bin/env node
/**
 * Determine the recommended semver bump type from conventional commits
 * since the last git tag.
 *
 * Zero dependencies — uses only Node built-ins.
 *
 * Usage:
 *   node scripts/determine-version.js
 *
 * Exit code:
 *   0 — recommendation found
 *   1 — no commits since last tag (nothing to release)
 */

import { execSync } from "node:child_process";

function getLastTag() {
  try {
    const out = execSync("git describe --tags --abbrev=0 2>/dev/null || echo ''", {
      encoding: "utf-8",
    }).trim();
    return out || null;
  } catch {
    return null;
  }
}

function getCommitsSince(tag) {
  const range = tag ? `${tag}..HEAD` : "HEAD";
  try {
    const out = execSync(`git log ${range} --oneline --no-merges`, {
      encoding: "utf-8",
    }).trim();
    return out ? out.split("\n") : [];
  } catch {
    return [];
  }
}

function analyzeCommits(commits) {
  const counts = { major: 0, minor: 0, patch: 0 };
  const reasons = [];

  for (const line of commits) {
    const msg = line.replace(/^[a-f0-9]+\s+/, "");
    const lowered = msg.toLowerCase();

    if (/^feat!?:/.test(lowered) || lowered.includes("breaking change:")) {
      counts.major++;
      reasons.push(msg);
    } else if (/^feat(\([^)]+\))?:/.test(lowered)) {
      counts.minor++;
    } else if (/^fix(\([^)]+\))?:/.test(lowered)) {
      counts.patch++;
    }
  }

  let bump = "patch";
  if (counts.major > 0) bump = "major";
  else if (counts.minor > 0) bump = "minor";

  return { counts, bump, reasons };
}

const tag = getLastTag();

if (!tag) {
  console.log("No git tags found. Starting fresh — recommend patch.");
  console.log("Run: npm version patch");
  process.exit(0);
}

const commits = getCommitsSince(tag);

console.log(`Commits since ${tag}:`);
if (commits.length === 0) {
  console.log("  (none)");
  console.log("\nNo commits since last tag. Nothing to release.");
  process.exit(1);
}

for (const c of commits) {
  console.log(`  ${c}`);
}

const { counts, bump, reasons } = analyzeCommits(commits);

const parts = [];
if (counts.major > 0) parts.push(`${counts.major} breaking`);
if (counts.minor > 0) parts.push(`${counts.minor} feat`);
if (counts.patch > 0) parts.push(`${counts.patch} fix`);

const nonConv = commits.length - (counts.major + counts.minor + counts.patch);
if (nonConv > 0) parts.push(`${nonConv} other`);

console.log(`\nRecommended bump: ${bump} (${parts.join(", ")})`);

if (reasons.length > 0) {
  console.log("\n⚠  Breaking changes detected:");
  for (const r of reasons) console.log(`   ${r}`);
}

console.log(`\nRun: npm version ${bump}`);
