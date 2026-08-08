import Parser from "rss-parser";
import type { RssSource } from "@/data/rss-sources";

/** A single parsed feed item, normalized to what we actually use. */
export interface RssFeedItem {
  title: string;
  link: string;
  publishedAt: Date;
  contentSnippet: string | null;
}

/** A parsed feed item tagged with the source it came from. */
export interface FetchedRssItem extends RssFeedItem {
  rssSourceId: string;
}

/**
 * Minimal shape this module needs from a constituency record. Matches the
 * relevant columns of the `constituencies` table (see src/db/schema.ts) —
 * intentionally narrow so this module doesn't need to import whatever
 * concrete constituency data/type another module produces.
 */
export interface ConstituencyForMatching {
  id: string;
  name: string;
  state: string;
}

/** Result of the location-guessing heuristic. Both fields are nullable. */
export interface GuessedLocation {
  constituencyId: string | null;
  state: string | null;
}

/**
 * Plain object shaped to map 1:1 into the `content` table (source="rss").
 * This module returns data only — no DB writes happen here, that's a
 * later integration step.
 */
export interface RssContentCandidate {
  source: "rss";
  rssSourceId: string;
  title: string;
  snippet: string | null;
  url: string;
  publishedAt: Date;
  guessedConstituencyId: string | null;
  guessedState: string | null;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_CONCURRENCY = 5;

const parser = new Parser({
  timeout: DEFAULT_TIMEOUT_MS,
  headers: {
    // Some Indian news CDNs (Akamai etc.) block default Node/axios UAs;
    // a normal-looking UA string is what let these feeds validate at all.
    "User-Agent":
      "Mozilla/5.0 (compatible; ConstituencyPulseBot/1.0; prototype news aggregator)",
  },
});

/**
 * Fetch and parse a single RSS/Atom feed.
 *
 * Never throws: a dead, slow, blocked, or malformed feed resolves to an
 * empty array (with a console warning) rather than rejecting, so that one
 * bad outlet can't take down a batch fetch across many sources.
 */
export async function fetchFeed(feedUrl: string): Promise<RssFeedItem[]> {
  try {
    const feed = await parser.parseURL(feedUrl);
    return (feed.items ?? [])
      .map((item): RssFeedItem => {
        const publishedRaw = item.isoDate ?? item.pubDate;
        const parsedDate = publishedRaw ? new Date(publishedRaw) : new Date();
        return {
          title: item.title?.trim() || "(untitled)",
          link: item.link?.trim() ?? "",
          publishedAt: Number.isNaN(parsedDate.getTime())
            ? new Date()
            : parsedDate,
          contentSnippet:
            item.contentSnippet?.trim() || item.summary?.trim() || null,
        };
      })
      .filter((item) => item.link.length > 0);
  } catch (err) {
    console.warn(
      `[rss] failed to fetch/parse feed "${feedUrl}":`,
      err instanceof Error ? err.message : err
    );
    return [];
  }
}

/** Resolves `fallback` if `promise` doesn't settle within `ms`. */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (result) => {
        clearTimeout(timer);
        resolve(result);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      }
    );
  });
}

/** Runs `fn` over `items` with at most `limit` in flight at once. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    for (;;) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await fn(items[index]);
    }
  }

  const workerCount = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

/**
 * Fetches all curated RSS sources concurrently (bounded concurrency +
 * a per-feed timeout on top of the parser's own timeout) and returns a
 * flat array of items, each tagged with the `rssSourceId` it came from.
 *
 * A slow or dead feed contributes zero items rather than blocking or
 * failing the whole batch.
 */
export async function fetchAllFeeds(
  sources: RssSource[],
  options?: { concurrency?: number; timeoutMs?: number }
): Promise<FetchedRssItem[]> {
  const concurrency = options?.concurrency ?? DEFAULT_CONCURRENCY;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const perSource = await mapWithConcurrency(sources, concurrency, async (source) => {
    const items = await withTimeout(
      fetchFeed(source.feedUrl),
      timeoutMs,
      [] as RssFeedItem[]
    );
    return items.map((item): FetchedRssItem => ({ ...item, rssSourceId: source.id }));
  });

  return perSource.flat();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsWholeWord(haystack: string, needle: string): boolean {
  const trimmed = needle.trim();
  if (!trimmed) return false;
  const pattern = new RegExp(`\\b${escapeRegExp(trimmed)}\\b`, "i");
  return pattern.test(haystack);
}

/**
 * HEURISTIC ONLY — this is a simple keyword-matching guess, not real
 * geolocation, entity extraction, or NLP. It scans the item's title +
 * snippet for a literal, whole-word match against constituency names and
 * (as a fallback) state names drawn from the constituency list passed in.
 *
 * This is intentionally blunt: it will miss articles that discuss a place
 * indirectly, and it can false-positive when a constituency/state name
 * happens to appear in an unrelated context (e.g. a person's surname, a
 * company name). Treat the result as a low-confidence "might be relevant
 * to this constituency" hint for the UI — never surface it as a confirmed
 * or authoritative geotag.
 *
 * Returns `{ constituencyId: null, state: null }` when nothing matches.
 */
export function guessStateOrConstituency(
  item: { title: string; contentSnippet?: string | null },
  constituencies: ConstituencyForMatching[]
): GuessedLocation {
  if (constituencies.length === 0) {
    return { constituencyId: null, state: null };
  }

  const haystack = `${item.title} ${item.contentSnippet ?? ""}`;

  // Pass 1: a specific constituency name is a stronger signal than a
  // state name (e.g. "Varanasi" narrows further than "Uttar Pradesh"),
  // so check constituency names first.
  for (const constituency of constituencies) {
    if (containsWholeWord(haystack, constituency.name)) {
      return { constituencyId: constituency.id, state: constituency.state };
    }
  }

  // Pass 2: fall back to a broad state-name-only match.
  const states = Array.from(new Set(constituencies.map((c) => c.state)));
  for (const state of states) {
    if (containsWholeWord(haystack, state)) {
      return { constituencyId: null, state };
    }
  }

  return { constituencyId: null, state: null };
}

/**
 * Maps fetched RSS items into plain objects shaped for the `content`
 * table (source="rss"), applying the constituency-guessing heuristic to
 * each item. Does not write to the DB — that's a later integration step.
 */
export function toContentCandidates(
  items: FetchedRssItem[],
  constituencies: ConstituencyForMatching[]
): RssContentCandidate[] {
  return items.map((item) => {
    const guess = guessStateOrConstituency(
      { title: item.title, contentSnippet: item.contentSnippet },
      constituencies
    );
    return {
      source: "rss" as const,
      rssSourceId: item.rssSourceId,
      title: item.title,
      snippet: item.contentSnippet,
      url: item.link,
      publishedAt: item.publishedAt,
      guessedConstituencyId: guess.constituencyId,
      guessedState: guess.state,
    };
  });
}
