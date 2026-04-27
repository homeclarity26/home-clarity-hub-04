import AdminHeader from "@/components/admin/AdminHeader";
import { WizardProvider } from "@/contexts/WizardContext";
import { WizardShell } from "@/components/admin/wizard/WizardShell";

// Parallel wizard route at /admin/clients/new-v2 per Master Plan W1. The
// legacy 4-step wizard at /admin/clients/new keeps running untouched.

const AdminNewReportV2 = () => {
  return (
    <div>
      <AdminHeader
        breadcrumbs={[
          { label: "Clients", path: "/admin/clients" },
          { label: "New Report (v2)" },
        ]}
      />
      <div className="p-6 max-w-6xl mx-auto">
        <WizardProvider>
          <WizardShell />
        </WizardProvider>
      </div>
    </div>
  );
};

export default AdminNewReportV2;
