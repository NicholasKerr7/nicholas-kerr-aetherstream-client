import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default [
  {
    ignores: ["build", "coverage", "dist", "node_modules"],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      "jsx-a11y/media-has-caption": "off",
      "react/prop-types": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["*.config.mjs", "eslint.config.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ["src/**/*.test.js"],
    languageOptions: {
      globals: {
        ...globals.vitest,
      },
    },
  },
];
