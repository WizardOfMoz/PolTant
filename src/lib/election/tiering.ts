/**
 * Pure computation functions that turn a constituency's real historical
 * election results (src/data/election-results.ts) into the swing-tier and
 * coverage-tier classification stored in src/data/constituencies.ts.
 *
 * Nothing here is asserted by hand — src/data/constituencies.ts imports these
 * functions and calls them over the real results to *derive* every numeric
 * field, so the classification is demonstrably computed, not hardcoded.
 */

export type SwingTier = "Safe" | "Lean" | "Swing" | "Toss-up";
export type CoverageTier = "Tier 1" | "Tier 2" | "Tier 3";

/** The subset of an election result row that the formulas below need. */
export interface CycleResult {
  year: number;
  winningParty: string;
  runnerUpParty: string;
  /** Winning margin as a % of total votes polled in that cycle. */
  marginPct: number;
  totalVotes: number;
}

function sortByYear(results: CycleResult[]): CycleResult[] {
  return [...results].sort((a, b) => a.year - b.year);
}

/**
 * Margin volatility = average absolute change in winning-margin % between
 * consecutive election cycles. A seat whose margin swings wildly from one
 * election to the next (e.g. 2% -> 30% -> 5%) scores high volatility even if
 * the same party kept winning; a seat that wins by a similar margin every
 * time scores near zero. Requires >= 2 cycles; returns 0 for fewer.
 */
export function marginVolatility(results: CycleResult[]): number {
  const sorted = sortByYear(results);
  if (sorted.length < 2) return 0;
  const diffs: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    diffs.push(Math.abs(sorted[i].marginPct - sorted[i - 1].marginPct));
  }
  const avg = diffs.reduce((sum, d) => sum + d, 0) / diffs.length;
  return Math.round(avg * 100) / 100;
}

/**
 * Flip frequency = number of times the winning party changed between
 * consecutive cycles (party label to party label, e.g. "BJP" -> "INC" counts
 * as one flip). This is a literal string comparison of the winner's party —
 * it does not attempt to model alliance continuity across splits/mergers
 * (e.g. undivided NCP vs NCP-SP are treated as different labels), which is
 * called out per-row in election-results.ts sourceNote where it matters.
 */
export function flipFrequency(results: CycleResult[]): number {
  const sorted = sortByYear(results);
  let flips = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].winningParty !== sorted[i - 1].winningParty) flips++;
  }
  return flips;
}

/**
 * Closeness index = winning margin as a % of total votes polled in the most
 * recent cycle available. Lower = closer race in the latest election.
 */
export function closenessIndex(results: CycleResult[]): number {
  const sorted = sortByYear(results);
  if (sorted.length === 0) return 0;
  return sorted[sorted.length - 1].marginPct;
}

/** Thresholds used by classifySwingTier — kept as named constants so the
 *  cutoffs are visible and adjustable in one place rather than buried in
 *  conditionals. */
export const TIER_THRESHOLDS = {
  tossUpClosenessPct: 3,
  tossUpMinFlips: 2,
  swingClosenessPct: 8,
  swingMinFlips: 1,
  leanClosenessPct: 15,
} as const;

/**
 * Classifies a seat into Safe / Lean / Swing / Toss-up from its computed
 * margin volatility, flip frequency, and closeness index (most-recent-cycle
 * margin %). A seat is a Toss-up if its latest margin is razor-thin OR it has
 * flipped party at least twice; Swing if the latest margin is still fairly
 * tight OR it has flipped at least once; Lean if the margin is moderate with
 * no flips; Safe otherwise. Margin volatility isn't a hard gate here (a seat
 * can have a wide latest margin after a volatile history) but is exposed
 * separately for display since it signals how *stable* a seat's Safe/Lean
 * label actually is.
 */
export function classifySwingTier(
  volatility: number,
  flips: number,
  closeness: number
): SwingTier {
  if (closeness < TIER_THRESHOLDS.tossUpClosenessPct || flips >= TIER_THRESHOLDS.tossUpMinFlips) {
    return "Toss-up";
  }
  if (closeness < TIER_THRESHOLDS.swingClosenessPct || flips >= TIER_THRESHOLDS.swingMinFlips) {
    return "Swing";
  }
  if (closeness < TIER_THRESHOLDS.leanClosenessPct) {
    return "Lean";
  }
  return "Safe";
}

/** Convenience wrapper: compute all three metrics + tier in one call. */
export function computeSwingMetrics(results: CycleResult[]): {
  marginVolatility: number;
  flipFrequency: number;
  closenessIndex: number;
  tier: SwingTier;
} {
  const volatility = marginVolatility(results);
  const flips = flipFrequency(results);
  const closeness = closenessIndex(results);
  return {
    marginVolatility: volatility,
    flipFrequency: flips,
    closenessIndex: closeness,
    tier: classifySwingTier(volatility, flips, closeness),
  };
}

/** A state's real internet-usage figure counts as "high" digital engagement
 *  once it clears the midpoint of the normalized 0-100 scale. */
export const HIGH_ENGAGEMENT_THRESHOLD = 50;

/**
 * Coverage tier per the PRD:
 * - Tier 1: Swing or Toss-up seat with high digital engagement -> full
 *   real-time monitoring (these are the seats where fast-moving online
 *   narrative could plausibly move a close outcome).
 * - Tier 2: either a swing/toss-up seat with lower digital engagement, or a
 *   safe/lean seat with high digital engagement -> monthly check-ins.
 * - Tier 3: safe/lean seat with low digital engagement -> quarterly.
 */
export function classifyCoverageTier(
  swingTier: SwingTier,
  digitalEngagementIndex: number
): CoverageTier {
  const isCompetitive = swingTier === "Swing" || swingTier === "Toss-up";
  const isHighEngagement = digitalEngagementIndex >= HIGH_ENGAGEMENT_THRESHOLD;

  if (isCompetitive && isHighEngagement) return "Tier 1";
  if (isCompetitive !== isHighEngagement) return "Tier 2"; // XOR: one but not both
  return "Tier 3"; // safe/lean AND low engagement
}

/**
 * Normalizes a real state-level internet-usage percentage (see
 * src/data/constituencies.ts digitalEngagementSourceNote for the exact NFHS-5
 * figures used) onto a 0-100 index via min-max scaling against the full
 * national range of state/UT values, so the *lowest*-usage state/UT in the
 * country maps to 0 and the *highest* maps to 100.
 */
export function normalizeDigitalEngagementIndex(
  stateValue: number,
  nationalMin: number,
  nationalMax: number
): number {
  if (nationalMax === nationalMin) return 50;
  const pct = ((stateValue - nationalMin) / (nationalMax - nationalMin)) * 100;
  return Math.round(Math.min(100, Math.max(0, pct)) * 10) / 10;
}
