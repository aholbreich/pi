import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Small helper used by the extension to detect whether the current repository
 * has already been initialized with `tl init`.
 *
 * `Pick<ExtensionContext, "cwd">` means: we only require the `cwd` property
 * from Pi's full ExtensionContext object, not the whole context.
 */
export function hasLedger(ctx: Pick<ExtensionContext, "cwd">): boolean {
	return existsSync(join(ctx.cwd, ".tl"));
}
