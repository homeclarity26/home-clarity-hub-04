import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RENTCAST_API_KEY = Deno.env.get("RENTCAST_API_KEY");
    if (!RENTCAST_API_KEY) {
      throw new Error("RENTCAST_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { property_id, address, city, state, zip, force } = await req.json();
    if (!property_id || !address) {
      return new Response(JSON.stringify({ error: "property_id and address required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date().toISOString().split("T")[0];

    // Check if we already have a snapshot for today (skip if force)
    if (!force) {
      const { data: existing } = await supabase
        .from("home_value_snapshots")
        .select("*")
        .eq("property_id", property_id)
        .eq("snapshot_date", today)
        .limit(1);

      if (existing && existing.length > 0) {
        // Still calculate change from previous
        const { data: prev } = await supabase
          .from("home_value_snapshots")
          .select("estimated_value")
          .eq("property_id", property_id)
          .lt("snapshot_date", today)
          .order("snapshot_date", { ascending: false })
          .limit(1);

        const prevVal = prev?.[0]?.estimated_value || null;
        const change = existing[0].estimated_value && prevVal
          ? existing[0].estimated_value - prevVal
          : null;

        return new Response(JSON.stringify({
          ...existing[0],
          change_from_last_snapshot: change,
          change_percent: change && prevVal ? ((change / prevVal) * 100) : null,
          already_cached: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Call Rentcast AVM API
    const encodedAddress = encodeURIComponent(address);
    const avmUrl = `https://api.rentcast.io/v1/avm/value?address=${encodedAddress}&propertyType=Single+Family`;
    const avmRes = await fetch(avmUrl, {
      headers: { "X-Api-Key": RENTCAST_API_KEY, Accept: "application/json" },
    });

    if (!avmRes.ok) {
      const errorBody = await avmRes.text();
      console.error(`Rentcast AVM error [${avmRes.status}]: ${errorBody}`);
      throw new Error(`Rentcast AVM API failed: ${avmRes.status}`);
    }

    const avmData = await avmRes.json();

    // Try to get neighborhood data via markets API
    let neighborhoodAvg: number | null = null;
    if (zip) {
      try {
        const marketsRes = await fetch(
          `https://api.rentcast.io/v1/markets?zipCode=${encodeURIComponent(zip)}`,
          { headers: { "X-Api-Key": RENTCAST_API_KEY, Accept: "application/json" } }
        );
        if (marketsRes.ok) {
          const marketsData = await marketsRes.json();
          // Markets API returns array or single object
          const market = Array.isArray(marketsData) ? marketsData[0] : marketsData;
          neighborhoodAvg = market?.medianSalePrice || market?.medianPrice || null;
        }
      } catch (e) {
        console.warn("Markets API call failed, continuing without neighborhood data:", e);
      }
    }

    const snapshot = {
      property_id,
      snapshot_date: today,
      estimated_value: avmData.price ?? null,
      low_estimate: avmData.priceRangeLow ?? null,
      high_estimate: avmData.priceRangeHigh ?? null,
      price_per_sqft: avmData.pricePerSquareFoot ?? null,
      neighborhood_avg: neighborhoodAvg,
      data_source: "rentcast",
      raw_response: avmData,
    };

    // Upsert snapshot (one per property per day)
    const { data: inserted, error: insertErr } = await supabase
      .from("home_value_snapshots")
      .upsert(snapshot, { onConflict: "property_id,snapshot_date" })
      .select()
      .single();

    if (insertErr) {
      console.error("Snapshot insert error:", insertErr);
    }

    // Also update estimated_value on the property
    if (avmData.price) {
      await supabase
        .from("properties")
        .update({ estimated_value: avmData.price })
        .eq("id", property_id);
    }

    // Get previous snapshot for change calculation
    const { data: prev } = await supabase
      .from("home_value_snapshots")
      .select("estimated_value")
      .eq("property_id", property_id)
      .lt("snapshot_date", today)
      .order("snapshot_date", { ascending: false })
      .limit(1);

    const prevVal = prev?.[0]?.estimated_value || null;
    const currentVal = inserted?.estimated_value || snapshot.estimated_value;
    const change = currentVal && prevVal ? currentVal - prevVal : null;

    return new Response(JSON.stringify({
      ...(inserted || snapshot),
      change_from_last_snapshot: change,
      change_percent: change && prevVal ? ((change / prevVal) * 100) : null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in fetch-home-value:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
