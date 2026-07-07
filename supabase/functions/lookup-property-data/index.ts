import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAuth } from "../_shared/auth.ts";
import { rateLimit, getClientIP, rateLimitResponse } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export interface PropertyLookupResult {
  yearBuilt?: number;
  sqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  estimatedValue?: number;
  lastSaleDate?: string;
  lastSalePrice?: number;
  lotSize?: number;
  stories?: number;
  garage?: boolean;
  pool?: boolean;
  formattedAddress?: string;
  county?: string;
  zoning?: string;
  source: "rentcast" | "not_found" | "error";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Authenticated + tightly rate-limited: each call spends a paid Rentcast credit.
  if (!rateLimit(getClientIP(req), 10)) return rateLimitResponse(corsHeaders);
  const auth = await requireAuth(req);
  if ("error" in auth) return auth.error;

  try {
    const { address, city, state, zip }: { address: string; city?: string; state?: string; zip?: string } = await req.json();

    if (!address) {
      return new Response(
        JSON.stringify({ error: "address is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RENTCAST_API_KEY = Deno.env.get("RENTCAST_API_KEY");
    if (!RENTCAST_API_KEY) {
      // Return empty result gracefully — feature just won't auto-populate
      return new Response(
        JSON.stringify({ source: "error", error: "RENTCAST_API_KEY not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build Rentcast query — address + optional city/state/zip for accuracy
    const params = new URLSearchParams({ address });
    if (city) params.append("city", city);
    if (state) params.append("state", state);
    if (zip) params.append("zipCode", zip);
    params.append("limit", "1");

    const response = await fetch(
      `https://api.rentcast.io/v1/properties?${params.toString()}`,
      {
        headers: {
          "X-Api-Key": RENTCAST_API_KEY,
          "Accept": "application/json",
        },
      }
    );

    if (response.status === 404 || response.status === 204) {
      return new Response(
        JSON.stringify({ source: "not_found" } as PropertyLookupResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Rentcast error:", response.status, errorText);
      return new Response(
        JSON.stringify({ source: "error", error: `Rentcast returned ${response.status}` } as PropertyLookupResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    // Rentcast returns an array — grab first result
    const prop = Array.isArray(data) ? data[0] : data;

    if (!prop) {
      return new Response(
        JSON.stringify({ source: "not_found" } as PropertyLookupResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result: PropertyLookupResult = {
      source: "rentcast",
      formattedAddress: prop.formattedAddress || prop.addressLine1,
      yearBuilt: prop.yearBuilt || undefined,
      sqft: prop.squareFootage || undefined,
      bedrooms: prop.bedrooms || undefined,
      bathrooms: prop.bathrooms || undefined,
      propertyType: prop.propertyType || undefined,
      estimatedValue: prop.price || prop.estimatedValue || undefined,
      lastSaleDate: prop.lastSaleDate || undefined,
      lastSalePrice: prop.lastSalePrice || undefined,
      lotSize: prop.lotSize || undefined,
      stories: prop.stories || undefined,
      garage: prop.features?.garage ?? undefined,
      pool: prop.features?.pool ?? undefined,
      county: prop.county || undefined,
      zoning: prop.zoning || undefined,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("lookup-property-data error:", err);
    return new Response(
      JSON.stringify({ source: "error", error: err instanceof Error ? err.message : "Internal error" } as PropertyLookupResult),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
