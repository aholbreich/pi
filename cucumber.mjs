// Cucumber.js configuration for TypeScript + ESM
// Uses tsx for zero-config TypeScript transpilation
export default {
  requireModule: ["tsx/esm"],
  require: ["features/step-definitions/**/*.ts"],
  format: ["progress-bar"],
  formatOptions: {
    snippetInterface: "async-await",
  },
  paths: ["features/"],
  publishQuiet: true,
};
