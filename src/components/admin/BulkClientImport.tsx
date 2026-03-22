import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface ParsedClient {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  property_type?: string;
  notes?: string;
}

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

function parseCSV(text: string): ParsedClient[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(",").map((h) => h.trim().replace(/^"|"$/g, ""));

  const colMap: Record<string, number> = {};
  const aliases: Record<string, string[]> = {
    name: ["name", "full_name", "fullname", "client_name", "client name"],
    email: ["email", "email_address", "email address", "e-mail"],
    phone: ["phone", "phone_number", "phone number", "tel", "mobile"],
    address: ["address", "street_address", "street address", "property_address", "property address"],
    city: ["city"],
    state: ["state", "province"],
    zip: ["zip", "zipcode", "zip_code", "postal_code", "postal code"],
    property_type: ["property_type", "property type", "type"],
    notes: ["notes", "discovery_notes", "discovery notes", "comments"],
  };

  for (const [field, names] of Object.entries(aliases)) {
    const idx = headers.findIndex((h) => names.includes(h));
    if (idx >= 0) colMap[field] = idx;
  }

  if (colMap.name === undefined && colMap.email === undefined) {
    return [];
  }

  const results: ParsedClient[] = [];
  for (let i = 1; i < lines.length; i++) {
    // Simple CSV parse (handles quoted fields)
    const vals: string[] = [];
    let current = "";
    let inQuote = false;
    for (const ch of lines[i]) {
      if (ch === '"') {
        inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        vals.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    vals.push(current.trim());

    const get = (field: string) => {
      const idx = colMap[field];
      return idx !== undefined ? vals[idx]?.replace(/^"|"$/g, "").trim() || undefined : undefined;
    };

    const name = get("name");
    const email = get("email");
    if (!name && !email) continue;

    results.push({
      name: name || email || "",
      email: email || "",
      phone: get("phone"),
      address: get("address"),
      city: get("city"),
      state: get("state"),
      zip: get("zip"),
      property_type: get("property_type"),
      notes: get("notes"),
    });
  }

  return results;
}

const BulkClientImport = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [parsed, setParsed] = useState<ParsedClient[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const clients = parseCSV(text);
      if (clients.length === 0) {
        toast.error("Could not parse any clients. Make sure your CSV has 'name' and/or 'email' columns.");
        return;
      }
      setParsed(clients);
      setResult(null);
      setOpen(true);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImport = async () => {
    if (!user || parsed.length === 0) return;
    setImporting(true);

    const errors: string[] = [];
    let success = 0;

    for (const client of parsed) {
      try {
        // Create property
        const { data: prop, error: propErr } = await supabase
          .from("properties")
          .insert({
            property_name: client.name,
            address: client.address || "",
            city: client.city || null,
            state: client.state || null,
            zip: client.zip || null,
            property_type: client.property_type || "single_family",
            creator_user_id: user.id,
            client_user_id: user.id,
            discovery_notes: client.notes || null,
            intake_status: "draft",
            metadata: {},
          } as any)
          .select("id")
          .single();

        if (propErr) {
          errors.push(`${client.name}: ${propErr.message}`);
          continue;
        }

        // Create report
        await supabase.from("reports").insert({
          property_id: prop.id,
          title: `${client.name} Home Report`,
          status: "draft",
          created_by: user.id,
        } as any);

        // Update profile email if available
        if (client.email) {
          await supabase.from("profiles").upsert(
            {
              user_id: user.id,
              email: client.email,
              phone: client.phone || null,
            } as any,
            { onConflict: "user_id" }
          );
        }

        success++;
      } catch (e) {
        errors.push(`${client.name}: ${e instanceof Error ? e.message : "Unknown error"}`);
      }
    }

    setResult({ total: parsed.length, success, failed: errors.length, errors });
    setImporting(false);
    queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });

    if (success > 0) {
      toast.success(`Imported ${success} client${success > 1 ? "s" : ""} successfully`);
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs font-sans"
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="w-4 h-4" />
        Import CSV
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-accent" />
              Import {parsed.length} Client{parsed.length !== 1 ? "s" : ""}
            </DialogTitle>
          </DialogHeader>

          {!result ? (
            <div className="space-y-4">
              <div className="max-h-60 overflow-auto">
                <table className="w-full text-xs font-sans">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-1.5 px-2">Name</th>
                      <th className="text-left py-1.5 px-2">Email</th>
                      <th className="text-left py-1.5 px-2">Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.map((c, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-1.5 px-2 text-foreground">{c.name}</td>
                        <td className="py-1.5 px-2 text-muted-foreground">{c.email || "—"}</td>
                        <td className="py-1.5 px-2 text-muted-foreground truncate max-w-[140px]">
                          {c.address || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleImport}
                  disabled={importing}
                  className="gap-1.5 font-sans"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />Importing…
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />Import All
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {result.failed === 0 ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-amber-500" />
                )}
                <div>
                  <p className="font-sans text-sm font-medium text-foreground">
                    {result.success} of {result.total} imported successfully
                  </p>
                  {result.failed > 0 && (
                    <p className="font-sans text-xs text-muted-foreground">
                      {result.failed} failed
                    </p>
                  )}
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="max-h-32 overflow-auto bg-muted/50 rounded-md p-3 space-y-1">
                  {result.errors.map((err, i) => (
                    <p key={i} className="font-sans text-xs text-destructive">{err}</p>
                  ))}
                </div>
              )}

              <div className="flex justify-end">
                <Button size="sm" onClick={() => { setOpen(false); setParsed([]); setResult(null); }}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BulkClientImport;
