import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import AdminMessagesSection from "@/components/admin/AdminMessagesSection";

const CRMCommunicationTab = ({ propertyId, contactId }: { propertyId: string | null | undefined; contactId: string }) => {
  if (!propertyId) {
    return (
      <Card className="p-12 text-center">
        <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground font-sans">No property linked — messaging requires a property.</p>
      </Card>
    );
  }

  return <AdminMessagesSection propertyId={propertyId} />;
};

export default CRMCommunicationTab;
