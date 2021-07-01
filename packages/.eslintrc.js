const path = require("path");

module.exports = {
  root: false,
  parser: "@typescript-eslint/parser",
  parserOptions: { project: [path.resolve(__dirname, "../tsconfig.json")] },
  extends: ["leap"],
  env: { es2017: true },
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", caughtErrors: "none" },
    ],
  },
};
