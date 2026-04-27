import { Home, FileText, Hammer, CreditCard, Menu as More } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * MobileBottomNav — primary phone navigation.
 *
 * Four primary tabs + "More" drawer. 56px tall + iOS safe-area padding.
 * Replaces the per-tab hamburger round-trip.
 *
 * Hidden on md+ (desktop uses Header + PortalSidebar).
 */
interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenMore: () => void;
  className?: string;
}

// C12: Messages folded into the Concierge bar — Payments takes its slot in the
// 4 primary mobile tabs. The "More" button reveals Schedule + Contacts.
const PRIMARY = [
  { id: "home", label: "Home", icon: Home },
  { id: "report", label: "Report", icon: FileText },
  { id: "projects", label: "Projects", icon: Hammer },
  { id: "payments", label: "Payments", icon: CreditCard },
] as const;

export function MobileBottomNav({
  activeTab,
  onTabChange,
  onOpenMore,
  className,
}: MobileBottomNavProps) {
  return (
    <nav
      aria-label="Primary navigation"
      className={cn(
        "md:hidden fixed bottom-0 inset-x-0 z-40 h-14 bg-background/95 backdrop-blur border-t border-border flex items-stretch",
        className,
      )}
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {PRIMARY.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            aria-label={tab.label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors border-none bg-transparent cursor-pointer min-h-[44px]",
              active ? "text-primary" : "text-hbc-text-secondary hover:text-foreground",
            )}
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
            <span className="font-sans text-[10px] uppercase tracking-[0.18em] font-semibold">
              {tab.label}
            </span>
            {active && (
              <span className="w-3.5 h-[1.5px] bg-accent rounded-full" aria-hidden="true" />
            )}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onOpenMore}
        aria-label="More options"
        className="flex-1 flex flex-col items-center justify-center gap-0.5 text-hbc-text-secondary hover:text-foreground transition-colors border-none bg-transparent cursor-pointer min-h-[44px]"
      >
        <More className="w-5 h-5" aria-hidden="true" />
        <span className="font-sans text-[10px] uppercase tracking-[0.18em] font-semibold">More</span>
      </button>
    </nav>
  );
}
