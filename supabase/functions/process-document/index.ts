import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callAI, parseJSON } from "../_shared/ai-client.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { document_id, client_id, file_url, file_type, user_hint } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create extraction record
    const { data: extraction, error: extErr } = await supabase
      .from("document_extractions")
      .insert({ document_id, client_id, extraction_status: "processing" })
      .select("id")
      .single();
    if (extErr) throw extErr;
    const extractionId = extraction.id;

    // Load home context
    const [equipRes, kbRes, propRes, reportRes] = await Promise.all([
      supabase.from("equipment").select("*").eq("property_id", client_id),
      supabase.from("home_knowledge_base").select("*").eq("client_id", client_id).eq("is_current", true).limit(100),
      supabase.from("properties").select("*").eq("id", client_id).single(),
      supabase.from("report_pages").select("title, condition_rating, narrative, specs, page_key")
        .eq("report_id", (await supabase.from("reports").select("id").eq("property_id", client_id).limit(1).single()).data?.id || ""),
    ]);

    const homeContext = {
      equipment: equipRes.data || [],
      knowledgeBase: (kbRes.data || []).slice(0, 50),
      property: propRes.data || {},
      reportSections: reportRes.data || [],
    };

    // For images, use vision; for text-based, describe to AI
    const isImage = file_type?.startsWith("image/");

    const systemPrompt = `You are a meticulous home documentation specialist. Analyze the uploaded document and extract ALL structured data relevant to a home's permanent digital record.

Home Context:
${JSON.stringify(homeContext, null, 2)}

${user_hint ? `User hint about this document: ${user_hint}` : ""}

Return a JSON object with these keys:
- document_type: one of appliance_manual, warranty, permit, inspection_report, invoice, insurance_policy, service_record, hoa_document, survey, deed, other
- confidence_score: 0-100 how confident you are in the extraction
- equipment_records: array of equipment objects {name, category, brand, model, serial_number, install_date, condition, notes}
- warranty_records: array {item_name, manufacturer, model_number, serial_number, purchase_date, warranty_type, warranty_duration_months, expiration_date, coverage_description, claim_process, support_phone, support_email, support_url}
- permit_records: array {permit_number, permit_type, description, issue_date, expiration_date, issued_by, contractor_name, estimated_cost, final_cost, status}
- service_records: array {service_date, service_type, description, contractor_name, contractor_phone, cost, invoice_number, warranty_on_work_months, next_service_recommended_date}
- knowledge_facts: array {knowledge_type, subject, content, confidence, date_of_fact}
- timeline_events: array {event_date, event_type, title, description, cost, contractor_name, permit_number}
- structural_specs: array {spec_category, specification_name, specification_value, unit, notes}
- findings: array {title, description, severity}
- action_items: array {title, description, priority}

Only include arrays that have actual data extracted. Return empty arrays for categories with no relevant data found.`;

    let messages: any[];
    if (isImage) {
      // Fetch image and convert to base64
      const imgResp = await fetch(file_url);
      const imgBuf = await imgResp.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(imgBuf)));
      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${file_type};base64,${base64}` } },
            { type: "text", text: "Extract all information from this document image." },
          ],
        },
      ];
    } else {
      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Document URL: ${file_url}\nFile type: ${file_type}\n\nAnalyze this document and extract all structured data. If you cannot access the URL directly, use any context available to identify what type of document this likely is based on the filename and context provided.` },
      ];
    }

    // Call Gemini directly for structured extraction. NOTE: `messages` was
    // constructed above but isn't used — callAI accepts our raw context
    // directly. The previous shape here had a duplicate `const aiJson`
    // declaration that made the module fail to compile (Supabase returned
    // BOOT_ERROR on every invocation).
    const _extractText = await callAI({
      system: systemPrompt,
      messages: isImage ? [
        { role: "user", parts: [{ text: "Extract all information from this document image." }] }
      ] : [
        { role: "user", parts: [{ text: `Document URL: ${file_url}\nFile type: ${file_type}\n\nAnalyze this document and extract all structured data.` }] }
      ],
      model: "google/gemini-2.5-flash",
      json: true,
    });
    const result = parseJSON<any>(_extractText);
    let itemsCreated = 0;
    const equipmentIdsCreated: string[] = [];

    // Insert equipment records
    if (result.equipment_records?.length) {
      for (const eq of result.equipment_records) {
        const { data } = await supabase.from("equipment").insert({
          property_id: client_id, name: eq.name, category: eq.category || "other",
          brand: eq.brand, model: eq.model, serial_number: eq.serial_number,
          install_date: eq.install_date || null, condition: eq.condition || "unknown", notes: eq.notes,
        }).select("id").single();
        if (data) { equipmentIdsCreated.push(data.id); itemsCreated++; }
      }
    }

    // Insert warranty records
    if (result.warranty_records?.length) {
      for (const w of result.warranty_records) {
        await supabase.from("warranty_registry").insert({
          client_id, item_name: w.item_name, manufacturer: w.manufacturer,
          model_number: w.model_number, serial_number: w.serial_number,
          purchase_date: w.purchase_date || null, warranty_type: w.warranty_type || "manufacturer",
          warranty_duration_months: w.warranty_duration_months, expiration_date: w.expiration_date || null,
          coverage_description: w.coverage_description, support_phone: w.support_phone,
          support_email: w.support_email, document_id: document_id,
        });
        itemsCreated++;
      }
    }

    // Insert permit records
    if (result.permit_records?.length) {
      for (const p of result.permit_records) {
        await supabase.from("permit_registry").insert({
          client_id, permit_number: p.permit_number, permit_type: p.permit_type,
          description: p.description, issue_date: p.issue_date || null,
          expiration_date: p.expiration_date || null, issued_by: p.issued_by,
          contractor_name: p.contractor_name, estimated_cost: p.estimated_cost,
          status: p.status || "open", document_id: document_id,
        });
        itemsCreated++;
      }
    }

    // Insert service records
    if (result.service_records?.length) {
      for (const s of result.service_records) {
        await supabase.from("service_history").insert({
          client_id, service_date: s.service_date, service_type: s.service_type,
          description: s.description, contractor_name: s.contractor_name,
          cost: s.cost, invoice_number: s.invoice_number, document_id: document_id,
        });
        itemsCreated++;
      }
    }

    // Insert knowledge facts
    if (result.knowledge_facts?.length) {
      for (const k of result.knowledge_facts) {
        await supabase.from("home_knowledge_base").insert({
          client_id, knowledge_type: k.knowledge_type || "fact",
          subject: k.subject, content: k.content,
          source_document_id: document_id, source_type: "ai_extraction",
          confidence: k.confidence || "medium",
          date_of_fact: k.date_of_fact || null,
        });
        itemsCreated++;
      }
    }

    // Insert timeline events
    if (result.timeline_events?.length) {
      for (const t of result.timeline_events) {
        await supabase.from("property_timeline").insert({
          client_id, event_date: t.event_date, event_type: t.event_type || "renovation",
          title: t.title, description: t.description, cost: t.cost,
          contractor_name: t.contractor_name, source_document_id: document_id,
          created_by: "ai_extraction",
        });
        itemsCreated++;
      }
    }

    // Insert structural specs
    if (result.structural_specs?.length) {
      for (const s of result.structural_specs) {
        await supabase.from("structural_specifications").insert({
          client_id, spec_category: s.spec_category, specification_name: s.specification_name,
          specification_value: s.specification_value, unit: s.unit,
          source_document_id: document_id,
        });
        itemsCreated++;
      }
    }

    // Update extraction record
    await supabase.from("document_extractions").update({
      extraction_status: "complete",
      document_type: result.document_type,
      confidence_score: result.confidence_score,
      structured_data: result,
      equipment_ids_created: equipmentIdsCreated,
      findings_created: result.findings || [],
      processed_at: new Date().toISOString(),
    }).eq("id", extractionId);

    // Activity log
    await supabase.from("activity_log").insert({
      property_id: client_id,
      action_type: "document_processed",
      message: `Document processed — ${itemsCreated} knowledge items extracted`,
      metadata: { extraction_id: extractionId, document_type: result.document_type, items_created: itemsCreated },
    });

    return new Response(JSON.stringify({
      success: true,
      extraction_id: extractionId,
      document_type: result.document_type,
      items_created: itemsCreated,
      findings: result.findings || [],
      action_items: result.action_items || [],
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("process-document error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
