import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, reportContext } = await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const ctx = reportContext || {};

    // Build a page index for citations
    const pageIndex: { slug: string; title: string; group: string; condition: string }[] = [];

    const pagesText = Array.isArray(ctx.pages) && ctx.pages.length > 0
      ? ctx.pages.map((p: Record<string, unknown>) => {
          const slug = (p.id || p.page_key || "") as string;
          const title = (p.title || "") as string;
          const group = (p.group || "") as string;
          const condition = (p.conditionRating || "Not assessed") as string;

          pageIndex.push({ slug, title, group, condition });

          const narrative = Array.isArray(p.narrative) ? p.narrative.join(" ") : (p.narrative || "");
          const specs = p.specs && typeof p.specs === "object"
            ? Object.entries(p.specs as Record<string, unknown>).map(([k, v]) => `${k}: ${v}`).join(", ")
            : "";
          const tiers = Array.isArray(p.tiers)
            ? (p.tiers as Record<string, unknown>[]).map((t) => `${t.label}: ${t.cost}`).join(" | ")
            : "";
          const recs = Array.isArray(p.recommendations) ? (p.recommendations as string[]).join("; ") : "";
          return [
            `### ${title} [PAGE:${slug}] (${group}) — Condition: ${condition}`,
            narrative,
            specs ? `Specs: ${specs}` : "",
            tiers ? `Cost tiers: ${tiers}` : "",
            recs ? `Recommendations: ${recs}` : "",
          ].filter(Boolean).join("\n");
        }).join("\n\n")
      : "No report pages available yet.";

    const goalsText = Array.isArray(ctx.goals) && ctx.goals.length > 0
      ? ctx.goals.map((g: Record<string, unknown>) => `- ${g.title} (${g.status})${g.target_year ? ` target: ${g.target_year}` : ""}${g.estimated_budget ? ` budget: $${g.estimated_budget}` : ""}`).join("\n")
      : "";

    const systemPrompt = `You are a friendly, knowledgeable home advisor for Home Clarity Hub. You help homeowners understand their Home Clarity Report and answer questions about their property. Speak plainly and warmly — no jargon, real answers.

PROPERTY: ${ctx.propertyName || ctx.propertyAddress || "Unknown"}
ADDRESS: ${ctx.propertyAddress || "Unknown"}
REPORT STATUS: ${ctx.reportCompletionPercent ?? 0}% complete
${ctx.invoiceBalance ? `OUTSTANDING BALANCE: $${ctx.invoiceBalance}` : ""}
${Array.isArray(ctx.projects) && ctx.projects.length ? `ACTIVE PROJECTS:\n${(ctx.projects as Record<string, unknown>[]).map((p) => `- ${p.title}: ${p.status}${p.total_cost ? ` ($${p.total_cost})` : ""}`).join("\n")}` : ""}

REPORT PAGES:
${pagesText}
${goalsText ? `\nCLIENT HOME GOALS:\n${goalsText}` : ""}

CITATION GUIDELINES:
- When referencing information from a specific report page, include a citation in the format: **[See: Page Title]** at the end of the relevant sentence or paragraph
- Each page is tagged with [PAGE:slug] in the report data above — use the page title (not the slug) in your citations
- You can cite multiple pages if your answer draws from several sections
- Example: "Your roof is in Fair condition and should be budgeted for replacement in 3-5 years. **[See: Roof System]**"

GENERAL GUIDELINES:
- Reference specific findings from the report when answering
- When discussing costs, cite the tier ranges (e.g., "Adam recommends budgeting $4,000–$8,000")
- Flag anything rated Poor or Critical as urgent
- If asked about something not in the report, say so honestly
- Keep answers concise. Use bullet points or bold for clarity
- Never invent data that isn't in the report
- Refer to "Adam" or "your advisor" when appropriate`;

    const geminiContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: geminiContents,
          generationConfig: { temperature: 0.6, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Gemini streaming error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert Gemini SSE → OpenAI-compatible SSE so the client (useChat.ts) needs no changes
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const emit = (text: string) => {
          const chunk = JSON.stringify({ choices: [{ delta: { content: text } }] });
          controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
        };

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let idx: number;
            while ((idx = buffer.indexOf("\n")) !== -1) {
              const line = buffer.slice(0, idx).replace(/\r$/, "");
              buffer = buffer.slice(idx + 1);
              if (!line.startsWith("data: ")) continue;
              const json = line.slice(6).trim();
              if (!json || json === "[DONE]") continue;
              try {
                const parsed = JSON.parse(json);
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) emit(text);
              } catch { /* partial chunk, skip */ }
            }
          }
        } finally {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (e) {
    console.error("chat-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
