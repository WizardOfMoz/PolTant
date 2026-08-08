import { unstable_cache } from "next/cache";
import type { Constituency } from "@/data/constituencies";
import { getChannelsWithLiveData } from "./channels";
import { getLiveRssItems } from "./rss";
import { analyzeBatch, type AnalysisOutcome } from "./analysis";
import type { Platform } from "@/data/dummy-channels";
import {
  synthesizeConstituencyBrief,
  type ConstituencyBrief,
} from "@/lib/analysis/brief";
import { AnalysisError } from "@/lib/analysis/client";

export interface ConstituencyItemAnalysis extends AnalysisOutcome {
  title: string;
  url: string;
  sourceName: string;
  sourceKind: Platform | "rss";
}

export interface ConstituencyBriefResult {
  brief: ConstituencyBrief | null;
  /** Individually analyzed items feeding the brief, for display alongside it. */
  items: ConstituencyItemAnalysis[];
  /** True only when the brief itself couldn't be produced (e.g. missing
   *  ANTHROPIC_API_KEY) — `items` may still be populated with per-item
   *  analysis (which degrades independently, see analyzeBatch). */
  briefUnavailable: boolean;
}

/**
 * Gathers real YouTube + RSS content relevant to one constituency (by the
 * heuristic state/name matching already built into the ingestion/RSS
 * modules — see PROJECT_BRIEF.md: this is explicitly a low-confidence
 * heuristic, not real geolocation), runs real per-item LLM analysis, then
 * synthesizes one constituency-level brief. Cached 1h per constituency id
 * via Next's Data Cache — no DB required.
 */
async function buildConstituencyBrief(
  constituency: Pick<Constituency, "id" | "name" | "state">
): Promise<ConstituencyBriefResult> {
  const [{ channels }, rssItems] = await Promise.all([
    getChannelsWithLiveData(),
    getLiveRssItems(),
  ]);

  // Channel posts are already analyzed once in src/lib/pipeline/channels.ts
  // (so /channels can show per-post results too) — reuse that AnalysisOutcome
  // directly rather than paying for a second Claude call on the same content.
  const relevantChannelItems: ConstituencyItemAnalysis[] = channels.flatMap((channel) =>
    channel.expectedPrimaryState === constituency.state
      ? channel.recentVideos.map((v) => ({
          sentimentScore: v.sentimentScore,
          topics: v.topics,
          narrativeSummary: v.narrativeSummary,
          unavailable: v.unavailable,
          title: v.title,
          url: v.url,
          sourceName: channel.displayName,
          sourceKind: channel.platform,
        }))
      : []
  );

  const relevantRss = rssItems.filter(
    (item) =>
      item.guessedConstituencyId === constituency.id || item.guessedState === constituency.state
  );
  const rssAnalysisMap = await analyzeBatch(
    relevantRss.map((item) => ({
      id: `rss-${item.url}`,
      title: item.title,
      snippet: item.snippet,
    }))
  );
  const rssItemsAnalyzed: ConstituencyItemAnalysis[] = relevantRss.map((item) => {
    const analysis = rssAnalysisMap.get(`rss-${item.url}`)!;
    return { ...analysis, title: item.title, url: item.url, sourceName: item.rssSourceId, sourceKind: "rss" };
  });

  const items: ConstituencyItemAnalysis[] = [...relevantChannelItems, ...rssItemsAnalyzed];

  // Only feed items with a real civic/political signal into the brief —
  // items that came back unavailable or off-topic (empty topics, per the
  // analysis system prompt's fallback) would just dilute the synthesis.
  const civicItems = items.filter((i) => !i.unavailable && i.topics.length > 0);

  if (civicItems.length === 0) {
    return {
      brief: {
        dominantNarrative:
          "No real civic/political content was matched to this constituency in the current window (this uses a keyword-based heuristic, not confirmed geolocation — see /methodology).",
        sentimentScore: 0,
        sentimentDelta: null,
        topDrivers: [],
      },
      items,
      briefUnavailable: false,
    };
  }

  try {
    const brief = await synthesizeConstituencyBrief({
      constituencyName: constituency.name,
      analyzedItems: civicItems.map((i) => ({
        topics: i.topics,
        sentimentScore: i.sentimentScore,
        narrativeSummary: i.narrativeSummary,
        channelOrSourceName: i.sourceName,
      })),
    });
    return { brief, items, briefUnavailable: false };
  } catch (err) {
    if (err instanceof AnalysisError) {
      console.warn(`[pipeline/constituency] brief unavailable for ${constituency.id}:`, err.message);
      return { brief: null, items, briefUnavailable: true };
    }
    throw err;
  }
}

const cachedBuildConstituencyBrief = unstable_cache(
  buildConstituencyBrief,
  ["constituency-brief-v1"],
  { revalidate: 3600 }
);

export async function getConstituencyBrief(
  constituency: Pick<Constituency, "id" | "name" | "state">
): Promise<ConstituencyBriefResult> {
  return cachedBuildConstituencyBrief(constituency);
}
