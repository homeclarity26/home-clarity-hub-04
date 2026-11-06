// Scripted Bobby for the public sample report (/demo). No network, no AI:
// every reply is canned and agrees with docs/demo/CALDWELL_DEMO_BIBLE.md.
// Where a fact also lives in the built report (dining room paint, furnace
// serial, chimney vendor, project price ranges) the reply reads it from
// there so the two can never drift.

import type { CaldwellDemo, DemoReportPage } from "./caldwellBuilder";
import { formatRange } from "./caldwellBuilder";

/** The five prompt chips (bible, "Bobby demo prompts"). */
export const DEMO_BOBBY_PROMPTS: string[] = [
  "Schedule the chimney sweep this fall",
  "Pay the AK Renovations draw invoice that came in",
  "What paint is on the dining room walls?",
  "Pull up the photo of the furnace serial plate",
  "Tell Adam I want to start planning the screened porch",
];

/** Reply to anything typed that is not one of the five prompts. */
export const DEMO_BOBBY_FALLBACK =
  "This is a sample portal, so I'm answering from a script. In your own portal I work from your home's full record: I can schedule, pay, pull up documents and photos, and message Adam for you.";

export interface DemoBobbyReply {
  content: string;
  imageUrl?: string;
}

export interface DemoBobbyContext {
  demo: CaldwellDemo;
  /** Page the visitor is on, if any (gives CTA replies their subject). */
  pageKey?: string | null;
  /**
   * "typed": the visitor typed it or tapped a prompt chip.
   * "action": it came from a button on a page (briefing, vision, room).
   */
  source: "typed" | "action";
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function blockContent(page: DemoReportPage | undefined, type: string): Record<string, unknown> | undefined {
  return page?.narrative.find((b) => b.type === type)?.content;
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

interface TierLike {
  recommended?: boolean;
  label?: string;
  priceLow?: number;
  priceHigh?: number;
}

function recommendedTier(content: Record<string, unknown> | undefined): TierLike | undefined {
  const tiers = (content?.tiers as TierLike[] | undefined) ?? [];
  return tiers.find((t) => t.recommended) ?? tiers[1] ?? tiers[0];
}

function chimneyReply(demo: CaldwellDemo): DemoBobbyReply {
  const services =
    (blockContent(demo.pages["recurring-services"], "recurring_services_register")?.services as
      | { serviceName: string; vendorName?: string }[]
      | undefined) ?? [];
  const vendor = services.find((s) => /chimney/i.test(s.serviceName))?.vendorName ?? "Brooks Chimney";
  return {
    content: `Your annual chimney sweep and inspection with ${vendor} is past due on your register, so now is the right time. I'll request their first open morning, add it to your calendar, send you a reminder 7 days ahead and file the inspection report in your home record when it's done. It bills through your HBC Concierge plan. Want me to book it?`,
  };
}

function invoiceReply(): DemoBobbyReply {
  return {
    content:
      "I found it: the AK Renovations invoice for the primary bath design phase, $4,500, due November 20. I can pay it from the payment method on file, save the receipt to your documents and note it on the Primary Bath project. Should I pay it now?",
  };
}

function diningPaintReply(demo: CaldwellDemo): DemoBobbyReply {
  const room = blockContent(demo.pages["dining-room"], "room_record");
  const walls = str(room?.wallPaint) ?? "Benjamin Moore Edgecomb Gray HC-173 above the chair rail";
  const trim = str(room?.trimPaint) ?? "Benjamin Moore Simply White OC-117";
  const ceiling = str(room?.ceilingPaint) ?? "flat white";
  return {
    content: `Here is the dining room. Walls: ${walls}. Trim: ${trim}. Ceiling: ${ceiling}. It is all on your Dining Room page. Want me to add a touch-up quart to your next painter visit?`,
  };
}

function serialPlateReply(demo: CaldwellDemo): DemoBobbyReply {
  const page = demo.pages["furnace-main-zone"];
  const rec = blockContent(page, "system_record");
  const make = str(rec?.make) ?? "Lennox";
  const model = str(rec?.model) ?? "SLP99V-090";
  const serial = str(rec?.serial) ?? "5818H45821";
  const installed = page?.specs?.find((s) => s.label === "Installed")?.value ?? "August 2009";
  const photo =
    demo.pageImages["furnace-main-zone"]?.find((src) => /serial/i.test(src)) ??
    "/demo/caldwell/furnace-serial-plate.jpg";
  return {
    content: `Here it is. Furnace: Main Floor Zone, ${make} ${model}, serial ${serial}, installed ${installed}. If you need service, I can send this photo and the full Replacement Briefing straight to your HVAC partner.`,
    imageUrl: photo,
  };
}

function screenedPorchReply(demo: CaldwellDemo): DemoBobbyReply {
  const page = demo.pages["vision-screened-porch"];
  const tier = recommendedTier(blockContent(page, "vision_project"));
  const range =
    tier?.priceLow != null && tier?.priceHigh != null
      ? formatRange(tier.priceLow, tier.priceHigh)
      : "$58,000 - $75,000";
  return {
    content: `Done. I sent Adam a note that you're ready to start planning the Screened Porch: Four-Season Conversion, and attached the project page with all three scoped tiers (the recommended Enhanced tier runs ${range}). He usually replies within one business day with a couple of times to talk.`,
  };
}

const SCRIPTED: { prompt: string; reply: (demo: CaldwellDemo) => DemoBobbyReply }[] = [
  { prompt: DEMO_BOBBY_PROMPTS[0], reply: chimneyReply },
  { prompt: DEMO_BOBBY_PROMPTS[1], reply: invoiceReply },
  { prompt: DEMO_BOBBY_PROMPTS[2], reply: diningPaintReply },
  { prompt: DEMO_BOBBY_PROMPTS[3], reply: serialPlateReply },
  { prompt: DEMO_BOBBY_PROMPTS[4], reply: screenedPorchReply },
];

const CONCIERGE_PLANS_REPLY =
  "HBC Concierge is $200 a month for up to 5 services managed, $400 for up to 10, and $600 for more than 10. With 20 services on your register you'd be on the $600 plan. It doesn't lower what the services themselves cost. What you stop doing is the scheduling, chasing receipts, remembering due dates and vetting vendors. Want me to ask Adam to walk you through it?";

function actionReply(text: string, ctx: DemoBobbyContext): DemoBobbyReply {
  const { demo, pageKey } = ctx;
  const page = pageKey ? demo.pages[pageKey] : undefined;
  const title = page?.title ?? "this";
  const briefing = blockContent(page, "replacement_briefing");
  const vision = blockContent(page, "vision_project");

  if (/concierge plan/i.test(text)) return { content: CONCIERGE_PLANS_REPLY };

  if (/stopped working|isn't working|not working|need help today/i.test(text)) {
    return {
      content: `I'm treating this as urgent. I've sent your trade partner the full Replacement Briefing for ${title}: model, serial, install photos and every connection detail, so they arrive ready to work. Their dispatcher will call you within the hour, and I've let Adam know. If you ever smell gas, leave the house and call the gas company first.`,
    };
  }

  if (briefing && /replace/i.test(text)) {
    const tier = recommendedTier(briefing);
    const age = page?.current_age_years;
    const life = page?.expected_lifespan_years;
    const ageLine =
      age != null && life
        ? `${title} is ${age} years into a typical ${life}-year life, so you get to pick the date instead of the equipment picking it. `
        : "";
    const tierLine =
      tier?.priceLow != null && tier?.priceHigh != null
        ? `The recommended ${tier.label ?? "Enhanced"} tier runs ${formatRange(tier.priceLow, tier.priceHigh)}. `
        : "";
    return {
      content: `Good timing. ${ageLine}${tierLine}I'll ask Adam to set up a planning visit with the trade partner, who already has the model, serial, photos and connection details from this page. Do weekday mornings or afternoons work better for you?`,
    };
  }

  if (vision) {
    const tier = recommendedTier(vision);
    const project = str(vision.projectTitle) ?? title;
    const tierLine =
      tier?.priceLow != null && tier?.priceHigh != null
        ? ` The recommended ${tier.label ?? "Enhanced"} tier runs ${formatRange(tier.priceLow, tier.priceHigh)}.`
        : "";
    return {
      content: `Done. I let Adam know you want to start planning ${project} and attached this page with all three scoped tiers.${tierLine} He usually replies within one business day with a couple of times to talk it through.`,
    };
  }

  if (/tell adam|start planning|planning the/i.test(text)) {
    return {
      content:
        "Done. I sent Adam your note along with the pages it refers to. He usually replies within one business day with a couple of times to talk.",
    };
  }

  if (/consultation/i.test(text)) {
    return {
      content:
        "I'll pull two or three openings from Adam's calendar for next week and send them over. Once you pick one, it goes on your calendar with a reminder the day before.",
    };
  }

  if (/refer/i.test(text)) {
    return {
      content:
        "Thank you. Most families find us through a neighbor. Share their name and the best way to reach them, and Adam will reach out personally. There is never a hard sell.",
    };
  }

  return {
    content:
      "I'll take care of it. I'll confirm the right vendor from your register, find their first opening that fits your calendar and send you a confirmation with a reminder 7 days ahead. When the visit is done, I'll update the record on this page. Want me to go ahead?",
  };
}

/** The scripted reply for a message. Pure; never touches the network. */
export function demoBobbyReply(text: string, ctx: DemoBobbyContext): DemoBobbyReply {
  const wanted = norm(text);
  const scripted = SCRIPTED.find((s) => norm(s.prompt) === wanted);
  if (scripted) return scripted.reply(ctx.demo);
  if (ctx.source === "action") return actionReply(text, ctx);
  return { content: DEMO_BOBBY_FALLBACK };
}
