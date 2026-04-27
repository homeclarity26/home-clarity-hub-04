import { useState } from "react";
import {
  Home, FileText, Calendar, FolderOpen,
  CreditCard, Users, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import HCRLogo from "@/components/brand/HCRLogo";

interface NavItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// C12: 6 visible tabs — Photos folds into Projects, Documents/Equipment fold
// into Report, Estimates/Billing fold into Payments, Services folds into
// Schedule, Messages folds into the Concierge bar, Refer is a quick link on
// Home, Notifications surface as a Concierge indicator.
const NAV_SECTIONS: NavSection[] = [
  {
    title: "YOUR HOME",
    items: [
      { key: "home", label: "Home", icon: Home },
      { key: "report", label: "Report", icon: FileText },
      { key: "schedule", label: "Schedule", icon: Calendar },
    ],
  },
  {
    title: "WORK",
    items: [
      { key: "projects", label: "Projects", icon: FolderOpen },
      { key: "payments", label: "Payments", icon: CreditCard },
    ],
  },
  {
    title: "CONNECT",
    items: [
      { key: "contacts", label: "Contacts", icon: Users },
    ],
  },
];

interface PortalSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  unreadMessages?: number;
  propertyName?: string;
  // Controlled mobile drawer — driven by MobileBottomNav "More" button
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

// HCR tokens — bound to CSS vars so the sidebar matches the rest of the portal
// instead of drifting to one-off hex values.
const GOLD = "hsl(var(--accent))";
const NAVY = "hsl(var(--primary))";

const SidebarContent = ({
  activeTab,
  onTabChange,
  unreadMessages,
  collapsed,
  onToggleCollapse,
  onClose,
}: PortalSidebarProps & { collapsed: boolean; onToggleCollapse: () => void; onClose?: () => void }) => (
  <div
    className="flex flex-col h-full overflow-hidden"
    style={{ background: NAVY, width: "100%" }}
  >
    {/* Logo / top area */}
    <div
      className="flex items-center justify-between px-3 py-4 shrink-0"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
    >
      {!collapsed && <HCRLogo variant="light" size="sm" />}
      {onClose ? (
        <button
          onClick={onClose}
          className="ml-auto p-1 rounded text-white/50 hover:text-white transition-colors bg-transparent border-none cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={onToggleCollapse}
          className="ml-auto p-1 rounded text-white/50 hover:text-white transition-colors bg-transparent border-none cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      )}
    </div>

    {/* Nav sections */}
    <nav className="flex-1 overflow-y-auto py-3">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title} className="mb-1">
          {!collapsed && (
            <p
              className="px-3 pt-3 pb-1 font-mono text-[9px] tracking-[0.18em] uppercase"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              {section.title}
            </p>
          )}
          {collapsed && <div className="h-2" />}
          {section.items.map((item) => {
            const isActive = activeTab === item.key;
            const badge = item.key === "messages" ? unreadMessages : undefined;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onTabChange(item.key);
                  onClose?.();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 transition-all bg-transparent border-none cursor-pointer relative group min-h-[44px]"
                style={{
                  borderLeft: isActive ? `2px solid ${GOLD}` : "2px solid transparent",
                  color: isActive ? GOLD : "rgba(255,255,255,0.6)",
                }}
              >
                {/* Active glow bg */}
                {isActive && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "hsl(var(--accent) / 0.08)" }}
                  />
                )}
                {/* lucide icons accept className but not `style`; use a wrapper span for the color. */}
                <span
                  className="shrink-0 relative z-10 inline-flex"
                  style={{ color: isActive ? GOLD : "rgba(255,255,255,0.55)" }}
                >
                  <item.icon className="w-[15px] h-[15px]" />
                </span>
                {!collapsed && (
                  <span
                    className="text-xs font-sans relative z-10 truncate"
                    style={{
                      color: isActive ? GOLD : "rgba(255,255,255,0.7)",
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {item.label}
                  </span>
                )}
                {badge != null && badge > 0 && (
                  <span
                    className="relative z-10 ml-auto text-[9px] font-mono font-bold rounded-full px-1.5 py-0.5 shrink-0"
                    style={{ background: GOLD, color: NAVY }}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </nav>

    {/* Bottom collapse toggle (desktop only) */}
    {!onClose && (
      <div
        className="shrink-0 py-3 flex justify-center"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded text-white/40 hover:text-white transition-colors bg-transparent border-none cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    )}
  </div>
);

const PortalSidebar = ({
  activeTab,
  onTabChange,
  unreadMessages,
  propertyName,
  mobileOpen: mobileOpenProp,
  onMobileOpenChange,
}: PortalSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpenInternal, setMobileOpenInternal] = useState(false);
  const isControlled = mobileOpenProp !== undefined;
  const mobileOpen = isControlled ? mobileOpenProp : mobileOpenInternal;
  const setMobileOpen = (v: boolean) => {
    if (isControlled) onMobileOpenChange?.(v);
    else setMobileOpenInternal(v);
  };

  const sidebarWidth = collapsed ? 40 : 188;

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex fixed left-0 top-0 bottom-0 z-40 flex-col"
        style={{
          width: sidebarWidth,
          transition: "width 0.2s ease",
          background: NAVY,
        }}
      >
        <SidebarContent
          activeTab={activeTab}
          onTabChange={onTabChange}
          unreadMessages={unreadMessages}
          propertyName={propertyName}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
        />
      </aside>

      {/* Mobile top slab removed — the main <Header/> is the single mobile top bar.
       *  The mobile drawer below still opens on demand via the "More" button in
       *  MobileBottomNav.tsx. */}

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="flex-shrink-0 h-full"
            style={{ width: 220, background: NAVY }}
          >
            <SidebarContent
              activeTab={activeTab}
              onTabChange={onTabChange}
              unreadMessages={unreadMessages}
              propertyName={propertyName}
              collapsed={false}
              onToggleCollapse={() => {}}
              onClose={() => setMobileOpen(false)}
            />
          </div>
          <div
            className="flex-1 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}
    </>
  );
};

export default PortalSidebar;
