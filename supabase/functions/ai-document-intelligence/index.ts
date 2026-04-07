import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI, parseJSON } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { document_text, file_name, file_type } = await req.json();
    const prompt = `Analyze this document and extract structured data for a home stewardship platform.

File name: ${file_name}
File type: ${file_type}
Content:
${document_text?.substring(0, 4000) || "No text provided"}

Extract information in JSON format:
{
  "document_type": "warranty|inspection|contract|invoice|insurance|permit|other",
  "summary": "1-2 sentence summary",
  "key_dates": [{ "label": "description", "date": "YYYY-MM-DD or approximate" }],
  "equipment_mentioned": [{ "name": "equipment name", "brand": "brand if found", "model": "model if found", "serial": "serial if found" }],
  "action_items": ["item 1", "item 2"],
  "financial_amounts": [{ "description": "what it's for", "amount": 0 }],
  "confidence": 0.0-1.0
}`;

    const _aiText = await callAI({ system: "You are a document analysis expert for home-related documents.", messages: [
          { role: "system", content: "You are a document analysis expert for home-related documents." },
          { role: "user", content: prompt },
        ], model: "google/gemini-2.5-flash-lite", json: true });
    const response = { ok: true, json: async () => ({ choices: [{ message: { content: _aiText } }] }) };

    if (!response.ok) throw new Error(`AI error: ${response.status}`);

    const result = await response.json();
    const analysis = JSON.parse(result.choices[0].message.content);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Document intelligence error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
