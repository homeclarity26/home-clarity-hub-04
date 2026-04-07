import { useState, useRef } from "react";
import {
  Home, FileText, Calendar, FolderOpen, Image, File, Wrench,
  CreditCard, FileCheck, Receipt, MessageSquare, Briefcase,
  Users, Gift, Bell, ChevronLeft, ChevronRight, Menu, X
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

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
    title: "PROJECTS",
    items: [
      { key: "projects", label: "Projects", icon: FolderOpen },
      { key: "photos", label: "Photos", icon: Image },
      { key: "documents", label: "Documents", icon: File },
      { key: "equipment", label: "Equipment", icon: Wrench },
    ],
  },
  {
    title: "FINANCES",
    items: [
      { key: "payments", label: "Payments", icon: CreditCard },
      { key: "estimates", label: "Estimates", icon: FileCheck },
      { key: "billing", label: "Billing", icon: Receipt },
    ],
  },
  {
    title: "CONNECT",
    items: [
      { key: "messages", label: "Messages", icon: MessageSquare },
      { key: "services", label: "Services", icon: Briefcase },
      { key: "contacts", label: "Contacts", icon: Users },
      { key: "refer", label: "Refer", icon: Gift },
    ],
  },
];

interface PortalSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  unreadMessages?: number;
  propertyName?: string;
}

const GOLD = "#C4A265";
const NAVY = "#1B2B4D";

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
      {!collapsed && (
        <span className="text-white font-sans text-xs font-bold tracking-widest uppercase opacity-70">
          HBC
        </span>
      )}
      {onClose ? (
        <button
          onClick={onClose}
          className="ml-auto p-1 rounded text-white/50 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={onToggleCollapse}
          className="ml-auto p-1 rounded text-white/50 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
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
                className="w-full flex items-center gap-3 px-3 py-2.5 transition-all bg-transparent border-none cursor-pointer relative group"
                style={{
                  borderLeft: isActive ? `2px solid ${GOLD}` : "2px solid transparent",
                  color: isActive ? GOLD : "rgba(255,255,255,0.6)",
                }}
              >
                {/* Active glow bg */}
                {isActive && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "rgba(196,162,101,0.08)" }}
                  />
                )}
                <item.icon
                  className="w-[15px] h-[15px] shrink-0 relative z-10"
                  style={{ color: isActive ? GOLD : "rgba(255,255,255,0.55)" }}
                />
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
          className="p-1.5 rounded text-white/40 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
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

const PortalSidebar = ({ activeTab, onTabChange, unreadMessages, propertyName }: PortalSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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

      {/* Mobile: hamburger button in top header */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 h-14 z-40 flex items-center px-4 gap-3"
        style={{ background: NAVY }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded text-white/70 hover:text-white bg-transparent border-none cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        {propertyName && (
          <span className="text-white font-sans text-sm font-semibold truncate">{propertyName}</span>
        )}
        {unreadMessages != null && unreadMessages > 0 && (
          <Badge
            className="ml-auto text-[9px] font-mono shrink-0"
            style={{ background: GOLD, color: NAVY, border: "none" }}
          >
            {unreadMessages}
          </Badge>
        )}
      </div>

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
