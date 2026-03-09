import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Plus, History } from "lucide-react";
import { mockPricingTemplates } from "@/data/adminMockData";

type TabType = "pricing" | "scope" | "systems";

const KnowledgeBase = () => {
  const [activeTab, setActiveTab] = useState<TabType>("pricing");

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["pricing", "scope", "systems"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-sans capitalize transition-colors border-b-2 bg-transparent cursor-pointer ${
              activeTab === tab
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "pricing" ? "Pricing Templates" : tab === "scope" ? "Scope Templates" : "System Templates"}
          </button>
        ))}
      </div>

      {activeTab === "pricing" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-sans text-muted-foreground">
              Manage three-tier pricing for project types
            </p>
            <Button size="sm" className="gap-1.5 text-xs font-sans">
              <Plus className="w-3.5 h-3.5" />
              Add Template
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-sans text-xs">Project Type</TableHead>
                <TableHead className="font-sans text-xs">Essential</TableHead>
                <TableHead className="font-sans text-xs">Enhanced</TableHead>
                <TableHead className="font-sans text-xs">Signature</TableHead>
                <TableHead className="font-sans text-xs">Region</TableHead>
                <TableHead className="font-sans text-xs">Ver.</TableHead>
                <TableHead className="font-sans text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPricingTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-sans text-sm font-medium">{template.projectType}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-xs font-sans text-foreground">{template.essential.priceRange}</p>
                      <p className="text-[11px] font-sans text-muted-foreground truncate max-w-[160px]">{template.essential.scope}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-xs font-sans text-foreground">{template.enhanced.priceRange}</p>
                      <p className="text-[11px] font-sans text-muted-foreground truncate max-w-[160px]">{template.enhanced.scope}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-xs font-sans text-foreground">{template.signature.priceRange}</p>
                      <p className="text-[11px] font-sans text-muted-foreground truncate max-w-[160px]">{template.signature.scope}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-sans text-xs text-muted-foreground">{template.region}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-sans">v{template.version}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm"><Edit className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="sm"><History className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {activeTab === "scope" && (
        <div className="space-y-4">
          <p className="text-sm font-sans text-muted-foreground">
            Template narratives for each room/system type
          </p>
          {["Kitchen", "Bathroom", "Roof", "HVAC", "Electrical", "Plumbing"].map((type) => (
            <Card key={type} className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-sans font-medium text-foreground">{type}</p>
                <p className="text-xs font-sans text-muted-foreground">Default narrative, risks, recommendations</p>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-sans">
                <Edit className="w-3.5 h-3.5" />
                Edit
              </Button>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "systems" && (
        <div className="space-y-4">
          <p className="text-sm font-sans text-muted-foreground">
            Equipment templates with lifespans, maintenance, and costs
          </p>
          {["Furnace", "AC Unit", "Water Heater", "Electrical Panel", "Roof Materials", "Siding"].map((type) => (
            <Card key={type} className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-sans font-medium text-foreground">{type}</p>
                <p className="text-xs font-sans text-muted-foreground">Lifespan, maintenance, replacement costs</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-sans">v1</Badge>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs font-sans">
                  <Edit className="w-3.5 h-3.5" />
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
