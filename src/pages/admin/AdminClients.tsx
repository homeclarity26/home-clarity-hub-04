import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Plus, Loader2, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "@/components/admin/AdminHeader";
import ClientTable from "@/components/admin/ClientTable";
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
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
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
          </div>
          <Button onClick={() => navigate("/admin/clients/new")} className="gap-1.5 font-sans" size="sm">
            <Plus className="w-4 h-4" />
            New Client
          </Button>
        </div>

        {/* Table */}
        <Card className="p-0 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length > 0 ? (
            <ClientTable clients={filtered} />
          ) : (
            <p className="text-sm font-sans text-muted-foreground text-center py-12">
              {clients?.length === 0 ? "No clients yet." : "No clients match your search."}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminClients;
