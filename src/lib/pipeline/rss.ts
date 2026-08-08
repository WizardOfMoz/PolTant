import { unstable_cache } from "next/cache";
import { rssSources } from "@/data/rss-sources";
import { constituencies } from "@/data/constituencies";
import { fetchAllFeeds, toContentCandidates, type RssContentCandidate } from "@/lib/rss/client";

/**
 * Live real news items from the curated RSS sources, tagged with the
 * (heuristic — see guessStateOrConstituency) constituency/state they most
 * likely relate to. Cached 1 hour via Next's Data Cache; no DB required.
 */
async function fetchAllRssLive(): Promise<RssContentCandidate[]> {
  const items = await fetchAllFeeds(rssSources);
  return toContentCandidates(
    items,
    constituencies.map((c) => ({ id: c.id, name: c.name, state: c.state }))
  );
}

export const getLiveRssItems = unstable_cache(fetchAllRssLive, ["rss-live-items-v1"], {
  revalidate: 3600,
});
