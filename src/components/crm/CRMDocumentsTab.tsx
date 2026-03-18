import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";
import FileManager from "@/components/admin/FileManager";

const CRMDocumentsTab = ({ propertyId }: { propertyId: string | null | undefined }) => {
  if (!propertyId) {
    return (
      <Card className="p-12 text-center">
        <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground font-sans">No property linked — documents require a property.</p>
      </Card>
    );
  }

  return <FileManager propertyId={propertyId} />;
};

export default CRMDocumentsTab;
