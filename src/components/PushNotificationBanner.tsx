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
    <div className="fixed top-0 left-0 right-0 z-[100] bg-primary text-primary-foreground px-4 py-3 flex items-center justify-center gap-3 shadow-lg animate-in slide-in-from-top duration-300">
      <Bell className="w-4 h-4 shrink-0" />
      <span className="text-sm font-sans">
        Get notified about new messages, invoices, and updates
      </span>
      <Button
        size="sm"
        variant="secondary"
        className="font-sans text-xs h-7"
        onClick={handleEnable}
        disabled={loading}
      >
        {loading ? "Enabling..." : "Turn on notifications"}
      </Button>
      <button
        onClick={handleDismiss}
        className="ml-1 p-1 rounded hover:bg-primary-foreground/10 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default PushNotificationBanner;
