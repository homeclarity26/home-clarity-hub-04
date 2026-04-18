import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Types
export interface CRMContact {
  id: string;
  contact_type: "client" | "trade_partner";
  property_id: string | null;
  vendor_id: string | null;
  client_stage: string | null;
  partner_stage: string | null;
  tags: string[];
  last_contact_date: string | null;
  lifetime_value: number;
  referral_source: string | null;
  since_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  property?: any;
  vendor?: any;
}

export interface CRMActivityEntry {
  id: string;
  contact_id: string;
  activity_type: string;
  channel: string | null;
  content_preview: string | null;
  metadata: any;
  logged_by: string | null;
  logged_at: string;
}

export interface PipelineEntry {
  id: string;
  contact_id: string;
  from_stage: string | null;
  to_stage: string;
  changed_by: string | null;
  changed_at: string;
  notes: string | null;
}

export interface CRMPerson {
  id: string;
  contact_id: string;
  name: string;
  relationship: string | null;
  phone: string | null;
  email: string | null;
  preferred_method: string | null;
  birthday: string | null;
  notes: string | null;
  created_at: string;
}

// ─── Hooks ───

export function useCRMContacts(contactType?: "client" | "trade_partner") {
  return useQuery({
    queryKey: ["crm-contacts", contactType],
    queryFn: async () => {
      let query = supabase.from("crm_contacts").select("*").order("created_at", { ascending: false });
      if (contactType) query = query.eq("contact_type", contactType);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CRMContact[];
    },
  });
}

export function useCRMContact(id: string | undefined) {
  return useQuery({
    queryKey: ["crm-contact", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_contacts")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as CRMContact;
    },
  });
}

export function useCRMActivities(contactId: string | undefined) {
  return useQuery({
    queryKey: ["crm-activities", contactId],
    enabled: !!contactId,
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_activity_log")
        .select("*")
        .eq("contact_id", contactId)
        .order("logged_at", { ascending: false });
      if (error) throw error;
      return (data || []) as CRMActivityEntry[];
    },
  });
}

export function useCRMPipelineHistory(contactId: string | undefined) {
  return useQuery({
    queryKey: ["crm-pipeline-history", contactId],
    enabled: !!contactId,
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_pipeline_history")
        .select("*")
        .eq("contact_id", contactId)
        .order("changed_at", { ascending: false });
      if (error) throw error;
      return (data || []) as PipelineEntry[];
    },
  });
}

export function useCRMPeople(contactId: string | undefined) {
  return useQuery({
    queryKey: ["crm-people", contactId],
    enabled: !!contactId,
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_contacts_people")
        .select("*")
        .eq("contact_id", contactId)
        .order("created_at");
      if (error) throw error;
      return (data || []) as CRMPerson[];
    },
  });
}

export function useCRMSavedFilters(contactType?: "client" | "trade_partner") {
  return useQuery({
    queryKey: ["crm-saved-filters", contactType],
    queryFn: async () => {
      let query = supabase.from("crm_saved_filters").select("*").order("created_at");
      if (contactType) query = query.eq("contact_type", contactType);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

// ─── Mutations ───

export function useUpdateCRMStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contactId, contactType, newStage, userId }: { contactId: string; contactType: "client" | "trade_partner"; newStage: string; userId: string }) => {
      // Get current stage
      const { data: contact } = await supabase.from("crm_contacts").select("client_stage, partner_stage").eq("id", contactId).single();
      const fromStage = contactType === "client" ? contact?.client_stage : contact?.partner_stage;

      // Update stage
      const updateCol = contactType === "client" ? { client_stage: newStage } : { partner_stage: newStage };
      const { error: updateErr } = await supabase.from("crm_contacts").update(updateCol).eq("id", contactId);
      if (updateErr) throw updateErr;

      // Log history
      await supabase.from("crm_pipeline_history").insert({
        contact_id: contactId,
        from_stage: fromStage,
        to_stage: newStage,
        changed_by: userId,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-contacts"] });
      qc.invalidateQueries({ queryKey: ["crm-pipeline-history"] });
      toast.success("Stage updated");
    },
  });
}

export function useLogCRMActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Omit<CRMActivityEntry, "id" | "logged_at">) => {
      const { error } = await supabase.from("crm_activity_log").insert(entry);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-activities"] });
    },
  });
}

export function useCreateCRMContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contact: Partial<CRMContact>) => {
      const { data, error } = await supabase.from("crm_contacts").insert(contact).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-contacts"] });
      toast.success("Contact created");
    },
  });
}

export function useUpdateCRMContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CRMContact> & { id: string }) => {
      const { error } = await supabase.from("crm_contacts").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-contacts"] });
      qc.invalidateQueries({ queryKey: ["crm-contact"] });
      toast.success("Contact updated");
    },
  });
}

// ─── Enriched queries ───

export function useCRMClientsEnriched() {
  return useQuery({
    queryKey: ["crm-clients-enriched"],
    queryFn: async () => {
      // Get CRM contacts of type client
      const { data: contacts, error: cErr } = await supabase.from("crm_contacts")
        .select("*")
        .eq("contact_type", "client")
        .order("created_at", { ascending: false });
      if (cErr) throw cErr;

      // Get all properties for joining
      const { data: properties } = await supabase.from("properties").select("*");
      const propMap = new Map((properties || []).map((p: any) => [p.id, p]));

      // Get profiles for names
      const { data: profiles } = await supabase.from("profiles").select("*");
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      // Get invoices for balance
      const { data: invoices } = await supabase.from("invoices").select("property_id, amount, status");

      // Get projects for count
      const { data: projects } = await supabase.from("projects").select("property_id, status");

      const enrichContact = (c: CRMContact) => {
        const prop = c.property_id ? propMap.get(c.property_id) : null;
        const profile = prop?.client_user_id ? profileMap.get(prop.client_user_id) : null;
        const propInvoices = (invoices || []).filter((i: any) => i.property_id === c.property_id);
        const balanceDue = propInvoices.filter((i: any) => i.status !== "paid").reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
        const activeProjects = (projects || []).filter((p: any) => p.property_id === c.property_id && p.status !== "completed" && p.status !== "cancelled").length;

        return {
          ...c,
          name: profile?.full_name || prop?.property_name || "Unknown",
          email: profile?.email || "",
          phone: profile?.phone || "",
          property: prop?.property_name || prop?.address || "",
          address: prop?.address || "",
          healthScore: 0, // computed separately if needed
          balanceDue,
          activeProjects,
        };
      };

      const enrichedFromContacts = (contacts || []).map(enrichContact);

      // Fallback: any property that has NO matching crm_contacts row still
      // belongs in the CRM list — otherwise /admin/clients and /admin/crm
      // disagree (the New Client wizard creates a property but doesn't
      // create a crm_contacts row). Synthesize a virtual contact so the
      // client shows up in CRM until a proper crm_contacts row is created.
      const contactPropertyIds = new Set(
        (contacts || []).map((c: CRMContact) => c.property_id).filter(Boolean),
      );
      const orphanProperties = (properties || []).filter(
        (p: any) => !contactPropertyIds.has(p.id),
      );
      const synthesized = orphanProperties.map((prop: any) => {
        const profile = prop.client_user_id ? profileMap.get(prop.client_user_id) : null;
        const propInvoices = (invoices || []).filter((i: any) => i.property_id === prop.id);
        const balanceDue = propInvoices
          .filter((i: any) => i.status !== "paid")
          .reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
        const activeProjects = (projects || []).filter(
          (p: any) => p.property_id === prop.id && p.status !== "completed" && p.status !== "cancelled",
        ).length;
        return {
          id: `synthetic:${prop.id}`,
          contact_type: "client" as const,
          property_id: prop.id,
          vendor_id: null,
          client_stage: "lead",
          partner_stage: null,
          tags: [],
          last_contact_date: null,
          lifetime_value: 0,
          referral_source: null,
          since_date: prop.created_at || null,
          notes: null,
          created_by: null,
          created_at: prop.created_at || new Date().toISOString(),
          updated_at: prop.updated_at || prop.created_at || new Date().toISOString(),
          name: profile?.full_name || prop.property_name || "Unknown",
          email: profile?.email || "",
          phone: profile?.phone || "",
          property: prop.property_name || prop.address || "",
          address: prop.address || "",
          healthScore: 0,
          balanceDue,
          activeProjects,
          _synthetic: true as const,
        };
      });

      return [...enrichedFromContacts, ...synthesized];
    },
  });
}

export function useCRMTradePartnersEnriched() {
  return useQuery({
    queryKey: ["crm-trade-partners-enriched"],
    queryFn: async () => {
      const { data: contacts, error: cErr } = await supabase.from("crm_contacts")
        .select("*")
        .eq("contact_type", "trade_partner")
        .order("created_at", { ascending: false });
      if (cErr) throw cErr;

      const { data: vendors } = await supabase.from("central_vendors").select("*");
      const vendorMap = new Map((vendors || []).map((v: any) => [v.id, v]));

      return (contacts || []).map((c: CRMContact) => {
        const vendor: any = c.vendor_id ? vendorMap.get(c.vendor_id) : null;
        return {
          ...c,
          name: vendor?.contact_name || vendor?.company_name || "Unknown",
          company: vendor?.company_name || "",
          specialty: vendor?.specialties?.join(", ") || "",
          rating: vendor?.rating || 0,
          tier: vendor?.tier || "approved",
          email: vendor?.email || "",
          phone: vendor?.phone || "",
          activeProjects: 0,
          availability: vendor?.lead_time || "Unknown",
        };
      });
    },
  });
}
