/**
 * ESLint rule: no-em-dashes-in-jsx
 *
 * Flags the em-dash character (U+2014) when it appears in JSX text that
 * ends up rendered in the DOM. Em-dashes in UI strings are a brand
 * inconsistency: the HCR design system uses contextually-appropriate
 * punctuation (colon, comma, en-dash, or prose rewrite) instead.
 *
 * Flagged locations:
 *   - JSXText nodes (literal text between JSX tags)
 *   - JSXAttribute string literal values  (e.g. placeholder="foo — bar")
 *   - TemplateLiteral quasis that appear as a JSX attribute value (best-effort)
 *
 * NOT flagged:
 *   - Code comments (// — or /* — *\/)
 *   - String literals used as plain function arguments (AI prompt strings, etc.)
 *   - Non-JSX TypeScript/JS code
 *
 * Severity: warn for the D1 PR. Flip to error after the sweep confirms clean.
 *
 * Exceptions (single object option):
 *   - exceptions: array of source-file path substrings that bypass the rule
 *     (e.g. the eslint-rules/ directory itself, PDF renderers using — as a
 *      bullet glyph, etc.)
 */

const EM_DASH = "—";

const DEFAULT_EXCEPTIONS = [
  // The rule file itself
  "eslint-rules/",
  // @react-pdf/renderer Text nodes use — as a visual bullet — that is fine
  "src/features/pdf/",
  // Generated Supabase types
  "src/integrations/supabase/types.ts",
];

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow em-dash (U+2014) in JSX text and JSX attribute strings. Use contextually-appropriate punctuation instead (colon, comma, or prose rewrite).",
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
      emDashInJsx:
        "Em-dash (—) found in JSX text. Replace with contextually-appropriate punctuation: colon (': '), comma (', '), or a prose rewrite. See CLAUDE.md D1.",
      emDashInAttr:
        "Em-dash (—) found in JSX attribute string '{{value}}'. Replace with contextually-appropriate punctuation. See CLAUDE.md D1.",
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const exceptions = [
      ...DEFAULT_EXCEPTIONS,
      ...(Array.isArray(options.exceptions) ? options.exceptions : []),
    ];

    const filename = context.getFilename().replace(/\\/g, "/");
    if (exceptions.some((ex) => filename.includes(ex))) {
      return {};
    }

    /**
     * Check whether a node is (or is the direct value of) a JSXAttribute.
     * We use this to distinguish `<Foo bar="x — y" />` (flag) from
     * `callFn("x — y")` (skip).
     */
    const isInsideJSXAttribute = (node) => {
      let current = node.parent;
      while (current) {
        if (current.type === "JSXAttribute") return true;
        // Stop climbing when we leave the JSX world
        if (
          current.type === "CallExpression" ||
          current.type === "VariableDeclarator" ||
          current.type === "AssignmentExpression" ||
          current.type === "Property" ||
          current.type === "ReturnStatement" ||
          current.type === "ExpressionStatement"
        ) {
          return false;
        }
        current = current.parent;
      }
      return false;
    };

    return {
      // Literal text between JSX tags: <p>Hello — world</p>
      JSXText(node) {
        if (node.value && node.value.includes(EM_DASH)) {
          context.report({ node, messageId: "emDashInJsx" });
        }
      },

      // String literals that are JSX attribute values: placeholder="foo — bar"
      Literal(node) {
        if (
          typeof node.value === "string" &&
          node.value.includes(EM_DASH) &&
          node.parent &&
          node.parent.type === "JSXAttribute"
        ) {
          context.report({
            node,
            messageId: "emDashInAttr",
            data: { value: node.value.slice(0, 60) },
          });
        }
      },

      // Template literals used as JSX attribute values: title={`foo — bar`}
      TemplateLiteral(node) {
        if (!isInsideJSXAttribute(node)) return;
        for (const quasi of node.quasis) {
          if (quasi.value && quasi.value.raw && quasi.value.raw.includes(EM_DASH)) {
            context.report({ node: quasi, messageId: "emDashInJsx" });
            return; // one report per template literal is enough
          }
        }
      },
    };
  },
};

export default rule;
