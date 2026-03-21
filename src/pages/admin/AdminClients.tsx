import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Loader2, Download, BarChart3, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "@/components/admin/AdminHeader";
import ClientTable from "@/components/admin/ClientTable";
import ClientComparisonView from "@/components/admin/ClientComparisonView";
import BulkReportGenerator from "@/components/admin/BulkReportGenerator";
import ExportMenu from "@/components/admin/ExportMenu";
import ClientSmartFilters, { DEFAULT_FILTERS, type FilterState } from "@/components/admin/ClientSmartFilters";
import { useAdminClients } from "@/hooks/useAdminData";
import { exportClientsToCSV } from "@/lib/csvExport";
import type { AdminClient } from "@/hooks/useAdminData";

function getOnboardingComplete(client: AdminClient) {
  const steps = [
    !!client.address,
    !!client.discoveryNotes,
    client.digitalAssetsStatus === "complete",
    client.totalPages > 0,
    client.reportStatus === "published",
  ];
  return steps.every(Boolean);
}

function applyFilters(clients: AdminClient[], filters: FilterState): AdminClient[] {
  return clients.filter((c) => {
    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.address.toLowerCase().includes(q)) return false;
    }
    // Status
    if (filters.status !== "all" && c.reportStatus !== filters.status) return false;
    // Onboarding
    if (filters.onboarding === "complete" && !getOnboardingComplete(c)) return false;
    if (filters.onboarding === "incomplete" && getOnboardingComplete(c)) return false;
    // Unread
    if (filters.hasUnread === "yes" && (c.unreadMessages || 0) === 0 && (c.unreadComments || 0) === 0) return false;
    if (filters.hasUnread === "no" && ((c.unreadMessages || 0) > 0 || (c.unreadComments || 0) > 0)) return false;
    return true;
  });
}

const AdminClients = () => {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const navigate = useNavigate();
  const { data: clients, isLoading } = useAdminClients();

  const filtered = applyFilters(clients || [], filters);

  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "Clients" }]} />
      <div className="p-6 space-y-4 max-w-7xl">
        <Tabs defaultValue="clients">
          <div className="flex items-center justify-between gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="clients" className="text-xs font-sans">Clients</TabsTrigger>
              <TabsTrigger value="compare" className="text-xs font-sans gap-1"><BarChart3 className="w-3.5 h-3.5" />Compare</TabsTrigger>
              <TabsTrigger value="bulk" className="text-xs font-sans gap-1"><Sparkles className="w-3.5 h-3.5" />Bulk Generate</TabsTrigger>
            </TabsList>
            <Button onClick={() => navigate("/admin/clients/new")} className="gap-1.5 font-sans" size="sm">
              <Plus className="w-4 h-4" />New Client
            </Button>
          </div>

          <TabsContent value="clients">
            <div className="space-y-3 mb-4">
              <ClientSmartFilters filters={filters} onChange={setFilters} />
              {clients && clients.length > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-xs font-sans text-muted-foreground">
                    Showing {filtered.length} of {clients.length} clients
                  </p>
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => exportClientsToCSV(clients)} className="gap-1.5 text-xs font-sans">
                      <Download className="w-4 h-4" />Quick CSV
                    </Button>
                    <ExportMenu />
                  </div>
                </div>
              )}
            </div>
            <Card className="p-0 overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : filtered.length > 0 ? (
                <ClientTable clients={filtered} />
              ) : (
                <p className="text-sm font-sans text-muted-foreground text-center py-12">
                  {clients?.length === 0 ? "No clients yet." : "No clients match your filters."}
                </p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="compare"><ClientComparisonView /></TabsContent>
          <TabsContent value="bulk"><BulkReportGenerator /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminClients;
