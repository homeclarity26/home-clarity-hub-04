import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { document_text, file_name, file_type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a document analysis expert for home-related documents." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

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
