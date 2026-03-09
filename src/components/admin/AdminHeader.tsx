import { useNavigate } from "react-router-dom";
import { Search, Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAdminStats } from "@/hooks/useAdminData";

interface AdminHeaderProps {
  breadcrumbs: { label: string; path?: string }[];
}

const AdminHeader = ({ breadcrumbs }: AdminHeaderProps) => {
  const navigate = useNavigate();
  const { data: stats } = useAdminStats();

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 gap-4">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm font-sans min-w-0">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-muted-foreground">/</span>}
            {crumb.path ? (
              <button
                onClick={() => navigate(crumb.path!)}
                className="text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer font-sans text-sm"
              >
                {crumb.label}
              </button>
            ) : (
              <span className="text-foreground font-medium truncate">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients, pages..."
            className="pl-9 w-64 h-9 text-sm font-sans"
          />
        </div>

        <button className="relative p-2 rounded-md hover:bg-muted transition-colors bg-transparent border-none cursor-pointer">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {mockStats.unansweredQuestions > 0 && (
            <Badge className="absolute -top-0.5 -right-0.5 h-5 min-w-5 flex items-center justify-center text-[10px] bg-accent text-accent-foreground border-none px-1">
              {mockStats.unansweredQuestions}
            </Badge>
          )}
        </button>

        <Button
          size="sm"
          onClick={() => navigate("/admin/clients/new")}
          className="gap-1.5 font-sans"
        >
          <Plus className="w-4 h-4" />
          New Report
        </Button>
      </div>
    </header>
  );
};

export default AdminHeader;
