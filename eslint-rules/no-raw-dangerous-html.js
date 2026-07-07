/**
 * ESLint rule: no-raw-dangerous-html
 *
 * Flags `dangerouslySetInnerHTML` used directly in JSX. All HTML injection
 * must go through the <SanitizedHtml> component (DOMPurify wrapper) so that
 * admin/AI-authored prose can't carry an XSS payload into the portal. Supabase
 * auth tokens live in localStorage, so an injected script could exfiltrate a
 * session — defense-in-depth matters here.
 *
 * Wired in at warning level: several report block components still inject raw
 * *Html fields and will be migrated to <SanitizedHtml> during the report-
 * rendering UI work. A follow-up flips this to error once that sweep lands.
 *
 * Options (single object):
 *   - exceptions: array of path substrings that may use dangerouslySetInnerHTML
 *     directly (the sanitizer itself, and library-generated markup).
 */

const DEFAULT_EXCEPTIONS = [
  "src/components/ui/SanitizedHtml.tsx",
  "src/components/ui/chart.tsx",
];

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow raw dangerouslySetInnerHTML in JSX. Use the <SanitizedHtml> component instead.",
    },
    schema: [
      {
        type: "object",
        properties: {
          exceptions: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      rawHtml:
        "Do not use dangerouslySetInnerHTML directly. Wrap the HTML in <SanitizedHtml html={...} /> so it is DOMPurify-sanitized.",
    },
  },
  create(context) {
    const options = context.options[0] || {};
    const exceptions = [...DEFAULT_EXCEPTIONS, ...(options.exceptions || [])];
    const filename = context.getFilename().replace(/\\/g, "/");
    if (exceptions.some((e) => filename.includes(e))) return {};

    return {
      JSXAttribute(node) {
        if (node.name && node.name.name === "dangerouslySetInnerHTML") {
          context.report({ node, messageId: "rawHtml" });
        }
      },
    };
  },
};

export default rule;
