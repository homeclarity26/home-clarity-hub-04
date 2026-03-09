import { Outlet } from "react-router-dom";
import AdminSidebar from "@/components/admin/AdminSidebar";

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-muted/30 font-sans">
      <AdminSidebar />
      <div className="ml-60">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
