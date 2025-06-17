import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";
import onlyWarn from "eslint-plugin-only-warn";

/**
 * A shared ESLint configuration for TypeScript libraries.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const config = [
  {
    ignores: ["dist/**", "node_modules/**", ".turbo/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    plugins: {
      turbo: turboPlugin,
      onlyWarn,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn", // Allow flexibility for libraries
      "@typescript-eslint/no-unused-vars": "warn", // Allow flexibility during development
    },
  },
];
