import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

const PushNotificationBanner = () => {
  const { shouldShowBanner, subscribe, dismissBanner, loading } = usePushNotifications();

  if (!shouldShowBanner) return null;

  const handleEnable = async () => {
    const ok = await subscribe();
    if (ok) {
      toast.success("Push notifications enabled!");
    } else {
      toast.error("Could not enable notifications. Check browser settings.");
    }
  };

  const handleDismiss = () => {
    dismissBanner();
    // Force re-render by triggering a state update
    window.dispatchEvent(new Event("push-banner-dismissed"));
  };

  return (
    // Slim, bottom-right chip (was a full-width navy banner that dominated
    // every admin page). Still dismissible, still prominent enough to act
    // on, but no longer covering the header on every page load.
    <div className="fixed bottom-4 right-4 z-[100] max-w-sm bg-primary text-primary-foreground rounded-lg px-4 py-3 flex items-center gap-3 shadow-lg animate-in slide-in-from-bottom-2 duration-300">
      <Bell className="w-4 h-4 shrink-0" />
      <span className="text-xs font-sans flex-1">
        Get notified about new messages, invoices, and updates
      </span>
      <Button
        size="sm"
        variant="secondary"
        className="font-sans text-xs h-7"
        onClick={handleEnable}
        disabled={loading}
      >
        {loading ? "Enabling..." : "Turn on"}
      </Button>
      <button
        onClick={handleDismiss}
        className="ml-1 p-1 rounded hover:bg-primary-foreground/10 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default PushNotificationBanner;
