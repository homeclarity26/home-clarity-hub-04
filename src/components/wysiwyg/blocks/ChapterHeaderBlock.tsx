import type { ChapterHeaderContent } from "../types";

interface ChapterHeaderBlockProps {
  content: ChapterHeaderContent;
  editable?: boolean;
  onChange?: (content: ChapterHeaderContent) => void;
}

const ChapterHeaderBlock = ({ content, editable, onChange }: ChapterHeaderBlockProps) => (
  <div className="flex items-center gap-4 py-4 border-b-2 border-primary/10">
    <div className="flex-1">
      {editable ? (
        <input
          className="w-full bg-transparent font-display text-2xl font-bold text-foreground outline-none border-b border-transparent focus:border-accent"
          value={content.title}
          onChange={(e) => onChange?.({ ...content, title: e.target.value })}
          placeholder="Chapter Title"
        />
      ) : (
        <h2 className="font-display text-2xl font-bold text-foreground">{content.title}</h2>
      )}
    </div>
    {content.score !== undefined && content.score > 0 && (
      <div className="flex items-center gap-2 bg-muted rounded-full px-3 py-1">
        <div className={`w-2 h-2 rounded-full ${
          content.score >= 80 ? "bg-accent" : content.score >= 60 ? "bg-hbc-gold" : "bg-destructive"
        }`} />
        <span className="font-mono text-xs text-foreground font-semibold">{content.score}</span>
      </div>
    )}
  </div>
);

export default ChapterHeaderBlock;
