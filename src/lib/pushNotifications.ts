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

  conditionAlert: (userId: string, clientName: string, rating: string) => ({
    user_id: userId,
    title: `⚠️ Client condition alert`,
    body: `${clientName}'s condition changed to ${rating}`,
    url: "/admin",
  }),

  bobbyReply: (userId: string, propertyId: string, preview: string) => ({
    user_id: userId,
    title: "Adam replied to your message",
    body: preview.slice(0, 100),
    url: `/portal/${propertyId}`,
  }),

  bobbyEscalation: (adminUserId: string, clientName: string, preview: string) => ({
    user_id: adminUserId,
    title: `Bobby escalated: ${clientName}`,
    body: preview.slice(0, 100),
    url: "/admin/bobby-inbox",
  }),

  proactiveAlert: (userId: string, propertyId: string, title: string) => ({
    user_id: userId,
    title: "Home alert",
    body: title,
    url: `/portal/${propertyId}`,
  }),
};
