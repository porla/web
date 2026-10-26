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
      tseslint.configs.recommended,
      pluginQuery.configs["flat/recommended"],
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Route files export `Route` next to their components (the router plugin
    // handles HMR for them), and hooks/form.tsx is a hook factory.
    files: ["src/routes/**/*.tsx", "src/hooks/form.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
]);
