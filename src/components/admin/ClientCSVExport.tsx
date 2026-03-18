import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClientCSVExportProps {
  variant?: "outline" | "ghost" | "default";
  size?: "sm" | "default";
}

const ClientCSVExport = ({ variant = "outline", size = "sm" }: ClientCSVExportProps) => {
  const [loading, setLoading] = useState(false);

  const exportCSV = async () => {
    setLoading(true);
    try {
      const { data: properties } = await supabase
        .from("properties")
        .select("id, property_name, address, city, state, zip, property_type, relationship_type, estimated_value, metadata, created_at, profiles!properties_client_user_id_fkey(full_name, email, phone)")
        .order("created_at", { ascending: false });

      if (!properties || properties.length === 0) {
        toast.info("No clients to export");
        return;
      }

      const headers = [
        "Property Name", "Address", "City", "State", "ZIP", "Property Type",
        "Relationship", "Estimated Value", "Year Built", "Sqft", "Client Name",
        "Client Email", "Client Phone", "Created At"
      ];

      const rows = properties.map((p: any) => {
        const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
        const meta = p.metadata || {};
        return [
          p.property_name || "",
          p.address || "",
          p.city || "",
          p.state || "",
          p.zip || "",
          p.property_type || "",
          p.relationship_type || "",
          p.estimated_value || "",
          meta.year_built || "",
          meta.sqft || "",
          profile?.full_name || "",
          profile?.email || "",
          profile?.phone || "",
          p.created_at ? new Date(p.created_at).toLocaleDateString() : "",
        ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
      });

      const csv = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clients-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${properties.length} clients`);
    } catch (err) {
      console.error("CSV export error:", err);
      toast.error("Failed to export");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant={variant} size={size} className="gap-1.5 text-xs font-sans" onClick={exportCSV} disabled={loading}>
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
      Export CSV
    </Button>
  );
};

export default ClientCSVExport;
