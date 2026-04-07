import AdminHeader from "@/components/admin/AdminHeader";
import SmartCalendarView from "@/components/admin/SmartCalendarView";
import BobbyScheduleBar from "@/components/admin/BobbyScheduleBar";

const AdminCalendar = () => (
  <div>
    <AdminHeader breadcrumbs={[{ label: "Calendar" }]} />
    <div className="p-6 max-w-5xl">
      <BobbyScheduleBar />
      <SmartCalendarView />
    </div>
  </div>
);

export default AdminCalendar;
