import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEditMode } from "@/contexts/EditModeContext";
import { Users, Plus, X, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

interface Vendor {
  id: string;
  title: string;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  specialty?: string | null;
  report_page_key?: string | null;
}

interface RecommendedVendorsProps {
  propertyId: string;
  pageSlug: string;
}

const RecommendedVendors = ({ propertyId, pageSlug }: RecommendedVendorsProps) => {
  const { canEdit } = useEditMode();
  const [assignedVendors, setAssignedVendors] = useState<Vendor[]>([]);
  const [allPropertyVendors, setAllPropertyVendors] = useState<Vendor[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadVendors = useCallback(async () => {
    const { data, error } = await supabase
      .from("vendors")
      .select("*")
      .eq("property_id", propertyId)
      .order("title", { ascending: true });

    if (error) {
      console.error("Failed to load vendors:", error);
      setIsLoading(false);
      return;
    }

    const all = (data || []) as Vendor[];
    setAllPropertyVendors(all);
    setAssignedVendors(all.filter((v) => v.report_page_key === pageSlug));
    setIsLoading(false);
  }, [propertyId, pageSlug]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const assignVendor = async () => {
    if (!selectedVendorId) return;
    const { error } = await supabase
      .from("vendors")
      .update({ report_page_key: pageSlug } as Record<string, unknown>)
      .eq("id", selectedVendorId);

    if (error) {
      toast.error("Failed to assign vendor");
      return;
    }
    setSelectedVendorId("");
    setIsAdding(false);
    loadVendors();
  };

  const unassignVendor = async (vendorId: string) => {
    const { error } = await supabase
      .from("vendors")
      .update({ report_page_key: null } as Record<string, unknown>)
      .eq("id", vendorId);

    if (error) {
      toast.error("Failed to remove vendor");
      return;
    }
    loadVendors();
  };

  if (isLoading) return null;

  // In client view: only show if there are vendors assigned
  if (!canEdit && assignedVendors.length === 0) return null;

  // In admin view: only show if there are vendors in the system (no point showing empty state otherwise)
  if (canEdit && allPropertyVendors.length === 0) return null;

  const unassignedVendors = allPropertyVendors.filter(
    (v) => !v.report_page_key || v.report_page_key !== pageSlug
  );

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-2xl text-foreground flex items-center gap-2">
          Recommended Vendors
        </h3>
        {canEdit && !isAdding && unassignedVendors.length > 0 && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Assign Vendor
          </button>
        )}
      </div>

      {/* Assign vendor form */}
      {canEdit && isAdding && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg border border-border bg-muted/30">
          <select
            value={selectedVendorId}
            onChange={(e) => setSelectedVendorId(e.target.value)}
            className="flex-1 text-sm font-sans bg-background border border-input rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select a vendor to assign...</option>
            {unassignedVendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title}
                {v.specialty ? ` — ${v.specialty}` : ""}
              </option>
            ))}
          </select>
          <button
            onClick={assignVendor}
            disabled={!selectedVendorId}
            className="px-3 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-mono uppercase tracking-wider hover:bg-accent/90 transition-colors disabled:opacity-40"
          >
            Assign
          </button>
          <button
            onClick={() => {
              setIsAdding(false);
              setSelectedVendorId("");
            }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* No vendors assigned yet (admin only) */}
      {assignedVendors.length === 0 && canEdit && (
        <p className="font-sans text-sm text-muted-foreground italic">
          No vendors assigned to this page yet. Use the "Assign Vendor" button above to link vendors from your vendor list.
        </p>
      )}

      {/* Vendor cards */}
      {assignedVendors.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {assignedVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="rounded-lg border border-border p-4 bg-card flex items-start justify-between gap-3 hover:shadow-hbc-sm transition-shadow"
            >
              <div className="min-w-0">
                <p className="font-sans text-sm font-semibold text-foreground">{vendor.title}</p>
                {vendor.specialty && (
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent mt-0.5">
                    {vendor.specialty}
                  </p>
                )}
                {vendor.contact_name && (
                  <p className="font-sans text-xs text-muted-foreground mt-1.5">{vendor.contact_name}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-1.5">
                  {vendor.phone && (
                    <a
                      href={`tel:${vendor.phone}`}
                      className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {vendor.phone}
                    </a>
                  )}
                  {vendor.email && (
                    <a
                      href={`mailto:${vendor.email}`}
                      className="font-sans text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
                      {vendor.email}
                    </a>
                  )}
                </div>
              </div>
              {canEdit && (
                <button
                  onClick={() => unassignVendor(vendor.id)}
                  title="Remove from this page"
                  className="p-1 rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0 mt-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendedVendors;
