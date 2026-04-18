import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PropertyValuation {
  id: string;
  property_id: string;
  address: string;
  price: number | null;
  price_range_low: number | null;
  price_range_high: number | null;
  subject_property: {
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    lotSize?: number;
    yearBuilt?: number;
    lastSalePrice?: number;
    lastSaleDate?: string;
    propertyType?: string;
    [key: string]: unknown;
  };
  comparables: Array<{
    formattedAddress?: string;
    address?: string;
    price?: number;
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    distance?: number;
    daysOnMarket?: number;
    correlation?: number;
    listedDate?: string;
    lastSaleDate?: string;
    [key: string]: unknown;
  }>;
  fetched_at: string;
  _stale?: boolean;
}

export function usePropertyValuation(propertyId?: string, address?: string) {
  const [valuation, setValuation] = useState<PropertyValuation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cached valuation from DB
  useEffect(() => {
    if (!propertyId) return;

    async function loadCached() {
      const { data } = await supabase.from("property_valuations")
        .select("*")
        .eq("property_id", propertyId)
        .order("fetched_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setValuation(data[0] as PropertyValuation);
      }
    }
    loadCached();
  }, [propertyId]);

  const fetchValuation = useCallback(async (forceRefresh = false) => {
    if (!propertyId || !address) return;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("get-property-value", {
        body: { address, property_id: propertyId, force_refresh: forceRefresh },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setValuation(data as PropertyValuation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch valuation");
    } finally {
      setIsLoading(false);
    }
  }, [propertyId, address]);

  return { valuation, isLoading, error, fetchValuation };
}
