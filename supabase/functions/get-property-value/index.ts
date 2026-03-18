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

    const { address, property_id, force_refresh } = await req.json();
    if (!address || !property_id) {
      return new Response(JSON.stringify({ error: "address and property_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check cache (30-day window) unless force refresh
    if (!force_refresh) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: cached } = await supabase
        .from("property_valuations")
        .select("*")
        .eq("property_id", property_id)
        .gte("fetched_at", thirtyDaysAgo.toISOString())
        .order("fetched_at", { ascending: false })
        .limit(1);

      if (cached && cached.length > 0) {
        return new Response(JSON.stringify(cached[0]), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Call Rentcast AVM API
    const encodedAddress = encodeURIComponent(address);
    const rentcastRes = await fetch(
      `https://api.rentcast.io/v1/avm/value?address=${encodedAddress}`,
      {
        headers: { "X-Api-Key": RENTCAST_API_KEY, Accept: "application/json" },
      }
    );

    if (!rentcastRes.ok) {
      const errorBody = await rentcastRes.text();
      console.error(`Rentcast API error [${rentcastRes.status}]: ${errorBody}`);
      
      // Return last cached result if API fails
      const { data: fallback } = await supabase
        .from("property_valuations")
        .select("*")
        .eq("property_id", property_id)
        .order("fetched_at", { ascending: false })
        .limit(1);

      if (fallback && fallback.length > 0) {
        return new Response(JSON.stringify({ ...fallback[0], _stale: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`Rentcast API failed: ${rentcastRes.status}`);
    }

    const rentcastData = await rentcastRes.json();

    // Store in cache
    const record = {
      property_id,
      address,
      price: rentcastData.price ?? null,
      price_range_low: rentcastData.priceRangeLow ?? null,
      price_range_high: rentcastData.priceRangeHigh ?? null,
      subject_property: rentcastData.subjectProperty ?? {},
      comparables: rentcastData.comparables ?? [],
      fetched_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertErr } = await supabase
      .from("property_valuations")
      .insert(record)
      .select()
      .single();

    if (insertErr) {
      console.error("Cache insert error:", insertErr);
    }

    // Also update estimated_value on the property
    if (rentcastData.price) {
      await supabase
        .from("properties")
        .update({ estimated_value: rentcastData.price })
        .eq("id", property_id);
    }

    return new Response(JSON.stringify(inserted || record), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in get-property-value:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
