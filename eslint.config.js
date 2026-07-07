import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import noInlineHex from "./eslint-rules/no-inline-hex.js";
import noFixedHeightOnProse from "./eslint-rules/no-fixed-height-on-prose.js";
import noEmDashesInJsx from "./eslint-rules/no-em-dashes-in-jsx.js";
import noRawDangerousHtml from "./eslint-rules/no-raw-dangerous-html.js";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      hcr: {
        rules: {
          "no-inline-hex": noInlineHex,
          "no-fixed-height-on-prose": noFixedHeightOnProse,
          "no-em-dashes-in-jsx": noEmDashesInJsx,
          "no-raw-dangerous-html": noRawDangerousHtml,
        },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // D6 / D7 — both warnings until the color sweep (D3-D5) and the
      // expanding-container sweep land. Follow-up PRs flip these to error.
      "hcr/no-inline-hex": "warn",
      "hcr/no-fixed-height-on-prose": "warn",
      // D1 — flip to error after sweep confirms clean
      "hcr/no-em-dashes-in-jsx": "warn",
      // M1 — warn until the report block components are migrated to
      // <SanitizedHtml> during the report-rendering UI work, then flip to error.
      "hcr/no-raw-dangerous-html": "warn",
    },
  },
);
