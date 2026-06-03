/**
 * Shared test helpers — reduces boilerplate across test files.
 *
 * Every test file that loads TypeScript extension modules needs a jiti
 * instance. This module centralises that setup so when the jiti loading
 * path changes only one file needs updating.
 */
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);

/**
 * Resolve jiti — first from the project's own dependencies, then from
 * pi-coding-agent's bundled copy as a fallback.
 */
export function loadJiti() {
	try {
		return require("jiti");
	} catch {
		return require(
			join(
				process.cwd(),
				"node_modules/@earendil-works/pi-coding-agent/node_modules/jiti/lib/jiti.cjs",
			),
		);
	}
}

/**
 * Load a TypeScript module from extensions/tl/ via jiti.
 *
 * @param name  Module name relative to extensions/tl/, e.g. "keys.ts"
 */
export function loadTlModule(name) {
	const { createJiti } = loadJiti();
	const jiti = createJiti(join(process.cwd(), "tests/extension.test.mjs"));
	return jiti(`../extensions/tl/${name}`);
}
