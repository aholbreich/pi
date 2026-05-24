// Compatibility wrapper.
//
// Older instructions may tell users to run `pi -e ./extensions/tl.ts`.
// The real implementation now lives in `extensions/tl/index.ts`, split into
// smaller files so it is easier to read and maintain.
export { default } from "./tl/index.js";
