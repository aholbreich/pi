#!/usr/bin/env node
/**
 * Generate Markdown release notes from conventional commits since the last
 * git tag. Zero dependencies — Node built-ins only.
 *
 * Usage:
 *   npm run release-notes                   # print notes to stdout
 *   npm run release-notes -- -o NOTES.md    # write notes to a file
 */

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

// Conventional-commit type -> human-readable release-notes section.
const TYPE_LABELS = {
	feat: "Features",
	fix: "Bug Fixes",
	perf: "Performance",
	refactor: "Refactoring",
	refactoring: "Refactoring",
	docs: "Documentation",
	chore: "Chores",
	build: "Chores",
	ci: "Chores",
	test: "Chores",
	style: "Chores",
	revert: "Reverts",
};

const OTHER_LABEL = "Other Changes";
const BREAKING_LABEL = "Breaking Changes";

// Section order mirrors conventional-changelog conventions.
const SECTION_ORDER = [
	BREAKING_LABEL,
	"Features",
	"Bug Fixes",
	"Performance",
	"Refactoring",
	"Documentation",
	"Reverts",
	"Chores",
	OTHER_LABEL,
];

const TYPE_RE = /^(feat|fix|perf|refactor|refactoring|docs|chore|build|ci|test|style|revert)(\([^)]*\))?(!)?:\s*(.*)$/;

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
		const out = execSync(`git log ${range} --no-merges --format=%x1f%s%x1f%b%x1e`, {
			encoding: "utf-8",
		});
		return out
			.split("\x1e")
			.map((record) => record.trim())
			.filter(Boolean)
			.map((record) => {
				const [, subject, body] = record.split("\x1f");
				return { subject: subject ?? "", body: (body ?? "").trim() };
			});
	} catch {
		return [];
	}
}

function parseCommit({ subject, body }) {
	const match = subject.match(TYPE_RE);
	if (!match) {
		return {
			label: OTHER_LABEL,
			description: subject,
			breaking: /BREAKING CHANGE/i.test(`${subject}\n${body}`),
		};
	}
	const [, type, , bang, description] = match;
	return {
		label: TYPE_LABELS[type] ?? OTHER_LABEL,
		description,
		breaking: Boolean(bang) || /BREAKING CHANGE/i.test(body),
	};
}

function groupCommits(commits) {
	const groups = new Map();
	for (const commit of commits) {
		const { label, description, breaking } = parseCommit(commit);
		if (!groups.has(label)) groups.set(label, []);
		groups.get(label).push(description);
		if (breaking) {
			if (!groups.has(BREAKING_LABEL)) groups.set(BREAKING_LABEL, []);
			groups.get(BREAKING_LABEL).push(description);
		}
	}
	return groups;
}

function renderMarkdown(tag, commitCount, groups) {
	const lines = ["# Release notes", ""];
	if (commitCount === 0) {
		lines.push(tag ? `No commits since \`${tag}\`.` : "No commits found.");
		return lines.join("\n") + "\n";
	}
	lines.push(tag ? `Changes since \`${tag}\` (${commitCount} commit${commitCount === 1 ? "" : "s"}).` : `All changes (${commitCount} commit${commitCount === 1 ? "" : "s"}).`);

	const ordered = SECTION_ORDER.filter((label) => groups.has(label));
	const extra = [...groups.keys()].filter((label) => !SECTION_ORDER.includes(label));
	for (const label of [...ordered, ...extra]) {
		lines.push("", `## ${label}`, "");
		for (const item of groups.get(label)) lines.push(`- ${item}`);
	}
	return lines.join("\n") + "\n";
}

function parseArgs(argv) {
	const fileIndex = argv.findIndex((arg) => arg === "-o" || arg === "--file" || arg === "--output");
	if (fileIndex === -1) return { file: null };
	const file = argv[fileIndex + 1];
	if (!file) {
		console.error("Missing file path after --file/-o");
		process.exit(1);
	}
	return { file };
}

const { file } = parseArgs(process.argv.slice(2));
const tag = getLastTag();
const commits = getCommitsSince(tag);
const groups = groupCommits(commits);
const markdown = renderMarkdown(tag, commits.length, groups);

if (file) {
	writeFileSync(file, markdown);
	console.log(`Release notes written to ${file}`);
} else {
	process.stdout.write(markdown);
}
