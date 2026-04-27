import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ShoppingCart, Package, Check, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const categoryColors: Record<string, string> = {
  Inspection: "bg-blue-100 text-blue-800",
  Consultation: "bg-purple-100 text-purple-800",
  Maintenance: "bg-green-100 text-green-800",
  Report: "bg-accent/20 text-accent-foreground",
  "Add-On": "bg-orange-100 text-orange-800",
  Recurring: "bg-pink-100 text-pink-800",
  Other: "bg-muted text-muted-foreground",
};

interface ServicesMenuProps {
  propertyId?: string;
}

const ServicesMenu = ({ propertyId }: ServicesMenuProps) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: services = [] } = useQuery({
    queryKey: ["services-library-active"],
    queryFn: async () => {
      const { data } = await supabase.from("services").select("*").eq("is_active", true).order("category").order("name");
      return data || [];
    },
  });

  // Group by category
  const grouped = services.reduce((acc: Record<string, any[]>, s: any) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  const toggleCart = (id: string) => {
    setCart(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const cartTotal = services.filter((s: any) => cart.includes(s.id)).reduce((t: number, s: any) => t + Number(s.price), 0);

  const submitRequest = async () => {
    if (!user || !propertyId || cart.length === 0) return;
    setSubmitting(true);
    try {
      const { data: req, error } = await supabase.from("service_requests").insert({
        client_id: user.id, property_id: propertyId, notes, status: "pending",
      }).select("id").single();
      if (error || !req) throw error;

      await supabase.from("service_request_items").insert(
        cart.map(serviceId => ({ request_id: req.id, service_id: serviceId }))
      );

      toast.success("Service request submitted! Your advisor will review and send you a proposal.");
      setCart([]);
      setNotes("");
      setConfirmOpen(false);
    } catch {
      toast.error("Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const priceLabel = (s: any) => {
    const suffix: Record<string, string> = { flat: "", hourly: "/hr", monthly: "/mo", annual: "/yr" };
    return `${fmt(s.price)}${suffix[s.price_type] || ""}`;
  };

  if (services.length === 0) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 md:px-20 py-10 text-center">
        <Package className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-display text-xl text-foreground mb-2">No services available yet</h2>
        <p className="font-sans text-sm text-muted-foreground">Your advisor hasn't published any services for this property. Reach out to them directly if you'd like to request one.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 md:px-20 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-foreground">Available Services</h2>
          <p className="font-sans text-sm text-muted-foreground mt-1">Browse and request additional services for your property.</p>
        </div>
        {cart.length > 0 && (
          <Button className="gap-2 font-sans" onClick={() => setConfirmOpen(true)}>
            <ShoppingCart className="w-4 h-4" />
            Review Request ({cart.length}): {fmt(cartTotal)}
          </Button>
        )}
      </div>

      {Object.entries(grouped).map(([category, svcs]) => (
        <div key={category} className="space-y-3">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">{category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(svcs as any[]).map((s: any) => {
              const inCart = cart.includes(s.id);
              return (
                <Card key={s.id} className={`p-5 transition-all ${inCart ? "ring-2 ring-accent" : ""}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-sans font-semibold text-foreground">{s.name}</h4>
                      <Badge className={`text-[9px] mt-1 ${categoryColors[s.category] || categoryColors.Other}`}>{s.category}</Badge>
                    </div>
                    <span className="text-lg font-mono font-bold text-foreground">{priceLabel(s)}</span>
                  </div>
                  {s.description && <p className="text-sm font-sans text-muted-foreground mb-4">{s.description}</p>}
                  {s.duration_hours && <p className="text-[10px] font-mono text-muted-foreground mb-3">Approx. {s.duration_hours} hours</p>}
                  <Button
                    variant={inCart ? "default" : "outline"}
                    size="sm"
                    className="w-full gap-1.5 text-xs font-sans"
                    onClick={() => toggleCart(s.id)}
                  >
                    {inCart ? <><Check className="w-3.5 h-3.5" />Added to Request</> : <><ShoppingCart className="w-3.5 h-3.5" />Request This Service</>}
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Review Your Service Request</DialogTitle>
            <DialogDescription className="font-sans text-sm">
              Your advisor will review your selections and send you a detailed estimate for approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {services.filter((s: any) => cart.includes(s.id)).map((s: any) => (
              <div key={s.id} className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm font-sans">{s.name}</span>
                <span className="text-sm font-mono font-bold">{priceLabel(s)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 font-bold">
              <span className="font-sans">Estimated Total</span>
              <span className="font-mono">{fmt(cartTotal)}</span>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-sans text-muted-foreground">Add a note for your advisor (optional)</p>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any details or preferences..." className="font-sans text-sm" rows={3} />
            </div>
            <div className="bg-accent/5 rounded-md p-3 border border-accent/20">
              <p className="text-xs font-sans text-accent">
                ✓ Your advisor will review this request<br />
                ✓ You'll receive a detailed estimate for approval<br />
                ✓ No charge until you accept the estimate
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} className="font-sans">Cancel</Button>
            <Button onClick={submitRequest} disabled={submitting} className="font-sans gap-1.5">
              {submitting ? <><Send className="w-4 h-4 animate-pulse" />Submitting...</> : <><Send className="w-4 h-4" />Submit Request</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServicesMenu;
