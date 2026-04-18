import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireRole } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const THEME_COLORS: Record<string, { hero: string; accent: string }> = {
  navy:     { hero: "1B2B4D", accent: "C9A961" },
  slate:    { hero: "334155", accent: "0ea5e9" },
  forest:   { hero: "1a3a2a", accent: "84cc16" },
  midnight: { hero: "0f0f1a", accent: "6366f1" },
  warm:     { hero: "7c3d1e", accent: "e07b39" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  
  const auth = await requireRole(req, ["creator"]);
  if ("error" in auth) return auth.error;
try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { estimateId } = await req.json();
    if (!estimateId) {
      return new Response(JSON.stringify({ error: "estimateId required" }), { status: 400, headers: corsHeaders });
    }

    // Fetch data
    const { data: estimate, error: estErr } = await supabase
      .from("estimates").select("*").eq("id", estimateId).single();
    if (estErr || !estimate) {
      return new Response(JSON.stringify({ error: "Estimate not found" }), { status: 404, headers: corsHeaders });
    }

    const { data: lineItems } = await supabase
      .from("estimate_line_items").select("*").eq("estimate_id", estimateId).order("sort_order");

    let propertyAddress = "";
    let propertyCity = "";
    if (estimate.property_id) {
      const { data: property } = await supabase
        .from("properties").select("address, property_name, city, state, zip").eq("id", estimate.property_id).single();
      if (property) {
        propertyAddress = (property as any).address || (property as any).property_name || "";
        const city = (property as any).city || "";
        const state = (property as any).state || "";
        const zip = (property as any).zip || "";
        propertyCity = [city, state].filter(Boolean).join(", ") + (zip ? ` ${zip}` : "");
      }
    }

    let companyName = "Home Clarity Hub";
    let companyPhone = "";
    let companyWebsite = "";
    let companyEmail = "";
    let ownerName = "";

    const { data: profile } = await supabase
      .from("profiles").select("full_name, company_name, phone, website, email").eq("user_id", estimate.admin_id).single();
    if (profile) {
      companyName = (profile as any).company_name || profile.full_name || "Home Clarity Hub";
      companyPhone = (profile as any).phone || "";
      companyWebsite = (profile as any).website || "";
      companyEmail = profile.email || "";
      ownerName = profile.full_name || "";
    }

    const theme = THEME_COLORS[estimate.proposal_color_theme || "navy"] || THEME_COLORS.navy;
    const scopeSections = (estimate.proposal_scope_sections as any[]) || [];
    const clientSelections = (estimate.proposal_client_selections as any[]) || [];
    const terms = (estimate.proposal_terms as any[]) || [];
    const timelinePhases = (estimate.proposal_timeline_phases as any[]) || [];
    const optionalItems = (estimate.proposal_optional_line_items as any[]) || [];
    const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const clientName = estimate.proposal_prepared_for || "";

    // Derive "Residence" name from client name (last word)
    const nameParts = clientName.trim().split(/\s+/);
    const lastName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : clientName;
    const residenceName = lastName ? `${lastName} Residence` : "Proposal";

    // Estimated duration from timeline
    let estimatedDuration = "";
    if (timelinePhases.length > 0) {
      const durations = timelinePhases.map((p: any) => p.duration || "").filter(Boolean);
      estimatedDuration = durations.join(", ") || "";
    }

    // Build DOCX
    const docx = await import("npm:docx@9.5.0");
    const {
      Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
      Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType,
      PageBreak, LevelFormat, TabStopType, TabStopPosition,
    } = docx;

    const PAGE_W = 12240;
    const PAGE_H = 15840;
    const MARGIN = 1440;
    const CONTENT_W = PAGE_W - MARGIN * 2;
    const noBorder = { style: BorderStyle.NONE, size: 0 };
    const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

    const sp = (h: number) => new Paragraph({ spacing: { before: h } });

    const accentRule = () => new Paragraph({
      spacing: { before: 200, after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: theme.accent, space: 1 } },
    });

    // ═══════════════════════════════════════════════════
    // PAGE 1: COVER
    // ═══════════════════════════════════════════════════

    // Rust accent bar at top (thin row)
    const accentBarRow = new TableRow({
      height: { value: 400, rule: docx.HeightRule.EXACT },
      children: [new TableCell({
        width: { size: PAGE_W, type: WidthType.DXA },
        shading: { fill: theme.accent, type: ShadingType.CLEAR },
        borders: noBorders,
        children: [new Paragraph({ children: [] })],
      })],
    });

    // Main navy cover content
    const coverContentRow = new TableRow({
      height: { value: PAGE_H - 400, rule: docx.HeightRule.ATLEAST },
      children: [new TableCell({
        width: { size: PAGE_W, type: WidthType.DXA },
        shading: { fill: theme.hero, type: ShadingType.CLEAR },
        borders: noBorders,
        margins: { top: 1200, bottom: 800, left: 1440, right: 1440 },
        children: [
          // Company name
          new Paragraph({
            children: [new TextRun({ text: companyName.toUpperCase(), font: "Arial", size: 18, color: "FFFFFF", characterSpacing: 200 })],
            spacing: { after: 1200 },
          }),
          // Project type in accent color
          new Paragraph({
            children: [new TextRun({ text: estimate.title || "Proposal", font: "Arial", size: 24, color: theme.accent, bold: true })],
            spacing: { after: 120 },
          }),
          // Client residence name - large bold
          new Paragraph({
            children: [new TextRun({ text: residenceName, font: "Arial", size: 56, color: "FFFFFF", bold: true })],
            spacing: { after: 600 },
          }),
          // Divider line
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "FFFFFF", space: 1 } },
            spacing: { after: 1600 },
          }),
          // Bottom metadata grid - 2 columns
          new Table({
            width: { size: PAGE_W - 2880, type: WidthType.DXA },
            columnWidths: [Math.floor((PAGE_W - 2880) / 2), Math.floor((PAGE_W - 2880) / 2)],
            rows: [
              // Row 1: PREPARED FOR | PREPARED BY
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: Math.floor((PAGE_W - 2880) / 2), type: WidthType.DXA },
                    borders: noBorders,
                    margins: { top: 0, bottom: 200, left: 0, right: 200 },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "PREPARED FOR", font: "Arial", size: 14, color: "999999", characterSpacing: 100 })], spacing: { after: 40 } }),
                      new Paragraph({ children: [new TextRun({ text: clientName, font: "Arial", size: 20, color: "FFFFFF" })] }),
                    ],
                  }),
                  new TableCell({
                    width: { size: Math.floor((PAGE_W - 2880) / 2), type: WidthType.DXA },
                    borders: noBorders,
                    margins: { top: 0, bottom: 200, left: 200, right: 0 },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "PREPARED BY", font: "Arial", size: 14, color: "999999", characterSpacing: 100 })], spacing: { after: 40 } }),
                      new Paragraph({ children: [new TextRun({ text: `${ownerName}${ownerName && companyName ? ", " : ""}${companyName}`, font: "Arial", size: 20, color: "FFFFFF" })] }),
                    ],
                  }),
                ],
              }),
              // Row 2: PROPERTY | DATE + ESTIMATED DURATION
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: Math.floor((PAGE_W - 2880) / 2), type: WidthType.DXA },
                    borders: noBorders,
                    margins: { top: 200, bottom: 0, left: 0, right: 200 },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "PROPERTY", font: "Arial", size: 14, color: "999999", characterSpacing: 100 })], spacing: { after: 40 } }),
                      new Paragraph({ children: [new TextRun({ text: propertyAddress, font: "Arial", size: 20, color: "FFFFFF" })] }),
                      ...(propertyCity ? [new Paragraph({ children: [new TextRun({ text: propertyCity, font: "Arial", size: 20, color: "FFFFFF" })] })] : []),
                    ],
                  }),
                  new TableCell({
                    width: { size: Math.floor((PAGE_W - 2880) / 2), type: WidthType.DXA },
                    borders: noBorders,
                    margins: { top: 200, bottom: 0, left: 200, right: 0 },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "DATE", font: "Arial", size: 14, color: "999999", characterSpacing: 100 })], spacing: { after: 40 } }),
                      new Paragraph({ children: [new TextRun({ text: date, font: "Arial", size: 20, color: "FFFFFF" })], spacing: { after: 200 } }),
                      ...(estimatedDuration ? [
                        new Paragraph({ children: [new TextRun({ text: "ESTIMATED DURATION", font: "Arial", size: 14, color: "999999", characterSpacing: 100 })], spacing: { after: 40 } }),
                        new Paragraph({ children: [new TextRun({ text: estimatedDuration, font: "Arial", size: 20, color: "FFFFFF" })] }),
                      ] : []),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      })],
    });

    const coverTable = new Table({
      width: { size: PAGE_W, type: WidthType.DXA },
      columnWidths: [PAGE_W],
      rows: [accentBarRow, coverContentRow],
    });

    // ═══════════════════════════════════════════════════
    // PAGE 2+: PROJECT OVERVIEW + SCOPE SECTIONS
    // ═══════════════════════════════════════════════════
    const contentChildren: any[] = [];

    // Project Overview header
    contentChildren.push(
      new Paragraph({ children: [new TextRun({ text: "PROJECT OVERVIEW", font: "Arial", size: 16, color: theme.accent, bold: true, characterSpacing: 150 })], spacing: { after: 120 } }),
    );

    // Tagline as heading
    if (estimate.proposal_tagline) {
      contentChildren.push(
        new Paragraph({ children: [new TextRun({ text: estimate.proposal_tagline, font: "Arial", size: 32, bold: true, color: "222222" })], spacing: { after: 200 } }),
      );
    }

    // Intro paragraph
    if (estimate.proposal_intro_text) {
      contentChildren.push(
        new Paragraph({ children: [new TextRun({ text: estimate.proposal_intro_text, font: "Arial", size: 20, color: "444444" })], spacing: { after: 200, line: 340 } }),
      );
    }

    // Accent rule before scope sections
    contentChildren.push(accentRule());

    // ── SCOPE SECTIONS (two-column: sidebar | bullets) ──
    for (let i = 0; i < scopeSections.length; i++) {
      const s = scopeSections[i];
      const sectionNum = s.number || String(i + 1).padStart(2, "0");
      const sideW = 2400;
      const mainW = CONTENT_W - sideW;

      // Build bullet paragraphs for right column
      const bulletParagraphs = ((s.bullets || []) as any[]).map((b: any) =>
        new Paragraph({
          children: [
            new TextRun({ text: "\u2022  ", font: "Arial", size: 20, color: "444444" }),
            ...(b.label ? [new TextRun({ text: b.label, font: "Arial", size: 20, bold: true, color: "333333" })] : []),
            ...(b.label && b.desc ? [new TextRun({ text: ": ", font: "Arial", size: 20, color: "333333" })] : []),
            ...(b.desc ? [new TextRun({ text: b.desc, font: "Arial", size: 20, color: "555555" })] : []),
          ],
          spacing: { after: 100, line: 300 },
        })
      );

      contentChildren.push(
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [sideW, mainW],
          rows: [new TableRow({
            children: [
              // Left column: section number + title with accent left border
              new TableCell({
                width: { size: sideW, type: WidthType.DXA },
                borders: {
                  top: noBorder, bottom: noBorder, right: noBorder,
                  left: { style: BorderStyle.SINGLE, size: 8, color: theme.accent },
                },
                margins: { top: 120, bottom: 120, left: 200, right: 160 },
                children: [
                  new Paragraph({ children: [new TextRun({ text: `SECTION ${sectionNum}`, font: "Arial", size: 16, color: theme.accent, bold: true, characterSpacing: 80 })], spacing: { after: 60 } }),
                  new Paragraph({ children: [new TextRun({ text: s.title || "", font: "Arial", size: 22, bold: true, color: "222222" })] }),
                ],
              }),
              // Right column: bullet points
              new TableCell({
                width: { size: mainW, type: WidthType.DXA },
                borders: noBorders,
                margins: { top: 120, bottom: 120, left: 200, right: 0 },
                children: bulletParagraphs.length > 0 ? bulletParagraphs : [new Paragraph({ children: [] })],
              }),
            ],
          })],
        })
      );

      contentChildren.push(sp(200));
    }

    // ── INVESTMENT BOX ──
    contentChildren.push(
      new Paragraph({ children: [new TextRun({ text: "INVESTMENT", font: "Arial", size: 16, color: theme.accent, bold: true, characterSpacing: 150 })], spacing: { before: 400, after: 200 } }),
    );

    const totalAmount = Number(estimate.total || 0);
    const totalStr = `$${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const sectionRange = scopeSections.length > 0
      ? `SECTIONS 01 THROUGH ${String(scopeSections.length).padStart(2, "0")}`
      : "ALL SECTIONS";
    const sectionDesc = scopeSections.length > 0
      ? `Sections 01 through ${String(scopeSections.length).padStart(2, "0")} of this proposal. All labor, and construction materials included.`
      : "All labor and construction materials included.";

    const investLeftW = Math.floor(CONTENT_W * 0.6);
    const investRightW = CONTENT_W - investLeftW;
    const investBorder = { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" };

    contentChildren.push(
      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [investLeftW, investRightW],
        rows: [new TableRow({
          children: [
            new TableCell({
              width: { size: investLeftW, type: WidthType.DXA },
              borders: { top: investBorder, bottom: investBorder, left: investBorder, right: investBorder },
              margins: { top: 200, bottom: 200, left: 240, right: 240 },
              children: [
                new Paragraph({ children: [new TextRun({ text: "TOTAL FOR ALL LABOR, CONSTRUCTION MATERIALS, AND INSTALLATION", font: "Arial", size: 16, color: "666666", characterSpacing: 60 })], spacing: { after: 120 } }),
                new Paragraph({ children: [new TextRun({ text: totalStr, font: "Arial", size: 44, bold: true, color: "222222" })], spacing: { after: 80 } }),
                new Paragraph({ children: [new TextRun({ text: "Client selections purchased separately. See shopping list.", font: "Arial", size: 18, color: "888888" })] }),
              ],
            }),
            new TableCell({
              width: { size: investRightW, type: WidthType.DXA },
              borders: { top: investBorder, bottom: investBorder, left: investBorder, right: investBorder },
              margins: { top: 200, bottom: 200, left: 240, right: 240 },
              verticalAlign: docx.VerticalAlign.CENTER,
              children: [
                new Paragraph({ children: [new TextRun({ text: sectionRange, font: "Arial", size: 14, color: theme.accent, bold: true, characterSpacing: 80 })], spacing: { after: 60 }, alignment: AlignmentType.CENTER }),
                new Paragraph({ children: [new TextRun({ text: sectionDesc, font: "Arial", size: 18, color: "666666" })], alignment: AlignmentType.CENTER }),
              ],
            }),
          ],
        })],
      })
    );

    // Optional add-ons
    if (optionalItems.length > 0) {
      contentChildren.push(sp(200));
      for (const opt of optionalItems) {
        const optLeftW = Math.floor(CONTENT_W * 0.65);
        const optRightW = CONTENT_W - optLeftW;
        contentChildren.push(
          new Table({
            width: { size: CONTENT_W, type: WidthType.DXA },
            columnWidths: [optLeftW, optRightW],
            rows: [new TableRow({
              children: [
                new TableCell({
                  width: { size: optLeftW, type: WidthType.DXA },
                  borders: { top: investBorder, bottom: investBorder, left: { style: BorderStyle.SINGLE, size: 8, color: theme.accent }, right: investBorder },
                  margins: { top: 160, bottom: 160, left: 240, right: 240 },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "OPTIONAL ADD-ON", font: "Arial", size: 14, color: theme.accent, bold: true, characterSpacing: 80 })], spacing: { after: 60 } }),
                    new Paragraph({ children: [new TextRun({ text: opt.name || opt.title || "", font: "Arial", size: 22, bold: true, color: "222222" })], spacing: { after: 40 } }),
                    ...(opt.description ? [new Paragraph({ children: [new TextRun({ text: opt.description, font: "Arial", size: 18, color: "666666" })] })] : []),
                  ],
                }),
                new TableCell({
                  width: { size: optRightW, type: WidthType.DXA },
                  borders: { top: investBorder, bottom: investBorder, left: investBorder, right: investBorder },
                  margins: { top: 160, bottom: 160, left: 240, right: 240 },
                  verticalAlign: docx.VerticalAlign.CENTER,
                  children: [
                    new Paragraph({ children: [new TextRun({ text: `$${Number(opt.price || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, font: "Arial", size: 36, bold: true, color: "222222" })], alignment: AlignmentType.CENTER }),
                    new Paragraph({ children: [new TextRun({ text: "if selected", font: "Arial", size: 16, color: "999999" })], alignment: AlignmentType.CENTER }),
                  ],
                }),
              ],
            })],
          })
        );
        contentChildren.push(sp(120));
      }
    }

    // ═══════════════════════════════════════════════════
    // CLIENT SELECTIONS SHOPPING LIST
    // ═══════════════════════════════════════════════════
    if (clientSelections.length > 0) {
      contentChildren.push(new Paragraph({ children: [new PageBreak()] }));
      contentChildren.push(
        new Paragraph({ children: [new TextRun({ text: "CLIENT SELECTIONS SHOPPING LIST", font: "Arial", size: 16, color: theme.accent, bold: true, characterSpacing: 100 })], spacing: { after: 120 } }),
      );
      contentChildren.push(
        new Paragraph({ children: [new TextRun({ text: "Everything below is purchased directly by you", font: "Arial", size: 28, bold: true, color: "222222" })], spacing: { after: 160 } }),
      );
      contentChildren.push(
        new Paragraph({ children: [new TextRun({
          text: `${companyName} does not mark up any of these items. We will help coordinate design, shopping, and delivery of selections to the job site before the corresponding phase begins. Use this as your shopping checklist and fill in your budget targets as you make decisions.`,
          font: "Arial", size: 20, color: "555555",
        })], spacing: { after: 300, line: 340 } }),
      );

      // Column widths for selections table
      const colItem = 2200;
      const colWhat = 3200;
      const colWhere = 2200;
      const colBudget = 1760;
      const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: "E0E0E0" };

      // Table header row
      const headerRow = new TableRow({
        children: [
          { text: "ITEM", w: colItem },
          { text: "WHAT TO LOOK FOR", w: colWhat },
          { text: "WHERE TO SHOP", w: colWhere },
          { text: "YOUR BUDGET", w: colBudget },
        ].map((col: any) => new TableCell({
          width: { size: col.w, type: WidthType.DXA },
          borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: col.text, font: "Arial", size: 14, color: "888888", characterSpacing: 60 })] })],
        })),
      });

      const allRows: any[] = [headerRow];

      for (const cat of clientSelections) {
        // Category header row with accent left border
        allRows.push(new TableRow({
          children: [new TableCell({
            width: { size: CONTENT_W, type: WidthType.DXA },
            columnSpan: 4,
            borders: { top: thinBorder, bottom: thinBorder, right: thinBorder, left: { style: BorderStyle.SINGLE, size: 8, color: theme.accent } },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            shading: { fill: "FDF5ED", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: (cat.label || "").toUpperCase(), font: "Arial", size: 18, bold: true, color: theme.accent })] })],
          })],
        }));

        // Item rows
        for (const item of (cat.items || [])) {
          allRows.push(new TableRow({
            children: [
              new TableCell({
                width: { size: colItem, type: WidthType.DXA },
                borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
                margins: { top: 60, bottom: 60, left: 160, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: item.name || "", font: "Arial", size: 18, bold: true, color: "333333" })] })],
              }),
              new TableCell({
                width: { size: colWhat, type: WidthType.DXA },
                borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
                margins: { top: 60, bottom: 60, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: item.desc || "", font: "Arial", size: 18, color: "666666" })] })],
              }),
              new TableCell({
                width: { size: colWhere, type: WidthType.DXA },
                borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
                margins: { top: 60, bottom: 60, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: item.shop || "", font: "Arial", size: 18, color: "555555" })] })],
              }),
              new TableCell({
                width: { size: colBudget, type: WidthType.DXA },
                borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
                margins: { top: 60, bottom: 60, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({
                  text: item.budget ? `$${Number(item.budget).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "",
                  font: "Arial", size: 18, color: "333333",
                })] })],
              }),
            ],
          }));
        }
      }

      contentChildren.push(new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [colItem, colWhat, colWhere, colBudget],
        rows: allRows,
      }));

      // Selections total
      const selTotal = clientSelections.flatMap((c: any) => c.items || []).reduce((sum: number, i: any) => sum + Number(i.budget || 0), 0);
      if (selTotal > 0) {
        contentChildren.push(sp(200));
        contentChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
              text: `Total budget for all client provided selection items: $${selTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
              font: "Arial", size: 22, bold: true, color: "333333",
            })],
            spacing: { after: 120 },
          })
        );
      }

      contentChildren.push(accentRule());
    }

    // ═══════════════════════════════════════════════════
    // TERMS & CONDITIONS (2-column grid with bullet lists)
    // ═══════════════════════════════════════════════════
    if (terms.length > 0) {
      contentChildren.push(
        new Paragraph({ children: [new TextRun({ text: "TERMS AND CONDITIONS", font: "Arial", size: 16, color: theme.accent, bold: true, characterSpacing: 150 })], spacing: { before: 400, after: 300 } }),
      );

      const halfW = Math.floor(CONTENT_W / 2);
      const termBorder = { style: BorderStyle.SINGLE, size: 1, color: "E0E0E0" };

      for (let i = 0; i < terms.length; i += 2) {
        const left = terms[i];
        const right = terms[i + 1];

        const buildTermCell = (t: any, w: number) => {
          if (!t) return new TableCell({
            width: { size: w, type: WidthType.DXA },
            borders: { top: termBorder, bottom: termBorder, left: termBorder, right: termBorder },
            margins: { top: 120, bottom: 120, left: 200, right: 200 },
            children: [new Paragraph({ children: [] })],
          });

          // Parse value into bullet points (split on newlines or semicolons)
          const valueLines = (t.value || "").split(/[;\n]/).map((l: string) => l.trim()).filter(Boolean);

          return new TableCell({
            width: { size: w, type: WidthType.DXA },
            borders: { top: termBorder, bottom: termBorder, left: termBorder, right: termBorder },
            margins: { top: 120, bottom: 120, left: 200, right: 200 },
            children: [
              new Paragraph({ children: [new TextRun({ text: t.label || "", font: "Arial", size: 20, bold: true, color: "333333" })], spacing: { after: 80 } }),
              ...(valueLines.length > 1
                ? valueLines.map((line: string) => new Paragraph({
                    children: [new TextRun({ text: `\u2013  ${line}`, font: "Arial", size: 18, color: "555555" })],
                    spacing: { after: 60 },
                  }))
                : [new Paragraph({ children: [new TextRun({ text: t.value || "", font: "Arial", size: 18, color: "555555" })] })]
              ),
            ],
          });
        };

        contentChildren.push(
          new Table({
            width: { size: CONTENT_W, type: WidthType.DXA },
            columnWidths: [halfW, halfW],
            rows: [new TableRow({ children: [buildTermCell(left, halfW), buildTermCell(right, halfW)] })],
          })
        );
        contentChildren.push(sp(80));
      }
    }

    // ═══════════════════════════════════════════════════
    // AUTHORIZATION & SIGNATURES
    // ═══════════════════════════════════════════════════
    contentChildren.push(new Paragraph({ children: [new PageBreak()] }));
    contentChildren.push(
      new Paragraph({ children: [new TextRun({ text: "AUTHORIZATION AND SIGNATURES", font: "Arial", size: 16, color: theme.accent, bold: true, characterSpacing: 150 })], spacing: { after: 200 } }),
    );
    contentChildren.push(
      new Paragraph({ children: [new TextRun({ text: "By signing below, both parties agree to the scope of work, pricing, and terms described in this proposal.", font: "Arial", size: 20, color: "444444" })], spacing: { after: 40 } }),
    );
    contentChildren.push(
      new Paragraph({ children: [new TextRun({ text: "This document becomes a binding contract upon execution.", font: "Arial", size: 20, color: "444444" })], spacing: { after: 400 } }),
    );

    // Signature table
    const sigHalfW = Math.floor(CONTENT_W / 2);
    const sigLine = "________________________________________";

    contentChildren.push(
      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [sigHalfW, sigHalfW],
        rows: [
          // Headers
          new TableRow({
            children: [
              new TableCell({
                width: { size: sigHalfW, type: WidthType.DXA },
                borders: noBorders,
                margins: { top: 80, bottom: 80, left: 0, right: 200 },
                children: [new Paragraph({ children: [new TextRun({ text: "CLIENT", font: "Arial", size: 16, color: theme.accent, bold: true, characterSpacing: 100 })] })],
              }),
              new TableCell({
                width: { size: sigHalfW, type: WidthType.DXA },
                borders: noBorders,
                margins: { top: 80, bottom: 80, left: 200, right: 0 },
                children: [new Paragraph({ children: [new TextRun({ text: companyName.toUpperCase(), font: "Arial", size: 16, color: theme.accent, bold: true, characterSpacing: 100 })] })],
              }),
            ],
          }),
          // Signature lines
          new TableRow({
            children: [
              new TableCell({
                width: { size: sigHalfW, type: WidthType.DXA },
                borders: noBorders,
                margins: { top: 400, bottom: 80, left: 0, right: 200 },
                children: [
                  new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "333333", space: 1 } }, spacing: { after: 40 } }),
                  new Paragraph({ children: [new TextRun({ text: "Signature", font: "Arial", size: 16, color: "999999" })], spacing: { after: 40 } }),
                  new Paragraph({ children: [new TextRun({ text: "Printed name:", font: "Arial", size: 16, color: "999999" })], spacing: { after: 200 } }),
                  new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "333333", space: 1 } }, spacing: { after: 40 } }),
                  new Paragraph({ children: [new TextRun({ text: "Date:", font: "Arial", size: 16, color: "999999" })] }),
                ],
              }),
              new TableCell({
                width: { size: sigHalfW, type: WidthType.DXA },
                borders: noBorders,
                margins: { top: 400, bottom: 80, left: 200, right: 0 },
                children: [
                  new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "333333", space: 1 } }, spacing: { after: 40 } }),
                  new Paragraph({ children: [new TextRun({ text: "Signature", font: "Arial", size: 16, color: "999999" })], spacing: { after: 40 } }),
                  new Paragraph({ children: [new TextRun({ text: `Printed name: ${ownerName}`, font: "Arial", size: 16, color: "333333" })], spacing: { after: 200 } }),
                  new Paragraph({ children: [new TextRun({ text: `Date:`, font: "Arial", size: 16, color: "999999" })] }),
                ],
              }),
            ],
          }),
        ],
      })
    );

    // Accent rule before footer bar
    contentChildren.push(sp(600));
    contentChildren.push(accentRule());
    contentChildren.push(sp(200));

    // Company footer bar
    const footerBarLeftW = Math.floor(CONTENT_W * 0.35);
    const footerBarRightW = CONTENT_W - footerBarLeftW;
    contentChildren.push(
      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [footerBarLeftW, footerBarRightW],
        rows: [new TableRow({
          children: [
            new TableCell({
              width: { size: footerBarLeftW, type: WidthType.DXA },
              shading: { fill: theme.hero, type: ShadingType.CLEAR },
              borders: noBorders,
              margins: { top: 120, bottom: 120, left: 200, right: 200 },
              children: [new Paragraph({ children: [new TextRun({ text: companyName.toUpperCase(), font: "Arial", size: 18, color: "FFFFFF", bold: true, characterSpacing: 100 })] })],
            }),
            new TableCell({
              width: { size: footerBarRightW, type: WidthType.DXA },
              shading: { fill: theme.hero, type: ShadingType.CLEAR },
              borders: noBorders,
              margins: { top: 120, bottom: 120, left: 200, right: 200 },
              children: [new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({
                  text: [companyPhone, companyEmail || companyWebsite].filter(Boolean).join(" | "),
                  font: "Arial", size: 16, color: "CCCCCC", italics: true,
                })],
              })],
            }),
          ],
        })],
      })
    );

    // ═══════════════════════════════════════════════════
    // BUILD DOCUMENT
    // ═══════════════════════════════════════════════════
    const footerContactText = [companyPhone, companyWebsite].filter(Boolean).join(" | ");

    const doc = new Document({
      styles: { default: { document: { run: { font: "Arial", size: 22 } } } },
      sections: [
        // Cover (no margins)
        {
          properties: {
            page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: 0, right: 0, bottom: 0, left: 0 } },
          },
          children: [coverTable],
        },
        // Content pages
        {
          properties: {
            page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } },
          },
          footers: {
            default: new Footer({
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: footerContactText, font: "Arial", size: 14, color: "999999" })],
              })],
            }),
          },
          children: contentChildren,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    return new Response(
      JSON.stringify({ base64 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("DOCX generation error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "DOCX generation failed" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
