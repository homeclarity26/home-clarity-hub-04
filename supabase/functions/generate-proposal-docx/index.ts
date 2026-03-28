import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Theme color maps matching the 5 proposal themes
const THEME_COLORS: Record<string, { hero: string; accent: string; heroHex: string; accentHex: string }> = {
  navy:     { hero: "1a2744", accent: "c9a96e", heroHex: "#1a2744", accentHex: "#c9a96e" },
  slate:    { hero: "334155", accent: "0ea5e9", heroHex: "#334155", accentHex: "#0ea5e9" },
  forest:   { hero: "1a3a2a", accent: "84cc16", heroHex: "#1a3a2a", accentHex: "#84cc16" },
  midnight: { hero: "0f0f1a", accent: "6366f1", heroHex: "#0f0f1a", accentHex: "#6366f1" },
  warm:     { hero: "7c3d1e", accent: "e07b39", heroHex: "#7c3d1e", accentHex: "#e07b39" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { estimateId } = await req.json();
    if (!estimateId) {
      return new Response(JSON.stringify({ error: "estimateId required" }), { status: 400, headers: corsHeaders });
    }

    // Fetch estimate with line items
    const { data: estimate, error: estError } = await supabase
      .from("estimates")
      .select("*")
      .eq("id", estimateId)
      .single();

    if (estError || !estimate) {
      return new Response(JSON.stringify({ error: "Estimate not found" }), { status: 404, headers: corsHeaders });
    }

    const { data: lineItems } = await supabase
      .from("estimate_line_items")
      .select("*")
      .eq("estimate_id", estimateId)
      .order("sort_order");

    // Fetch property info
    let propertyAddress = "";
    let companyName = "Home Clarity";
    let companyPhone = "";
    let companyWebsite = "";

    if (estimate.property_id) {
      const { data: property } = await supabase
        .from("properties")
        .select("address, property_name")
        .eq("id", estimate.property_id)
        .single();
      if (property) {
        propertyAddress = property.address || property.property_name || "";
      }
    }

    // Fetch admin profile for branding
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, company_name, phone, website")
      .eq("user_id", estimate.admin_id)
      .single();

    if (profile) {
      companyName = (profile as any).company_name || profile.full_name || "Home Clarity";
      companyPhone = (profile as any).phone || "";
      companyWebsite = (profile as any).website || "";
    }

    const theme = THEME_COLORS[estimate.proposal_color_theme || "navy"] || THEME_COLORS.navy;
    const scopeSections = (estimate.proposal_scope_sections as any[]) || [];
    const clientSelections = (estimate.proposal_client_selections as any[]) || [];
    const terms = (estimate.proposal_terms as any[]) || [];
    const timelinePhases = (estimate.proposal_timeline_phases as any[]) || [];
    const isMultiOption = estimate.proposal_multi_option || false;
    const optionPrices = (estimate.proposal_option_prices as any[]) || [];
    const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    // Build the docx using docx-js via dynamic import
    const docx = await import("npm:docx@9.5.0");
    const {
      Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
      Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType,
      HeadingLevel, PageBreak, LevelFormat,
    } = docx;

    // Page constants (US Letter)
    const PAGE_W = 12240;
    const PAGE_H = 15840;
    const MARGIN = 1440;
    const CONTENT_W = PAGE_W - MARGIN * 2; // 9360

    // Helper: spacer paragraph
    const sp = (h: number) => new Paragraph({ spacing: { before: h } });

    // Helper: accent rule (thin colored line)
    const accentRule = () => new Paragraph({
      spacing: { before: 160, after: 160 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: theme.accent, space: 1 } },
    });

    // Helper: section number eyebrow
    const eyebrow = (text: string) => new Paragraph({
      children: [new TextRun({ text, font: "Arial", size: 16, color: theme.accent, bold: true })],
      spacing: { after: 80 },
    });

    // ── COVER PAGE (full navy background via table hack) ──
    const coverCell = new TableCell({
      width: { size: PAGE_W, type: WidthType.DXA },
      shading: { fill: theme.hero, type: ShadingType.CLEAR },
      borders: {
        top: { style: BorderStyle.NONE, size: 0 },
        bottom: { style: BorderStyle.NONE, size: 0 },
        left: { style: BorderStyle.NONE, size: 0 },
        right: { style: BorderStyle.NONE, size: 0 },
      },
      margins: { top: 2000, bottom: 2000, left: 1440, right: 1440 },
      children: [
        sp(2400),
        new Paragraph({
          children: [new TextRun({ text: companyName.toUpperCase(), font: "Arial", size: 20, color: "FFFFFF", bold: true, characterSpacing: 200 })],
        }),
        sp(600),
        new Paragraph({
          children: [new TextRun({ text: estimate.title || "Proposal", font: "Arial", size: 56, color: "FFFFFF", bold: true })],
        }),
        sp(200),
        ...(estimate.proposal_tagline ? [new Paragraph({
          children: [new TextRun({ text: estimate.proposal_tagline, font: "Arial", size: 24, color: theme.accent, italics: true })],
        })] : []),
        sp(800),
        new Paragraph({
          children: [new TextRun({ text: "PREPARED FOR", font: "Arial", size: 14, color: theme.accent, bold: true, characterSpacing: 150 })],
        }),
        sp(80),
        new Paragraph({
          children: [new TextRun({ text: estimate.proposal_prepared_for || "", font: "Arial", size: 28, color: "FFFFFF" })],
        }),
        sp(120),
        ...(propertyAddress ? [new Paragraph({
          children: [new TextRun({ text: propertyAddress, font: "Arial", size: 20, color: "CCCCCC" })],
        })] : []),
        sp(400),
        new Paragraph({
          children: [new TextRun({ text: date, font: "Arial", size: 18, color: "999999" })],
        }),
      ],
    });

    const coverTable = new Table({
      width: { size: PAGE_W, type: WidthType.DXA },
      columnWidths: [PAGE_W],
      rows: [new TableRow({ children: [coverCell] })],
    });

    // ── OVERVIEW PAGE ──
    const overviewChildren: any[] = [
      new Paragraph({ children: [new PageBreak()] }),
      sp(400),
      eyebrow("PROJECT OVERVIEW"),
      sp(120),
    ];

    if (estimate.proposal_intro_text) {
      overviewChildren.push(
        new Paragraph({
          children: [new TextRun({ text: estimate.proposal_intro_text, font: "Arial", size: 22, color: "333333" })],
          spacing: { after: 200, line: 360 },
        })
      );
    }

    // Total price box
    const totalDisplay = isMultiOption ? "See Options Below" : `$${Number(estimate.total || 0).toLocaleString()}`;
    overviewChildren.push(
      sp(200),
      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [CONTENT_W],
        rows: [new TableRow({
          children: [new TableCell({
            width: { size: CONTENT_W, type: WidthType.DXA },
            shading: { fill: theme.hero, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.NONE, size: 0 },
              bottom: { style: BorderStyle.NONE, size: 0 },
              left: { style: BorderStyle.SINGLE, size: 12, color: theme.accent },
              right: { style: BorderStyle.NONE, size: 0 },
            },
            margins: { top: 200, bottom: 200, left: 300, right: 300 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: "TOTAL INVESTMENT", font: "Arial", size: 14, color: theme.accent, bold: true, characterSpacing: 150 })],
              }),
              new Paragraph({
                children: [new TextRun({ text: totalDisplay, font: "Arial", size: 40, color: "FFFFFF", bold: true })],
              }),
            ],
          })],
        })],
      }),
      sp(200),
      accentRule(),
    );

    // ── SCOPE SECTIONS ──
    const scopeChildren: any[] = [];
    for (let i = 0; i < scopeSections.length; i++) {
      const s = scopeSections[i];
      if (i === 0) {
        scopeChildren.push(new Paragraph({ children: [new PageBreak()] }));
        scopeChildren.push(sp(200));
        scopeChildren.push(eyebrow("SCOPE OF WORK"));
        scopeChildren.push(sp(200));
      }

      // Section number + title in a sidebar-style table
      scopeChildren.push(
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [1600, CONTENT_W - 1600],
          rows: [new TableRow({
            children: [
              new TableCell({
                width: { size: 1600, type: WidthType.DXA },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0 },
                  bottom: { style: BorderStyle.NONE, size: 0 },
                  left: { style: BorderStyle.NONE, size: 0 },
                  right: { style: BorderStyle.SINGLE, size: 4, color: theme.accent },
                },
                margins: { top: 80, bottom: 80, left: 0, right: 120 },
                children: [new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [new TextRun({ text: s.number || `Section ${String(i + 1).padStart(2, "0")}`, font: "Arial", size: 16, color: theme.accent, bold: true })],
                })],
              }),
              new TableCell({
                width: { size: CONTENT_W - 1600, type: WidthType.DXA },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0 },
                  bottom: { style: BorderStyle.NONE, size: 0 },
                  left: { style: BorderStyle.NONE, size: 0 },
                  right: { style: BorderStyle.NONE, size: 0 },
                },
                margins: { top: 80, bottom: 80, left: 200, right: 0 },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: s.title || "", font: "Arial", size: 24, bold: true, color: "222222" })],
                    spacing: { after: 120 },
                  }),
                  ...((s.bullets || []) as any[]).map((b: any) =>
                    new Paragraph({
                      children: [
                        ...(b.label ? [new TextRun({ text: b.label + (b.desc ? ": " : ""), font: "Arial", size: 20, bold: true, color: "333333" })] : []),
                        ...(b.desc ? [new TextRun({ text: b.desc, font: "Arial", size: 20, color: "555555" })] : []),
                      ],
                      spacing: { after: 80 },
                    })
                  ),
                ],
              }),
            ],
          })],
        })
      );

      // Option price box after relevant sections (multi-option)
      if (isMultiOption && i < optionPrices.length) {
        const opt = optionPrices[i];
        scopeChildren.push(sp(120));
        scopeChildren.push(
          new Table({
            width: { size: CONTENT_W, type: WidthType.DXA },
            columnWidths: [3000, CONTENT_W - 3000],
            rows: [new TableRow({
              children: [
                new TableCell({
                  width: { size: 3000, type: WidthType.DXA },
                  shading: { fill: theme.hero, type: ShadingType.CLEAR },
                  borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } },
                  margins: { top: 160, bottom: 160, left: 200, right: 200 },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: opt.label || "", font: "Arial", size: 22, color: "FFFFFF", bold: true })] }),
                    ...(opt.sub ? [new Paragraph({ children: [new TextRun({ text: opt.sub, font: "Arial", size: 16, color: "CCCCCC" })] })] : []),
                  ],
                }),
                new TableCell({
                  width: { size: CONTENT_W - 3000, type: WidthType.DXA },
                  shading: { fill: theme.hero, type: ShadingType.CLEAR },
                  borders: { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.SINGLE, size: 4, color: theme.accent }, right: { style: BorderStyle.NONE, size: 0 } },
                  margins: { top: 160, bottom: 160, left: 200, right: 200 },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: opt.base || "", font: "Arial", size: 32, color: "FFFFFF", bold: true })] }),
                    ...(opt.upgrade ? [new Paragraph({ children: [new TextRun({ text: `Upgrade: ${opt.upgrade}`, font: "Arial", size: 18, color: theme.accent })] })] : []),
                  ],
                }),
              ],
            })],
          })
        );
      }

      scopeChildren.push(sp(120));
      scopeChildren.push(accentRule());
      scopeChildren.push(sp(120));
    }

    // ── CLIENT SELECTIONS TABLE ──
    const selectionsChildren: any[] = [];
    if (clientSelections.length > 0) {
      selectionsChildren.push(new Paragraph({ children: [new PageBreak()] }));
      selectionsChildren.push(sp(200));
      selectionsChildren.push(eyebrow("CLIENT SELECTIONS"));
      selectionsChildren.push(sp(80));
      selectionsChildren.push(new Paragraph({
        children: [new TextRun({ text: "Items you select and purchase separately. We handle the installation.", font: "Arial", size: 20, color: "666666", italics: true })],
        spacing: { after: 200 },
      }));

      for (const cat of clientSelections) {
        // Category header row
        selectionsChildren.push(
          new Table({
            width: { size: CONTENT_W, type: WidthType.DXA },
            columnWidths: [CONTENT_W],
            rows: [new TableRow({
              children: [new TableCell({
                width: { size: CONTENT_W, type: WidthType.DXA },
                shading: { fill: theme.accent + "22", type: ShadingType.CLEAR },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0 },
                  bottom: { style: BorderStyle.NONE, size: 0 },
                  left: { style: BorderStyle.SINGLE, size: 8, color: theme.accent },
                  right: { style: BorderStyle.NONE, size: 0 },
                },
                margins: { top: 80, bottom: 80, left: 200, right: 200 },
                children: [new Paragraph({
                  children: [new TextRun({ text: (cat.label || "").toUpperCase(), font: "Arial", size: 18, bold: true, color: theme.hero })],
                })],
              })],
            })],
          })
        );
        selectionsChildren.push(sp(80));

        // Item rows
        const colW1 = 2800;
        const colW2 = 3800;
        const colW3 = 2760;
        const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "E5E5E5" };
        const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

        // Header
        selectionsChildren.push(
          new Table({
            width: { size: CONTENT_W, type: WidthType.DXA },
            columnWidths: [colW1, colW2, colW3],
            rows: [
              new TableRow({
                children: ["Item", "What to Look For", "Where to Shop"].map((h, hi) =>
                  new TableCell({
                    width: { size: [colW1, colW2, colW3][hi], type: WidthType.DXA },
                    shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
                    borders: cellBorders,
                    margins: { top: 60, bottom: 60, left: 120, right: 120 },
                    children: [new Paragraph({ children: [new TextRun({ text: h, font: "Arial", size: 16, bold: true, color: "666666" })] })],
                  })
                ),
              }),
              ...((cat.items || []) as any[]).map((item: any) =>
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: colW1, type: WidthType.DXA },
                      borders: cellBorders,
                      margins: { top: 60, bottom: 60, left: 120, right: 120 },
                      children: [new Paragraph({ children: [new TextRun({ text: item.name || "", font: "Arial", size: 18, bold: true })] })],
                    }),
                    new TableCell({
                      width: { size: colW2, type: WidthType.DXA },
                      borders: cellBorders,
                      margins: { top: 60, bottom: 60, left: 120, right: 120 },
                      children: [new Paragraph({ children: [new TextRun({ text: item.desc || "", font: "Arial", size: 18, color: "555555" })] })],
                    }),
                    new TableCell({
                      width: { size: colW3, type: WidthType.DXA },
                      borders: cellBorders,
                      margins: { top: 60, bottom: 60, left: 120, right: 120 },
                      children: [new Paragraph({ children: [new TextRun({ text: item.shop || "", font: "Arial", size: 18, color: "555555" })] })],
                    }),
                  ],
                })
              ),
            ],
          })
        );
        selectionsChildren.push(sp(200));
      }
    }

    // ── TIMELINE ──
    const timelineChildren: any[] = [];
    if (timelinePhases.length > 0) {
      timelineChildren.push(new Paragraph({ children: [new PageBreak()] }));
      timelineChildren.push(sp(200));
      timelineChildren.push(eyebrow("PROJECT TIMELINE"));
      timelineChildren.push(sp(200));

      for (const phase of timelinePhases) {
        timelineChildren.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${phase.icon || "📋"} ${phase.phase_title || ""}`, font: "Arial", size: 24, bold: true, color: "222222" }),
              new TextRun({ text: `  ${phase.duration || ""}`, font: "Arial", size: 20, color: theme.accent }),
            ],
            spacing: { after: 80 },
          })
        );
        if (phase.description) {
          timelineChildren.push(
            new Paragraph({
              children: [new TextRun({ text: phase.description, font: "Arial", size: 20, color: "555555" })],
              spacing: { after: 160 },
            })
          );
        }
        timelineChildren.push(accentRule());
      }
    }

    // ── TERMS ──
    const termsChildren: any[] = [];
    if (terms.length > 0) {
      termsChildren.push(new Paragraph({ children: [new PageBreak()] }));
      termsChildren.push(sp(200));
      termsChildren.push(eyebrow("TERMS & CONDITIONS"));
      termsChildren.push(sp(200));

      const halfW = Math.floor(CONTENT_W / 2);
      // Render terms in 2-column grid (pairs)
      for (let i = 0; i < terms.length; i += 2) {
        const left = terms[i];
        const right = terms[i + 1];
        const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "E5E5E5" };
        const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

        termsChildren.push(
          new Table({
            width: { size: CONTENT_W, type: WidthType.DXA },
            columnWidths: [halfW, halfW],
            rows: [new TableRow({
              children: [left, right].map((t, ti) =>
                new TableCell({
                  width: { size: halfW, type: WidthType.DXA },
                  borders: cellBorders,
                  margins: { top: 100, bottom: 100, left: 160, right: 160 },
                  children: t ? [
                    new Paragraph({ children: [new TextRun({ text: t.label, font: "Arial", size: 16, bold: true, color: theme.hero })], spacing: { after: 40 } }),
                    new Paragraph({ children: [new TextRun({ text: t.value, font: "Arial", size: 18, color: "444444" })] }),
                  ] : [new Paragraph({ children: [] })],
                })
              ),
            })],
          })
        );
        termsChildren.push(sp(80));
      }
    }

    // ── CTA / NEXT STEPS ──
    const ctaChildren: any[] = [];
    if (estimate.proposal_cta_headline) {
      ctaChildren.push(new Paragraph({ children: [new PageBreak()] }));
      ctaChildren.push(sp(2000));
      ctaChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: estimate.proposal_cta_headline, font: "Arial", size: 40, bold: true, color: theme.hero })],
          spacing: { after: 200 },
        })
      );
      if (estimate.proposal_cta_subtext) {
        ctaChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: estimate.proposal_cta_subtext, font: "Arial", size: 22, color: "666666" })],
            spacing: { after: 400 },
          })
        );
      }
      // Contact info
      const contactParts = [companyPhone, companyWebsite].filter(Boolean).join(" | ");
      if (contactParts) {
        ctaChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: contactParts, font: "Arial", size: 18, color: theme.accent })],
          })
        );
      }
    }

    // ── BUILD DOCUMENT ──
    const doc = new Document({
      styles: {
        default: {
          document: { run: { font: "Arial", size: 22 } },
        },
      },
      sections: [
        // Cover page (no margins for full-bleed effect)
        {
          properties: {
            page: {
              size: { width: PAGE_W, height: PAGE_H },
              margin: { top: 0, right: 0, bottom: 0, left: 0 },
            },
          },
          children: [coverTable],
        },
        // Content pages
        {
          properties: {
            page: {
              size: { width: PAGE_W, height: PAGE_H },
              margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
            },
          },
          headers: {
            default: new Header({
              children: [new Paragraph({
                children: [new TextRun({ text: companyName, font: "Arial", size: 14, color: "999999" })],
              })],
            }),
          },
          footers: {
            default: new Footer({
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({
                  text: [companyPhone, companyWebsite].filter(Boolean).join(" | "),
                  font: "Arial",
                  size: 14,
                  color: "999999",
                })],
              })],
            }),
          },
          children: [
            ...overviewChildren.slice(1), // skip the PageBreak since it's a new section
            ...scopeChildren.slice(1),
            ...selectionsChildren.slice(1),
            ...timelineChildren.slice(1),
            ...termsChildren.slice(1),
            ...ctaChildren.slice(1),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

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
