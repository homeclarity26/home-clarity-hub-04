import { useState, useCallback, useRef, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical, Copy, Trash2, ChevronUp, ChevronDown,
  Plus, Sparkles, Columns, Save, Loader2, CheckCircle2,
} from "lucide-react";
import type { ReportBlock, BlockType, ColSpan } from "./types";
import { createBlock, BLOCK_TEMPLATES } from "./types";
import SharedBlockRenderer from "./SharedBlockRenderer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── TOC Sidebar ────────────────────────────────────────────────

interface TOCProps {
  blocks: ReportBlock[];
  onScrollTo: (id: string) => void;
}

const TOCSidebar = ({ blocks, onScrollTo }: TOCProps) => {
  const chapters = blocks.filter((b) => b.type === "chapter_header" || b.type === "cover");

  return (
    <div className="w-56 shrink-0 hidden lg:block sticky top-4 self-start">
      <div className="bg-card border border-border rounded-lg p-4 space-y-1">
        <h4 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3">
          Table of Contents
        </h4>
        {chapters.map((ch) => (
          <button
            key={ch.id}
            onClick={() => onScrollTo(ch.id)}
            className="w-full text-left text-sm text-foreground hover:text-accent truncate py-1 px-2 rounded hover:bg-muted transition-colors"
          >
            {(ch.content as Record<string, unknown>).title as string ||
             (ch.content as Record<string, unknown>).propertyName as string ||
             ch.type}
          </button>
        ))}
        {chapters.length === 0 && (
          <p className="text-xs text-muted-foreground italic">Add a Cover or Chapter Header block</p>
        )}
      </div>
    </div>
  );
};

// ─── Block Picker ───────────────────────────────────────────────

interface BlockPickerProps {
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

const BlockPicker = ({ onSelect, onClose }: BlockPickerProps) => (
  <div className="bg-card border border-accent/30 rounded-lg shadow-lg p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Add Block</span>
      <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {BLOCK_TEMPLATES.map((tpl) => (
        <button
          key={tpl.type}
          onClick={() => { onSelect(tpl.type); onClose(); }}
          className="text-left border border-border rounded-md p-3 hover:border-accent hover:bg-accent/5 transition-colors group"
        >
          <div className="font-display text-xs font-semibold text-foreground group-hover:text-accent">{tpl.label}</div>
          <div className="text-[10px] text-muted-foreground mt-1 leading-tight">{tpl.description}</div>
        </button>
      ))}
    </div>
  </div>
);

// ─── Sortable Block Wrapper ─────────────────────────────────────

interface SortableBlockProps {
  block: ReportBlock;
  editable: boolean;
  onContentChange: (id: string, content: Record<string, unknown>) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onColSpanChange: (id: string, span: ColSpan) => void;
  onInsertAfter: (id: string) => void;
  reportId?: string;
  propertyAddress?: string;
  isFirst: boolean;
  isLast: boolean;
}

const COL_OPTIONS: ColSpan[] = [3, 4, 6, 12];

const SortableBlock = ({
  block, editable, onContentChange, onDuplicate, onDelete,
  onMoveUp, onMoveDown, onColSpanChange, onInsertAfter,
  reportId, propertyAddress, isFirst, isLast,
}: SortableBlockProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const spanClass =
    block.colSpan === 3 ? "col-span-3" :
    block.colSpan === 4 ? "col-span-4" :
    block.colSpan === 6 ? "col-span-6" :
    "col-span-12";

  return (
    <div
      ref={setNodeRef}
      style={style}
      id={`block-${block.id}`}
      className={`${spanClass} group relative`}
    >
      {/* Block Controls */}
      {editable && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1 bg-card border border-border rounded-full shadow-md px-2 py-1">
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-0.5">
              <GripVertical className="h-3.5 w-3.5" />
            </button>
            <div className="h-3 w-px bg-border mx-0.5" />
            {COL_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => onColSpanChange(block.id, s)}
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${block.colSpan === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {s}
              </button>
            ))}
            <div className="h-3 w-px bg-border mx-0.5" />
            <button onClick={() => onMoveUp(block.id)} disabled={isFirst} className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5">
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onMoveDown(block.id)} disabled={isLast} className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5">
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onDuplicate(block.id)} className="text-muted-foreground hover:text-foreground p-0.5">
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onDelete(block.id)} className="text-muted-foreground hover:text-destructive p-0.5">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className={`${editable ? "ring-1 ring-transparent group-hover:ring-accent/30 rounded-lg transition-all" : ""}`}>
        <SharedBlockRenderer
          block={block}
          editable={editable}
          onChange={(content) => onContentChange(block.id, content)}
          reportId={reportId}
          propertyAddress={propertyAddress}
        />
      </div>

      {/* Insert Button */}
      {editable && (
        <div className="flex justify-center -mb-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onInsertAfter(block.id)}
            className="bg-accent text-primary-foreground rounded-full p-1 shadow-sm hover:bg-accent/90"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main Editor ────────────────────────────────────────────────

interface WYSIWYGReportEditorProps {
  reportId: string;
  propertyAddress?: string;
  initialBlocks?: ReportBlock[];
  propertyId?: string;
}

const WYSIWYGReportEditor = ({ reportId, propertyAddress, initialBlocks, propertyId }: WYSIWYGReportEditorProps) => {
  const [blocks, setBlocks] = useState<ReportBlock[]>(initialBlocks || []);
  const [pickerAfter, setPickerAfter] = useState<string | null>(null); // block id or "top"
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showAutoSaved, setShowAutoSaved] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAutoSaveRef = useRef<number>(Date.now());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Auto-save debounced
  const scheduleSave = useCallback((newBlocks: ReportBlock[]) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveBlocks(newBlocks);
    }, 2000);
  }, [reportId]);

  const saveBlocks = async (blocksToSave: ReportBlock[]) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("reports")
        .update({ blocks_json: JSON.parse(JSON.stringify(blocksToSave)) })
        .eq("id", reportId);
      if (error) throw error;
      setLastSaved(new Date());
      setShowAutoSaved(true);
      setTimeout(() => setShowAutoSaved(false), 3000);

      // Auto-snapshot every 5 minutes
      const now = Date.now();
      if (now - lastAutoSaveRef.current > 5 * 60 * 1000) {
        lastAutoSaveRef.current = now;
        try {
          const { data: lastVer } = await (supabase.from('report_versions') as any)
            .select('version_number').eq('client_id', propertyId).order('version_number', { ascending: false }).limit(1).maybeSingle();
          const nextVersion = (lastVer?.version_number || 0) + 1;
          // report_versions schema is (client_id, version_number, report_snapshot_json,
          // saved_at, saved_by_admin_id, change_notes, is_published). It does not
          // have `report_id` or `saved_by`. saved_by_admin_id is NOT NULL — use the
          // current user's id.
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser?.id) {
            await (supabase.from('report_versions') as any).insert({
              client_id: propertyId,
              version_number: nextVersion,
              report_snapshot_json: blocksToSave,
              saved_by_admin_id: currentUser.id,
              change_notes: 'auto-save',
            });
          }
        } catch (e) {
          console.warn('Auto-snapshot failed silently:', e);
        }
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const updateBlocks = (newBlocks: ReportBlock[]) => {
    setBlocks(newBlocks);
    scheduleSave(newBlocks);
  };

  // ─── Block operations ──────────────────────────────────────

  const handleContentChange = (id: string, content: Record<string, unknown>) => {
    updateBlocks(blocks.map((b) => b.id === id ? { ...b, content, updatedAt: new Date().toISOString() } : b));
  };

  const handleDuplicate = (id: string) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const dup = createBlock(blocks[idx].type, idx + 1, { content: { ...blocks[idx].content }, colSpan: blocks[idx].colSpan });
    const newBlocks = [...blocks];
    newBlocks.splice(idx + 1, 0, dup);
    updateBlocks(reorder(newBlocks));
  };

  const handleDelete = (id: string) => {
    updateBlocks(reorder(blocks.filter((b) => b.id !== id)));
  };

  const handleMoveUp = (id: string) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx <= 0) return;
    const newBlocks = [...blocks];
    [newBlocks[idx - 1], newBlocks[idx]] = [newBlocks[idx], newBlocks[idx - 1]];
    updateBlocks(reorder(newBlocks));
  };

  const handleMoveDown = (id: string) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx < 0 || idx >= blocks.length - 1) return;
    const newBlocks = [...blocks];
    [newBlocks[idx], newBlocks[idx + 1]] = [newBlocks[idx + 1], newBlocks[idx]];
    updateBlocks(reorder(newBlocks));
  };

  const handleColSpanChange = (id: string, span: ColSpan) => {
    updateBlocks(blocks.map((b) => b.id === id ? { ...b, colSpan: span } : b));
  };

  const handleInsertAfter = (id: string) => {
    setPickerAfter(id);
  };

  const handleAddBlock = (type: BlockType) => {
    const idx = pickerAfter === "top" ? 0 : blocks.findIndex((b) => b.id === pickerAfter) + 1;
    const newBlock = createBlock(type, idx);
    const newBlocks = [...blocks];
    newBlocks.splice(idx, 0, newBlock);
    updateBlocks(reorder(newBlocks));
    setPickerAfter(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = blocks.findIndex((b) => b.id === active.id);
    const newIdx = blocks.findIndex((b) => b.id === over.id);
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(oldIdx, 1);
    newBlocks.splice(newIdx, 0, moved);
    updateBlocks(reorder(newBlocks));
  };

  const handleScrollTo = (id: string) => {
    document.getElementById(`block-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleManualSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveBlocks(blocks);
  };

  return (
    <div className="flex gap-6 max-w-[1200px] mx-auto px-4">
      <TOCSidebar blocks={blocks} onScrollTo={handleScrollTo} />

      <div className="flex-1 space-y-2 pb-20">
        {/* Top bar */}
        <div className="flex items-center justify-between sticky top-0 z-30 bg-background/80 backdrop-blur-sm py-3 border-b border-border mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPickerAfter("top")}
              className="flex items-center gap-1 bg-primary text-primary-foreground rounded px-3 py-1.5 text-xs font-medium hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" /> Add Block
            </button>
            <span className="font-mono text-[10px] text-muted-foreground">
              {blocks.length} block{blocks.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {showAutoSaved && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-green-600 transition-opacity">
                <CheckCircle2 className="h-3 w-3" />
                Saved
              </span>
            )}
            {lastSaved && !showAutoSaved && (
              <span className="text-[10px] font-mono text-muted-foreground">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleManualSave}
              disabled={isSaving}
              className="flex items-center gap-1 bg-accent text-accent-foreground rounded px-3 py-1.5 text-xs font-medium hover:bg-accent/90 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </button>
          </div>
        </div>

        {/* Block Picker at top */}
        {pickerAfter === "top" && (
          <BlockPicker onSelect={handleAddBlock} onClose={() => setPickerAfter(null)} />
        )}

        {/* Blocks Grid */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-12 gap-4">
              {blocks.map((block, idx) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  editable={true}
                  onContentChange={handleContentChange}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  onColSpanChange={handleColSpanChange}
                  onInsertAfter={handleInsertAfter}
                  reportId={reportId}
                  propertyAddress={propertyAddress}
                  isFirst={idx === 0}
                  isLast={idx === blocks.length - 1}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Inline Block Picker */}
        {pickerAfter && pickerAfter !== "top" && (
          <div className="mt-2">
            <BlockPicker onSelect={handleAddBlock} onClose={() => setPickerAfter(null)} />
          </div>
        )}

        {/* Empty State */}
        {blocks.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div className="text-muted-foreground font-display text-xl">Start building your report</div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Click "Add Block" to begin. Add a Cover, Chapter Headers, Text blocks, Findings, Photos, and more.
            </p>
            <button
              onClick={() => setPickerAfter("top")}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded px-4 py-2 text-sm font-medium hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Add First Block
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

function reorder(blocks: ReportBlock[]): ReportBlock[] {
  return blocks.map((b, i) => ({ ...b, order: i }));
}

export default WYSIWYGReportEditor;
