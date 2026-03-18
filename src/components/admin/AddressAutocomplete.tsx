import { useEffect, useRef, useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wand2, MapPin, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ParsedAddress {
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  lat?: number;
  lng?: number;
}

export interface PropertyData {
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
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onAddressParsed?: (parsed: ParsedAddress) => void;
  onPropertyDataFetched?: (data: PropertyData) => void;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

export default function AddressAutocomplete({
  value,
  onChange,
  onAddressParsed,
  onPropertyDataFetched,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const scriptLoaded = useRef(false);

  const [parsedAddress, setParsedAddress] = useState<ParsedAddress | null>(null);
  const [satelliteUrl, setSatelliteUrl] = useState<string | null>(null);
  const [streetViewUrl, setStreetViewUrl] = useState<string | null>(null);
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataNotFound, setDataNotFound] = useState(false);

  const handlePlaceSelect = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    if (!place?.address_components) return;

    const get = (type: string) =>
      place.address_components?.find((c) => c.types.includes(type))?.long_name ?? "";
    const getShort = (type: string) =>
      place.address_components?.find((c) => c.types.includes(type))?.short_name ?? "";

    const streetNumber = get("street_number");
    const route = get("route");
    const fullAddress = place.formatted_address ?? `${streetNumber} ${route}`.trim();

    const lat = place.geometry?.location?.lat();
    const lng = place.geometry?.location?.lng();

    const parsed: ParsedAddress = {
      address: fullAddress,
      city: get("locality") || get("sublocality_level_1"),
      state: getShort("administrative_area_level_1"),
      zip: get("postal_code"),
      county: get("administrative_area_level_2").replace(/ County$/i, ""),
      lat,
      lng,
    };

    onChange(parsed.address);
    onAddressParsed?.(parsed);
    setParsedAddress(parsed);
    setPropertyData(null);
    setDataNotFound(false);

    // Build Google image URLs
    if (GOOGLE_MAPS_API_KEY && lat && lng) {
      setSatelliteUrl(
        `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=19&size=640x320&maptype=satellite&key=${GOOGLE_MAPS_API_KEY}`
      );
      setStreetViewUrl(
        `https://maps.googleapis.com/maps/api/streetview?size=640x320&location=${encodeURIComponent(fullAddress)}&fov=90&pitch=0&key=${GOOGLE_MAPS_API_KEY}`
      );
    } else if (GOOGLE_MAPS_API_KEY) {
      setSatelliteUrl(null);
      setStreetViewUrl(
        `https://maps.googleapis.com/maps/api/streetview?size=640x320&location=${encodeURIComponent(fullAddress)}&fov=90&pitch=0&key=${GOOGLE_MAPS_API_KEY}`
      );
    }

    // Trigger property data lookup
    fetchPropertyData(parsed);
  }, [onChange, onAddressParsed]);

  async function fetchPropertyData(parsed: ParsedAddress) {
    setIsLoadingData(true);
    try {
      const { data, error } = await supabase.functions.invoke("lookup-property-data", {
        body: {
          address: parsed.address,
          city: parsed.city,
          state: parsed.state,
          zip: parsed.zip,
        },
      });

      if (error) throw error;

      if (data.source === "not_found" || data.source === "error") {
        setDataNotFound(true);
        return;
      }

      const result: PropertyData = {
        yearBuilt: data.yearBuilt,
        sqft: data.sqft,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        propertyType: data.propertyType,
        estimatedValue: data.estimatedValue,
        lastSaleDate: data.lastSaleDate,
        lastSalePrice: data.lastSalePrice,
        lotSize: data.lotSize,
        stories: data.stories,
        garage: data.garage,
        pool: data.pool,
      };
      setPropertyData(result);
    } catch (err) {
      console.warn("Property data lookup failed:", err);
      setDataNotFound(true);
    } finally {
      setIsLoadingData(false);
    }
  }

  function handleAutoPopulate() {
    if (propertyData) {
      onPropertyDataFetched?.(propertyData);
    }
  }

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY || scriptLoaded.current) return;

    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );
    if (existingScript) {
      scriptLoaded.current = true;
      initAutocomplete();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => {
      scriptLoaded.current = true;
      initAutocomplete();
    };
    document.head.appendChild(script);
  }, []);

  function initAutocomplete() {
    if (!inputRef.current || !window.google?.maps?.places) return;

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "us" },
      fields: ["address_components", "formatted_address", "geometry", "place_id"],
    });

    autocompleteRef.current.addListener("place_changed", handlePlaceSelect);
  }

  useEffect(() => {
    if (scriptLoaded.current && inputRef.current && !autocompleteRef.current) {
      initAutocomplete();
    }
  }, [handlePlaceSelect]);

  const hasImages = satelliteUrl || streetViewUrl;
  const hasData = propertyData !== null;

  return (
    <div className="space-y-1.5">
      <Label htmlFor="address" className="font-mono text-[11px] uppercase tracking-[0.15em]">
        Property Address
      </Label>
      <Input
        ref={inputRef}
        id="address"
        placeholder="Start typing an address..."
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          // Reset preview if user clears the field
          if (!e.target.value) {
            setParsedAddress(null);
            setSatelliteUrl(null);
            setStreetViewUrl(null);
            setPropertyData(null);
            setDataNotFound(false);
          }
        }}
        className="font-mono text-xs"
      />
      {!GOOGLE_MAPS_API_KEY && (
        <p className="text-[10px] text-muted-foreground">
          Add <code className="font-mono">VITE_GOOGLE_MAPS_API_KEY</code> to .env to enable autocomplete and property images.
        </p>
      )}

      {/* Property preview card — appears after address is selected */}
      {parsedAddress && (hasImages || isLoadingData || hasData || dataNotFound) && (
        <div className="mt-3 rounded-lg border border-border overflow-hidden bg-card">

          {/* Images row */}
          {hasImages && (
            <div className="grid grid-cols-2 gap-0">
              {satelliteUrl && (
                <div className="relative">
                  <img
                    src={satelliteUrl}
                    alt="Satellite view"
                    className="w-full h-40 object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <span className="absolute bottom-1 left-1.5 text-[9px] font-mono uppercase tracking-wider text-white/80 bg-black/40 px-1.5 py-0.5 rounded">
                    Satellite
                  </span>
                </div>
              )}
              {streetViewUrl && (
                <div className="relative">
                  <img
                    src={streetViewUrl}
                    alt="Street view"
                    className="w-full h-40 object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <span className="absolute bottom-1 left-1.5 text-[9px] font-mono uppercase tracking-wider text-white/80 bg-black/40 px-1.5 py-0.5 rounded">
                    Street View
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Property data section */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  Property Data
                </p>
              </div>
              {isLoadingData && (
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Looking up...
                </div>
              )}
            </div>

            {isLoadingData && !hasData && (
              <div className="grid grid-cols-3 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-8 bg-muted/50 rounded animate-pulse" />
                ))}
              </div>
            )}

            {hasData && propertyData && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mb-3">
                  {propertyData.yearBuilt && (
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Year Built</p>
                      <p className="text-xs font-sans font-medium text-foreground">{propertyData.yearBuilt}</p>
                    </div>
                  )}
                  {propertyData.sqft && (
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Sq Ft</p>
                      <p className="text-xs font-sans font-medium text-foreground">{formatNumber(propertyData.sqft)}</p>
                    </div>
                  )}
                  {propertyData.bedrooms && (
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Beds / Baths</p>
                      <p className="text-xs font-sans font-medium text-foreground">{propertyData.bedrooms} bd / {propertyData.bathrooms ?? "—"} ba</p>
                    </div>
                  )}
                  {propertyData.estimatedValue && (
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Est. Value</p>
                      <p className="text-xs font-sans font-medium text-foreground">{formatCurrency(propertyData.estimatedValue)}</p>
                    </div>
                  )}
                  {propertyData.lastSalePrice && (
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Last Sale</p>
                      <p className="text-xs font-sans font-medium text-foreground">
                        {formatCurrency(propertyData.lastSalePrice)}
                        {propertyData.lastSaleDate && (
                          <span className="text-muted-foreground font-normal"> · {new Date(propertyData.lastSaleDate).getFullYear()}</span>
                        )}
                      </p>
                    </div>
                  )}
                  {propertyData.lotSize && (
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Lot Size</p>
                      <p className="text-xs font-sans font-medium text-foreground">{formatNumber(propertyData.lotSize)} sq ft</p>
                    </div>
                  )}
                </div>

                {/* Feature badges */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {propertyData.propertyType && (
                    <Badge variant="secondary" className="text-[10px] font-mono">{propertyData.propertyType}</Badge>
                  )}
                  {propertyData.stories && (
                    <Badge variant="secondary" className="text-[10px] font-mono">{propertyData.stories} {propertyData.stories === 1 ? "story" : "stories"}</Badge>
                  )}
                  {propertyData.garage && (
                    <Badge variant="secondary" className="text-[10px] font-mono">Garage</Badge>
                  )}
                  {propertyData.pool && (
                    <Badge variant="secondary" className="text-[10px] font-mono">Pool</Badge>
                  )}
                </div>

                <Button
                  size="sm"
                  onClick={handleAutoPopulate}
                  className="w-full font-mono text-[11px] gap-1.5 h-8"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Auto-populate form fields
                </Button>
              </>
            )}

            {dataNotFound && !isLoadingData && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <p className="text-[11px] font-sans">
                  No property data found for this address. Fill in the fields manually, or add a <code className="font-mono text-[10px]">RENTCAST_API_KEY</code> Supabase secret to enable lookups.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
