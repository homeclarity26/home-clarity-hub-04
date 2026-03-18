import type { CoverContent } from "../types";

interface CoverBlockProps {
  content: CoverContent;
  editable?: boolean;
  onChange?: (content: CoverContent) => void;
}

const CoverBlock = ({ content, editable, onChange }: CoverBlockProps) => {
  const handleChange = (field: keyof CoverContent, value: string) => {
    onChange?.({ ...content, [field]: value });
  };

  return (
    <div className="relative bg-primary text-primary-foreground rounded-lg overflow-hidden min-h-[220px] flex flex-col justify-end p-8">
      {content.imageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${content.imageUrl})` }}
        />
      )}
      <div className="relative z-10 space-y-2">
        {editable ? (
          <>
            <input
              className="bg-transparent border-b border-primary-foreground/30 focus:border-accent outline-none w-full font-display text-3xl font-bold text-primary-foreground placeholder:text-primary-foreground/50"
              value={content.reportTitle || ""}
              onChange={(e) => handleChange("reportTitle", e.target.value)}
              placeholder="Report Title"
            />
            <input
              className="bg-transparent border-b border-primary-foreground/30 focus:border-accent outline-none w-full font-display text-xl text-primary-foreground placeholder:text-primary-foreground/50"
              value={content.propertyName || ""}
              onChange={(e) => handleChange("propertyName", e.target.value)}
              placeholder="Property Name"
            />
            <input
              className="bg-transparent border-b border-primary-foreground/30 focus:border-accent outline-none w-full text-sm text-primary-foreground/80 placeholder:text-primary-foreground/40"
              value={content.address || ""}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Address"
            />
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl font-bold">{content.reportTitle || "Home Clarity Report"}</h1>
            <h2 className="font-display text-xl">{content.propertyName}</h2>
            <p className="text-sm text-primary-foreground/80">{content.address}</p>
          </>
        )}
        {content.date && (
          <p className="text-xs text-primary-foreground/60 font-mono uppercase tracking-wider mt-4">
            {content.date}
          </p>
        )}
      </div>
    </div>
  );
};

export default CoverBlock;
