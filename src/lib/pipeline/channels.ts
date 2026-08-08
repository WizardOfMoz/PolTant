import { unstable_cache } from "next/cache";
import { getDb, schema } from "@/db/client";
import { DUMMY_CHANNELS, type DummyChannel, type ChannelCategory, type Platform } from "@/data/dummy-channels";
import { analyzeBatch, type AnalysisOutcome } from "./analysis";

/**
 * Channel data pipeline for the /channels page (and anything downstream,
 * like the constituency-brief pipeline).
 *
 * DESIGN NOTE (change of direction from the first pass): this used to call
 * the real YouTube Data API for a curated list of real named channels (see
 * git history and the still-present, now-unused src/lib/youtube/ +
 * src/data/channels.ts). That was deliberately replaced with fictional
 * personas spanning all four platforms named in the source PRD — YouTube,
 * X, Instagram, Facebook (src/data/dummy-channels.ts) — attaching computed
 * sentiment to real named creators, even genuinely computed rather than
 * fabricated, was judged too close to the defamation/reputational risk the
 * source PRD's own Section 7 warns about for a link that gets shared
 * around. What's still REAL: the LLM sentiment/topic/narrative analysis
 * run over this fictional content, per post, right here (src/lib/analysis
 * via ./analysis, actual Anthropic API calls) — this is the "how it
 * analyzes and shows results" step, not just a data display. See
 * /methodology.
 *
 * `youtubeConfigured` is kept in the return shape for compatibility with
 * pages built against the original (YouTube-only) contract, but is now
 * always `true` — illustrative data has no API key dependency, for any of
 * the four platforms. No DATABASE_URL is required either; when it *is*
 * set, we additionally persist a best-effort snapshot per cache refresh so
 * src/lib/pipeline/alerts.ts has real history to compute growth from
 * (using this fictional data's numbers).
 */

export interface ChannelVideoDisplay extends AnalysisOutcome {
  title: string;
  url: string;
  publishedAt: string;
  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
  topCommentsText: string[];
}

export interface ChannelDisplay {
  handle: string;
  displayName: string;
  platform: Platform;
  profileUrl: string;
  category: ChannelCategory;
  languageRegion: string;
  expectedPrimaryState?: string;
  justification: string;
  isLive: boolean;
  subscriberCount: number | null;
  viewCount: number | null;
  videoCount: number | null;
  recentVideos: ChannelVideoDisplay[];
  error?: string;
}

export interface ChannelsResult {
  youtubeConfigured: boolean;
  channels: ChannelDisplay[];
}

const PROFILE_URL: Record<Platform, (handle: string) => string> = {
  youtube: (h) => `https://youtube.com/${h}`,
  x: (h) => `https://x.com/${h.replace(/^@/, "")}`,
  instagram: (h) => `https://instagram.com/${h.replace(/^@/, "")}`,
  facebook: (h) => `https://facebook.com/${h.replace(/^@/, "")}`,
};

/** Deterministic-ish slug, mirroring the original real-channel-era scheme
 *  so any already-seeded DB rows/snapshots from before this change stay
 *  addressable by the same ids for a given handle. */
function slugFromHandle(platform: Platform, handle: string): string {
  const clean = handle.replace(/^@/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `${platform}-${clean}`;
}

/** Small illustrative jitter so numbers drift slightly between cache
 *  refreshes (giving alerts something real to compute over) without
 *  claiming any precision they don't have. +/- ~1.5%. */
function jitter(base: number): number {
  const delta = base * 0.015 * (Math.random() * 2 - 1);
  return Math.max(0, Math.round(base + delta));
}

/** Best-effort persistence — never thrown to the caller. */
async function persist(
  channel: DummyChannel,
  channelId: string,
  subscriberCount: number,
  posts: ChannelVideoDisplay[]
) {
  const db = getDb();
  if (!db) return;
  try {
    await db
      .insert(schema.channels)
      .values({
        id: channelId,
        platform: channel.platform,
        displayName: channel.displayName,
        handle: channel.handle,
        externalId: channelId,
        category: channel.category,
        languageRegion: channel.languageRegion,
        isLive: true,
        subscriberCount,
        lastFetchedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.channels.id,
        set: { subscriberCount, lastFetchedAt: new Date(), isLive: true },
      });

    await db.insert(schema.channelSnapshots).values({
      channelId,
      subscriberCount,
      viewCount: null,
      videoCount: channel.posts.length,
    });

    for (const post of posts) {
      const postId = `${channelId}-${post.title.slice(0, 40)}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await db
        .insert(schema.content)
        .values({
          id: postId,
          source: channel.platform,
          channelId,
          rssSourceId: null,
          title: post.title,
          snippet: null,
          url: post.url,
          publishedAt: new Date(post.publishedAt),
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          viewCount: post.viewCount,
          guessedConstituencyId: null,
          guessedState: null,
        })
        .onConflictDoUpdate({
          target: schema.content.id,
          set: { likeCount: post.likeCount, commentCount: post.commentCount, viewCount: post.viewCount },
        });
    }
  } catch (err) {
    console.warn(`[pipeline/channels] persistence failed for ${channelId}:`, err);
  }
}

async function buildDummyChannels(): Promise<ChannelsResult> {
  const channels: ChannelDisplay[] = await Promise.all(
    DUMMY_CHANNELS.map(async (channel) => {
      const channelId = slugFromHandle(channel.platform, channel.handle);
      const subscriberCount = jitter(channel.baseSubscriberCount);
      const now = Date.now();
      const buildUrl = PROFILE_URL[channel.platform];

      // Real LLM analysis (Anthropic) over this channel's illustrative
      // posts — same analysis module/cache used for RSS content elsewhere,
      // so results shown here are genuinely computed, not fabricated.
      const analysisMap = await analyzeBatch(
        channel.posts.map((p) => ({
          id: `${channelId}-${p.title}`,
          title: p.title,
          snippet: p.snippet,
          topCommentsText: p.topCommentsText,
        }))
      );

      const recentVideos: ChannelVideoDisplay[] = channel.posts.map((p) => {
        const analysis = analysisMap.get(`${channelId}-${p.title}`)!;
        return {
          ...analysis,
          title: p.title,
          url: buildUrl(channel.handle),
          publishedAt: new Date(now - p.daysAgo * 24 * 60 * 60 * 1000).toISOString(),
          viewCount: jitter(p.baseViewCount),
          likeCount: jitter(p.baseLikeCount),
          commentCount: jitter(p.baseCommentCount),
          topCommentsText: p.topCommentsText,
        };
      });

      await persist(channel, channelId, subscriberCount, recentVideos);

      return {
        handle: channel.handle,
        displayName: channel.displayName,
        platform: channel.platform,
        profileUrl: buildUrl(channel.handle),
        category: channel.category,
        languageRegion: channel.languageRegion,
        expectedPrimaryState: channel.expectedPrimaryState,
        justification: channel.justification,
        isLive: true,
        subscriberCount,
        viewCount: null,
        videoCount: channel.posts.length,
        recentVideos,
      } satisfies ChannelDisplay;
    })
  );

  return { youtubeConfigured: true, channels };
}

/**
 * Cached for 1 hour via Next.js's Data Cache. The illustrative "live" feel
 * (small stat drift, snapshot history) comes from this cache expiring and
 * `buildDummyChannels` re-rolling jitter — not from any external API call.
 */
export const getChannelsWithLiveData = unstable_cache(
  buildDummyChannels,
  ["channels-live-data-v3-multiplatform"],
  { revalidate: 3600 }
);
