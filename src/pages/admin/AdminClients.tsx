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
import { useAdminClients } from "@/hooks/useAdminData";
import { exportClientsToCSV } from "@/lib/csvExport";

const AdminClients = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const navigate = useNavigate();
  const { data: clients, isLoading } = useAdminClients();

  const filtered = (clients || []).filter((c) => {
    const matchesSearch = search === "" || c.name.toLowerCase().includes(search.toLowerCase()) || c.address.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.reportStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            <div className="flex items-center gap-3 flex-1 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 font-sans" />
              </div>
              <div className="flex gap-1">
                {["all", "draft", "review", "published"].map((s) => (
                  <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} className="text-xs font-sans capitalize">
                    {s === "all" ? "All" : s === "review" ? "In Review" : s}
                  </Button>
                ))}
              </div>
              {clients && clients.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => exportClientsToCSV(clients)} className="gap-1.5 text-xs font-sans">
                  <Download className="w-4 h-4" />Export CSV
                </Button>
              )}
            </div>
            <Card className="p-0 overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
              ) : filtered.length > 0 ? (
                <ClientTable clients={filtered} />
              ) : (
                <p className="text-sm font-sans text-muted-foreground text-center py-12">
                  {clients?.length === 0 ? "No clients yet." : "No clients match your search."}
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
