/**
 * Reusable extraction of the constituency detail page's brief-computation
 * logic (see src/app/constituencies/[id]/page.tsx history) — matched posts
 * (falling back to primary-account posts when nothing geo-matches),
 * analyzed sentiment/topic/driver aggregates, and cross-platform
 * amplification events for a single constituency. Both the detail page and
 * the action-items/urgency engine (src/lib/action-items.ts) consume this so
 * the two can't silently disagree on what "this constituency's content"
 * means.
 *
 * Pure extraction — no behavior change from the page's prior inline
 * implementation.
 */

import { ACCOUNTS, type Account } from "@/data/mock/accounts";
import { getAllPosts, getPostsForAccount, type Post } from "@/data/mock/posts";
import { analyzePost, TOPIC_VOCABULARY, type ContentAnalysis } from "@/data/mock/mock-analysis";
import { buildIntelligenceGraph, type IntelligenceGraph } from "@/data/mock/graph";
import {
  getAmplificationForConstituency,
  type AmplificationEvent,
} from "@/data/mock/amplification";
import type { SentimentPoint } from "@/components/charts/sentiment-line-chart";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ConstituencyBrief {
  constituencyId: string;
  matchedPosts: Post[];
  usedAccountFallback: boolean;
  analyzedPosts: { post: Post; analysis: ContentAnalysis }[];
  aggregateSentiment: number;
  sentimentDelta: number | null;
  sentimentSeries: SentimentPoint[];
  dominantTopic: string | null;
  driverIds: string[];
  driverNames: string[];
  trendLabel: "trending up" | "trending down" | "holding steady";
  amplificationEvents: AmplificationEvent[];
}

function average(scores: number[]): number {
  if (scores.length === 0) return 0;
  return Math.round((scores.reduce((sum, v) => sum + v, 0) / scores.length) * 100) / 100;
}

/** Buckets posts into 7-day windows (from the earliest matched post onward)
 *  and averages `analyzePost().sentimentScore` within each window, producing
 *  the {date, sentiment}[] shape SentimentLineChart expects. */
function bucketSentimentByWeek(posts: Post[]): SentimentPoint[] {
  if (posts.length === 0) return [];
  const withMs = posts
    .map((post) => ({ post, ms: Date.parse(post.publishedAt) }))
    .sort((a, b) => a.ms - b.ms);
  const startMs = withMs[0].ms;

  const buckets = new Map<number, { label: string; scores: number[] }>();
  for (const { post, ms } of withMs) {
    const index = Math.floor((ms - startMs) / (7 * DAY_MS));
    const bucketStartMs = startMs + index * 7 * DAY_MS;
    const label = new Date(bucketStartMs).toISOString().slice(0, 10);
    const bucket = buckets.get(index) ?? { label, scores: [] };
    bucket.scores.push(analyzePost(post).sentimentScore);
    buckets.set(index, bucket);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, bucket]) => ({ date: bucket.label, sentiment: average(bucket.scores) }));
}

/** Aggregate sentiment for the most recent 15-day window vs. the 15 days
 *  before that, anchored on the most recent matched post's date (not the
 *  server's wall-clock date, so this stays meaningful regardless of when the
 *  page is rendered). Returns null when either window has no posts to
 *  compare. */
function computeSentimentDelta(posts: Post[]): number | null {
  if (posts.length === 0) return null;
  const dated = posts.map((post) => ({ post, ms: Date.parse(post.publishedAt) }));
  const anchorMs = Math.max(...dated.map((d) => d.ms));

  const recent = dated.filter((d) => d.ms > anchorMs - 15 * DAY_MS);
  const prior = dated.filter(
    (d) => d.ms <= anchorMs - 15 * DAY_MS && d.ms > anchorMs - 30 * DAY_MS
  );
  if (recent.length === 0 || prior.length === 0) return null;

  const recentAvg = average(recent.map((d) => analyzePost(d.post).sentimentScore));
  const priorAvg = average(prior.map((d) => analyzePost(d.post).sentimentScore));
  return Math.round((recentAvg - priorAvg) * 100) / 100;
}

/** Most frequent topic across a set of ContentAnalysis, tie-broken by
 *  TOPIC_VOCABULARY order for determinism. Null only when there is no
 *  content to summarize. */
function dominantTopic(analyses: ContentAnalysis[]): string | null {
  if (analyses.length === 0) return null;
  const counts = new Map<string, number>();
  for (const analysis of analyses) {
    for (const topic of analysis.topics) {
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const topic of TOPIC_VOCABULARY) {
    const count = counts.get(topic) ?? 0;
    if (count > bestCount) {
      bestCount = count;
      best = topic;
    }
  }
  return best;
}

/** Prefers accounts that DRIVE this constituency's discussed issues in the
 *  intelligence graph (issue -> DRIVEN_BY -> account), ranked by the edge
 *  weight (follower count). Falls back to this seat's own highest-follower
 *  primary accounts when the graph yields nothing. */
function topDriverAccountIds(constituencyId: string, graph: IntelligenceGraph): string[] {
  const issueIds = new Set(
    graph.edges
      .filter((edge) => edge.type === "DISCUSSED_IN" && edge.source === constituencyId)
      .map((edge) => edge.target)
  );

  const bestWeightByAccount = new Map<string, number>();
  for (const edge of graph.edges) {
    if (edge.type !== "DRIVEN_BY" || !issueIds.has(edge.source)) continue;
    const weight = edge.weight ?? 0;
    if (weight > (bestWeightByAccount.get(edge.target) ?? -1)) {
      bestWeightByAccount.set(edge.target, weight);
    }
  }

  let ranked = [...bestWeightByAccount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([accountId]) => accountId);

  if (ranked.length < 2) {
    const fallback = ACCOUNTS.filter((account) => account.primaryConstituencyId === constituencyId)
      .sort((a, b) => b.baseFollowerCount - a.baseFollowerCount)
      .map((account) => account.id)
      .filter((id) => !ranked.includes(id));
    ranked = [...ranked, ...fallback];
  }

  return ranked.slice(0, 4);
}

function accountDisplayName(accountId: string): string {
  return ACCOUNTS.find((a) => a.id === accountId)?.displayName ?? accountId;
}

/** Builds the full constituency brief: matched posts, analyzed
 *  sentiment/topic/driver aggregates, and amplification events for one
 *  constituency. Same logic the constituency detail page used inline
 *  before this extraction — no behavior change. */
export function getConstituencyBrief(constituencyId: string): ConstituencyBrief {
  const primaryAccounts: Account[] = ACCOUNTS.filter(
    (account) => account.primaryConstituencyId === constituencyId
  );

  let matchedPosts: Post[] = getAllPosts().filter(
    (post) => post.guessedConstituencyId === constituencyId
  );
  const usedAccountFallback = matchedPosts.length === 0;
  if (usedAccountFallback) {
    matchedPosts = primaryAccounts.flatMap((account) => getPostsForAccount(account.id));
  }

  const sortedPosts = [...matchedPosts].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  const analyzedPosts = sortedPosts.map((post) => ({ post, analysis: analyzePost(post) }));
  const analyses = analyzedPosts.map((entry) => entry.analysis);

  const aggregateSentiment = average(analyses.map((a) => a.sentimentScore));
  const sentimentDelta = computeSentimentDelta(matchedPosts);
  const sentimentSeries = bucketSentimentByWeek(matchedPosts);

  const graph = buildIntelligenceGraph();
  const topic = dominantTopic(analyses);
  const driverIds = topDriverAccountIds(constituencyId, graph);
  const driverNames = driverIds.map(accountDisplayName);

  const trendLabel =
    sentimentDelta === null
      ? "holding steady"
      : sentimentDelta > 0.05
        ? "trending up"
        : sentimentDelta < -0.05
          ? "trending down"
          : "holding steady";

  const amplificationEvents = getAmplificationForConstituency(constituencyId);

  return {
    constituencyId,
    matchedPosts,
    usedAccountFallback,
    analyzedPosts,
    aggregateSentiment,
    sentimentDelta,
    sentimentSeries,
    dominantTopic: topic,
    driverIds,
    driverNames,
    trendLabel,
    amplificationEvents,
  };
}
