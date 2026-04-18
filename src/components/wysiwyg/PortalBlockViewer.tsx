// Client Portal Block Viewer — renders the same blocks_json using SharedBlockRenderer
import { useState, useEffect } from "react";
import type { ReportBlock } from "./types";
import SharedBlockRenderer from "./SharedBlockRenderer";
import PhotoInspectionSidebar from "@/components/portal/PhotoInspectionSidebar";
import { supabase } from "@/integrations/supabase/client";

interface PortalBlockViewerProps {
  blocks: ReportBlock[];
  propertyAddress?: string;
  propertyId?: string;
}

const PortalBlockViewer = ({ blocks, propertyAddress, propertyId }: PortalBlockViewerProps) => {
  const [analyzedUrls, setAnalyzedUrls] = useState<Set<string>>(new Set());
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  // Load all analyzed photo URLs for this property
  useEffect(() => {
    if (!propertyId) return;
    supabase
      .from("photo_analyses")
      .select("photo_url")
      .eq("property_id", propertyId)
      .then(({ data }) => {
        if (data) {
          setAnalyzedUrls(new Set((data as any[]).map((d) => d.photo_url)));
        }
      });
  }, [propertyId]);

  if (!blocks || blocks.length === 0) return null;

  const sorted = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <>
      <div className="max-w-[900px] mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-12 gap-4">
          {sorted.map((block) => {
            const spanClass =
              block.colSpan === 3 ? "col-span-12 sm:col-span-3" :
              block.colSpan === 4 ? "col-span-12 sm:col-span-4" :
              block.colSpan === 6 ? "col-span-12 sm:col-span-6" :
              "col-span-12";

            return (
              <div key={block.id} className={spanClass}>
                <SharedBlockRenderer
                  block={block}
                  editable={false}
                  propertyAddress={propertyAddress}
                  analyzedPhotoUrls={analyzedUrls}
                  onPhotoClick={(url) => setSelectedPhotoUrl(url)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <PhotoInspectionSidebar
        photoUrl={selectedPhotoUrl}
        onClose={() => setSelectedPhotoUrl(null)}
      />
    </>
  );
};

export default PortalBlockViewer;
