import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callClaude, parseJSON } from "../_shared/ai-client.ts";
import { requireAuth, corsHeaders, json } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireAuth(req);
  if ("error" in auth) return auth.error;

  try {
    const { task, context } = await req.json();
    let systemPrompt = "";
    let userPrompt = "";

    switch (task) {
      case "generate_estimate": {
        systemPrompt = "You are a home services estimator. Generate a structured list of line items for an invoice/estimate. Return JSON with a 'lineItems' array where each item has: description (string), quantity (number), unit_price (number). Be specific and realistic with pricing for home services.";
        userPrompt = `Generate line items for this job:\n\nJob Description: ${context.jobDescription}\nProperty: ${context.propertyAddress || "Unknown"}\nSquare Footage: ${context.sqft || "Unknown"}\nProperty Type: ${context.propertyType || "Residential"}`;
        break;
      }
      case "from_transcript": {
        systemPrompt = `You are an expert home services estimator. A consultant just had a meeting or discovery call with a homeowner. Analyze the meeting notes/transcript and extract every actionable scope item that could be estimated or invoiced.

For each item, determine a realistic price based on the described work, property details, and regional norms. Group related items logically. Include labor and materials as separate line items when appropriate.

Also extract:
- A suggested estimate/invoice title
- Any notes or terms mentioned (payment schedule, timeline, warranty)

Return JSON with:
- title (string): suggested title for the estimate
- lineItems: array of {description (string), quantity (number), unit_price (number)}
- notes (string): any terms, conditions, or scheduling notes mentioned`;
        userPrompt = `Extract estimate line items from this meeting transcript/notes:\n\n${context.transcript}\n\nProperty: ${context.propertyAddress || "Unknown"}\nSquare Footage: ${context.sqft || "Unknown"}\nProperty Type: ${context.propertyType || "Residential"}\nClient: ${context.clientName || "Unknown"}`;
        break;
      }
      case "draft_change_order": {
        systemPrompt = "You are a professional home services administrator. Draft a change order with a clear title, professional description, and suggested amount. Return JSON with: title (string), description (string), amount (number).";
        userPrompt = `Draft a change order for:\n\nChange Description: ${context.changeDescription}\nOriginal Invoice: ${context.invoiceTitle}\nOriginal Total: $${context.invoiceTotal}`;
        break;
      }
      case "invoice_summary": {
        systemPrompt = "You are a friendly home services advisor. Write a 2-3 sentence plain-English summary of what this invoice covers, the balance due, and the due date. Keep it conversational and clear. Return JSON with: summary (string).";
        userPrompt = `Summarize this invoice for the homeowner:\n\nTitle: ${context.invoiceTitle}\nDescription: ${context.description}\nLine Items: ${JSON.stringify(context.lineItems || [])}\nTotal: $${context.total}\nBalance Due: $${context.balanceDue}\nDue Date: ${context.dueDate || "Not set"}\nPayments Made: $${context.totalPaid || 0}`;
        break;
      }
      case "payment_reminder": {
        systemPrompt = "You are a professional but friendly home services advisor. Draft a payment reminder message. Be warm, not aggressive. Return JSON with: message (string).";
        userPrompt = `Draft a payment reminder:\n\nClient Name: ${context.clientName}\nInvoice Number: ${context.invoiceNumber}\nAmount Owed: $${context.amountOwed}\nDue Date: ${context.dueDate || "Past due"}`;
        break;
      }
      case "suggest_price": {
        systemPrompt = "You are a home services pricing advisor. Based on historical line items, suggest the most likely unit price for the described service. Return JSON with: suggested_price (number), confidence (string: high/medium/low).";
        userPrompt = `Suggest a price for: ${context.description}\n\nHistorical items: ${JSON.stringify(context.history || [])}`;
        break;
      }
      default:
        return new Response(JSON.stringify({ error: "Unknown task" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const _aiText = await callClaude({
      system: systemPrompt,
      prompt: userPrompt,
      json: true,
      temperature: 0.3,
      maxOutputTokens: 4096,
    });

    let result: Record<string, unknown>;
    try {
      result = parseJSON<Record<string, unknown>>(_aiText);
    } catch (e) {
      console.error("ai-invoice-assistant: JSON parse failed:", e, "raw:", _aiText.slice(0, 500));
      throw new Error("AI returned non-JSON — please retry");
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-invoice-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getSchema(task: string) {
  switch (task) {
    case "generate_estimate":
      return {
        type: "object",
        properties: {
          lineItems: {
            type: "array",
            items: {
              type: "object",
              properties: {
                description: { type: "string" },
                quantity: { type: "number" },
                unit_price: { type: "number" },
              },
              required: ["description", "quantity", "unit_price"],
              additionalProperties: false,
            },
          },
        },
        required: ["lineItems"],
        additionalProperties: false,
      };
    case "from_transcript":
      return {
        type: "object",
        properties: {
          title: { type: "string" },
          lineItems: {
            type: "array",
            items: {
              type: "object",
              properties: {
                description: { type: "string" },
                quantity: { type: "number" },
                unit_price: { type: "number" },
              },
              required: ["description", "quantity", "unit_price"],
              additionalProperties: false,
            },
          },
          notes: { type: "string" },
        },
        required: ["title", "lineItems", "notes"],
        additionalProperties: false,
      };
    case "draft_change_order":
      return {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          amount: { type: "number" },
        },
        required: ["title", "description", "amount"],
        additionalProperties: false,
      };
    case "invoice_summary":
      return {
        type: "object",
        properties: { summary: { type: "string" } },
        required: ["summary"],
        additionalProperties: false,
      };
    case "payment_reminder":
      return {
        type: "object",
        properties: { message: { type: "string" } },
        required: ["message"],
        additionalProperties: false,
      };
    case "suggest_price":
      return {
        type: "object",
        properties: {
          suggested_price: { type: "number" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["suggested_price", "confidence"],
        additionalProperties: false,
      };
    default:
      return { type: "object", properties: {}, additionalProperties: true };
  }
}
