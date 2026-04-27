/**
 * ESLint rule: no-fixed-height-on-prose
 *
 * Flags Tailwind utilities `max-h-*`, `overflow-y-auto`, and
 * `line-clamp-*` on JSX elements that wrap prose. "Wrap prose" means:
 *   1. The element has a `dangerouslySetInnerHTML` attribute, OR
 *   2. The element renders a known prose-bearing component as a child
 *      (configurable via the `proseComponents` option — defaults below).
 *
 * Rationale (from CLAUDE.md HCR Rebuild Locked Principles):
 *   "Every container that holds AI-authored or admin-authored prose
 *    expands to fit content. No fixed heights. No max-height. No inner
 *    scroll on prose containers. No line-clamp on multi-line prose."
 *
 * Wired in at warning level for the D-batch ship. After the universal
 * expanding-container rebuild lands, a follow-up flips this to error.
 *
 * Options (single object):
 *   - proseComponents: array of additional component names that count
 *     as prose-bearing (default list below)
 *   - exceptions: array of source-file substring matches that bypass
 *     the rule (e.g. truncation-allowed list views, photo-caption grids)
 */

const FORBIDDEN_PATTERN =
  /\b(max-h-(?!screen\b)[^\s]+|overflow-y-auto|line-clamp-[0-9]+)\b/;

const DEFAULT_PROSE_COMPONENTS = [
  "SanitizedHtml",
  "Tiptap",
  "TiptapEditor",
  "ProseMirror",
  "AIExpandTightenField",
  "PageNarrative",
  "ReportNarrative",
];

const DEFAULT_EXCEPTIONS = [];

const findForbiddenClasses = (className) => {
  if (typeof className !== "string") return null;
  const match = className.match(FORBIDDEN_PATTERN);
  return match ? match[0] : null;
};

const elementHasDangerousHtml = (openingElement) =>
  openingElement.attributes.some(
    (a) =>
      a.type === "JSXAttribute" &&
      a.name &&
      a.name.name === "dangerouslySetInnerHTML",
  );

const collectClassName = (openingElement) => {
  for (const attr of openingElement.attributes) {
    if (attr.type !== "JSXAttribute") continue;
    if (!attr.name || attr.name.name !== "className") continue;
    if (!attr.value) return null;
    if (attr.value.type === "Literal") return attr.value.value;
    if (
      attr.value.type === "JSXExpressionContainer" &&
      attr.value.expression.type === "Literal"
    ) {
      return attr.value.expression.value;
    }
    if (
      attr.value.type === "JSXExpressionContainer" &&
      attr.value.expression.type === "TemplateLiteral"
    ) {
      return attr.value.expression.quasis.map((q) => q.value.raw).join(" ");
    }
  }
  return null;
};

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow max-h-*, overflow-y-auto, and line-clamp-* on prose-bearing elements. Universal expanding containers are the rule.",
    },
    schema: [
      {
        type: "object",
        properties: {
          proseComponents: {
            type: "array",
            items: { type: "string" },
          },
          exceptions: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      forbidden:
        "'{{cls}}' is not allowed on prose-bearing elements. Containers that hold AI- or admin-authored prose must expand to fit content. See CLAUDE.md HCR Rebuild Locked Principles.",
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const proseComponents = new Set([
      ...DEFAULT_PROSE_COMPONENTS,
      ...(Array.isArray(options.proseComponents) ? options.proseComponents : []),
    ]);
    const exceptions = [
      ...DEFAULT_EXCEPTIONS,
      ...(Array.isArray(options.exceptions) ? options.exceptions : []),
    ];
    const filename = context.getFilename().replace(/\\/g, "/");
    if (exceptions.some((ex) => filename.includes(ex))) {
      return {};
    }

    const elementChildIsProseComponent = (node) => {
      if (!node.children) return false;
      return node.children.some((child) => {
        if (child.type !== "JSXElement") return false;
        const opening = child.openingElement;
        if (!opening || !opening.name) return false;
        const name =
          opening.name.type === "JSXIdentifier" ? opening.name.name : null;
        return name && proseComponents.has(name);
      });
    };

    return {
      JSXElement(node) {
        const opening = node.openingElement;
        if (!opening) return;
        const className = collectClassName(opening);
        const forbidden = findForbiddenClasses(className);
        if (!forbidden) return;

        const isProse =
          elementHasDangerousHtml(opening) ||
          elementChildIsProseComponent(node);
        if (!isProse) return;

        context.report({
          node: opening,
          messageId: "forbidden",
          data: { cls: forbidden },
        });
      },
    };
  },
};

export default rule;
