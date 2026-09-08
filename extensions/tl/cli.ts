import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const DEFAULT_TIMEOUT_MS = 30_000;
const VERSION_TIMEOUT_MS = 2_000;

/** Stable compatibility floor; development suffixes are not part of the minimum. */
export const MIN_TL_VERSION = "0.9.0";

export type TlRun = {
	args: string[];
	command: string[];
	cwd: string;
	exitCode: number;
	killed?: boolean;
	stdout: string;
	stderr: string;
	json?: unknown;
	jsonParseError?: string;
};

export type TlToolResult = {
	content: Array<{ type: "text"; text: string }>;
	details: Record<string, unknown>;
	isError?: boolean;
};

type TlColor = "auto" | "never" | "always";

type RunTlOptions = {
	parseJson?: boolean;
	timeoutMs?: number;
	/** Keep agent tools color-free; allow human UI commands to opt into color. */
	color?: TlColor;
};

/**
 * Quote values only for display. Execution uses argv arrays, so this is just
 * to make output like `$ tl ready --json` readable for the user/model.
 */
function shellQuote(value: string): string {
	return /^[A-Za-z0-9_./:=@-]+$/.test(value) ? value : JSON.stringify(value);
}

function formatCommand(command: string[]): string {
	return command.map(shellQuote).join(" ");
}

function stringifyError(error: unknown): string {
	if (error instanceof Error) return error.message;
	return String(error);
}

/**
 * Run the real `tl` executable through Pi's process helper.
 *
 * `pi.exec("tl", args, ...)` avoids shell parsing and lets Pi cancel/timeout the
 * process using the current turn's AbortSignal.
 */
export async function runTl(
	pi: ExtensionAPI,
	ctx: Pick<ExtensionContext, "cwd" | "signal">,
	args: string[],
	options: RunTlOptions = {},
): Promise<TlRun> {
	const color = options.color ?? "never";
	const fullArgs = ["--color", color, ...args];
	const result = await pi.exec("tl", fullArgs, {
		cwd: ctx.cwd,
		signal: ctx.signal,
		timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
	});

	const run: TlRun = {
		args,
		command: ["tl", ...fullArgs],
		cwd: ctx.cwd,
		exitCode: result.code ?? 1,
		killed: result.killed,
		stdout: result.stdout ?? "",
		stderr: result.stderr ?? "",
	};

	if (options.parseJson && run.stdout.trim() !== "") {
		try {
			run.json = JSON.parse(run.stdout);
		} catch (error) {
			run.jsonParseError = stringifyError(error);
		}
	}

	return run;
}

/** Probe once per call so setup flows can retry after installing/upgrading tl. */
async function probeTlVersion(pi: ExtensionAPI, ctx: Pick<ExtensionContext, "cwd" | "signal">): Promise<string | null> {
	try {
		const run = await runTl(pi, ctx, ["--version"], { timeoutMs: VERSION_TIMEOUT_MS });
		return run.exitCode === 0 && !run.killed ? run.stdout.trim() : null;
	} catch {
		// Missing executable, spawn failure, cancellation, or timeout.
		return null;
	}
}

/** Availability means the executable runs successfully, even if its version is unknown. */
export async function isTlAvailable(pi: ExtensionAPI, ctx: Pick<ExtensionContext, "cwd" | "signal">): Promise<boolean> {
	return (await probeTlVersion(pi, ctx)) !== null;
}

/**
 * Read a semantic version without the CLI label or optional v prefix.
 * Preserve prerelease/build metadata; return null for failed probes or unknown
 * formats (including unversioned development builds). This does not enforce
 * MIN_TL_VERSION: callers decide how to handle older versions.
 */
export async function getTlVersion(pi: ExtensionAPI, ctx: Pick<ExtensionContext, "cwd" | "signal">): Promise<string | null> {
	return parseTlVersion(await probeTlVersion(pi, ctx));
}

function parseTlVersion(output: string | null): string | null {
	if (output === null) return null;
	const match = /^(?:tl(?:\s+version)?\s+)?v?((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?)$/.exec(output);
	if (!match) return null;
	// Semver permits leading zeros in build metadata, but not numeric prerelease identifiers.
	if (match[2]?.split(".").some((part) => /^0\d+$/.test(part))) return null;
	return match[1];
}

/** Compare against the stable minimum, accounting for tl's Git build version format. */
export function isTlVersionCompatible(version: string): boolean {
	const parsed = parseTlVersion(version);
	if (parsed === null) return false;
	const [core, ...suffixParts] = parsed.split("+")[0].split("-");
	const suffix = suffixParts.join("-");
	const installed = core.split(".").map(BigInt);
	const minimum = MIN_TL_VERSION.split(".").map(BigInt);
	for (let i = 0; i < minimum.length; i++) {
		if (installed[i] !== minimum[i]) return installed[i] > minimum[i];
	}
	// tl's Makefile stamps source builds as TAG-COMMIT_COUNT-COMMIT_HASH.
	// These are builds at/after the release tag, not SemVer prereleases.
	// Only recognize that exact suffix shape; rc/beta tags remain prereleases.
	return suffix === "" || /^(?:0|[1-9]\d*)-[0-9a-f]{4,64}$/i.test(suffix);
}

function toolResultFromRun(run: TlRun): TlToolResult {
	const lines = [`$ ${formatCommand(run.command)}`];
	if (run.stdout.trim() !== "") lines.push(run.stdout.trimEnd());
	if (run.stderr.trim() !== "") lines.push(`stderr:\n${run.stderr.trimEnd()}`);
	if (run.jsonParseError) lines.push(`JSON parse warning: ${run.jsonParseError}`);
	if (run.exitCode !== 0) lines.push(`exit code: ${run.exitCode}`);

	return {
		content: [{ type: "text", text: lines.join("\n\n") }],
		details: {
			command: run.command,
			cwd: run.cwd,
			exitCode: run.exitCode,
			killed: run.killed,
			stdout: run.stdout,
			stderr: run.stderr,
			json: run.json,
			jsonParseError: run.jsonParseError,
		},
		isError: run.exitCode !== 0,
	};
}

function toolError(command: string[], cwd: string, error: unknown): TlToolResult {
	const message = stringifyError(error);
	return {
		content: [{ type: "text", text: `$ ${formatCommand(command)}\n\n${message}` }],
		details: { command, cwd, error: message },
		isError: true,
	};
}

/**
 * Convenience wrapper for custom tools: run `tl`, format stdout/stderr, and
 * convert failures into a normal tool result instead of crashing the extension.
 */
export async function runTlTool(
	pi: ExtensionAPI,
	ctx: Pick<ExtensionContext, "cwd" | "signal">,
	args: string[],
	options: RunTlOptions = {},
): Promise<TlToolResult> {
	try {
		return toolResultFromRun(await runTl(pi, ctx, args, options));
	} catch (error) {
		return toolError(["tl", "--color", "never", ...args], ctx.cwd, error);
	}
}
