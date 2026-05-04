import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, BookOpen, Settings, LogOut, Menu, X, MessageSquare, CheckSquare, Briefcase, Target, Share2, Megaphone, Zap, GraduationCap, BarChart3, Calendar, Award, Home, ChevronDown, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useOpenTaskCount } from "@/hooks/useAdminTasks";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const primaryNavItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard, showBadge: true },
  { label: "Inbox", path: "/admin/inbox", icon: MessageSquare },
  { label: "Bobby Inbox", path: "/admin/bobby-inbox", icon: Sparkles },
  { label: "Clients", path: "/admin/clients", icon: Home },
  { label: "CRM", path: "/admin/crm", icon: Users },
  { label: "Projects", path: "/admin/projects", icon: Briefcase },
  { label: "Tasks", path: "/admin/tasks", icon: CheckSquare },
  { label: "Calendar", path: "/admin/calendar", icon: Calendar },
  { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
  { label: "Team", path: "/admin/team", icon: Users },
];

const toolsNavItems = [
  { label: "Goals", path: "/admin/goals", icon: Target },
  { label: "Referrals", path: "/admin/referrals", icon: Share2 },
  { label: "Announcements", path: "/admin/announcements", icon: Megaphone },
  { label: "Automations", path: "/admin/automations", icon: Zap },
  { label: "Annual Reviews", path: "/admin/annual-reviews", icon: Award },
  { label: "Knowledge Base", path: "/admin/knowledge-base", icon: BookOpen },
  { label: "Help & Tutorials", path: "/admin/help", icon: GraduationCap },
];

const SidebarContent = ({ onNavClick, iconOnly }: { onNavClick?: () => void; iconOnly?: boolean }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { data: taskCount } = useOpenTaskCount();
  const [toolsOpen, setToolsOpen] = useState(() =>
    toolsNavItems.some((item) => location.pathname.startsWith(item.path))
  );

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  const renderNavButton = (item: typeof primaryNavItems[number]) => (
    <button
      key={item.path}
      onClick={() => {
        navigate(item.path);
        onNavClick?.();
      }}
      title={iconOnly ? item.label : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-sans transition-colors border-none cursor-pointer ${
        iconOnly ? "justify-center" : ""
      } ${
        isActive(item.path)
          ? "bg-primary text-primary-foreground font-medium"
          : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <item.icon className="w-4 h-4 shrink-0" />
      {!iconOnly && item.label}
      {!iconOnly && item.showBadge && taskCount != null && taskCount > 0 && (
        <Badge variant="destructive" className="ml-auto text-[10px] h-5 px-1.5 font-mono">
          {taskCount}
        </Badge>
      )}
      {iconOnly && item.showBadge && taskCount != null && taskCount > 0 && (
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
      )}
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      <div className={`h-16 flex flex-col justify-center border-b border-border ${iconOnly ? "px-2 items-center" : "px-6"}`}>
        {!iconOnly && (
          <>
            <span className="font-sans text-lg font-bold text-foreground tracking-tight">HBC</span>
            <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-muted-foreground -mt-0.5">Creator</span>
          </>
        )}
        {iconOnly && (
          <span className="font-sans text-sm font-bold text-foreground">H</span>
        )}
      </div>

      <nav className={`flex-1 py-4 space-y-1 overflow-y-auto ${iconOnly ? "px-1" : "px-3"}`}>
        {primaryNavItems.map(renderNavButton)}

        {!iconOnly && (
          <Collapsible open={toolsOpen} onOpenChange={setToolsOpen}>
            <CollapsibleTrigger className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-sans transition-colors border-none cursor-pointer bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground">
              <Settings className="w-4 h-4 shrink-0" />
              Tools
              <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${toolsOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1 ml-2">
              {toolsNavItems.map(renderNavButton)}
            </CollapsibleContent>
          </Collapsible>
        )}

        {iconOnly && (
          <button
            title="Settings"
            onClick={() => navigate("/admin/settings")}
            className="w-full flex items-center justify-center px-3 py-2.5 rounded-md text-sm font-sans transition-colors border-none cursor-pointer bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Settings className="w-4 h-4 shrink-0" />
          </button>
        )}

        {!iconOnly && renderNavButton({ label: "Settings", path: "/admin/settings", icon: Settings })}
      </nav>

      <div className={`p-4 border-t border-border space-y-3 ${iconOnly ? "flex flex-col items-center p-2" : ""}`}>
        {!iconOnly && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-sans font-medium">
              {profile?.avatar_initials || "??"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-sans font-medium text-foreground truncate">
                {profile?.full_name || "Creator"}
              </p>
              <p className="text-[11px] font-sans text-muted-foreground">Creator</p>
            </div>
          </div>
        )}
        {iconOnly && (
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-sans font-medium">
            {profile?.avatar_initials || "??"}
          </div>
        )}
        <button
          onClick={signOut}
          title={iconOnly ? "Sign out" : undefined}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-sans text-muted-foreground hover:text-foreground hover:bg-muted transition-colors bg-transparent border-none cursor-pointer ${iconOnly ? "justify-center" : ""}`}
        >
          <LogOut className="w-4 h-4" />
          {!iconOnly && "Sign out"}
        </button>
      </div>
    </div>
  );
};

const AdminSidebar = () => {
  const [open, setOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ open: boolean }>).detail;
      setFocusMode(detail.open);
    };
    window.addEventListener("hbc-agent-toggle", handler);
    return () => window.removeEventListener("hbc-agent-toggle", handler);
  }, []);

  const sidebarWidth = focusMode ? "56px" : "240px";

  return (
    <>
      <aside
        className="hidden md:flex fixed left-0 top-0 bottom-0 bg-muted/50 border-r border-border flex-col z-40 overflow-hidden"
        style={{ width: sidebarWidth, transition: "width 0.25s ease" }}
      >
        <SidebarContent iconOnly={focusMode} />
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-40 flex items-center px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="p-2 bg-transparent border-none cursor-pointer text-foreground">
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0">
            <SidebarContent onNavClick={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="font-sans text-sm font-bold text-foreground ml-3">HBC Creator</span>
      </div>
    </>
  );
};

export default AdminSidebar;
