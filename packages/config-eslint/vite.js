import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

// export default tseslint.config(
//   // enable TS lang support
//   tseslint.configs.base,
//   // enable linting of TS files
//   { files: tseslint.configs["eslint-recommended"].files },
//   {
//     plugins: {
//       "react-hooks": reactHooks,
//       "react-refresh": reactRefresh,
//     },
//   },
//   {
//     rules: {
//       ...reactHooks.configs.recommended.rules,
//       "@typescript-eslint/no-explicit-any": ["warn"],
//       "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
//     },
//   },
// );

export default tseslint.config({
  extends: [js.configs.recommended, ...tseslint.configs.recommended],
  files: ["**/*.{ts,tsx}"],
  ignores: ["dist"],
  languageOptions: {
    ecmaVersion: 2020,
    globals: {
      ...globals.browser,
      ...globals.node,
    },
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
      ecmaVersion: 12,
      sourceType: "module",
    },
  },
  plugins: {
    "react-hooks": reactHooks,
    "react-refresh": reactRefresh,
  },
  rules: {
    ...reactHooks.configs.recommended.rules,
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/no-explicit-any": ["warn"],
    "react-refresh/only-export-components": ["off"],

    // Customize indentation
    indent: [
      "error",
      2,
      {
        SwitchCase: 1,
        VariableDeclarator: 1,
        outerIIFEBody: 1,
      },
    ],

    // Enforce consistent linebreak style
    "linebreak-style": ["error", "unix"],

    // Enforce consistent quotes
    quotes: ["error", "double"],

    // Enforce consistent spacing
    "space-before-blocks": "error",
    "space-before-function-paren": [
      "error",
      {
        anonymous: "always",
        named: "never",
        asyncArrow: "always",
      },
    ],
  },
});
