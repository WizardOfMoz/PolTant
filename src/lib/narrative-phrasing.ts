/**
 * Shared "is this constituency's current sentiment plausibly explained by a
 * cross-platform amplification event?" logic, used by both the constituency
 * detail page's narrative-brief sentence (descriptive) and
 * src/lib/action-items.ts's recommendedAction text (prescriptive). Kept in
 * one place so the two surfaces can't drift on what counts as "correlated."
 *
 * An amplification event is treated as correlated with a brief's current
 * sentiment delta when its `occurredAt` falls inside the same recent-15-day
 * window `getConstituencyBrief`'s `computeSentimentDelta` compares against
 * the prior 15 days (anchored on the most recent matched post, not
 * wall-clock "today" — same reasoning as constituency-brief.ts).
 */

import type { AmplificationEvent } from "@/data/mock/amplification";
import type { ConstituencyBrief } from "@/lib/constituency-brief";
import type { Platform } from "@/lib/types";

export const PLATFORM_LABEL: Record<Platform, string> = {
  youtube: "YouTube",
  x: "X",
  instagram: "Instagram",
  facebook: "Facebook",
};

const DAY_MS = 24 * 60 * 60 * 1000;

function recentWindow(brief: ConstituencyBrief): { startMs: number; endMs: number } | null {
  if (brief.matchedPosts.length === 0) return null;
  const anchorMs = Math.max(...brief.matchedPosts.map((p) => Date.parse(p.publishedAt)));
  return { startMs: anchorMs - 15 * DAY_MS, endMs: anchorMs };
}

/** The amplification event (if any) whose `occurredAt` falls within this
 *  brief's recent 15-day delta window — i.e. plausibly correlated with the
 *  currently-reported sentiment trend. When more than one qualifies, picks
 *  the most recent (ties broken by event id) for determinism. */
export function findCitedAmplificationEvent(
  brief: ConstituencyBrief
): AmplificationEvent | undefined {
  const window = recentWindow(brief);
  if (!window) return undefined;

  const candidates = brief.amplificationEvents.filter((event) => {
    const ms = Date.parse(event.occurredAt);
    return ms > window.startMs && ms <= window.endMs;
  });
  if (candidates.length === 0) return undefined;

  return [...candidates].sort((a, b) => {
    const dateDiff = Date.parse(b.occurredAt) - Date.parse(a.occurredAt);
    if (dateDiff !== 0) return dateDiff;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  })[0];
}

/** Short clause describing a cross-platform amplification event — mirrors
 *  the source PRD's own phrasing (Section 8: "content first appeared on
 *  Instagram, amplified to X within 6 hours"), e.g.
 *  `"Local clip alleging..." amplified from Facebook to YouTube 18h later`. */
export function formatAmplificationClause(event: AmplificationEvent): string {
  return `"${event.headline}" amplified from ${PLATFORM_LABEL[event.originPlatform]} to ${
    PLATFORM_LABEL[event.targetPlatform]
  } ${event.hoursDelay}h later`;
}

function formatSignedDelta(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}`;
}

/**
 * The constituency detail page's narrative-brief sentence. Descriptive, not
 * prescriptive — contrast action-items.ts's recommendedAction, which is the
 * prescriptive counterpart built from this same cited-event logic. Callers
 * should only invoke this once `brief.dominantTopic` and at least one
 * matched post are confirmed to exist (same guard the page already applies
 * before rendering the narrative-brief section).
 */
export function buildNarrativeBriefSentence(brief: ConstituencyBrief): string {
  const topic = brief.dominantTopic ?? "the discussed issues";
  const deltaSuffix =
    brief.sentimentDelta !== null
      ? ` (${formatSignedDelta(brief.sentimentDelta)} vs. the prior 15 days)`
      : "";
  const citedEvent = findCitedAmplificationEvent(brief);

  if (citedEvent) {
    return `The dominant discussion this period centers on ${topic}, with sentiment ${brief.trendLabel}${deltaSuffix} — ${formatAmplificationClause(citedEvent)}.`;
  }

  return `The dominant discussion this period centers on ${topic}, with sentiment ${brief.trendLabel}${deltaSuffix}.`;
}
