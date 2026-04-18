import { useState } from "react";
import { Box, View, ExternalLink, X, Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  const [hoverModalOpen, setHoverModalOpen] = useState(false);
  const [iguideModalOpen, setIguideModalOpen] = useState(false);

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

          {/* Inline iframe preview when URL available */}
          {hasHover && (
            <div className="relative w-full" style={{ height: "240px" }}>
              <iframe
                src={hoverUrl!}
                className="w-full h-full border-0"
                title="Hover.to 3D Model"
                allow="fullscreen"
                loading="lazy"
              />
              <button
                onClick={() => setHoverModalOpen(true)}
                className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-md p-1.5 border border-border hover:bg-background transition-colors cursor-pointer"
                title="View fullscreen"
              >
                <Maximize2 className="w-4 h-4 text-foreground" />
              </button>
            </div>
          )}

          <div className="px-6 py-5">
            <p className="font-sans text-sm text-muted-foreground mb-5 leading-relaxed">
              Explore a photorealistic 3D model of your home's exterior. View detailed measurements,
              roof geometry, and elevation data.
            </p>
            {hasHover ? (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => setHoverModalOpen(true)}
                  className="gap-2 font-sans bg-hbc-rust hover:bg-hbc-rust/90 text-white"
                >
                  <Maximize2 className="w-4 h-4" />
                  Open Fullscreen 3D Model
                </Button>
                <a
                  href={hoverUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-md text-sm font-sans text-muted-foreground hover:text-foreground border border-border hover:bg-muted transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in New Tab
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
                  Not yet uploaded
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

          {/* Inline iframe preview when URL available */}
          {hasIguide && (
            <div className="relative w-full" style={{ height: "240px" }}>
              <iframe
                src={iguideUrl!}
                className="w-full h-full border-0"
                title="iGuide 360° Tour"
                allow="fullscreen"
                loading="lazy"
              />
              <button
                onClick={() => setIguideModalOpen(true)}
                className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-md p-1.5 border border-border hover:bg-background transition-colors cursor-pointer"
                title="View fullscreen"
              >
                <Maximize2 className="w-4 h-4 text-foreground" />
              </button>
            </div>
          )}

          <div className="px-6 py-5">
            <p className="font-sans text-sm text-muted-foreground mb-5 leading-relaxed">
              Walk through every room with immersive 360° photography. View accurate floor plans,
              room dimensions, and spatial relationships.
            </p>
            {hasIguide ? (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => setIguideModalOpen(true)}
                  className="gap-2 font-sans bg-hbc-rust hover:bg-hbc-rust/90 text-white"
                >
                  <Maximize2 className="w-4 h-4" />
                  Open Fullscreen Tour
                </Button>
                <a
                  href={iguideUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-md text-sm font-sans text-muted-foreground hover:text-foreground border border-border hover:bg-muted transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in New Tab
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
                  Not yet uploaded
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hover.to Fullscreen Modal */}
      <Dialog open={hoverModalOpen} onOpenChange={setHoverModalOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 gap-0">
          <DialogHeader className="px-6 py-3 border-b border-border flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <Box className="w-5 h-5 text-accent" />
              <DialogTitle className="font-display text-lg">3D Exterior Model</DialogTitle>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0" style={{ height: "calc(90vh - 60px)" }}>
            {hoverUrl && (
              <iframe
                src={hoverUrl}
                className="w-full h-full border-0"
                title="Hover.to 3D Model — Fullscreen"
                allow="fullscreen"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* iGuide Fullscreen Modal */}
      <Dialog open={iguideModalOpen} onOpenChange={setIguideModalOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 gap-0">
          <DialogHeader className="px-6 py-3 border-b border-border flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <View className="w-5 h-5 text-accent" />
              <DialogTitle className="font-display text-lg">360° Interior Tour</DialogTitle>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0" style={{ height: "calc(90vh - 60px)" }}>
            {iguideUrl && (
              <iframe
                src={iguideUrl}
                className="w-full h-full border-0"
                title="iGuide 360° Tour — Fullscreen"
                allow="fullscreen"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default DigitalHomePanel;
