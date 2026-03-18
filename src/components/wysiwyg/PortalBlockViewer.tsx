// Client Portal Block Viewer — renders the same blocks_json using SharedBlockRenderer
import type { ReportBlock } from "./types";
import SharedBlockRenderer from "./SharedBlockRenderer";

interface PortalBlockViewerProps {
  blocks: ReportBlock[];
  propertyAddress?: string;
}

const PortalBlockViewer = ({ blocks, propertyAddress }: PortalBlockViewerProps) => {
  if (!blocks || blocks.length === 0) return null;

  const sorted = [...blocks].sort((a, b) => a.order - b.order);

  return (
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
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PortalBlockViewer;
