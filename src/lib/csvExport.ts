import type { AdminClient } from "@/hooks/useAdminData";

export function exportClientsToCSV(clients: AdminClient[]) {
  const headers = ["Name", "Email", "Phone", "Address", "City", "State", "Zip", "Property Type", "Report Status", "Total Pages", "Complete Pages", "Last Updated"];
  const rows = clients.map((c) => [
    c.name,
    c.email,
    c.phone,
    c.address,
    c.city || "",
    c.state || "",
    c.zip || "",
    c.propertyType || "",
    c.reportStatus,
    String(c.totalPages),
    String(c.completePages),
    c.lastUpdated,
  ]);

  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hbc-clients-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
