/**
 * ESLint rule: no-inline-hex
 *
 * Flags inline hex color literals (#xxx, #xxxxxx, #xxxxxxxx) in string
 * literals and template literals inside .ts and .tsx files. Inline hex
 * is a brand-drift vector — colors live in src/index.css as HSL CSS
 * variables and surface through Tailwind tokens. After D3-D5 land, the
 * codebase has zero inline hex outside the design-token file.
 *
 * Wired in at warning level for the D-batch ship. After D5 lands, a
 * follow-up PR flips this to error.
 *
 * Options (single object):
 *   - exceptions: array of substring matches against the source-file path
 *     that bypass the rule (e.g. "src/index.css", icon SVGs, library
 *     overrides where a vendor expects a hex). Defaults below cover the
 *     known carve-outs.
 */

const HEX_PATTERN = /#([0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/;

const DEFAULT_EXCEPTIONS = [
  "src/index.css",
  ".svg",
  "src/integrations/supabase/types.ts",
];

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow inline hex color literals in TypeScript and TSX. Use CSS variables / Tailwind tokens instead.",
    },
    schema: [
      {
        type: "object",
        properties: {
          exceptions: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      inlineHex:
        "Inline hex color '{{hex}}' is not allowed. Use a CSS variable from src/index.css (e.g. hsl(var(--hbc-navy))) or a Tailwind token (e.g. bg-hbc-navy).",
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const exceptions = [
      ...DEFAULT_EXCEPTIONS,
      ...(Array.isArray(options.exceptions) ? options.exceptions : []),
    ];

    const filename = context.getFilename();
    const filenameNorm = filename.replace(/\\/g, "/");

    if (exceptions.some((ex) => filenameNorm.includes(ex))) {
      return {};
    }

    const checkLiteral = (node, raw) => {
      const match = raw && raw.match(HEX_PATTERN);
      if (match) {
        context.report({
          node,
          messageId: "inlineHex",
          data: { hex: match[0] },
        });
      }
    };

    return {
      Literal(node) {
        if (typeof node.value === "string") {
          checkLiteral(node, node.value);
        }
      },
      TemplateElement(node) {
        if (node.value && typeof node.value.raw === "string") {
          checkLiteral(node, node.value.raw);
        }
      },
    };
  },
};

export default rule;
