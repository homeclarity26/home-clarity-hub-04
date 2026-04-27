import { useLocation } from "react-router-dom";
import AdminHeader from "@/components/admin/AdminHeader";
import NewReportWizard from "@/components/admin/NewReportWizard";

const AdminNewReport = () => {
  const { pathname } = useLocation();
  const isLegacyRoute = pathname.includes("new-legacy");

  return (
    <div>
      <AdminHeader
        breadcrumbs={[
          { label: "Clients", path: "/admin/clients" },
          { label: "New Report (legacy)" },
        ]}
      />
      <div className="p-6 max-w-4xl">
        {isLegacyRoute && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 text-sm text-amber-800">
            This wizard is being retired. Use{" "}
            <a href="/admin/clients/new" className="underline font-medium">the new wizard</a>.
          </div>
        )}
        <NewReportWizard />
      </div>
    </div>
  );
};

export default AdminNewReport;
