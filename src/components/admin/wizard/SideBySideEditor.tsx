import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eye, Pencil } from "lucide-react";

// Side-by-side admin / client view used inside Step3Authoring. Slider
// persists to localStorage as `hcr_editor_split_pct` per W3.
//
// On mobile the layout collapses to a vertical stack with a "view as client"
// toggle button; the slider hides.

const STORAGE_KEY = "hcr_editor_split_pct";
const MIN_PCT = 30;
const MAX_PCT = 80;

interface SideBySideEditorProps {
  admin: React.ReactNode;
  preview: React.ReactNode;
}

export function SideBySideEditor({ admin, preview }: SideBySideEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pct, setPct] = useState<number>(() => {
    if (typeof window === "undefined") return 60;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? Number.parseInt(stored, 10) : Number.NaN;
    if (Number.isFinite(parsed) && parsed >= MIN_PCT && parsed <= MAX_PCT) {
      return parsed;
    }
    return 60;
  });
  const [mobileView, setMobileView] = useState<"admin" | "preview">("admin");
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, String(pct));
  }, [pct]);

  // Pointer-driven slider — handles both mouse and touch via Pointer Events.
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const next = Math.round(((e.clientX - rect.left) / rect.width) * 100);
      const clamped = Math.min(MAX_PCT, Math.max(MIN_PCT, next));
      setPct(clamped);
    };
    const onUp = () => setDragging(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging]);

  return (
    <div className="space-y-3">
      {/* Mobile toggle (hidden on md+) */}
      <div className="flex md:hidden gap-2">
        <Button
          type="button"
          variant={mobileView === "admin" ? "default" : "outline"}
          size="sm"
          onClick={() => setMobileView("admin")}
          className="min-h-[44px] flex-1"
        >
          <Pencil className="w-4 h-4 mr-1.5" aria-hidden />
          Edit
        </Button>
        <Button
          type="button"
          variant={mobileView === "preview" ? "default" : "outline"}
          size="sm"
          onClick={() => setMobileView("preview")}
          className="min-h-[44px] flex-1"
        >
          <Eye className="w-4 h-4 mr-1.5" aria-hidden />
          View as client
        </Button>
      </div>

      {/* Mobile single-pane stack */}
      <div className="md:hidden">
        {mobileView === "admin" ? (
          <Card className="p-4">{admin}</Card>
        ) : (
          <Card className="p-4 bg-muted/20">{preview}</Card>
        )}
      </div>

      {/* Desktop split */}
      <div
        ref={containerRef}
        className="hidden md:flex relative items-stretch gap-0 rounded-md border border-border overflow-hidden"
      >
        <div
          className="bg-background overflow-auto"
          style={{ flexBasis: `${pct}%` }}
        >
          <div className="p-4">{admin}</div>
        </div>
        <div
          role="separator"
          aria-orientation="vertical"
          aria-valuemin={MIN_PCT}
          aria-valuemax={MAX_PCT}
          aria-valuenow={pct}
          tabIndex={0}
          className="w-1 bg-border hover:bg-primary/40 cursor-col-resize shrink-0"
          onPointerDown={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") {
              setPct((p) => Math.max(MIN_PCT, p - 2));
            } else if (e.key === "ArrowRight") {
              setPct((p) => Math.min(MAX_PCT, p + 2));
            }
          }}
        />
        <div
          className="bg-muted/20 overflow-auto"
          style={{ flexBasis: `${100 - pct}%` }}
        >
          <div className="p-4">{preview}</div>
        </div>
      </div>
    </div>
  );
}
