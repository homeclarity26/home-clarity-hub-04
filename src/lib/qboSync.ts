// QuickBooks Online sync — one-directional push from portal to QBO
// Portal is source of truth for project data; QBO is books of record
//
// To enable: set these env vars in .env (or Supabase secrets for edge functions):
//   VITE_QBO_CLIENT_ID     — your QBO app client ID
//   VITE_QBO_ACCESS_TOKEN  — OAuth2 access token (refreshed periodically)
//   VITE_QBO_REALM_ID      — QuickBooks company ID

const QBO_BASE_URL = "https://quickbooks.api.intuit.com/v3/company";
const QBO_SANDBOX_URL = "https://sandbox-quickbooks.api.intuit.com/v3/company";

function getQBOBaseUrl(): string {
  const isProd = import.meta.env.VITE_QBO_ENVIRONMENT === "production";
  return isProd ? QBO_BASE_URL : QBO_SANDBOX_URL;
}

export interface QBOLine {
  Amount: number;
  Description: string;
  DetailType: "SalesItemLineDetail" | "DescriptionOnly";
  SalesItemLineDetail?: {
    ItemRef: { value: string; name: string };
    Qty?: number;
    UnitPrice?: number;
  };
}

export interface QBOInvoice {
  DocNumber: string;
  CustomerRef: { name: string; value?: string };
  Line: QBOLine[];
  DueDate: string;
  TxnDate: string;
  PrivateNote?: string;
  EmailStatus?: "NeedToSend" | "EmailSent" | "NotSet";
  BillEmail?: { Address: string };
}

export interface QBOSyncResult {
  success: boolean;
  qboId?: string;
  error?: string;
}

/**
 * Sync a portal invoice to QuickBooks Online.
 * Returns silently if QBO credentials are not configured.
 */
export async function syncInvoiceToQBO(
  invoice: {
    id: string;
    invoice_number?: string | null;
    title?: string | null;
    due_date?: string | null;
    issue_date?: string | null;
    notes?: string | null;
    total?: number;
    balance_due?: number;
  },
  lineItems: {
    description: string;
    quantity?: number;
    unit_price?: number;
    total: number;
    item_type?: string;
  }[],
  clientName: string
): Promise<QBOSyncResult> {
  const QBO_CLIENT_ID = import.meta.env.VITE_QBO_CLIENT_ID;
  const QBO_ACCESS_TOKEN = import.meta.env.VITE_QBO_ACCESS_TOKEN;
  const QBO_REALM_ID = import.meta.env.VITE_QBO_REALM_ID;

  if (!QBO_ACCESS_TOKEN || !QBO_REALM_ID) {
    console.log("[QBO Sync] Credentials not configured — skipping sync");
    return { success: false, error: "QBO not configured" };
  }

  try {
    // Build QBO line items
    const qboLines: QBOLine[] = lineItems.map((item) => ({
      Amount: item.total,
      Description: item.description,
      DetailType: "SalesItemLineDetail",
      SalesItemLineDetail: {
        ItemRef: { value: "1", name: "Services" }, // Default service item — update with real QBO item IDs
        Qty: item.quantity ?? 1,
        UnitPrice: item.unit_price ?? item.total,
      },
    }));

    // Add a description-only line if no line items
    if (qboLines.length === 0) {
      qboLines.push({
        Amount: invoice.total ?? 0,
        Description: invoice.title || "Home Clarity Hub Services",
        DetailType: "DescriptionOnly",
      });
    }

    const payload: QBOInvoice = {
      DocNumber: invoice.invoice_number || invoice.id.slice(0, 8).toUpperCase(),
      CustomerRef: { name: clientName },
      Line: qboLines,
      DueDate: invoice.due_date || new Date().toISOString().split("T")[0],
      TxnDate: invoice.issue_date || new Date().toISOString().split("T")[0],
      PrivateNote: invoice.notes || `Synced from Home Clarity Hub — Invoice ID: ${invoice.id}`,
    };

    const url = `${getQBOBaseUrl()}/${QBO_REALM_ID}/invoice`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${QBO_ACCESS_TOKEN}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ Invoice: payload }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[QBO Sync] Invoice sync failed:", response.status, errorBody);
      return { success: false, error: `QBO API error ${response.status}` };
    }

    const result = await response.json();
    const qboId = result?.Invoice?.Id;
    console.log("[QBO Sync] Invoice synced successfully. QBO ID:", qboId);
    return { success: true, qboId };
  } catch (err) {
    console.error("[QBO Sync] Unexpected error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Record a payment in QuickBooks Online against a synced invoice.
 */
export async function syncPaymentToQBO(
  payment: {
    id: string;
    amount: number;
    payment_date: string;
    method?: string;
    notes?: string | null;
  },
  invoiceQBOId: string,
  customerRef: { name: string; value?: string }
): Promise<QBOSyncResult> {
  const QBO_ACCESS_TOKEN = import.meta.env.VITE_QBO_ACCESS_TOKEN;
  const QBO_REALM_ID = import.meta.env.VITE_QBO_REALM_ID;

  if (!QBO_ACCESS_TOKEN || !QBO_REALM_ID) {
    console.log("[QBO Sync] Credentials not configured — skipping payment sync");
    return { success: false, error: "QBO not configured" };
  }

  try {
    const payload = {
      Payment: {
        CustomerRef: customerRef,
        TotalAmt: payment.amount,
        TxnDate: payment.payment_date,
        PrivateNote: payment.notes || `Payment via ${payment.method || "portal"} — ID: ${payment.id}`,
        Line: [
          {
            Amount: payment.amount,
            LinkedTxn: [
              {
                TxnId: invoiceQBOId,
                TxnType: "Invoice",
              },
            ],
          },
        ],
      },
    };

    const url = `${getQBOBaseUrl()}/${QBO_REALM_ID}/payment`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${QBO_ACCESS_TOKEN}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[QBO Sync] Payment sync failed:", response.status, errorBody);
      return { success: false, error: `QBO API error ${response.status}` };
    }

    const result = await response.json();
    const qboId = result?.Payment?.Id;
    console.log("[QBO Sync] Payment synced successfully. QBO ID:", qboId);
    return { success: true, qboId };
  } catch (err) {
    console.error("[QBO Sync] Unexpected error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Check if QBO credentials are configured.
 */
export function isQBOConfigured(): boolean {
  return !!(
    import.meta.env.VITE_QBO_ACCESS_TOKEN &&
    import.meta.env.VITE_QBO_REALM_ID
  );
}
