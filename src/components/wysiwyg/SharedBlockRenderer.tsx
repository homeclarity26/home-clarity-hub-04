// Shared Block Renderer — used in both WYSIWYG editor and client portal
import type { ReportBlock } from "./types";
import CoverBlock from "./blocks/CoverBlock";
import ScoreBlock from "./blocks/ScoreBlock";
import TextBlock from "./blocks/TextBlock";
import FindingCardBlock from "./blocks/FindingCardBlock";
import FindingGroupBlock from "./blocks/FindingGroupBlock";
import PhotoBlock from "./blocks/PhotoBlock";
import PhotoGalleryBlock from "./blocks/PhotoGalleryBlock";
import PriorityActionBlock from "./blocks/PriorityActionBlock";
import CostRangeBlock from "./blocks/CostRangeBlock";
import StatCardBlock from "./blocks/StatCardBlock";
import DividerBlock from "./blocks/DividerBlock";
import StrategicPlanBlock from "./blocks/StrategicPlanBlock";
import ChapterHeaderBlock from "./blocks/ChapterHeaderBlock";
import AINarrativeBlock from "./blocks/AINarrativeBlock";
import ConditionRatingBlock from "./blocks/ConditionRatingBlock";
import RoomRecordBlock from "./blocks/RoomRecordBlock";
import SystemRecordBlock from "./blocks/SystemRecordBlock";
import ReplacementBriefingBlock from "./blocks/ReplacementBriefingBlock";
import VisionProjectBlock from "./blocks/VisionProjectBlock";
import RecurringServicesRegisterBlock from "./blocks/RecurringServicesRegisterBlock";
import ConditionPillBlock from "./blocks/ConditionPillBlock";
import ConciergeActionBlock from "./blocks/ConciergeActionBlock";
import MaintenanceCalendarBlock from "./blocks/MaintenanceCalendarBlock";
import TodaysBriefBlock from "./blocks/TodaysBriefBlock";
import { HoverEmbedBlock, IGuideEmbedBlock, FloorPlanEmbedBlock } from "./blocks/EmbedBlocks";

interface SharedBlockRendererProps {
  block: ReportBlock;
  editable?: boolean;
  onChange?: (content: Record<string, unknown>) => void;
  reportId?: string;
  propertyAddress?: string;
  sectionType?: string;
  propertyId?: string;
  currentRating?: string;
  onInsertFinding?: (finding: { name: string; rating: string; notes: string }) => void;
  onInsertFindings?: (findings: Array<{ name: string; rating: string; notes: string }>) => void;
  onApplyNarrative?: (narrative: string) => void;
  onApplyRating?: (rating: string) => void;
  /** Set of photo URLs that have analysis records (for portal "Inspected" badges) */
  analyzedPhotoUrls?: Set<string>;
  onPhotoClick?: (photoUrl: string) => void;
}

const SharedBlockRenderer = ({
  block, editable, onChange, reportId, propertyAddress,
  sectionType, propertyId, currentRating,
  onInsertFinding, onInsertFindings, onApplyNarrative, onApplyRating,
  analyzedPhotoUrls, onPhotoClick,
}: SharedBlockRendererProps) => {
  const c = block.content as Record<string, unknown>;
  const handleChange = (updated: Record<string, unknown>) => onChange?.(updated);

  switch (block.type) {
    case "cover":
      return <CoverBlock content={c as any} editable={editable} onChange={handleChange as any} />;
    case "score":
      return <ScoreBlock content={c as any} editable={editable} onChange={handleChange as any} />;
    case "text":
      return <TextBlock content={c as any} editable={editable} onChange={handleChange as any} />;
    case "finding_card":
      return <FindingCardBlock content={c as any} editable={editable} onChange={handleChange as any} />;
    case "finding_group":
      return <FindingGroupBlock content={c as any} editable={editable} onChange={handleChange as any} />;
    case "photo":
      return (
        <PhotoBlock
          content={c as any}
          editable={editable}
          onChange={handleChange as any}
          reportId={reportId}
          hasAnalysis={analyzedPhotoUrls?.has((c as any).url)}
        />
      );
    case "photo_gallery":
      return (
        <PhotoGalleryBlock
          content={c as any}
          editable={editable}
          onChange={handleChange as any}
          reportId={reportId}
          sectionType={sectionType}
          propertyId={propertyId}
          currentRating={currentRating}
          onInsertFinding={onInsertFinding}
          onInsertFindings={onInsertFindings}
          onApplyNarrative={onApplyNarrative}
          onApplyRating={onApplyRating}
        />
      );
    case "priority_action":
      return <PriorityActionBlock content={c as any} editable={editable} onChange={handleChange as any} />;
    case "cost_range":
      return <CostRangeBlock content={c as any} editable={editable} onChange={handleChange as any} />;
    case "stat_card":
      return <StatCardBlock content={c as any} editable={editable} onChange={handleChange as any} />;
    case "divider":
      return <DividerBlock />;
    case "strategic_plan":
      return <StrategicPlanBlock content={c as any} editable={editable} onChange={handleChange as any} />;
    case "chapter_header":
      return <ChapterHeaderBlock content={c as any} editable={editable} onChange={handleChange as any} />;
    case "ai_narrative":
      return <AINarrativeBlock content={c as any} editable={editable} onChange={handleChange as any} propertyAddress={propertyAddress} pageSlug={c.pageSlug as string} />;
    case "condition_rating":
      return <ConditionRatingBlock content={c as any} editable={editable} onChange={handleChange as any} />;
    case "room_record":
      return <RoomRecordBlock content={c as any} editable={editable} onChange={handleChange as any} />;
    case "system_record":
      return <SystemRecordBlock content={c as any} editable={editable} onChange={handleChange as any} />;
    case "replacement_briefing":
      return <ReplacementBriefingBlock content={c as any} editable={editable} onChange={handleChange as any} />;
    case "vision_project":
      return <VisionProjectBlock content={c as any} editable={editable} onChange={handleChange as any} />;
    case "recurring_services_register":
      return <RecurringServicesRegisterBlock content={c as any} editable={editable} onChange={handleChange as any} />;
    case "condition_pill":
      return <ConditionPillBlock content={c as any} editable={editable} onChange={handleChange as any} />;
    case "concierge_action":
      return <ConciergeActionBlock content={c as any} editable={editable} onChange={handleChange as any} />;
    case "maintenance_calendar":
      return <MaintenanceCalendarBlock content={c as any} editable={editable} onChange={handleChange as any} />;
    case "todays_brief":
      return <TodaysBriefBlock content={c as any} editable={editable} onChange={handleChange as any} />;
    case "hover_embed":
      return <HoverEmbedBlock content={c as any} editable={editable} onChange={handleChange as any} />;
    case "iguide_embed":
      return <IGuideEmbedBlock content={c as any} editable={editable} onChange={handleChange as any} />;
    case "floor_plan_embed":
      return <FloorPlanEmbedBlock content={c as any} editable={editable} onChange={handleChange as any} />;
    default:
      return <div className="bg-muted rounded p-4 text-xs text-muted-foreground">Unknown block: {block.type}</div>;
  }
};

export default SharedBlockRenderer;
