import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, AlertTriangle, HelpCircle, Mail, Phone, MapPin, Home } from "lucide-react";
import type { MockClient } from "@/data/adminMockData";

interface ClientOverviewProps {
  client: MockClient;
}

const ClientOverview = ({ client }: ClientOverviewProps) => {
  return (
    <div className="space-y-6">
      {/* Client Info */}
      <Card className="p-6">
        <h3 className="text-sm font-sans font-semibold text-foreground mb-4">Client Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs font-sans text-muted-foreground">Email</p>
              <p className="text-sm font-sans text-foreground">{client.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs font-sans text-muted-foreground">Phone</p>
              <p className="text-sm font-sans text-foreground">{client.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs font-sans text-muted-foreground">Address</p>
              <p className="text-sm font-sans text-foreground">{client.address}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Home className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs font-sans text-muted-foreground">Property</p>
              <p className="text-sm font-sans text-foreground">
                {client.yearBuilt} · {client.sqft.toLocaleString()} sqft · {client.bedrooms}bd / {client.bathrooms}ba
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Report Status */}
      <Card className="p-6">
        <h3 className="text-sm font-sans font-semibold text-foreground mb-4">Report Status</h3>
        <div className="flex items-center gap-3 mb-4">
          <Badge className={`text-xs font-sans border-none ${
            client.reportStatus === "published" ? "bg-primary text-primary-foreground" :
            client.reportStatus === "review" ? "bg-accent/20 text-accent-foreground" :
            "bg-muted text-muted-foreground"
          }`}>
            {client.reportStatus === "published" ? "Published" : client.reportStatus === "review" ? "In Review" : "Draft"}
          </Badge>
          <span className="text-sm font-sans text-muted-foreground">Version {client.reportVersion}</span>
        </div>
        <div className="text-xs font-sans text-muted-foreground space-y-1">
          <p>v1 published Jan 15, 2024</p>
          {client.reportVersion === "v2" && <p>v2 draft started Feb 3, 2024</p>}
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-lg font-sans font-bold text-foreground">{client.totalPages}</p>
            <p className="text-[11px] font-sans text-muted-foreground">Total Pages</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <CheckCircle className="w-4 h-4 text-foreground" />
          <div>
            <p className="text-lg font-sans font-bold text-foreground">{client.completePages}</p>
            <p className="text-[11px] font-sans text-muted-foreground">Complete</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-accent" />
          <div>
            <p className="text-lg font-sans font-bold text-foreground">{client.flaggedPages}</p>
            <p className="text-[11px] font-sans text-muted-foreground">Flagged</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <HelpCircle className="w-4 h-4 text-accent" />
          <div>
            <p className="text-lg font-sans font-bold text-foreground">{client.openQuestions}</p>
            <p className="text-[11px] font-sans text-muted-foreground">Questions</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ClientOverview;
