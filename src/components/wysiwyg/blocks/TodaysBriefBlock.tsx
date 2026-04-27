import { useState } from "react";
import type { TodaysBriefContent, TodaysBriefAction } from "../types";

const NAVY = "#0A1628";
const GOLD = "#B87333";
const CREAM = "#EDE9E1";
const CREAM_LIGHT = "#F5F2EE";

interface TodaysBriefBlockProps {
  content: TodaysBriefContent;
  editable?: boolean;
  onChange?: (content: TodaysBriefContent) => void;
}

const TodaysBriefBlock = ({ content, editable, onChange }: TodaysBriefBlockProps) => {
  const update = (patch: Partial<TodaysBriefContent>) => onChange?.({ ...content, ...patch });
  const [whyExpanded, setWhyExpanded] = useState(false);

  const actions = content.actions ?? [];

  const buttonStyleFor = (style?: TodaysBriefAction["style"]) => {
    if (style === "ghost") {
      return { background: "transparent", color: NAVY, border: `1px solid ${NAVY}` };
    }
    return { background: GOLD, color: NAVY };
  };

  return (
    <div className="space-y-3">
      {/* Eyebrow */}
      <div className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: GOLD }}>
        {editable ? (
          <input
            className="w-full bg-transparent outline-none"
            style={{ color: GOLD }}
            value={content.eyebrow ?? "From your Concierge · generated this morning"}
            onChange={(e) => update({ eyebrow: e.target.value })}
          />
        ) : (
          content.eyebrow ?? "From your Concierge · generated this morning"
        )}
      </div>

      {/* Title */}
      {editable ? (
        <input
          className="w-full bg-transparent font-display text-xl sm:text-2xl text-foreground outline-none"
          value={content.title ?? "Today's Brief"}
          onChange={(e) => update({ title: e.target.value })}
        />
      ) : (
        <h3 className="font-display text-xl sm:text-2xl text-foreground">
          {content.title ?? "Today's Brief"}
        </h3>
      )}

      {/* Cream-light card with gold left border */}
      <div
        className="rounded-lg p-5"
        style={{ background: CREAM_LIGHT, borderLeft: `3px solid ${GOLD}` }}
      >
        {editable ? (
          <textarea
            className="w-full bg-transparent text-sm leading-relaxed text-foreground border-b border-border outline-none resize-none"
            rows={5}
            value={content.briefHtml}
            onChange={(e) => update({ briefHtml: e.target.value })}
            placeholder="Brief HTML — headline (bold) + body. Allow <strong>, <br/>."
          />
        ) : (
          <div
            className="text-sm leading-relaxed text-foreground"
            dangerouslySetInnerHTML={{ __html: content.briefHtml }}
          />
        )}

        {/* Why this matters now */}
        {(editable || content.whyItMattersHtml) && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setWhyExpanded((v) => !v)}
              className="text-[11px] py-0.5"
              style={{ color: GOLD }}
            >
              {whyExpanded ? "Hide why this matters now ↑" : "Why this matters now →"}
            </button>
            {whyExpanded && (
              editable ? (
                <textarea
                  className="w-full mt-3 bg-card text-xs leading-relaxed text-foreground border border-border rounded p-3 outline-none resize-none"
                  rows={5}
                  value={content.whyItMattersHtml ?? ""}
                  onChange={(e) => update({ whyItMattersHtml: e.target.value })}
                  placeholder="Expanded explainer. Allow <strong>, <br/>."
                />
              ) : (
                <div
                  className="mt-3 p-3 rounded-md text-xs leading-relaxed text-foreground bg-card"
                  dangerouslySetInnerHTML={{ __html: content.whyItMattersHtml ?? "" }}
                />
              )
            )}
          </div>
        )}

        {/* Action buttons */}
        {(editable || actions.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.map((a, i) => (
              editable ? (
                <div key={i} className="flex gap-1 items-center bg-card border border-border rounded p-1.5 text-xs">
                  <input
                    className="bg-transparent outline-none w-40"
                    value={a.label}
                    onChange={(e) => {
                      const next = [...actions];
                      next[i] = { ...a, label: e.target.value };
                      update({ actions: next });
                    }}
                    placeholder="Button label"
                  />
                  <select
                    className="bg-transparent outline-none text-[10px]"
                    value={a.style ?? "gold"}
                    onChange={(e) => {
                      const next = [...actions];
                      next[i] = { ...a, style: e.target.value as TodaysBriefAction["style"] };
                      update({ actions: next });
                    }}
                  >
                    <option value="gold">gold</option>
                    <option value="ghost">ghost</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => update({ actions: actions.filter((_, j) => j !== i) })}
                    className="text-muted-foreground hover:text-foreground px-1"
                    aria-label="Remove action"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  key={i}
                  type="button"
                  className="rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em]"
                  style={buttonStyleFor(a.style)}
                  title={a.prompt}
                  onClick={() => {
                    // C1 wires this to ConciergePanel.open(a.prompt). Until
                    // then this is a visual no-op so the brief renders correctly.
                  }}
                >
                  {a.label}
                </button>
              )
            ))}
            {editable && actions.length < 6 && (
              <button
                type="button"
                onClick={() =>
                  update({ actions: [...actions, { label: "New action", style: "gold" } as TodaysBriefAction] })
                }
                className="text-[10px] text-muted-foreground hover:text-foreground"
              >
                + Add action
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodaysBriefBlock;
