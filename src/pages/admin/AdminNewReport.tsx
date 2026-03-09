import AdminHeader from "@/components/admin/AdminHeader";
import NewReportWizard from "@/components/admin/NewReportWizard";

const AdminNewReport = () => {
  return (
    <div>
      <AdminHeader
        breadcrumbs={[
          { label: "Clients", path: "/admin/clients" },
          { label: "New Report" },
        ]}
      />
      <div className="p-6 max-w-4xl">
        <NewReportWizard />
      </div>
    </div>
  );
};

export default AdminNewReport;
