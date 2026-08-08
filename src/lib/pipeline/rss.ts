import { unstable_cache } from "next/cache";
import { rssSources } from "@/data/rss-sources";
import { constituencies } from "@/data/constituencies";
import { fetchAllFeeds, toContentCandidates, type RssContentCandidate } from "@/lib/rss/client";

/**
 * Blocks individual-victim crime/tragedy stories (sexual assault, murder,
 * fatal-accident-victim reports, etc.) from ever reaching constituency
 * "narrative" pages. Found in review: the state-matching heuristic (a
 * blunt keyword match, see guessStateOrConstituency) pulled a report of an
 * alleged child sexual assault into a constituency's political sentiment
 * feed — the analysis model correctly scored it as neutral/law-enforcement
 * rather than forcing a political spin, but showing that kind of story at
 * all in a "what's driving political narrative here" UI is a bad editorial
 * call regardless of how it's scored, and out of scope for what this tool
 * is meant to surface. Deliberately blunt/over-inclusive: false positives
 * (a genuinely political story mentioning "assault" in passing) just mean
 * one fewer RSS item feeds the brief, which is a much smaller cost than a
 * false negative here.
 */
const SENSITIVE_CRIME_PATTERN =
  /\b(rape|raped|sexual assault|molest(ed|ation)?|gang-?rape|murder(ed)?|stabbed|kidnap(ped|ping)?|acid attack|dowry death|killed in .*accident|found dead)\b/i;

function isSensitiveCrimeStory(item: { title: string; contentSnippet: string | null }): boolean {
  return SENSITIVE_CRIME_PATTERN.test(`${item.title} ${item.contentSnippet ?? ""}`);
}

/**
 * Live real news items from the curated RSS sources, tagged with the
 * (heuristic — see guessStateOrConstituency) constituency/state they most
 * likely relate to. Cached 1 hour via Next's Data Cache; no DB required.
 */
async function fetchAllRssLive(): Promise<RssContentCandidate[]> {
  const items = await fetchAllFeeds(rssSources);
  const filtered = items.filter((item) => !isSensitiveCrimeStory(item));
  return toContentCandidates(
    filtered,
    constituencies.map((c) => ({ id: c.id, name: c.name, state: c.state }))
  );
}

export const getLiveRssItems = unstable_cache(fetchAllRssLive, ["rss-live-items-v1"], {
  revalidate: 3600,
});
