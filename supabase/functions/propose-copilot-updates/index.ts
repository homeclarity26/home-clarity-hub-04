import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireRole, corsHeaders, json } from "../_shared/auth.ts";
import { callAI } from "../_shared/ai-client.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;

  try {
    const { itemId, propertyId } = await req.json();
    if (!itemId || !propertyId) {
      return json({ error: "itemId and propertyId required" }, { status: 400 });
    }

    const { data: item } = await auth.adminSupabase
      .from("copilot_inbox")
      .select("*")
      .eq("id", itemId)
      .single();

    if (!item) return json({ error: "Item not found" }, { status: 404 });

    const { data: pages } = await auth.adminSupabase
      .from("report_pages")
      .select("id, title, page_key, group_id")
      .eq("property_id", propertyId)
      .eq("status", "published");

    const pageList = (pages || []).map((p) => `- ${p.title} (id: ${p.id}, key: ${p.page_key})`).join("\n");

    const payload = item.payload as Record<string, string>;
    const itemDescription = payload.text || payload.fileName || "uploaded content";
    const itemKind = item.kind;

    const prompt = `You are an AI co-pilot for a home report management system. A ${itemKind} was submitted to the copilot inbox:

Content: "${itemDescription}"
${payload.fileType ? `File type: ${payload.fileType}` : ""}

Here are the existing published report pages for this property:
${pageList}

Based on this submission, suggest which pages should be updated and what changes to make. Return a JSON array of proposals:
[{"page_id": "uuid", "page_title": "string", "suggested_action": "update_narrative|add_photo|update_specs", "rationale": "why this page should be updated"}]

If a new page should be created instead, use page_id: "new" and include a suggested_title field.
Only suggest relevant pages. If the content doesn't clearly map to any page, return an empty array.`;

    const result = await callAI({
      system: "You are a home report co-pilot. Return only valid JSON arrays.",
      prompt,
      json: true,
      temperature: 0.2,
    });

    let proposals = [];
    try {
      proposals = JSON.parse(result);
      if (!Array.isArray(proposals)) proposals = [];
    } catch {
      proposals = [];
    }

    return json({ ok: true, proposals });
  } catch (e) {
    console.error("propose-copilot-updates error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, { status: 500 });
  }
});
