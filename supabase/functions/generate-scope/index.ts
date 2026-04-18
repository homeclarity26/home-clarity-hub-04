import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callClaude, parseJSON } from "../_shared/ai-client.ts";
import { retrieveContext } from "../_shared/rag.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { project_id, client_id, scope_detail_level = "standard", sections_to_include, special_instructions } = await req.json();
    if (!project_id) throw new Error("project_id required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Load project
    const { data: project } = await sb.from("projects").select("*, properties(*)").eq("id", project_id).single();
    if (!project) throw new Error("Project not found");

    // Load related data in parallel
    const propertyId = project.property_id;
    const [
      { data: reportPages },
      { data: equipment },
      { data: bids },
      { data: phases },
      { data: changeOrders },
    ] = await Promise.all([
      propertyId
        ? sb.from("reports").select("id").eq("property_id", propertyId).limit(1).then(async (r) => {
            if (r.data?.[0]) return sb.from("report_pages").select("*").eq("report_id", r.data[0].id);
            return { data: [] };
          })
        : Promise.resolve({ data: [] }),
      propertyId ? sb.from("equipment").select("*").eq("property_id", propertyId) : Promise.resolve({ data: [] }),
      sb.from("contractor_bids").select("*").eq("project_id", project_id),
      sb.from("project_phases").select("*").eq("project_id", project_id).order("sort_order"),
      sb.from("project_change_orders").select("*").eq("project_id", project_id),
    ]);

    const property = project.properties || {};
    const meta = property.metadata || {};

    const contextParts = [
      `PROJECT: ${project.title}`,
      `Description: ${project.description || "N/A"}`,
      `Type: ${project.project_type || "custom"}`,
      `Status: ${project.status}`,
      `Budget: $${project.budget || 0}`,
      `PROPERTY: ${property.address || "N/A"}`,
      `City/State: ${property.city || ""}, ${property.state || "OH"}`,
      `Year Built: ${meta.year_built || "Unknown"}`,
      `Sq Ft: ${meta.sqft || "Unknown"}`,
      `Property Type: ${property.property_type || "single_family"}`,
    ];

    if (reportPages && reportPages.length > 0) {
      contextParts.push("\nREPORT SECTIONS:");
      for (const p of reportPages) {
        contextParts.push(`- ${p.title}: Condition=${p.condition_rating || "N/A"}, Narrative=${JSON.stringify(p.narrative || []).slice(0, 500)}`);
        if (p.specs) contextParts.push(`  Specs: ${JSON.stringify(p.specs).slice(0, 300)}`);
        if (p.tiers) contextParts.push(`  Tiers: ${JSON.stringify(p.tiers).slice(0, 400)}`);
      }
    }

    if (equipment && equipment.length > 0) {
      contextParts.push("\nEQUIPMENT:");
      for (const e of equipment) {
        contextParts.push(`- ${e.name} (${e.category}): ${e.brand || ""} ${e.model || ""}, Condition=${e.condition}, Installed=${e.install_date || "?"}`);
      }
    }

    if (bids && bids.length > 0) {
      contextParts.push("\nEXISTING BIDS:");
      for (const b of bids) {
        contextParts.push(`- ${b.contractor_name}: $${b.bid_amount}, Timeline=${b.estimated_timeline || "?"}, Status=${b.status}`);
      }
    }

    if (phases && phases.length > 0) {
      contextParts.push("\nPROJECT PHASES:");
      for (const ph of phases) {
        contextParts.push(`- ${ph.name} (${ph.status})`);
      }
    }

    if (special_instructions) {
      contextParts.push(`\nSPECIAL INSTRUCTIONS FROM ADMIN: ${special_instructions}`);
    }

    const detailInstructions = {
      basic: "Keep the scope concise — 1-2 pages. Focus on project overview, materials list, and sequence of work only.",
      standard: "Produce a comprehensive scope — 3-5 pages. Include all sections with moderate detail.",
      detailed: "Produce an exhaustive scope — 5-10 pages. Include extremely detailed specifications, exact material quantities, brand-specific recommendations, detailed inspection checkpoints, and comprehensive permit analysis.",
    };

    const systemPrompt = `You are a licensed general contractor and construction project manager with 30 years of experience writing formal scopes of work for residential projects in Ohio. You are preparing this scope on behalf of Hometown Builders Club (HBC), acting as the homeowner's representative.

${detailInstructions[scope_detail_level as keyof typeof detailInstructions] || detailInstructions.standard}

Generate a complete, professional scope of work document. Return a JSON object with these keys:

{
  "project_overview": {
    "property_address": string,
    "project_title": string,
    "scope_summary": string (2-3 paragraph executive summary),
    "estimated_timeline": string,
    "project_reference": string (format: "HBC-SOW-YYYY-XXXX")
  },
  "materials_specification": [
    { "category": string, "material": string, "specification": string, "quantity": string, "grade_standard": string, "brand_recommendation": string }
  ],
  "sequence_of_work": [
    { "step_number": number, "phase": string, "description": string, "duration": string, "dependencies": string, "notes": string }
  ],
  "quality_standards": [
    { "checkpoint": string, "standard": string, "tolerance": string, "inspection_method": string }
  ],
  "exclusions": [string],
  "assumptions": [string],
  "permit_requirements": [
    { "permit_type": string, "required": boolean, "notes": string, "estimated_cost": string }
  ],
  "warranty_requirements": [
    { "component": string, "minimum_term": string, "coverage": string }
  ],
  "payment_schedule": [
    { "milestone": string, "percentage": number, "description": string }
  ]
}`;

    const userContent = contextParts.join("\n");
    const ragContext = await retrieveContext({
      query: userContent.slice(0, 3000),
      adminSupabase: auth.adminSupabase as unknown as { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown[] | null; error: unknown }> },
      creatorUserId: auth.user.id,
      sources: ["report_pages", "knowledge_templates", "agent_memory"],
      perSource: 3,
    });

    const _aiText = await callClaude({
      system: systemPrompt,
      cacheableContext: ragContext || undefined,
      prompt: userContent,
      json: true,
      temperature: 0.3,
      maxOutputTokens: 8192,
    });
    const response = { ok: true, json: async () => ({ choices: [{ message: { content: _aiText } }] }) };

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error("AI generation failed");
    }

    // Claude returns a JSON string in the message content (json:true wraps
    // with "respond with valid JSON only"). parseJSON strips fences too.
    let scopeContent: Record<string, unknown>;
    try {
      scopeContent = parseJSON<Record<string, unknown>>(_aiText);
    } catch (parseErr) {
      console.error("generate-scope: JSON parse failed:", parseErr, "raw:", _aiText.slice(0, 500));
      throw new Error("AI returned non-JSON — please retry");
    }

    // Generate formatted markdown
    const md = generateMarkdown(scopeContent);

    // Get next version number
    const { data: existingScopes } = await sb.from("project_scopes").select("version_number").eq("project_id", project_id).order("version_number", { ascending: false }).limit(1);
    const nextVersion = (existingScopes?.[0]?.version_number || 0) + 1;

    // Mark all existing scopes as not current
    if (nextVersion > 1) {
      await sb.from("project_scopes").update({ is_current: false }).eq("project_id", project_id);
    }

    // Insert new scope
    const { data: newScope, error: insertErr } = await sb.from("project_scopes").insert({
      project_id,
      version_number: nextVersion,
      scope_content: scopeContent,
      formatted_markdown: md,
      detail_level: scope_detail_level,
      is_current: true,
    }).select().single();

    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({ scope: newScope, markdown: md }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-scope error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateMarkdown(scope: any): string {
  const ov = scope.project_overview || {};
  const lines: string[] = [
    `# SCOPE OF WORK`,
    `## ${ov.project_title || "Project"}`,
    `**Reference:** ${ov.project_reference || "N/A"}`,
    `**Property:** ${ov.property_address || "N/A"}`,
    `**Estimated Timeline:** ${ov.estimated_timeline || "TBD"}`,
    "",
    `### Project Overview`,
    ov.scope_summary || "",
    "",
  ];

  if (scope.materials_specification?.length) {
    lines.push("### Materials Specification", "");
    lines.push("| Category | Material | Specification | Qty | Grade | Brand |", "|---|---|---|---|---|---|");
    for (const m of scope.materials_specification) {
      lines.push(`| ${m.category || ""} | ${m.material || ""} | ${m.specification || ""} | ${m.quantity || ""} | ${m.grade_standard || ""} | ${m.brand_recommendation || ""} |`);
    }
    lines.push("");
  }

  if (scope.sequence_of_work?.length) {
    lines.push("### Sequence of Work", "");
    for (const s of scope.sequence_of_work) {
      lines.push(`**${s.step_number}. ${s.phase}**`);
      lines.push(`${s.description}`);
      if (s.duration) lines.push(`- Duration: ${s.duration}`);
      if (s.dependencies) lines.push(`- Dependencies: ${s.dependencies}`);
      if (s.notes) lines.push(`- Notes: ${s.notes}`);
      lines.push("");
    }
  }

  if (scope.quality_standards?.length) {
    lines.push("### Quality Standards", "");
    for (const q of scope.quality_standards) {
      lines.push(`- **${q.checkpoint}**: ${q.standard}${q.tolerance ? ` (Tolerance: ${q.tolerance})` : ""}`);
    }
    lines.push("");
  }

  if (scope.exclusions?.length) {
    lines.push("### Exclusions", "");
    for (const e of scope.exclusions) lines.push(`- ${e}`);
    lines.push("");
  }

  if (scope.assumptions?.length) {
    lines.push("### Assumptions", "");
    for (const a of scope.assumptions) lines.push(`- ${a}`);
    lines.push("");
  }

  if (scope.permit_requirements?.length) {
    lines.push("### Permit Requirements", "");
    for (const p of scope.permit_requirements) {
      lines.push(`- **${p.permit_type}**: ${p.required ? "Required" : "Not Required"}${p.notes ? ` — ${p.notes}` : ""}${p.estimated_cost ? ` (Est. ${p.estimated_cost})` : ""}`);
    }
    lines.push("");
  }

  if (scope.warranty_requirements?.length) {
    lines.push("### Warranty Requirements", "");
    for (const w of scope.warranty_requirements) {
      lines.push(`- **${w.component}**: ${w.minimum_term}${w.coverage ? ` — ${w.coverage}` : ""}`);
    }
    lines.push("");
  }

  if (scope.payment_schedule?.length) {
    lines.push("### Payment Schedule", "");
    lines.push("| Milestone | % | Description |", "|---|---|---|");
    for (const ps of scope.payment_schedule) {
      lines.push(`| ${ps.milestone} | ${ps.percentage}% | ${ps.description || ""} |`);
    }
    lines.push("");
  }

  lines.push("---", "*Prepared by Hometown Builders Club as owner's representative.*");
  lines.push("", "**Contractor Signature:** _________________________ **Date:** ___________");
  lines.push("", "**Print Name:** _________________________");

  return lines.join("\n");
}
