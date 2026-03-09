import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import AdminHeader from "@/components/admin/AdminHeader";

const AdminSettings = () => {
  return (
    <div>
      <AdminHeader breadcrumbs={[{ label: "Settings" }]} />
      <div className="p-6 max-w-3xl space-y-6">
        {/* Account */}
        <Card className="p-6 space-y-5">
          <h3 className="text-base font-sans font-semibold text-foreground">Account</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Full Name</Label>
              <Input defaultValue="Alex Rivera" className="font-sans" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Email</Label>
              <Input defaultValue="alex@homebuildingclarity.com" className="font-sans" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Company</Label>
              <Input defaultValue="Home Building Clarity" className="font-sans" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Phone</Label>
              <Input defaultValue="(330) 555-0100" className="font-sans" />
            </div>
          </div>
          <Button size="sm" className="font-sans">Save Changes</Button>
        </Card>

        {/* Notifications */}
        <Card className="p-6 space-y-5">
          <h3 className="text-base font-sans font-semibold text-foreground">Notifications</h3>
          <div className="space-y-4">
            {[
              { label: "Client comments & questions", desc: "Get notified when clients leave comments" },
              { label: "Report published", desc: "Confirmation when a report goes live" },
              { label: "File uploads", desc: "When new files are uploaded to a client" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-sans text-foreground">{item.label}</p>
                  <p className="text-xs font-sans text-muted-foreground">{item.desc}</p>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
          </div>
        </Card>

        {/* Integrations */}
        <Card className="p-6 space-y-5">
          <h3 className="text-base font-sans font-semibold text-foreground">Integrations</h3>
          <div className="space-y-4">
            {[
              { label: "Google Calendar", desc: "Sync appointments and reminders", connected: false },
              { label: "Stripe", desc: "Payment processing for invoices", connected: false },
              { label: "hover.to", desc: "3D property measurement data", connected: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-sans text-foreground">{item.label}</p>
                  <p className="text-xs font-sans text-muted-foreground">{item.desc}</p>
                </div>
                <Button variant={item.connected ? "outline" : "default"} size="sm" className="text-xs font-sans">
                  {item.connected ? "Connected" : "Connect"}
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Region */}
        <Card className="p-6 space-y-5">
          <h3 className="text-base font-sans font-semibold text-foreground">Default Region</h3>
          <div className="space-y-1.5">
            <Label className="text-xs font-sans">Service Area</Label>
            <Input defaultValue="Summit County, OH" className="font-sans" />
          </div>
          <Button size="sm" className="font-sans">Update</Button>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;
