import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Upload, Download } from "lucide-react";
import { useMyProjectFiles } from "@/hooks/useTradePartnerData";
import { format } from "date-fns";

const TradePartnerDocuments = () => {
  const { data: files, isLoading } = useMyProjectFiles();

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-sans font-bold text-foreground">Documents</h1>
        <Button size="sm" className="gap-1.5 font-sans"><Upload className="w-3.5 h-3.5" /> Upload</Button>
      </div>

      {(files || []).length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-sm font-sans font-semibold text-foreground mb-1">No documents</h3>
          <p className="text-xs text-muted-foreground font-sans">Files shared with you or uploaded by you will appear here.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {(files || []).map((f: any) => (
            <Card key={f.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-sans font-medium text-foreground">{f.file_name}</p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-sans">
                    <span>{f.projects?.title || "Project"}</span>
                    <span>·</span>
                    <span>{format(new Date(f.created_at), "MMM d, yyyy")}</span>
                    {f.file_size && <><span>·</span><span>{f.file_size}</span></>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-sans">{f.category}</Badge>
                {f.file_url && (
                  <Button variant="ghost" size="icon" asChild><a href={f.file_url} target="_blank" rel="noopener noreferrer"><Download className="w-4 h-4" /></a></Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TradePartnerDocuments;
