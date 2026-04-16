import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PublishBar — floating bottom bar shown in admin edit mode with unsaved changes.
 *
 * The design system: rust (#B5450B) for the Publish CTA, navy body, Inter type.
 *
 * Edit autosave still happens to the page's working copy. This button flips
 * `reports.status` (or `report_pages.status`) from draft → published so the
 * client portal reflects only what the admin intends.
 *
 * Accessible: announces unsaved-change count as an aria-live region for SR users.
 */
interface PublishBarProps {
  pendingCount: number;
  onPublish: () => Promise<void> | void;
  onDiscard?: () => void;
  disabled?: boolean;
  label?: string; // "changes" | "page changes" etc
  className?: string;
}

export function PublishBar({
  pendingCount,
  onPublish,
  onDiscard,
  disabled,
  label,
  className,
}: PublishBarProps) {
  const [publishing, setPublishing] = useState(false);

  if (pendingCount <= 0) return null;

  const handlePublish = async () => {
    try {
      setPublishing(true);
      await onPublish();
    } finally {
      setPublishing(false);
    }
  };

  const noun = label ?? (pendingCount === 1 ? "unsaved change" : "unsaved changes");

  return (
    <div
      className={cn(
        // Sit above the mobile bottom nav (64px) and the FAB; desktop near bottom
        "fixed inset-x-0 z-50 flex justify-center px-4 pointer-events-none",
        "bottom-[84px] md:bottom-8",
        className,
      )}
    >
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto flex items-center gap-4 bg-primary text-primary-foreground rounded-full shadow-hbc-lg px-5 py-3 min-w-[280px] max-w-md w-full"
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.15em] truncate">
          {pendingCount} {noun}
        </span>
        <div className="ml-auto flex items-center gap-3">
          {onDiscard && (
            <button
              type="button"
              onClick={onDiscard}
              disabled={publishing || disabled}
              className="font-mono text-[10px] uppercase tracking-wider text-primary-foreground/60 hover:text-primary-foreground transition-colors border-none bg-transparent cursor-pointer"
            >
              Discard
            </button>
          )}
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing || disabled}
            className="inline-flex items-center gap-2 bg-[hsl(16_86%_39%)] hover:bg-[hsl(16_86%_35%)] text-white font-mono text-[11px] uppercase tracking-[0.15em] px-4 py-1.5 rounded-full transition-colors border-none cursor-pointer disabled:opacity-60"
          >
            {publishing && <Loader2 className="w-3 h-3 animate-spin" />}
            {publishing ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
