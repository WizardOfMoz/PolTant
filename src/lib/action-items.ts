/**
 * Consolidated "action items" / urgency engine — the single ranked queue a
 * War Room page (built by a sibling agent, not this module) consumes to
 * answer "which constituencies need attention right now, and why."
 *
 * Every input is already deterministic mock data (constituencies.ts's
 * computed tiers, constituency-brief.ts's sentiment aggregates,
 * alerts.ts's growth alerts, amplification.ts's events), so
 * `computeActionItems()` itself introduces no randomness — re-running it
 * always yields the exact same ranked list.
 *
 * Tone: recommendedAction text is neutral and policy-focused, describing
 * issues/narratives, never any person's, account's, or party's character —
 * same framing rule as the rest of this codebase (see mock-analysis.ts's
 * file header and PROJECT_BRIEF.md).
 */

import { constituencies } from "@/data/constituencies";
import { ACCOUNTS } from "@/data/mock/accounts";
import type { SwingTier, CoverageTier } from "@/lib/election/tiering";
import { computeGrowthAlerts, type GrowthAlert } from "@/lib/alerts";
import { getConstituencyBrief, type ConstituencyBrief } from "@/lib/constituency-brief";
import {
  findCitedAmplificationEvent,
  formatAmplificationClause,
} from "@/lib/narrative-phrasing";
import type { AmplificationEvent } from "@/data/mock/amplification";

export type UrgencyBand = "Critical" | "High" | "Watch" | "Stable";

export interface ActionItem {
  constituencyId: string;
  constituencyName: string;
  state: string;
  tier: SwingTier;
  coverageTier: CoverageTier;
  urgencyScore: number;
  urgencyBand: UrgencyBand;
  recommendedAction: string;
  brief: ConstituencyBrief;
  relatedGrowthAlerts: GrowthAlert[];
  citedAmplificationEvent?: AmplificationEvent;
}

const SWING_TIER_WEIGHT: Record<SwingTier, number> = {
  "Toss-up": 3,
  Swing: 2,
  Lean: 1,
  Safe: 0,
};

const COVERAGE_TIER_WEIGHT: Record<CoverageTier, number> = {
  "Tier 1": 2,
  "Tier 2": 1,
  "Tier 3": 0,
};

/**
 * Band cutoffs. The originally-suggested defaults (>=12 Critical, >=8 High,
 * >=4 Watch) were checked against the actual score distribution across all
 * 27 constituencies and produced zero Critical items (max observed score
 * was ~9.1) with most seats piling into Watch/Stable — a degenerate spread
 * for a "which needs attention right now" queue. Thresholds below were
 * re-derived from the real distribution (scores ranged ~0.4-9.1) to land
 * roughly: a handful of Critical, several High, and the remainder split
 * across Watch/Stable.
 */
const BAND_THRESHOLDS = {
  critical: 7,
  high: 5,
  watch: 2,
} as const;

function bandFor(score: number): UrgencyBand {
  if (score >= BAND_THRESHOLDS.critical) return "Critical";
  if (score >= BAND_THRESHOLDS.high) return "High";
  if (score >= BAND_THRESHOLDS.watch) return "Watch";
  return "Stable";
}

/** True when at least one of this constituency's primary accounts shows a
 *  falling (direction === "down") growth alert. */
function hasFallingGrowthAlert(primaryAccountIds: Set<string>, growthAlerts: GrowthAlert[]): boolean {
  return growthAlerts.some((alert) => alert.direction === "down" && primaryAccountIds.has(alert.accountId));
}

function computeUrgencyScore(
  tier: SwingTier,
  coverageTier: CoverageTier,
  brief: ConstituencyBrief,
  hasAmplification: boolean,
  fallingAlert: boolean
): number {
  let score = SWING_TIER_WEIGHT[tier] + COVERAGE_TIER_WEIGHT[coverageTier];
  score += Math.abs(brief.sentimentDelta ?? 0) * 10;
  score += Math.max(0, -brief.aggregateSentiment) * 5;
  if (hasAmplification && fallingAlert) score += 2;
  if (hasAmplification) score += 1;
  return Math.round(score * 100) / 100;
}

// ---------------------------------------------------------------------------
// recommendedAction templates — deterministic, chosen by whether a dominant
// topic exists, the sentiment trendLabel, and whether a cited amplification
// event (occurredAt inside the brief's recent-15-day delta window) is
// available to name explicitly. Kept as several distinct variants so the
// queue doesn't read as mechanically identical across rows sharing a trend
// direction — mirrors the PRD's own Section 8 example phrasing style
// ("Recommended: policy communication addressing disbursement timeline,
// given this is displacing a previously dominant narrative...").
// ---------------------------------------------------------------------------

function recommendedActionFor(brief: ConstituencyBrief, citedEvent: AmplificationEvent | undefined): string {
  const topic = brief.dominantTopic;

  if (!topic) {
    return "Insufficient matched content to identify a dominant narrative for this seat; expand monitoring coverage before prioritizing a response.";
  }

  if (citedEvent) {
    return `Policy communication addressing ${topic}, given sentiment is ${brief.trendLabel} and ${formatAmplificationClause(citedEvent)}.`;
  }

  if (brief.trendLabel === "trending down") {
    return `Prioritize a policy update on ${topic} — sentiment has been trending down over the last 15 days with no single cross-platform trigger identified yet; continue monitoring for amplification.`;
  }

  if (brief.trendLabel === "trending up") {
    return `Sentiment on ${topic} is trending up; sustain current messaging and continue monitoring for any shift in narrative.`;
  }

  return `Sentiment on ${topic} is holding steady; maintain routine monitoring, no immediate response indicated.`;
}

/** One ranked action item per constituency in `constituencies`, sorted by urgencyScore desc. */
export function computeActionItems(): ActionItem[] {
  const growthAlerts = computeGrowthAlerts();

  const items: ActionItem[] = constituencies.map((constituency) => {
    const brief = getConstituencyBrief(constituency.id);
    const primaryAccountIds = new Set(
      ACCOUNTS.filter((account) => account.primaryConstituencyId === constituency.id).map(
        (account) => account.id
      )
    );

    const hasAmplification = brief.amplificationEvents.length > 0;
    const fallingAlert = hasFallingGrowthAlert(primaryAccountIds, growthAlerts);
    const urgencyScore = computeUrgencyScore(
      constituency.tier,
      constituency.coverageTier,
      brief,
      hasAmplification,
      fallingAlert
    );

    const citedAmplificationEvent = findCitedAmplificationEvent(brief);
    const relatedGrowthAlerts = growthAlerts.filter((alert) => primaryAccountIds.has(alert.accountId));

    return {
      constituencyId: constituency.id,
      constituencyName: constituency.name,
      state: constituency.state,
      tier: constituency.tier,
      coverageTier: constituency.coverageTier,
      urgencyScore,
      urgencyBand: bandFor(urgencyScore),
      recommendedAction: recommendedActionFor(brief, citedAmplificationEvent),
      brief,
      relatedGrowthAlerts,
      citedAmplificationEvent,
    };
  });

  return items.sort((a, b) => b.urgencyScore - a.urgencyScore);
}
