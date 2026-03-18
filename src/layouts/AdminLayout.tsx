import { Outlet } from "react-router-dom";
import AdminSidebar from "@/components/admin/AdminSidebar";
import CommandPalette from "@/components/admin/CommandPalette";
import QuickAddFAB from "@/components/admin/QuickAddFAB";
import AgentPanel from "@/components/agent/AgentPanel";
import useAdminShortcuts from "@/hooks/useAdminShortcuts";

const AdminLayout = () => {
  useAdminShortcuts();

  return (
    <div className="min-h-screen bg-muted/30 font-sans">
      <AdminSidebar />
      <CommandPalette />
      <QuickAddFAB />
      <AgentPanel />
      <div className="md:ml-60 mt-14 md:mt-0">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
