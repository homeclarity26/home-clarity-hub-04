import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, BookOpen, Settings, LogOut, Menu, X, MessageSquare, CheckSquare, Briefcase, Target, Share2, Megaphone, Zap, GraduationCap, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useOpenTaskCount } from "@/hooks/useAdminTasks";

const navItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard, showBadge: true },
  { label: "Inbox", path: "/admin/inbox", icon: MessageSquare },
  { label: "Clients", path: "/admin/clients", icon: Users },
  { label: "Tasks", path: "/admin/tasks", icon: CheckSquare },
  { label: "Vendors", path: "/admin/vendors", icon: Briefcase },
  { label: "Goals", path: "/admin/goals", icon: Target },
  { label: "Referrals", path: "/admin/referrals", icon: Share2 },
  { label: "Announcements", path: "/admin/announcements", icon: Megaphone },
  { label: "Automations", path: "/admin/automations", icon: Zap },
  { label: "Knowledge Base", path: "/admin/knowledge-base", icon: BookOpen },
  { label: "Help & Tutorials", path: "/admin/help", icon: GraduationCap },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { data: taskCount } = useOpenTaskCount();

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="h-16 flex flex-col justify-center px-6 border-b border-border">
        <span className="font-sans text-lg font-bold text-foreground tracking-tight">HBC</span>
        <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-muted-foreground -mt-0.5">Creator</span>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => {
              navigate(item.path);
              onNavClick?.();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-sans transition-colors border-none cursor-pointer ${
              isActive(item.path)
                ? "bg-primary text-primary-foreground font-medium"
                : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
            {item.showBadge && taskCount != null && taskCount > 0 && (
              <Badge variant="destructive" className="ml-auto text-[10px] h-5 px-1.5 font-mono">
                {taskCount}
              </Badge>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-border space-y-3">
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
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-sans text-muted-foreground hover:text-foreground hover:bg-muted transition-colors bg-transparent border-none cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
};

const AdminSidebar = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 bg-muted/50 border-r border-border flex-col z-40">
        <SidebarContent />
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
