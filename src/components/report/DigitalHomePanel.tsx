import { Box, View, ExternalLink } from "lucide-react";

interface DigitalHomePanelProps {
  propertyAddress?: string;
  hoverUrl?: string | null;
  hoverPdfUrl?: string | null;
  iguideUrl?: string | null;
  iguidePdfUrl?: string | null;
}

const DigitalHomePanel = ({
  propertyAddress,
  hoverUrl,
  hoverPdfUrl,
  iguideUrl,
  iguidePdfUrl,
}: DigitalHomePanelProps) => {
  const hasHover = !!hoverUrl;
  const hasIguide = !!iguideUrl;

  return (
    <section>
      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent mb-2">
        Your Digital Home
      </h2>
      {propertyAddress && (
        <p className="font-sans text-sm text-muted-foreground mb-6">{propertyAddress}</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Hover.to 3D Exterior Model */}
        <div
          className={`rounded-lg border overflow-hidden ${
            hasHover
              ? "border-border bg-card shadow-hbc-sm"
              : "border-border/50 bg-muted/30"
          }`}
        >
          <div className="bg-primary px-6 py-4 flex items-center gap-3">
            <Box className="w-5 h-5 text-accent" />
            <div>
              <h3 className="font-display text-lg text-primary-foreground">3D Exterior Model</h3>
              <p className="font-mono text-[9px] uppercase tracking-wider text-primary-foreground/50">
                Powered by Hover.to
              </p>
            </div>
          </div>
          <div className="px-6 py-5">
            <p className="font-sans text-sm text-muted-foreground mb-5 leading-relaxed">
              Explore a photorealistic 3D model of your home's exterior. View detailed measurements,
              roof geometry, and elevation data.
            </p>
            {hasHover ? (
              <div className="flex flex-col gap-2">
                <a
                  href={hoverUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md text-sm font-sans font-medium text-white bg-hbc-rust transition-all hover:opacity-90"
                >
                  <ExternalLink className="w-4 h-4" />
                  Launch 3D Model
                </a>
                {hoverPdfUrl && (
                  <a
                    href={hoverPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-md text-sm font-sans text-muted-foreground hover:text-foreground border border-border hover:bg-muted transition-colors"
                  >
                    Download Measurements PDF
                  </a>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-3 rounded-md bg-muted/50 border border-border/50">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Coming soon — your advisor is setting this up
                </span>
              </div>
            )}
          </div>
        </div>

        {/* iGuide 360° Interior Tour */}
        <div
          className={`rounded-lg border overflow-hidden ${
            hasIguide
              ? "border-border bg-card shadow-hbc-sm"
              : "border-border/50 bg-muted/30"
          }`}
        >
          <div className="bg-primary px-6 py-4 flex items-center gap-3">
            <View className="w-5 h-5 text-accent" />
            <div>
              <h3 className="font-display text-lg text-primary-foreground">360° Interior Tour</h3>
              <p className="font-mono text-[9px] uppercase tracking-wider text-primary-foreground/50">
                Powered by iGuide
              </p>
            </div>
          </div>
          <div className="px-6 py-5">
            <p className="font-sans text-sm text-muted-foreground mb-5 leading-relaxed">
              Walk through every room with immersive 360° photography. View accurate floor plans,
              room dimensions, and spatial relationships.
            </p>
            {hasIguide ? (
              <div className="flex flex-col gap-2">
                <a
                  href={iguideUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md text-sm font-sans font-medium text-white bg-hbc-rust transition-all hover:opacity-90"
                >
                  <ExternalLink className="w-4 h-4" />
                  Launch 360° Tour
                </a>
                {iguidePdfUrl && (
                  <a
                    href={iguidePdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-md text-sm font-sans text-muted-foreground hover:text-foreground border border-border hover:bg-muted transition-colors"
                  >
                    Download Floor Plans PDF
                  </a>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-3 rounded-md bg-muted/50 border border-border/50">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Coming soon — your advisor is setting this up
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DigitalHomePanel;
