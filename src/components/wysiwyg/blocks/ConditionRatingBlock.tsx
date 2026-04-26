import type { ConditionRating, ConditionRatingContent } from "../types";

// Locked palette per the v2 prototype's ConditionDot (caldwell_prototype_v2.html
// line 270). These five hex values are the visual signature of the rating
// system — kept inline rather than in tailwind.config so a stray theme tweak
// can't drift them. The future no-inline-hex ESLint rule (D6) will need this
// file in its exception list.
const RATING_COLORS: Record<ConditionRating, string> = {
  Excellent: "#2F6E40",
  Good: "#5A8A4F",
  Fair: "#B58A1F",
  Poor: "#B7410E",
  Critical: "#8B0000",
};

const RATINGS: ConditionRating[] = ["Excellent", "Good", "Fair", "Poor", "Critical"];

interface ConditionRatingBlockProps {
  content: ConditionRatingContent;
  editable?: boolean;
  onChange?: (content: ConditionRatingContent) => void;
}

const ConditionRatingBlock = ({ content, editable, onChange }: ConditionRatingBlockProps) => {
  const rating = content.rating ?? "Good";
  const color = RATING_COLORS[rating];

  return (
    <div className="bg-card border border-border rounded-lg p-5 text-center space-y-2">
      {editable ? (
        <input
          className="w-full text-center bg-transparent font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground outline-none"
          value={content.label ?? ""}
          onChange={(e) => onChange?.({ ...content, label: e.target.value })}
          placeholder="Condition"
        />
      ) : (
        content.label && (
          <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            {content.label}
          </div>
        )
      )}

      <div className="flex items-center justify-center gap-2">
        <span
          aria-hidden
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            background: color,
            display: "inline-block",
          }}
        />
        {editable ? (
          <select
            className="bg-transparent font-mono text-sm uppercase tracking-[0.15em] outline-none cursor-pointer"
            value={rating}
            onChange={(e) =>
              onChange?.({ ...content, rating: e.target.value as ConditionRating })
            }
            style={{ color }}
          >
            {RATINGS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        ) : (
          <span
            className="font-mono text-sm uppercase tracking-[0.15em]"
            style={{ color }}
          >
            {rating}
          </span>
        )}
      </div>

      {editable ? (
        <input
          className="w-full text-center bg-transparent text-xs text-muted-foreground outline-none"
          value={content.notes ?? ""}
          onChange={(e) => onChange?.({ ...content, notes: e.target.value })}
          placeholder="Optional note"
        />
      ) : (
        content.notes && (
          <div className="text-xs text-muted-foreground">{content.notes}</div>
        )
      )}
    </div>
  );
};

export default ConditionRatingBlock;
