/**
 * Helpers for building argv arrays for the `tl` CLI.
 *
 * We pass arguments as an array (`["ready", "--json"]`) instead of building one
 * big shell string. That avoids quoting bugs and shell-injection surprises.
 */

export function addOptional(args: string[], flag: string, value: unknown): void {
	if (typeof value === "string" && value.trim() !== "") args.push(flag, value.trim());
}

export function addBoolean(args: string[], flag: string, value: unknown): void {
	if (value === true) args.push(flag);
}

export function addPositional(args: string[], value: unknown): void {
	if (typeof value === "string" && value.trim() !== "") args.push(value.trim());
}

export function addTags(args: string[], tags: unknown): void {
	if (!Array.isArray(tags)) return;
	for (const tag of tags) {
		if (typeof tag === "string" && tag.trim() !== "") args.push("--tag", tag.trim());
	}
}
