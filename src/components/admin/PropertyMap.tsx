import { useState, useEffect, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface PropertyMarker {
  id: string;
  address: string;
  propertyName: string | null;
  lat: number;
  lng: number;
  estimatedValue: number | null;
  clientName: string | null;
  propertyType: string | null;
}

// Custom marker icon using accent color
const createCustomIcon = (color: string = "#b49a6a") =>
  L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 28px; height: 28px; border-radius: 50% 50% 50% 0;
      background: ${color}; transform: rotate(-45deg);
      border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
    "><div style="
      width: 8px; height: 8px; border-radius: 50%;
      background: white; transform: rotate(45deg);
    "></div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });

const CONDITION_COLORS: Record<string, string> = {
  excellent: "#22c55e",
  good: "#4a7c59",
  fair: "#b49a6a",
  poor: "#e88c30",
  critical: "#dc2626",
};

// Auto-fit map bounds to markers
function FitBounds({ markers }: { markers: PropertyMarker[] }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length === 0) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }, [markers, map]);
  return null;
}

// Geocode an address using Nominatim (free, no API key)
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      { headers: { "User-Agent": "HomeClarityHub/1.0" } }
    );
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (e) {
    console.error("Geocoding failed for:", address, e);
  }
  return null;
}

interface PropertyMapProps {
  compact?: boolean;
}

const PropertyMap = ({ compact = false }: PropertyMapProps) => {
  const navigate = useNavigate();
  const [markers, setMarkers] = useState<PropertyMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);

  const loadProperties = useCallback(async () => {
    setLoading(true);
    const { data: properties, error } = await supabase
      .from("properties")
      .select("id, address, property_name, estimated_value, property_type, latitude, longitude, client_user_id");

    if (error) {
      toast.error("Failed to load properties");
      setLoading(false);
      return;
    }

    if (!properties || properties.length === 0) {
      setLoading(false);
      return;
    }

    // Get profile names for clients
    const clientIds = [...new Set(properties.map((p) => p.client_user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", clientIds);

    const nameMap: Record<string, string> = {};
    (profiles || []).forEach((p) => {
      if (p.user_id && p.full_name) nameMap[p.user_id] = p.full_name;
    });

    // Split into geocoded and un-geocoded
    const withCoords: PropertyMarker[] = [];
    const needsGeocode: typeof properties = [];

    properties.forEach((p) => {
      const lat = (p as any).latitude as number | null;
      const lng = (p as any).longitude as number | null;
      if (lat && lng) {
        withCoords.push({
          id: p.id,
          address: p.address,
          propertyName: p.property_name,
          lat,
          lng,
          estimatedValue: p.estimated_value,
          clientName: nameMap[p.client_user_id] || null,
          propertyType: p.property_type,
        });
      } else {
        needsGeocode.push(p);
      }
    });

    setMarkers(withCoords);
    setLoading(false);

    // Geocode missing addresses in background
    if (needsGeocode.length > 0) {
      setGeocoding(true);
      const newMarkers: PropertyMarker[] = [...withCoords];

      for (const p of needsGeocode) {
        const coords = await geocodeAddress(p.address);
        if (coords) {
          // Save to DB for caching
          await supabase
            .from("properties")
            .update({ latitude: coords.lat, longitude: coords.lng } as any)
            .eq("id", p.id);

          newMarkers.push({
            id: p.id,
            address: p.address,
            propertyName: p.property_name,
            lat: coords.lat,
            lng: coords.lng,
            estimatedValue: p.estimated_value,
            clientName: nameMap[p.client_user_id] || null,
            propertyType: p.property_type,
          });
          setMarkers([...newMarkers]);
        }
        // Rate limit: Nominatim requires 1 req/sec
        await new Promise((r) => setTimeout(r, 1100));
      }
      setGeocoding(false);
    }
  }, []);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const defaultIcon = useMemo(() => createCustomIcon(), []);

  const height = compact ? "h-[320px]" : "h-[500px]";

  if (loading) {
    return (
      <Card className={`${height} flex items-center justify-center`}>
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  if (markers.length === 0) {
    return (
      <Card className={`${height} flex flex-col items-center justify-center gap-3 p-6`}>
        <MapPin className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-sm font-sans text-muted-foreground text-center">
          No properties to display yet. Add clients to see them on the map.
        </p>
      </Card>
    );
  }

  // Default center: average of all markers
  const center: [number, number] = [
    markers.reduce((s, m) => s + m.lat, 0) / markers.length,
    markers.reduce((s, m) => s + m.lng, 0) / markers.length,
  ];

  return (
    <Card className="overflow-hidden relative">
      {geocoding && (
        <div className="absolute top-3 right-3 z-[1000] bg-card/90 backdrop-blur-sm rounded-md px-3 py-1.5 flex items-center gap-2 border border-border shadow-sm">
          <Loader2 className="w-3 h-3 animate-spin text-accent" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Geocoding…</span>
        </div>
      )}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-sans font-semibold text-foreground">Property Map</h3>
          <Badge variant="secondary" className="text-[10px] h-5">{markers.length} properties</Badge>
        </div>
        <Button variant="ghost" size="sm" className="text-xs gap-1.5" onClick={loadProperties}>
          <RefreshCw className="w-3 h-3" />Refresh
        </Button>
      </div>
      <div className={height}>
        <MapContainer
          center={center}
          zoom={10}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds markers={markers} />
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={defaultIcon}
            >
              <Popup>
                <div className="min-w-[200px] font-sans">
                  <p className="font-semibold text-sm text-foreground mb-0.5">
                    {marker.propertyName || "Unnamed Property"}
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">{marker.address}</p>
                  {marker.clientName && (
                    <p className="text-xs text-muted-foreground mb-1">
                      <span className="font-medium">Client:</span> {marker.clientName}
                    </p>
                  )}
                  {marker.propertyType && (
                    <p className="text-xs text-muted-foreground mb-1">
                      <span className="font-medium">Type:</span> {marker.propertyType.replace(/_/g, " ")}
                    </p>
                  )}
                  {marker.estimatedValue && (
                    <p className="text-xs text-muted-foreground mb-2">
                      <span className="font-medium">Value:</span> ${marker.estimatedValue.toLocaleString()}
                    </p>
                  )}
                  <button
                    onClick={() => navigate(`/admin/clients/${marker.id}`)}
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:underline bg-transparent border-none cursor-pointer p-0"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </Card>
  );
};

export default PropertyMap;
