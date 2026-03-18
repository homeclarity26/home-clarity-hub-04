import AdminHeader from "@/components/admin/AdminHeader";
import SmartCalendarView from "@/components/admin/SmartCalendarView";

const AdminCalendar = () => (
  <div>
    <AdminHeader breadcrumbs={[{ label: "Calendar" }]} />
    <div className="p-6 max-w-5xl">
      <SmartCalendarView />
    </div>
  </div>
);

export default AdminCalendar;
