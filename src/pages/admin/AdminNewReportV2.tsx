import AdminHeader from "@/components/admin/AdminHeader";
import { WizardProvider } from "@/contexts/WizardContext";
import { WizardShell } from "@/components/admin/wizard/WizardShell";

// Primary wizard at /admin/clients/new (W7 cutover). Legacy 4-step wizard
// kept at /admin/clients/new-legacy with a deprecation banner.

const AdminNewReportV2 = () => {
  return (
    <div>
      <AdminHeader
        breadcrumbs={[
          { label: "Clients", path: "/admin/clients" },
          { label: "New Report" },
        ]}
      />
      {/* Full-bleed: WizardShell owns its own navy rail + cream content
          layout per prototype screens 1-20. */}
      <WizardProvider>
        <WizardShell />
      </WizardProvider>
    </div>
  );
};

export default AdminNewReportV2;
