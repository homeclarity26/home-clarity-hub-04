import { Bell, BellOff, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

const PushNotificationSettings = () => {
  const { permissionState, isSubscribed, subscribe, unsubscribe, loading } =
    usePushNotifications();

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
      toast.success("Push notifications disabled");
    } else {
      const ok = await subscribe();
      if (ok) toast.success("Push notifications enabled!");
      else toast.error("Could not enable. Check browser permissions.");
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-accent" />
          <h3 className="text-base font-sans font-semibold text-foreground">
            Push Notifications
          </h3>
        </div>
        {isSubscribed && (
          <Badge className="bg-green-100 text-green-800 border-none gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Active
          </Badge>
        )}
      </div>

      <p className="text-sm font-sans text-muted-foreground">
        Receive browser notifications for new messages, paid invoices, and
        important updates, even when you don't have the app open.
      </p>

      {permissionState === "unsupported" ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BellOff className="w-4 h-4" />
          Push notifications are not supported in this browser.
        </div>
      ) : permissionState === "denied" ? (
        <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm font-sans">
          Notifications are blocked. Please enable them in your browser settings
          and reload the page.
        </div>
      ) : (
        <Button
          size="sm"
          variant={isSubscribed ? "outline" : "default"}
          className="font-sans"
          onClick={handleToggle}
          disabled={loading}
        >
          {loading
            ? "Processing..."
            : isSubscribed
            ? "Disable Push Notifications"
            : "Enable Push Notifications"}
        </Button>
      )}

      <div className="text-xs font-sans text-muted-foreground space-y-1 pt-2 border-t border-border">
        <p className="font-medium">You'll be notified about:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>New messages from clients or trade partners</li>
          <li>Invoice payments</li>
          <li>Proposal signatures</li>
          <li>Client health score alerts</li>
        </ul>
      </div>
    </Card>
  );
};

export default PushNotificationSettings;
