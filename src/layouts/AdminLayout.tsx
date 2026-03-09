import { Outlet } from "react-router-dom";
import AdminSidebar from "@/components/admin/AdminSidebar";

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-muted/30 font-sans">
      <AdminSidebar />
      {/* md:ml-60 for desktop sidebar, mt-14 for mobile topbar */}
      <div className="md:ml-60 mt-14 md:mt-0">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
