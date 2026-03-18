import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, RefreshCw, Shield } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CRMContact } from "@/hooks/useCRMData";

const CRMSettingsTab = ({ contact }: { contact: CRMContact }) => {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const handleDelete = async () => {
    const { error } = await (supabase.from("crm_contacts") as any).delete().eq("id", contact.id);
    if (error) { toast.error("Failed to delete contact"); return; }
    toast.success("Contact deleted");
    qc.invalidateQueries({ queryKey: ["crm-contacts"] });
    navigate("/admin/crm");
  };

  return (
    <div className="space-y-6 max-w-lg">
      <Card className="p-5">
        <h3 className="font-sans font-semibold text-sm text-foreground mb-3 flex items-center gap-2"><Shield className="w-4 h-4" /> Portal Access</h3>
        <p className="text-sm text-muted-foreground font-sans mb-3">Manage this client's access to their portal.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="font-sans"><RefreshCw className="w-3.5 h-3.5 mr-1" /> Resend Invite</Button>
        </div>
      </Card>

      <Card className="p-5 border-destructive/30">
        <h3 className="font-sans font-semibold text-sm text-destructive mb-3">Danger Zone</h3>
        <p className="text-sm text-muted-foreground font-sans mb-3">Permanently delete this CRM contact and all associated data.</p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="gap-1.5 font-sans"><Trash2 className="w-3.5 h-3.5" /> Delete Contact</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-sans">Delete this contact?</AlertDialogTitle>
              <AlertDialogDescription className="font-sans">This will permanently remove the CRM record, pipeline history, and activity log. This cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-sans">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="font-sans bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>
  );
};

export default CRMSettingsTab;
