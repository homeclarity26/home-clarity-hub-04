import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Image, Music, Archive, ExternalLink } from "lucide-react";
import { mockFiles } from "@/data/adminMockData";

const categoryIcons: Record<string, typeof FileText> = {
  "Discovery Call": Music,
  "Walkthrough": FileText,
  "Exterior Photos": Image,
  "Interior Photos": Image,
  "Serial Plates": Image,
  "hover.to": Archive,
  "External Reports": FileText,
};

const FileManager = () => {
  const categories = [...new Set(mockFiles.map((f) => f.category))];

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const files = mockFiles.filter((f) => f.category === category);
        const Icon = categoryIcons[category] || FileText;

        return (
          <Card key={category} className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-sans font-semibold text-foreground">{category}</h4>
                <span className="text-xs font-sans text-muted-foreground">({files.length})</span>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-sans">
                <Upload className="w-3.5 h-3.5" />
                Upload
              </Button>
            </div>

            <div className="space-y-2">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    {file.type === "image" ? (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                        <Image className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-sans text-foreground truncate">{file.name}</p>
                      <p className="text-[11px] font-sans text-muted-foreground">{file.size} · {file.uploadDate}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      {/* Additional upload zones */}
      <Card className="p-5 border-dashed">
        <div className="flex items-center gap-2 mb-3">
          <ExternalLink className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-sans font-semibold text-foreground">iGuide Link</h4>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="https://youriguide.com/..."
            className="flex-1 h-9 px-3 rounded-md border border-border text-sm font-sans bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button size="sm" className="text-xs font-sans">Save</Button>
        </div>
      </Card>
    </div>
  );
};

export default FileManager;
