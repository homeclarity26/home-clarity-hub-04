/**
 * Backfill structured data (condition_rating, specs, key_observations)
 * for all report pages that currently have null condition_rating.
 *
 * Calls the draft-page-narrative edge function for each page, extracts
 * the structured fields, and writes them back to report_pages.
 *
 * Usage:
 *   bun --env-file=.env.local scripts/backfill-page-structured-data.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function getCreatorJwt(): Promise<string> {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: "adam@hometownbuildersclub.com",
  });
  if (error) throw new Error(`generateLink: ${error.message}`);
  const otp = (data as unknown as { properties: { email_otp: string } })
    .properties.email_otp;
  const { data: session, error: vErr } = await supabase.auth.verifyOtp({
    email: "adam@hometownbuildersclub.com",
    token: otp,
    type: "email",
  });
  if (vErr) throw new Error(`verifyOtp: ${vErr.message}`);
  return session.session!.access_token;
}

const PROPERTY_ID = "c9ea52bd-eadd-49e8-864c-7da7c78181b1";

// Strategy/info pages that don't need condition ratings
const SKIP_PAGES = new Set([
  "executive-summary",
  "financial-roadmap",
  "action-plan",
  "capital-plan-10yr",
  "maintenance-calendar",
  "recurring-services",
]);

// Batch size — don't overwhelm the edge function
const BATCH_SIZE = 5;
const DELAY_MS = 2000;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  // 1. Get property details for context
  const { data: prop } = await supabase
    .from("properties")
    .select("*")
    .eq("id", PROPERTY_ID)
    .single();

  if (!prop) {
    console.error("Property not found");
    process.exit(1);
  }

  // 2. Get report + pages
  const { data: reports } = await supabase
    .from("reports")
    .select("id")
    .eq("property_id", PROPERTY_ID)
    .limit(1);

  if (!reports?.length) {
    console.error("No report found");
    process.exit(1);
  }

  const reportId = reports[0].id;

  const { data: pages } = await supabase
    .from("report_pages")
    .select("id, page_key, title, condition_rating, narrative, group_name")
    .eq("report_id", reportId)
    .order("sort_order");

  if (!pages?.length) {
    console.error("No pages found");
    process.exit(1);
  }

  // 3. Filter to pages that need backfill
  const needsBackfill = pages.filter(
    (p) => !p.condition_rating && !SKIP_PAGES.has(p.page_key)
  );

  console.log(
    `Found ${pages.length} pages, ${needsBackfill.length} need backfill`
  );

  // 4. Get a creator JWT for edge function auth
  console.log("Obtaining creator JWT...");
  const jwt = await getCreatorJwt();
  console.log("JWT obtained.");

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < needsBackfill.length; i += BATCH_SIZE) {
    const batch = needsBackfill.slice(i, i + BATCH_SIZE);
    console.log(
      `\nBatch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(needsBackfill.length / BATCH_SIZE)}: ${batch.map((p) => p.page_key).join(", ")}`
    );

    const results = await Promise.allSettled(
      batch.map(async (page) => {
        // Extract plain text from narrative blocks for context
        let narrativeText = "";
        if (Array.isArray(page.narrative)) {
          for (const block of page.narrative as Array<Record<string, unknown>>) {
            if (block.type === "text" && typeof block.content === "string") {
              narrativeText += block.content + "\n";
            } else if (
              block.type === "text" &&
              block.content &&
              typeof block.content === "object"
            ) {
              const c = block.content as Record<string, unknown>;
              if (typeof c.text === "string") narrativeText += c.text + "\n";
            }
          }
        }

        // Call the edge function
        const resp = await fetch(
          `${SUPABASE_URL}/functions/v1/draft-page-narrative`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${jwt}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              pageSlug: page.page_key,
              pageName: page.title,
              propertyAddress: prop.address,
              yearBuilt: (prop as Record<string, unknown>).year_built ?? 1998,
              sqft: (prop as Record<string, unknown>).sqft,
              propertyType:
                (prop as Record<string, unknown>).property_type ?? "Colonial",
              existingConditionRating: null,
            }),
          }
        );

        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(
            `${page.page_key}: HTTP ${resp.status} — ${text.slice(0, 200)}`
          );
        }

        const data = await resp.json();

        // Update the DB row with structured data
        const updatePayload: Record<string, unknown> = {};
        if (data.suggested_condition) {
          updatePayload.condition_rating = data.suggested_condition;
        }
        if (data.specs && Array.isArray(data.specs) && data.specs.length > 0) {
          updatePayload.specs = data.specs;
        }
        if (
          data.key_observations &&
          Array.isArray(data.key_observations) &&
          data.key_observations.length > 0
        ) {
          updatePayload.key_observations = data.key_observations;
        }

        if (Object.keys(updatePayload).length === 0) {
          console.log(`  ${page.page_key}: no structured data returned`);
          return;
        }

        const { error } = await supabase
          .from("report_pages")
          .update(updatePayload)
          .eq("id", page.id);

        if (error) {
          throw new Error(`${page.page_key}: DB update failed — ${error.message}`);
        }

        console.log(
          `  ✓ ${page.page_key}: ${updatePayload.condition_rating ?? "—"} | ${(updatePayload.specs as unknown[])?.length ?? 0} specs | ${(updatePayload.key_observations as unknown[])?.length ?? 0} observations`
        );
        return "ok";
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled") updated++;
      else {
        failed++;
        console.error(`  ✗ ${r.reason}`);
      }
    }

    if (i + BATCH_SIZE < needsBackfill.length) {
      console.log(`  Waiting ${DELAY_MS}ms...`);
      await sleep(DELAY_MS);
    }
  }

  console.log(`\nDone: ${updated} updated, ${failed} failed out of ${needsBackfill.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
