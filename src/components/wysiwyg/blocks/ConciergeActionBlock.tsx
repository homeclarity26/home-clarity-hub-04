import type { ConciergeActionContent } from "../types";

const NAVY = "#0A1628";
const GOLD = "#B87333";
const RUST = "#B7410E";
const CREAM = "#EDE9E1";
const CREAM_LIGHT = "#F5F2EE";

interface ConciergeActionBlockProps {
  content: ConciergeActionContent;
  editable?: boolean;
  onChange?: (content: ConciergeActionContent) => void;
}

const buttonStyleFor = (style: ConciergeActionContent["style"]) => {
  switch (style) {
    case "rust":
      return { background: RUST, color: CREAM };
    case "navy":
      return { background: NAVY, color: CREAM };
    case "gold":
    default:
      return { background: GOLD, color: NAVY };
  }
};

const ConciergeActionBlock = ({ content, editable, onChange }: ConciergeActionBlockProps) => {
  const update = (patch: Partial<ConciergeActionContent>) => onChange?.({ ...content, ...patch });
  const style = content.style ?? "gold";

  return (
    <div
      className="rounded-md p-4 flex justify-between items-center gap-4 flex-wrap"
      style={{ background: CREAM_LIGHT }}
    >
      <div className="flex-1 min-w-0">
        {editable ? (
          <input
            className="w-full bg-transparent font-mono text-[10px] uppercase tracking-[0.15em] outline-none"
            style={{ color: GOLD }}
            value={content.eyebrow ?? ""}
            onChange={(e) => update({ eyebrow: e.target.value })}
            placeholder="Eyebrow (e.g. Concierge Action)"
          />
        ) : (
          content.eyebrow && (
            <div
              className="font-mono text-[10px] uppercase tracking-[0.15em]"
              style={{ color: GOLD }}
            >
              {content.eyebrow}
            </div>
          )
        )}
        {editable ? (
          <input
            className="w-full mt-1 bg-transparent text-sm outline-none border-b border-border"
            style={{ color: NAVY }}
            value={content.label}
            onChange={(e) => update({ label: e.target.value })}
            placeholder="Visible button label"
          />
        ) : (
          <div className="text-sm mt-0.5" style={{ color: NAVY }}>
            {content.label}
          </div>
        )}
        {editable && (
          <input
            className="w-full mt-1 bg-transparent text-xs text-muted-foreground outline-none border-b border-border"
            value={content.prompt}
            onChange={(e) => update({ prompt: e.target.value })}
            placeholder="Prefilled Concierge prompt"
          />
        )}
      </div>
      <div className="flex items-center gap-2">
        {editable && (
          <select
            className="bg-transparent text-xs outline-none border-b border-border text-muted-foreground"
            value={style}
            onChange={(e) => update({ style: e.target.value as ConciergeActionContent["style"] })}
          >
            <option value="gold">gold</option>
            <option value="rust">rust</option>
            <option value="navy">navy</option>
          </select>
        )}
        <button
          type="button"
          className="rounded-md px-4 py-2 font-mono text-xs uppercase tracking-[0.15em]"
          style={buttonStyleFor(style)}
          title={content.prompt}
          onClick={() => {
            // C1 will wire this to ConciergePanel.open(content.prompt). Until
            // then this is a visual no-op — the block renders correctly in
            // reports and the button is tappable but performs no action.
          }}
        >
          {content.label || "Open Concierge"}
        </button>
      </div>
    </div>
  );
};

export default ConciergeActionBlock;
