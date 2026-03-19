import { supabase } from "@/integrations/supabase/client";

interface PushPayload {
  user_id: string;
  title: string;
  body?: string;
  url?: string;
  icon?: string;
}

/**
 * Send a push notification to a user via the edge function.
 * Fire-and-forget — errors are silently logged.
 */
export async function sendPushNotification(payload: PushPayload) {
  try {
    await supabase.functions.invoke("send-push-notification", {
      body: payload,
    });
  } catch (err) {
    console.error("Push notification send failed:", err);
  }
}

// Pre-built notification templates
export const pushTemplates = {
  newMessage: (userId: string, senderName: string, preview: string) => ({
    user_id: userId,
    title: `💬 New message from ${senderName}`,
    body: preview.slice(0, 100),
    url: "/portal?tab=messages",
  }),

  invoicePaid: (userId: string, clientName: string, amount: string) => ({
    user_id: userId,
    title: `✅ Invoice paid`,
    body: `${clientName} paid $${amount}`,
    url: "/admin",
  }),

  proposalSigned: (userId: string, clientName: string, estimateTitle: string) => ({
    user_id: userId,
    title: `✍️ Proposal signed`,
    body: `${clientName} signed the proposal for ${estimateTitle}`,
    url: "/admin",
  }),

  healthScoreAlert: (userId: string, clientName: string, score: number) => ({
    user_id: userId,
    title: `⚠️ Client health score alert`,
    body: `${clientName}'s health score dropped to ${score}`,
    url: "/admin",
  }),
};
