import { Plus, X } from "lucide-react";
import type { FindingGroupContent, FindingCardContent } from "../types";
import FindingCardBlock from "./FindingCardBlock";

interface FindingGroupBlockProps {
  content: FindingGroupContent;
  editable?: boolean;
  onChange?: (content: FindingGroupContent) => void;
}

const FindingGroupBlock = ({ content, editable, onChange }: FindingGroupBlockProps) => {
  const findings = content.findings || [];

  const updateFinding = (idx: number, finding: FindingCardContent) => {
    const updated = findings.map((f, i) => (i === idx ? finding : f));
    onChange?.({ ...content, findings: updated });
  };

  const addFinding = () => {
    onChange?.({
      ...content,
      findings: [...findings, { name: "New Finding", rating: "Good", notes: "" }],
    });
  };

  const removeFinding = (idx: number) => {
    onChange?.({ ...content, findings: findings.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {editable ? (
          <input
            className="flex-1 bg-transparent font-display text-lg font-semibold text-foreground outline-none border-b border-transparent focus:border-accent"
            value={content.title}
            onChange={(e) => onChange?.({ ...content, title: e.target.value })}
            placeholder="Group Title"
          />
        ) : (
          <h3 className="font-display text-lg font-semibold text-foreground">{content.title}</h3>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {findings.map((finding, idx) => (
          <div key={idx} className="relative group">
            <FindingCardBlock
              content={finding}
              editable={editable}
              onChange={(f) => updateFinding(idx, f)}
            />
            {editable && (
              <button
                onClick={() => removeFinding(idx)}
                className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>
      {editable && (
        <button onClick={addFinding} className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 font-mono">
          <Plus className="h-3 w-3" /> Add Finding
        </button>
      )}
    </div>
  );
};

export default FindingGroupBlock;
