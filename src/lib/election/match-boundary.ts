import indiaPcBoundaries from "@/data/india-pc-boundaries.json";
import { normalizePcProperties } from "@/components/map/normalize";
import type { Constituency } from "@/data/constituencies";

/**
 * Joins our curated `constituencies` dataset (built independently from real
 * election results, before the map's boundary file was even fetched) to the
 * real India PC boundary features, by constituency name + state — NOT by
 * ECI `pc_no`, which repeats across states (see normalize.ts) and collides
 * even within our own curated list (four tracked seats share pc_no 1:
 * Chandni Chowk/Delhi, Chandigarh, Gurdaspur/Punjab, Ladakh).
 *
 * Returns the boundary feature's globally-unique `pcId` for each matched
 * constituency — that's the key `IndiaMap`'s `highlighted` prop expects.
 * Logs (doesn't throw) on anything unmatched or ambiguous, so a bad match
 * is visible during development rather than silently wrong on the map.
 */

// Some state/UT labels differ between our seed data (plain, common names)
// and the boundary file's `st_name` (which may use official/longer forms).
// Keys and values are both lower-cased before comparison.
const STATE_ALIASES: Record<string, string> = {
  delhi: "nct of delhi",
  "chandigarh (ut)": "chandigarh",
  // This boundary file reflects the 2019 delimitation, before Ladakh became
  // its own UT (Oct 2019) — at 2019-election time it was PC 4 within the
  // then-undivided Jammu & Kashmir state.
  "ladakh (ut)": "jammu & kashmir",
  ladakh: "jammu & kashmir",
};

// Spelling differs between our seed data (common/current usage) and this
// boundary file's transliteration of the same constituency name.
const NAME_ALIASES: Record<string, string> = {
  kanniyakumari: "kanyakumari",
  hassan: "haasan",
};

function normalizeStateLabel(state: string): string {
  const lower = state.trim().toLowerCase();
  return STATE_ALIASES[lower] ?? lower;
}

function normalizeNameLabel(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/\s*\((sc|st)\)\s*$/i, "") // strip reserved-category suffixes some sources append
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return NAME_ALIASES[base] ?? base;
}

interface BoundaryFeatureInfo {
  pcId: number;
  pcNumber: number;
  pcName: string;
  stateName: string;
}

function loadBoundaryFeatures(): BoundaryFeatureInfo[] {
  const collection = indiaPcBoundaries as unknown as {
    features: Array<{ properties: Record<string, unknown> }>;
  };
  const out: BoundaryFeatureInfo[] = [];
  for (const feature of collection.features) {
    const normalized = normalizePcProperties(feature.properties);
    if (!normalized || normalized.pcId === null) continue;
    out.push({
      pcId: normalized.pcId,
      pcNumber: normalized.pcNumber,
      pcName: normalized.pcName ?? "",
      stateName: normalized.stateName ?? "",
    });
  }
  return out;
}

export interface BoundaryMatchResult {
  /** constituency.id -> boundary feature's globally-unique pcId */
  matched: Map<string, number>;
  unmatched: Constituency[];
}

export function matchConstituenciesToBoundaries(
  constituencies: Constituency[]
): BoundaryMatchResult {
  const features = loadBoundaryFeatures();
  const byNameAndState = new Map<string, BoundaryFeatureInfo[]>();
  for (const f of features) {
    const key = `${normalizeNameLabel(f.pcName)}|${normalizeStateLabel(f.stateName)}`;
    const bucket = byNameAndState.get(key) ?? [];
    bucket.push(f);
    byNameAndState.set(key, bucket);
  }

  const matched = new Map<string, number>();
  const unmatched: Constituency[] = [];

  for (const c of constituencies) {
    const key = `${normalizeNameLabel(c.name)}|${normalizeStateLabel(c.state)}`;
    const candidates = byNameAndState.get(key);

    if (!candidates || candidates.length === 0) {
      console.warn(
        `[match-boundary] No boundary feature matched for "${c.name}" (${c.state}), id=${c.id}. It won't render on the map.`
      );
      unmatched.push(c);
      continue;
    }

    if (candidates.length > 1) {
      console.warn(
        `[match-boundary] Ambiguous match for "${c.name}" (${c.state}), id=${c.id}: ${candidates.length} boundary features matched. Using the first.`
      );
    }

    matched.set(c.id, candidates[0].pcId);
  }

  return { matched, unmatched };
}
