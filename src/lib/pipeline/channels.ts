import { unstable_cache } from "next/cache";
import { getDb, schema } from "@/db/client";
import { CHANNELS, type CuratedChannel } from "@/data/channels";
import { ingestChannel, type IngestedVideo } from "@/lib/youtube/ingest";

/**
 * Live-data pipeline for the /channels page (and anything else that needs
 * real tracked-channel data): fetches all curated channels from the real
 * YouTube Data API, wrapped in Next.js's Data Cache (`unstable_cache`) so a
 * page load doesn't re-hit the API (and burn quota) on every request.
 *
 * No DATABASE_URL is required for this to work — caching is handled by
 * Next.js itself. When DATABASE_URL *is* set, we additionally persist a
 * best-effort channel snapshot on every cache refresh (~hourly), which is
 * what powers real growth-over-time in src/lib/pipeline/alerts.ts. That
 * persistence is fire-and-forget and never affects what this function
 * returns, so a DB hiccup can't break the page.
 */

export interface ChannelVideoDisplay {
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
  category: CuratedChannel["category"];
  languageRegion: string;
  expectedPrimaryState?: string;
  justification: string;
  isLive: boolean;
  subscriberCount: number | null;
  viewCount: number | null;
  videoCount: number | null;
  recentVideos: ChannelVideoDisplay[];
  /** Set when live ingestion failed for this specific channel (e.g. a
   *  stale handle) — the row still renders with static metadata only. */
  error?: string;
}

export interface ChannelsResult {
  youtubeConfigured: boolean;
  channels: ChannelDisplay[];
}

function staticFallback(curated: CuratedChannel, error?: string): ChannelDisplay {
  return {
    handle: curated.handle,
    displayName: curated.displayName,
    category: curated.category,
    languageRegion: curated.languageRegion,
    expectedPrimaryState: curated.expectedPrimaryState,
    justification: curated.justification,
    isLive: false,
    subscriberCount: null,
    viewCount: null,
    videoCount: null,
    recentVideos: [],
    error,
  };
}

/** Best-effort persistence — never thrown to the caller. */
async function persist(
  curated: CuratedChannel,
  channelId: string,
  externalId: string,
  resolvedTitle: string,
  subscriberCount: number | null,
  viewCount: number | null,
  videoCount: number | null,
  videos: IngestedVideo[]
) {
  const db = getDb();
  if (!db) return;
  try {
    await db
      .insert(schema.channels)
      .values({
        id: channelId,
        platform: "youtube",
        displayName: curated.displayName || resolvedTitle,
        handle: curated.handle,
        externalId,
        category: curated.category,
        languageRegion: curated.languageRegion,
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
      viewCount,
      videoCount,
    });

    for (const video of videos) {
      const { topComments, ...row } = video;
      void topComments; // content-table columns only — comments aren't persisted (see schema.ts)
      await db
        .insert(schema.content)
        .values(row)
        .onConflictDoUpdate({
          target: schema.content.id,
          set: {
            likeCount: row.likeCount,
            commentCount: row.commentCount,
            viewCount: row.viewCount,
          },
        });
    }
  } catch (err) {
    console.warn(`[pipeline/channels] persistence failed for ${channelId}:`, err);
  }
}

async function fetchAllChannelsLive(): Promise<ChannelsResult> {
  if (!process.env.YOUTUBE_API_KEY) {
    return { youtubeConfigured: false, channels: CHANNELS.map((c) => staticFallback(c)) };
  }

  const settled = await Promise.allSettled(CHANNELS.map((c) => ingestChannel(c)));

  const channels: ChannelDisplay[] = await Promise.all(
    settled.map(async (result, i) => {
      const curated = CHANNELS[i];
      if (result.status === "rejected") {
        const message =
          result.reason instanceof Error ? result.reason.message : String(result.reason);
        console.warn(`[pipeline/channels] ingestion failed for ${curated.handle}:`, message);
        return staticFallback(curated, message);
      }

      const { channel, videos } = result.value;
      await persist(
        curated,
        channel.id,
        channel.externalId,
        channel.displayName,
        channel.subscriberCount ?? null,
        null,
        null,
        videos
      );

      return {
        handle: curated.handle,
        displayName: channel.displayName,
        category: curated.category,
        languageRegion: curated.languageRegion,
        expectedPrimaryState: curated.expectedPrimaryState,
        justification: curated.justification,
        isLive: true,
        subscriberCount: channel.subscriberCount ?? null,
        viewCount: null,
        videoCount: null,
        recentVideos: videos.map((v) => ({
          title: v.title,
          url: v.url,
          publishedAt:
            v.publishedAt instanceof Date ? v.publishedAt.toISOString() : String(v.publishedAt),
          viewCount: v.viewCount ?? null,
          likeCount: v.likeCount ?? null,
          commentCount: v.commentCount ?? null,
          topCommentsText: v.topComments.map((c) => c.text),
        })),
      } satisfies ChannelDisplay;
    })
  );

  return { youtubeConfigured: true, channels };
}

/**
 * Cached for 1 hour via Next.js's Data Cache — call this from any Server
 * Component/Route Handler; repeated calls within the window are free (no
 * network call, no quota spent).
 */
export const getChannelsWithLiveData = unstable_cache(
  fetchAllChannelsLive,
  ["channels-live-data-v1"],
  { revalidate: 3600 }
);
