import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, BookOpen, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Clients", path: "/admin/clients", icon: Users },
  { label: "Knowledge Base", path: "/admin/knowledge-base", icon: BookOpen },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-muted/50 border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 flex flex-col justify-center px-6 border-b border-border">
        <span className="font-sans text-lg font-bold text-foreground tracking-tight">HBC</span>
        <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-muted-foreground -mt-0.5">Creator</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-sans transition-colors border-none cursor-pointer ${
              isActive(item.path)
                ? "bg-primary text-primary-foreground font-medium"
                : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* User section */}
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
    </aside>
  );
};

export default AdminSidebar;
