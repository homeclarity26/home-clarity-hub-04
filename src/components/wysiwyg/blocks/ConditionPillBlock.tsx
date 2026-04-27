import type { ConditionRating, ConditionPillContent } from "../types";

// Same locked palette as ConditionRatingBlock (B1) and the inline
// ConditionDot from caldwell_prototype_v2.html line 270.
const RATING_COLORS: Record<ConditionRating, string> = {
  Excellent: "#2F6E40",
  Good: "#5A8A4F",
  Fair: "#B58A1F",
  Poor: "#B7410E",
  Critical: "#8B0000",
};

const RATINGS: ConditionRating[] = ["Excellent", "Good", "Fair", "Poor", "Critical"];

interface ConditionPillBlockProps {
  content: ConditionPillContent;
  editable?: boolean;
  onChange?: (content: ConditionPillContent) => void;
}

const ConditionPillBlock = ({ content, editable, onChange }: ConditionPillBlockProps) => {
  const rating = content.rating ?? "Good";
  const color = RATING_COLORS[rating];

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          background: color,
          display: "inline-block",
        }}
      />
      {editable ? (
        <select
          className="bg-transparent font-mono text-[10px] uppercase tracking-[0.15em] outline-none cursor-pointer"
          value={rating}
          onChange={(e) => onChange?.({ rating: e.target.value as ConditionRating })}
          style={{ color }}
        >
          {RATINGS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      ) : (
        <span
          className="font-mono text-[10px] uppercase tracking-[0.15em]"
          style={{ color }}
        >
          {rating}
        </span>
      )}
    </span>
  );
};

export default ConditionPillBlock;
