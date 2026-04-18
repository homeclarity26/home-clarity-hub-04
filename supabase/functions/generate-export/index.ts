import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { export_type, filter_params, job_id } = await req.json();

    const VALID_TYPES = ["client_list", "invoice_register", "revenue_report", "equipment_registry", "maintenance_due"];
    if (!export_type || !VALID_TYPES.includes(export_type)) {
      return new Response(JSON.stringify({
        error: "Invalid or missing export_type",
        valid_types: VALID_TYPES,
        received: export_type ?? null,
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update job to processing
    if (job_id) {
      await supabase.from("export_jobs").update({ status: "processing" }).eq("id", job_id);
    }

    let csvContent = "";
    let filename = "";

    switch (export_type) {
      case "client_list": {
        const { data: props } = await supabase
          .from("properties")
          .select("*, profiles!properties_client_user_id_fkey(full_name, email, phone)")
          .order("created_at", { ascending: false });

        const headers = ["Client Name", "Email", "Phone", "Address", "City", "State", "ZIP", "Property Type", "Created"];
        const rows = (props || []).map((p: any) => {
          const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
          return [
            profile?.full_name || p.property_name || "",
            profile?.email || "",
            profile?.phone || "",
            p.address || "",
            p.city || "",
            p.state || "",
            p.zip || "",
            p.property_type || "",
            p.created_at ? new Date(p.created_at).toLocaleDateString() : "",
          ];
        });
        csvContent = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
        filename = `client-list-${new Date().toISOString().slice(0, 10)}.csv`;
        break;
      }

      case "revenue_summary": {
        const { data: invoices } = await supabase.from("invoices").select("total, balance_due, status, created_at, due_date, paid_date");
        const { data: payments } = await supabase.from("payments_posted").select("amount, payment_date");

        // Group by month
        const monthMap: Record<string, { invoiced: number; collected: number; outstanding: number; overdue: number }> = {};
        for (const inv of (invoices || [])) {
          const m = inv.created_at ? new Date(inv.created_at).toISOString().slice(0, 7) : "Unknown";
          if (!monthMap[m]) monthMap[m] = { invoiced: 0, collected: 0, outstanding: 0, overdue: 0 };
          monthMap[m].invoiced += Number(inv.total) || 0;
          if (inv.status === "overdue") monthMap[m].overdue += Number(inv.balance_due) || 0;
          if (inv.status !== "paid") monthMap[m].outstanding += Number(inv.balance_due) || 0;
        }
        for (const p of (payments || [])) {
          const m = p.payment_date ? new Date(p.payment_date).toISOString().slice(0, 7) : "Unknown";
          if (!monthMap[m]) monthMap[m] = { invoiced: 0, collected: 0, outstanding: 0, overdue: 0 };
          monthMap[m].collected += Number(p.amount) || 0;
        }

        const headers = ["Month", "Invoiced", "Collected", "Outstanding", "Overdue"];
        const rows = Object.entries(monthMap).sort().map(([m, v]) => [m, v.invoiced.toFixed(2), v.collected.toFixed(2), v.outstanding.toFixed(2), v.overdue.toFixed(2)]);
        csvContent = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
        filename = `revenue-summary-${new Date().toISOString().slice(0, 10)}.csv`;
        break;
      }

      case "project_status": {
        const { data: projects } = await supabase
          .from("projects")
          .select("title, status, priority, estimated_cost, actual_cost, created_at, properties(property_name)")
          .order("created_at", { ascending: false });

        const headers = ["Project", "Property", "Status", "Priority", "Estimated Cost", "Actual Cost", "Created"];
        const rows = (projects || []).map((p: any) => [
          p.title || "",
          (p.properties as any)?.property_name || "",
          p.status || "",
          p.priority || "",
          p.estimated_cost || "",
          p.actual_cost || "",
          p.created_at ? new Date(p.created_at).toLocaleDateString() : "",
        ]);
        csvContent = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
        filename = `project-status-${new Date().toISOString().slice(0, 10)}.csv`;
        break;
      }

      case "invoice_aging": {
        const { data: invoices } = await supabase
          .from("invoices")
          .select("invoice_number, title, total, balance_due, status, due_date, created_at, properties(property_name)")
          .neq("status", "paid")
          .order("due_date", { ascending: true });

        const headers = ["Invoice #", "Title", "Property", "Total", "Balance Due", "Due Date", "Days Overdue", "Aging Bucket"];
        const now = Date.now();
        const rows = (invoices || []).map((inv: any) => {
          const due = inv.due_date ? new Date(inv.due_date) : null;
          const daysOver = due ? Math.max(0, Math.floor((now - due.getTime()) / 86400000)) : 0;
          const bucket = daysOver === 0 ? "Current" : daysOver <= 30 ? "1-30 Days" : daysOver <= 60 ? "31-60 Days" : daysOver <= 90 ? "61-90 Days" : "90+ Days";
          return [
            inv.invoice_number || "",
            inv.title || "",
            (inv.properties as any)?.property_name || "",
            inv.total || "",
            inv.balance_due || "",
            inv.due_date || "",
            daysOver,
            bucket,
          ];
        });
        csvContent = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
        filename = `invoice-aging-${new Date().toISOString().slice(0, 10)}.csv`;
        break;
      }

      case "trade_partner_performance": {
        const { data: vendors } = await supabase
          .from("central_vendors")
          .select("company_name, contact_name, email, phone, specialties, rating, status, cost_tier")
          .order("company_name");

        const headers = ["Company", "Contact", "Email", "Phone", "Specialties", "Rating", "Status", "Cost Tier"];
        const rows = (vendors || []).map((v: any) => [
          v.company_name || "",
          v.contact_name || "",
          v.email || "",
          v.phone || "",
          (v.specialties || []).join("; "),
          v.rating || "",
          v.status || "",
          v.cost_tier || "",
        ]);
        csvContent = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
        filename = `trade-partners-${new Date().toISOString().slice(0, 10)}.csv`;
        break;
      }

      case "maintenance_due": {
        const days = filter_params?.days || 30;
        const cutoff = new Date(Date.now() + days * 86400000).toISOString();
        const { data: equipment } = await supabase
          .from("equipment")
          .select("name, category, brand, model, next_service_date, condition, properties(property_name)")
          .not("next_service_date", "is", null)
          .lte("next_service_date", cutoff)
          .order("next_service_date");

        const headers = ["Equipment", "Category", "Brand", "Model", "Next Service", "Condition", "Property"];
        const rows = (equipment || []).map((e: any) => [
          e.name || "",
          e.category || "",
          e.brand || "",
          e.model || "",
          e.next_service_date || "",
          e.condition || "",
          (e.properties as any)?.property_name || "",
        ]);
        csvContent = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
        filename = `maintenance-due-${days}d-${new Date().toISOString().slice(0, 10)}.csv`;
        break;
      }

      default:
        throw new Error(`Unknown export type: ${export_type}`);
    }

    // Store CSV in storage
    const path = `exports/${filename}`;
    const { error: uploadErr } = await supabase.storage
      .from("report-images")
      .upload(path, new Blob([csvContent], { type: "text/csv" }), { upsert: true });

    if (uploadErr) throw uploadErr;

    const { data: urlData } = supabase.storage.from("report-images").getPublicUrl(path);
    const fileUrl = urlData.publicUrl;

    // Update job
    if (job_id) {
      await supabase.from("export_jobs").update({
        status: "complete",
        file_url: fileUrl,
        completed_at: new Date().toISOString(),
      }).eq("id", job_id);
    }

    return new Response(JSON.stringify({ file_url: fileUrl, filename, rows_count: csvContent.split("\n").length - 1 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-export error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
