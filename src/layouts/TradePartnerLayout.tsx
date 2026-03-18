import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, CheckSquare, Calendar, FileText, MessageSquare, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Dashboard", path: "/trade", icon: LayoutDashboard },
  { label: "My Tasks", path: "/trade/tasks", icon: CheckSquare },
  { label: "Schedule", path: "/trade/schedule", icon: Calendar },
  { label: "Documents", path: "/trade/documents", icon: FileText },
  { label: "Messages", path: "/trade/messages", icon: MessageSquare },
];

const TradePartnerLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === "/trade") return location.pathname === "/trade";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-muted/30 font-sans">
      {/* Top Nav */}
      <header className="bg-card border-b border-border px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-sm font-bold text-foreground">HBC</span>
            <span className="text-[10px] text-muted-foreground ml-1">Trade Partner</span>
          </div>
          <nav className="flex gap-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-sans transition-colors border-none cursor-pointer ${
                  isActive(item.path) ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <button onClick={signOut} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer font-sans">
          <LogOut className="w-3.5 h-3.5" />Sign out
        </button>
      </header>
      <main className="p-6 max-w-6xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default TradePartnerLayout;
