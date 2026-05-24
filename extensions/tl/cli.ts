import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const DEFAULT_TIMEOUT_MS = 30_000;

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
