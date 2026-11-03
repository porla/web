import js from "@eslint/js";
import globals from "globals";
import pluginQuery from "@tanstack/eslint-plugin-query";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      pluginQuery.configs["flat/recommended"],
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Async event handlers are how React apps run actions; their errors
      // reach the query cache's handler or the console either way.
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      // The router's notFound() and redirect() are thrown by design.
      "@typescript-eslint/only-throw-error": [
        "error",
        {
          allow: [
            {
              from: "package",
              package: "@tanstack/router-core",
              name: ["NotFoundError", "Redirect"],
            },
          ],
        },
      ],
    },
  },
  {
    // Imports go through the @/ alias (or ./ within a folder) and leave out the
    // extension, so moving a file doesn't break the paths in it and every import
    // reads the same everywhere.
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../*"],
              message: "Import from @/… instead of a parent folder.",
            },
            {
              group: ["*.ts", "*.tsx"],
              message: "Leave the extension out of import paths.",
            },
          ],
        },
      ],
    },
  },
  {
    // Route files export `Route` next to their components (the router plugin
    // handles HMR for them), and components/form/app-form.tsx is a hook factory.
    files: ["src/routes/**/*.tsx", "src/components/form/app-form.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
]);
