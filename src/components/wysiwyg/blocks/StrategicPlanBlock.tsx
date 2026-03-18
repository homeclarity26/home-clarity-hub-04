import { Target } from "lucide-react";
import type { StrategicPlanContent } from "../types";

interface StrategicPlanBlockProps {
  content: StrategicPlanContent;
  editable?: boolean;
  onChange?: (content: StrategicPlanContent) => void;
}

const urgencyColors: Record<string, string> = {
  urgent: "bg-destructive/10 text-destructive border-destructive/30",
  soon: "bg-hbc-gold/10 text-accent-foreground border-accent/30",
  future: "bg-muted text-muted-foreground border-border",
};

const StrategicPlanBlock = ({ content, editable, onChange }: StrategicPlanBlockProps) => (
  <div className={`rounded-lg border p-5 space-y-3 ${urgencyColors[content.urgency] || urgencyColors.future}`}>
    <div className="flex items-center gap-2">
      <Target className="h-4 w-4 shrink-0" />
      {editable ? (
        <input
          className="flex-1 bg-transparent font-display text-sm font-semibold outline-none"
          value={content.title}
          onChange={(e) => onChange?.({ ...content, title: e.target.value })}
          placeholder="Project Title"
        />
      ) : (
        <span className="font-display text-sm font-semibold">{content.title}</span>
      )}
    </div>
    {editable ? (
      <textarea
        className="w-full bg-transparent text-sm outline-none resize-none min-h-[40px]"
        value={content.description}
        onChange={(e) => onChange?.({ ...content, description: e.target.value })}
        placeholder="Description..."
      />
    ) : (
      <p className="text-sm">{content.description}</p>
    )}
    <div className="flex items-center gap-3 text-xs font-mono">
      {editable ? (
        <>
          <select
            className="bg-transparent outline-none"
            value={content.urgency}
            onChange={(e) => onChange?.({ ...content, urgency: e.target.value as "urgent" | "soon" | "future" })}
          >
            <option value="urgent">Urgent</option>
            <option value="soon">Soon</option>
            <option value="future">Future</option>
          </select>
          <input
            className="bg-transparent outline-none flex-1"
            value={content.timeframe}
            onChange={(e) => onChange?.({ ...content, timeframe: e.target.value })}
            placeholder="Timeframe"
          />
        </>
      ) : (
        <>
          <span className="uppercase">{content.urgency}</span>
          <span>·</span>
          <span>{content.timeframe}</span>
        </>
      )}
      {content.estimatedCost && (
        <>
          <span>·</span>
          <span>{content.estimatedCost}</span>
        </>
      )}
    </div>
  </div>
);

export default StrategicPlanBlock;
