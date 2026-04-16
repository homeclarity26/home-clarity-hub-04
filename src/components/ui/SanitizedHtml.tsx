import DOMPurify from "dompurify";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

/**
 * SanitizedHtml — safely render HTML that came from AI output or rich-text
 * editing without exposing an XSS vector.
 *
 * Wraps DOMPurify with a conservative allowlist. Use this ANYWHERE you were
 * about to reach for `dangerouslySetInnerHTML`:
 *
 *   <SanitizedHtml html={aiNarrative} className="prose prose-sm" />
 *
 * We drop script/iframe/object/embed/form/input + all event handlers. We keep
 * links but force them to open in a new tab with rel="noopener noreferrer".
 */
interface SanitizedHtmlProps {
  html: string;
  className?: string;
  as?: "div" | "span" | "article" | "section";
  // Allow the caller to tighten the allowlist further (e.g. block all links)
  allowLinks?: boolean;
  allowImages?: boolean;
}

const BASE_ALLOWED_TAGS = [
  "p", "br", "strong", "em", "b", "i", "u", "s",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "blockquote", "code", "pre",
  "table", "thead", "tbody", "tr", "th", "td",
  "hr",
];

const BASE_ALLOWED_ATTR = ["class", "style", "id"];

export function SanitizedHtml({
  html,
  className,
  as: Tag = "div",
  allowLinks = true,
  allowImages = true,
}: SanitizedHtmlProps) {
  const sanitized = useMemo(() => {
    if (!html) return "";
    const allowedTags = [...BASE_ALLOWED_TAGS];
    const allowedAttr = [...BASE_ALLOWED_ATTR];
    if (allowLinks) {
      allowedTags.push("a");
      allowedAttr.push("href", "target", "rel", "title");
    }
    if (allowImages) {
      allowedTags.push("img", "figure", "figcaption");
      allowedAttr.push("src", "alt", "width", "height", "loading");
    }
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: allowedAttr,
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input", "textarea", "select", "button"],
      FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur", "onchange", "onsubmit"],
      KEEP_CONTENT: true,
      RETURN_TRUSTED_TYPE: false,
      ADD_ATTR: ["target"],
    });
  }, [html, allowLinks, allowImages]);

  // Force links to be safe: open in new tab, with noopener noreferrer.
  const finalHtml = useMemo(() => {
    if (!allowLinks) return sanitized;
    return sanitized.replace(
      /<a\s+([^>]*?)>/gi,
      (_match, attrs: string) => {
        const hasTarget = /target=/i.test(attrs);
        const hasRel = /rel=/i.test(attrs);
        const parts = [attrs.trim()];
        if (!hasTarget) parts.push('target="_blank"');
        if (!hasRel) parts.push('rel="noopener noreferrer"');
        return `<a ${parts.filter(Boolean).join(" ")}>`;
      },
    );
  }, [sanitized, allowLinks]);

  return (
    <Tag
      className={cn(className)}
      // This is safe: DOMPurify has neutralized scripts, event handlers,
      // and dangerous tags above. See the allowlist configuration.
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: finalHtml }}
    />
  );
}
