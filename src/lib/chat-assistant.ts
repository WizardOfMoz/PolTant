"use server";

/**
 * Mock "ask about this data" assistant — a capability demo, NOT a real LLM
 * call. Every answer below is deterministic keyword-routing over this app's
 * existing synthetic mock-data modules (same accounts/posts/graph/
 * amplification data every other page reads), formatted into a short reply.
 * No model API, no network call — consistent with this whole build's
 * zero-live-dependency architecture (see /methodology).
 *
 * Kept as a Server Action (`"use server"` file directive) so the mock
 * dataset itself never ships to the client bundle — only the question
 * string in and the answer string out cross the network boundary.
 */

import { ACCOUNTS } from "@/data/mock/accounts";
import { getAllGrowthHistories } from "@/data/mock/growth-history";
import { getAllPosts, getRecentPosts } from "@/data/mock/posts";
import { analyzeAllPosts, analyzePost } from "@/data/mock/mock-analysis";
import { buildIntelligenceGraph } from "@/data/mock/graph";
import { getAllAmplificationEvents } from "@/data/mock/amplification";
import { computeGrowthAlerts } from "@/lib/alerts";
import { constituencies } from "@/data/constituencies";
import { TIER_ORDER } from "@/lib/palette";

const accountsById = new Map(ACCOUNTS.map((a) => [a.id, a]));

function formatPct(n: number): string {
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function formatSentiment(n: number): string {
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}`;
}

function accountsAnswer(): string {
  const byPlatform: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  for (const a of ACCOUNTS) {
    byPlatform[a.platform] = (byPlatform[a.platform] ?? 0) + 1;
    byCategory[a.category] = (byCategory[a.category] ?? 0) + 1;
  }
  const platformLine = Object.entries(byPlatform)
    .map(([p, n]) => `${n} ${p}`)
    .join(", ");
  return (
    `${ACCOUNTS.length} accounts are tracked across all four platforms (${platformLine}) — ` +
    `${byCategory["established-influencer"] ?? 0} established influencers and ` +
    `${byCategory["rising-new-media"] ?? 0} rising new-media accounts. All synthetic, see /channels.`
  );
}

function sentimentAnswer(): string {
  const analyses = analyzeAllPosts();
  const avg = analyses.reduce((s, a) => s + a.sentimentScore, 0) / Math.max(1, analyses.length);
  const posts = getAllPosts();
  const latest = posts.reduce((max, p) => (p.publishedAt > max ? p.publishedAt : max), "");
  const recent = posts.filter((p) => {
    const days = (Date.parse(latest) - Date.parse(p.publishedAt)) / 86_400_000;
    return days < 14;
  });
  const recentAvg =
    recent.reduce((s, p) => s + analyzePost(p).sentimentScore, 0) / Math.max(1, recent.length);
  return (
    `Average sentiment across all ${analyses.length} tracked posts is ${formatSentiment(avg)} ` +
    `(-1 to +1 scale). Over the most recent 14 days it's ${formatSentiment(recentAvg)}. ` +
    `See the National sentiment trend chart on Overview for the full time series.`
  );
}

function alertsAnswer(): string {
  const alerts = computeGrowthAlerts();
  const rising = alerts.filter((a) => a.direction === "up").slice(0, 3);
  const falling = alerts.filter((a) => a.direction === "down").slice(0, 3);
  if (alerts.length === 0) return "No accounts currently cross the 12% trailing-14-day growth threshold.";
  const parts: string[] = [`${alerts.length} accounts currently have a flagged growth alert.`];
  if (rising.length > 0) {
    parts.push(
      "Rising: " + rising.map((a) => `${a.displayName} (${formatPct(a.growthPct)})`).join(", ") + "."
    );
  }
  if (falling.length > 0) {
    parts.push(
      "Falling: " + falling.map((a) => `${a.displayName} (${formatPct(a.growthPct)})`).join(", ") + "."
    );
  }
  parts.push("Full list on /alerts.");
  return parts.join(" ");
}

function constituenciesAnswer(): string {
  const counts: Record<string, number> = {};
  for (const tier of TIER_ORDER) counts[tier] = 0;
  for (const c of constituencies) counts[c.tier] = (counts[c.tier] ?? 0) + 1;
  const stateCount = new Set(constituencies.map((c) => c.state)).size;
  const breakdown = TIER_ORDER.map((t) => `${counts[t]} ${t}`).join(", ");
  return (
    `${constituencies.length} constituencies are tracked across ${stateCount} states/UTs, ` +
    `by swing tier: ${breakdown}. See /constituencies, or /war-room for the ranked action-item view.`
  );
}

function issuesAnswer(): string {
  const graph = buildIntelligenceGraph();
  const topIssues = graph.nodes
    .filter((n) => n.type === "issue")
    .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
    .slice(0, 5);
  const lines = topIssues.map((issue) => issue.label).join(", ");
  return `The most-discussed issues right now are: ${lines}. Each links out to its own drill-down page under /issues.`;
}

function amplificationAnswer(): string {
  const events = getAllAmplificationEvents();
  const top = [...events].sort((a, b) => b.spreadMultiplier - a.spreadMultiplier).slice(0, 3);
  if (top.length === 0) return "No cross-platform amplification events are recorded in this dataset.";
  const lines = top
    .map(
      (e) =>
        `"${e.headline}" (${e.originPlatform} → ${e.targetPlatform}, ${e.hoursDelay}h, ${e.spreadMultiplier.toFixed(1)}x spread)`
    )
    .join("; ");
  return `${events.length} cross-platform amplification events are tracked. Biggest by spread: ${lines}.`;
}

function engagementAnswer(): string {
  const ranked = getAllGrowthHistories()
    .map((h) => {
      const account = accountsById.get(h.accountId);
      const latest = h.snapshots[h.snapshots.length - 1];
      if (!account || !latest) return null;
      return { name: account.displayName, rate: latest.engagementRate };
    })
    .filter((r): r is { name: string; rate: number } => Boolean(r))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5);
  const lines = ranked.map((r) => `${r.name} (${(r.rate * 100).toFixed(1)}%)`).join(", ");
  return `Highest engagement rate right now: ${lines}. Full ranking on /leaderboard.`;
}

function recentAnswer(): string {
  const posts = getRecentPosts(3);
  const lines = posts
    .map((p) => {
      const account = accountsById.get(p.accountId);
      const score = analyzePost(p).sentimentScore;
      return `"${p.title}" — ${account?.displayName ?? p.accountId} (${formatSentiment(score)})`;
    })
    .join("; ");
  return `Most recent tracked posts: ${lines}. See /channels for the full feed.`;
}

const HELP_TEXT =
  "I can answer questions about the synthetic dataset this demo tracks — try asking about " +
  "accounts, sentiment, alerts, constituencies, issues/narratives, amplification, engagement, " +
  "or recent posts. I'm a mock, rule-based assistant reading the same data every page reads — " +
  "not a live model call. See /methodology for what's real vs. synthetic here.";

interface Route {
  keywords: string[];
  answer: () => string;
}

const ROUTES: Route[] = [
  { keywords: ["account", "channel", "creator", "influencer", "platform"], answer: accountsAnswer },
  { keywords: ["sentiment", "mood", "feeling", "positive", "negative"], answer: sentimentAnswer },
  { keywords: ["alert", "rising", "falling", "growth", "spike"], answer: alertsAnswer },
  { keywords: ["constituenc", "seat", "swing", "toss-up", "tier"], answer: constituenciesAnswer },
  { keywords: ["issue", "narrative", "topic", "discuss"], answer: issuesAnswer },
  { keywords: ["amplif", "viral", "spread", "cross-platform", "cross platform"], answer: amplificationAnswer },
  { keywords: ["engagement", "leaderboard", "top account", "rank"], answer: engagementAnswer },
  { keywords: ["recent", "latest", "new post", "news"], answer: recentAnswer },
  { keywords: ["help", "what can you", "capabilities"], answer: () => HELP_TEXT },
];

/** Server Action: routes a free-text question to the first matching mock
 *  answer generator, or a help message if nothing matches. */
export async function answerQuestion(question: string): Promise<string> {
  const q = question.toLowerCase();
  for (const route of ROUTES) {
    if (route.keywords.some((kw) => q.includes(kw))) {
      return route.answer();
    }
  }
  return HELP_TEXT;
}
