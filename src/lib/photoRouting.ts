// Phase 4 — photo → page assignment suggestions (pure heuristics).
//
// Suggests which report page an intake photo belongs on from filename
// tokens plus any AI category string already captured in wizard state
// (categorize-photo output). No network calls, no React, no Supabase:
// the Step 3 picker's "Suggest assignments" button and (later) any batch
// auto-assign flow both run through this one function so the heuristics
// stay testable and identical everywhere.
//
// A suggestion is conservative: when nothing matches, the photo stays
// unassigned (page_key: null) rather than guessing. For photos matched to
// a system/appliance page, a slot is suggested per prototype screens
// 10-11 (Unit Photo / Serial Plate / Install Location).

export interface RoutablePhoto {
  /** Identity passed through untouched (public URL, storage path, or id). */
  url: string;
  filename: string;
  /** Optional categorize-photo output, e.g. "HVAC / Furnace". */
  aiCategory?: string;
}

export interface RoutablePage {
  page_key: string;
  title: string;
  group?: string;
}

export type SuggestedPhotoSlot = "unit" | "serialPlate" | "installLocation";

export interface PhotoAssignmentSuggestion {
  url: string;
  filename: string;
  /** Best-match page, or null when no page matched (leave unassigned). */
  page_key: string | null;
  /** Only set for system/appliance page matches. */
  slot?: SuggestedPhotoSlot;
  /** Tokens the match was based on (debug/UX affordance). */
  matchedTokens: string[];
}

// Tokens that describe the photo, not the subject. Never match on these.
const STOPWORDS = new Set([
  "img",
  "image",
  "images",
  "photo",
  "photos",
  "pic",
  "pics",
  "picture",
  "jpg",
  "jpeg",
  "png",
  "heic",
  "webp",
  "copy",
  "final",
  "edit",
  "new",
  "the",
  "and",
  "of",
  "for",
  "with",
]);

// Small synonym bridge between how photos get named / AI-categorized and
// how pages are keyed. Expansion is one-directional (photo token → page
// tokens) and deliberately narrow.
const SYNONYMS: Record<string, string[]> = {
  hvac: ["furnace", "ac", "condenser"],
  fridge: ["refrigerator"],
  bath: ["bathroom"],
  bathroom: ["bath"],
  laundry: ["utility"],
  wh: ["water", "heater"],
};

function tokenize(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .toLowerCase()
    // Strip a trailing file extension before splitting.
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .split(/[^a-z0-9]+/)
    .filter(
      (t) => t.length >= 2 && !/^\d+$/.test(t) && !STOPWORDS.has(t),
    );
}

// Direct tokens (from the filename / AI category itself) outweigh synonym
// expansions so "HVAC / Furnace" lands on the furnace page even though the
// hvac synonym set also mentions the AC condenser.
const DIRECT_WEIGHT = 3;
const SYNONYM_WEIGHT = 1;

function expandWithWeights(tokens: string[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const t of tokens) out.set(t, DIRECT_WEIGHT);
  for (const t of tokens) {
    for (const syn of SYNONYMS[t] ?? []) {
      if (!out.has(syn)) out.set(syn, SYNONYM_WEIGHT);
    }
  }
  return out;
}

// System-ish pages get slot suggestions; rooms and vision pages never do.
function isSystemLikePage(page: RoutablePage): boolean {
  const g = (page.group ?? "").toLowerCase();
  return (
    g.startsWith("system") ||
    g.startsWith("appliance") ||
    g.startsWith("safety")
  );
}

// Slot inference from the raw filename + AI category. Serial-plate and
// install-location keywords are checked first; a system photo with neither
// reads as the overall unit shot (prototype: furnace_main_2026-04-22.jpg
// fills the Unit Photo slot).
const SERIAL_RE = /serial|nameplate|dataplate|model[\s_-]?plate/;
const INSTALL_RE =
  /install|location|clearance|closet|utility[\s_-]?room|mechanical[\s_-]?room/;

function inferSlot(photo: RoutablePhoto): SuggestedPhotoSlot {
  const haystack = `${photo.filename} ${photo.aiCategory ?? ""}`.toLowerCase();
  if (SERIAL_RE.test(haystack)) return "serialPlate";
  if (INSTALL_RE.test(haystack)) return "installLocation";
  return "unit";
}

export function suggestPhotoAssignments(
  photos: RoutablePhoto[],
  pages: RoutablePage[],
): PhotoAssignmentSuggestion[] {
  const pageTokens = pages.map((page) => ({
    page,
    tokens: new Set([
      ...tokenize(page.page_key),
      ...tokenize(page.title),
      ...tokenize(page.group),
    ]),
  }));

  return photos.map((photo) => {
    const photoTokens = expandWithWeights([
      ...tokenize(photo.filename),
      ...tokenize(photo.aiCategory),
    ]);

    let best: {
      page: RoutablePage;
      matched: string[];
      score: number;
      coverage: number;
    } | null = null;

    for (const { page, tokens } of pageTokens) {
      if (tokens.size === 0) continue;
      const matched: string[] = [];
      let score = 0;
      for (const t of tokens) {
        const weight = photoTokens.get(t);
        if (weight !== undefined) {
          matched.push(t);
          score += weight;
        }
      }
      if (matched.length === 0) continue;
      // Coverage = how much of the PAGE the photo tokens explain. Breaks
      // ties toward the more specific page ("kitchen" beats
      // "outdoor-kitchen" for kitchen_overview.jpg).
      const coverage = matched.length / tokens.size;
      if (
        !best ||
        score > best.score ||
        (score === best.score && coverage > best.coverage)
      ) {
        best = { page, matched, score, coverage };
      }
    }

    if (!best) {
      return {
        url: photo.url,
        filename: photo.filename,
        page_key: null,
        matchedTokens: [],
      };
    }

    return {
      url: photo.url,
      filename: photo.filename,
      page_key: best.page.page_key,
      slot: isSystemLikePage(best.page) ? inferSlot(photo) : undefined,
      matchedTokens: best.matched.sort(),
    };
  });
}
