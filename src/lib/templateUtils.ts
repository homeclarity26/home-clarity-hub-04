// Template utilities for status auto-detection and block configuration

export interface BlockConfig {
  page_header?: { active: boolean; required: boolean };
  narrative?: { active: boolean; required: boolean };
  key_observations?: { active: boolean; required: boolean };
  health_bar?: { active: boolean; required: boolean; default_label?: string };
  specs?: { active: boolean; required: boolean };
  tiers?: { active: boolean; required: boolean };
  timing?: { active: boolean; required: boolean };
  dependencies?: { active: boolean; required: boolean };
  risks?: { active: boolean; required: boolean };
  photos?: { active: boolean; required: boolean };
  maintenance?: { active: boolean; required: boolean };
  creator_notes?: { active: boolean; required: boolean };
  client_comments?: { active: boolean; required: boolean };
}

export interface PageContent {
  title?: string;
  conditionRating?: string;
  narrative?: string[];
  key_observations?: string[];
  health_bar?: { label: string; current: number; total: number; unit: string };
  specs?: { label: string; value: string }[];
  tiers?: {
    essential?: { price: string; description: string };
    enhanced?: { price: string; description: string };
    signature?: { price: string; description: string };
  };
  timing?: string;
  dependencies?: { pageKey: string; title: string; type: "before" | "after" }[];
  risks?: string[];
  images?: string[];
  maintenance?: { frequency?: string; tasks: string[] };
  creator_notes?: string;
}

// Check if a value is a placeholder (starts with [ or contains placeholder text)
const isPlaceholder = (value: unknown): boolean => {
  if (!value) return true;
  if (typeof value === "string") {
    return value.startsWith("[") || 
           value.includes("[Pending") || 
           value.includes("pending") ||
           value.includes("$X-") ||
           value.trim() === "";
  }
  if (Array.isArray(value)) {
    return value.length === 0 || value.every((v) => isPlaceholder(v));
  }
  return false;
};

// Check if a block has real content (not placeholder)
const blockHasContent = (blockName: keyof BlockConfig, content: PageContent): boolean => {
  switch (blockName) {
    case "page_header":
      return !!content.title && !isPlaceholder(content.title);
    case "narrative":
      return !!content.narrative && content.narrative.length > 0 && !isPlaceholder(content.narrative);
    case "key_observations":
      return !!content.key_observations && content.key_observations.length > 0 && !isPlaceholder(content.key_observations);
    case "health_bar":
      return !!content.health_bar && content.health_bar.current > 0;
    case "specs":
      return !!content.specs && content.specs.length > 0 && content.specs.some((s) => !isPlaceholder(s.value));
    case "tiers":
      return !!content.tiers && (
        (content.tiers.essential && !isPlaceholder(content.tiers.essential.price)) ||
        (content.tiers.enhanced && !isPlaceholder(content.tiers.enhanced.price)) ||
        (content.tiers.signature && !isPlaceholder(content.tiers.signature.price))
      );
    case "timing":
      return !!content.timing && !isPlaceholder(content.timing);
    case "dependencies":
      return !!content.dependencies && content.dependencies.length > 0;
    case "risks":
      return !!content.risks && content.risks.length > 0 && !isPlaceholder(content.risks);
    case "photos":
      return !!content.images && content.images.length > 0;
    case "maintenance":
      return !!content.maintenance && content.maintenance.tasks.length > 0 && !isPlaceholder(content.maintenance.tasks);
    case "creator_notes":
      return !!content.creator_notes && content.creator_notes.trim() !== "";
    case "client_comments":
      return true; // Always considered "complete" as it's client-driven
    default:
      return false;
  }
};

export type PageStatus = "complete" | "draft" | "needs_review" | "inactive";

/**
 * Compute the status of a report page based on its block configuration and content
 */
export function computePageStatus(
  blockConfig: BlockConfig | null,
  content: PageContent,
  isActive: boolean = true,
  flaggedForReview: boolean = false
): PageStatus {
  if (!isActive) return "inactive";
  if (flaggedForReview) return "needs_review";

  if (!blockConfig) return "draft";

  const requiredBlocks = Object.entries(blockConfig)
    .filter(([_, config]) => config.active && config.required)
    .map(([name]) => name as keyof BlockConfig);

  const activeBlocks = Object.entries(blockConfig)
    .filter(([_, config]) => config.active)
    .map(([name]) => name as keyof BlockConfig);

  // Check if all required blocks have content
  const allRequiredComplete = requiredBlocks.every((block) => blockHasContent(block, content));

  if (!allRequiredComplete) return "draft";

  // Check if at least some active blocks have content
  const someActiveComplete = activeBlocks.some((block) => blockHasContent(block, content));

  return someActiveComplete ? "complete" : "draft";
}

/**
 * Get the default block configuration for a template type
 */
export function getDefaultBlockConfig(templateType: "interior" | "exterior" | "systems" | "information" | "strategy"): BlockConfig {
  const baseConfig: BlockConfig = {
    page_header: { active: true, required: true },
    narrative: { active: true, required: true },
    key_observations: { active: true, required: false },
    health_bar: { active: false, required: false },
    specs: { active: false, required: false },
    tiers: { active: true, required: false },
    timing: { active: true, required: false },
    dependencies: { active: false, required: false },
    risks: { active: false, required: false },
    photos: { active: true, required: false },
    maintenance: { active: false, required: false },
    creator_notes: { active: true, required: false },
    client_comments: { active: true, required: true },
  };

  switch (templateType) {
    case "systems":
      return {
        ...baseConfig,
        health_bar: { active: true, required: true },
        specs: { active: true, required: true },
        maintenance: { active: true, required: true },
        risks: { active: true, required: false },
      };
    case "exterior":
      return {
        ...baseConfig,
        health_bar: { active: true, required: false },
        maintenance: { active: true, required: false },
      };
    case "interior":
      return {
        ...baseConfig,
        tiers: { active: true, required: true },
      };
    case "information":
      return {
        ...baseConfig,
        key_observations: { active: false, required: false },
        tiers: { active: false, required: false },
        timing: { active: false, required: false },
        photos: { active: false, required: false },
      };
    case "strategy":
      return {
        ...baseConfig,
        key_observations: { active: false, required: false },
        health_bar: { active: false, required: false },
        specs: { active: false, required: false },
        photos: { active: false, required: false },
      };
    default:
      return baseConfig;
  }
}

/**
 * Merge template defaults with page-specific overrides
 */
export function mergeBlockConfig(templateConfig: BlockConfig | null, pageConfig: BlockConfig | null): BlockConfig {
  if (!templateConfig) return pageConfig || getDefaultBlockConfig("interior");
  if (!pageConfig) return templateConfig;
  
  return {
    ...templateConfig,
    ...pageConfig,
  };
}
