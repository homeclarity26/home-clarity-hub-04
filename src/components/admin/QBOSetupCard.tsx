import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, AlertCircle, ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import { isQBOConfigured } from "@/lib/qboSync";

interface QBOSetupCardProps {
  propertyId?: string;
}

const QBOSetupCard = ({ propertyId }: QBOSetupCardProps) => {
  const [connected, setConnected] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      const configured = isQBOConfigured();
      setConnected(configured);

      if (configured && propertyId) {
        // Count invoices that are 'sent' but not yet synced to QBO
        const { data } = await supabase.from("invoices")
          .select("id, status, updated_at")
          .eq("property_id", propertyId)
          .eq("status", "sent");

        // Simulate: all 'sent' invoices that have no qbo_invoice_id are pending
        // In a real implementation, you'd check a qbo_invoice_id column
        setPendingCount(data?.length || 0);

        // Last sync time — in production this would come from a sync log
        setLastSync(
          data?.[0]?.updated_at
            ? new Date(data[0].updated_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })
            : null
        );
      }
      setChecking(false);
    };
    check();
  }, [propertyId]);

  if (checking) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-hbc-sm p-6 flex items-center gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="font-sans text-sm text-muted-foreground">Checking QBO connection...</span>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border shadow-hbc-sm p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display text-lg text-foreground">QuickBooks Online</h3>
          <p className="font-sans text-sm text-muted-foreground mt-0.5">
            Sync invoices and payments to your books automatically
          </p>
        </div>
        {connected ? (
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Connected
          </span>
        ) : (
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            <AlertCircle className="w-3.5 h-3.5" />
            Not connected
          </span>
        )}
      </div>

      {connected ? (
        // Connected state
        <div className="space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/40 rounded-lg p-4">
              <p className="font-mono text-2xl font-semibold text-foreground">{pendingCount}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-1">
                Invoices to Sync
              </p>
            </div>
            <div className="bg-muted/40 rounded-lg p-4">
              <p className="font-mono text-sm font-medium text-foreground">
                {lastSync || "Never"}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-1">
                Last Sync
              </p>
            </div>
          </div>

          {/* How sync works */}
          <div className="text-sm font-sans text-muted-foreground space-y-1.5">
            <p className="font-medium text-foreground text-xs font-mono uppercase tracking-wider mb-2">
              Sync Rules
            </p>
            <div className="flex items-start gap-2">
              <span className="text-accent mt-0.5">→</span>
              <span>Invoice syncs to QBO when status changes to <strong>Sent</strong></span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-accent mt-0.5">→</span>
              <span>Payments sync to QBO when posted in the portal</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-accent mt-0.5">→</span>
              <span>Portal is source of truth — changes flow one way (portal → QBO)</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <button
              onClick={() => {
                // Open QBO dashboard — placeholder
                window.open("https://app.qbo.intuit.com", "_blank");
              }}
              className="flex items-center gap-1.5 font-sans text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open QuickBooks
            </button>
            <button
              className="flex items-center gap-1.5 font-sans text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto"
              onClick={() => {
                // In production, this would clear tokens from env/settings
                if (confirm("Disconnect QuickBooks? Syncing will be paused.")) {
                  setConnected(false);
                }
              }}
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        // Not connected state
        <div className="space-y-4">
          {/* Instructions */}
          <div className="bg-muted/30 rounded-lg p-4 text-sm font-sans text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">To connect QuickBooks Online:</p>
            <ol className="list-decimal list-inside space-y-1.5 ml-1">
              <li>
                Create a QBO app at{" "}
                <a
                  href="https://developer.intuit.com/app/developer/qbo/docs/get-started"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  developer.intuit.com
                </a>
              </li>
              <li>Complete OAuth2 flow to get an access token</li>
              <li>
                Add these to your <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">.env</code> file:
                <pre className="mt-2 bg-muted rounded p-2 text-[11px] font-mono text-foreground overflow-x-auto">
{`VITE_QBO_CLIENT_ID="your-client-id"
VITE_QBO_ACCESS_TOKEN="your-access-token"
VITE_QBO_REALM_ID="your-company-id"`}
                </pre>
              </li>
            </ol>
          </div>

          {/* Connect button */}
          <a
            href="https://developer.intuit.com/app/developer/qbo/docs/get-started"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full font-sans text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg px-4 py-3 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Connect QuickBooks Online
          </a>

          <p className="text-xs font-sans text-muted-foreground text-center">
            When credentials are set, invoices marked "Sent" will automatically sync to QBO.
          </p>
        </div>
      )}
    </div>
  );
};

export default QBOSetupCard;
