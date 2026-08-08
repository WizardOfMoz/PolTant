/**
 * Orchestrates a full ingestion pass for one curated YouTube channel:
 * resolve handle -> recent videos -> video stats -> top comments
 * (aggregate-only). Returns plain, typed objects shaped like the
 * `channels`/`content` table rows from src/db/schema.ts, ready for a later
 * step to upsert via Drizzle - this module deliberately does NOT touch the
 * DB itself (no `getDb()` import here; that's the integration step's job).
 */

import { channels, content } from "@/db/schema";
import type { CuratedChannel } from "@/data/channels";
import {
  resolveChannelByHandle,
  getRecentVideos,
  getVideoStats,
  getTopComments,
  type CommentTextOnly,
} from "./client";

/** Row shape for an insert into the `channels` table (Drizzle-inferred). */
export type NewChannelRow = typeof channels.$inferInsert;

/** Row shape for an insert into the `content` table (Drizzle-inferred). */
export type NewContentRow = typeof content.$inferInsert;

export interface IngestedVideo extends NewContentRow {
  /**
   * Aggregate/text-only comments (see getTopComments) for downstream LLM
   * sentiment/topic analysis. This is NOT a `content` table column - do
   * not pass this field to an insert; strip it before writing to the DB.
   */
  topComments: CommentTextOnly[];
}

export interface IngestedChannel {
  channel: NewChannelRow;
  videos: IngestedVideo[];
}

const MAX_RECENT_VIDEOS = 5;
const MAX_COMMENTS_PER_VIDEO = 10;

/** Deterministic slug for the `channels`/`content.channel_id` primary key,
 *  derived from the handle so re-running ingestion upserts the same row
 *  instead of duplicating it. */
function slugFromHandle(handle: string): string {
  const clean = handle.replace(/^@/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `yt-${clean}`;
}

/**
 * Ingest one curated channel end-to-end.
 *
 * Approximate quota cost: 1 (resolve) + 1 (recent videos via uploads
 * playlist) + 1 (batched video stats) + up to MAX_RECENT_VIDEOS
 * (commentThreads, one call per video) ≈ 8 units for a channel with 5
 * videos. See src/lib/youtube/client.ts for the full quota breakdown -
 * running this over all ~20-25 curated channels once or twice a day stays
 * comfortably inside YouTube's 10,000 units/day default quota.
 *
 * Throws `YouTubeNotConfiguredError` (via the underlying client calls) if
 * `YOUTUBE_API_KEY` isn't set - callers should catch that and fall back to
 * static/placeholder data rather than let it crash page rendering.
 */
export async function ingestChannel(
  curated: CuratedChannel,
  opts: { maxRecentVideos?: number; maxCommentsPerVideo?: number } = {}
): Promise<IngestedChannel> {
  const maxRecentVideos = opts.maxRecentVideos ?? MAX_RECENT_VIDEOS;
  const maxCommentsPerVideo = opts.maxCommentsPerVideo ?? MAX_COMMENTS_PER_VIDEO;

  const resolved = await resolveChannelByHandle(curated.handle);
  const channelSlug = slugFromHandle(resolved.handle);

  const channelRow: NewChannelRow = {
    id: channelSlug,
    platform: "youtube",
    displayName: curated.displayName || resolved.title,
    handle: resolved.handle,
    externalId: resolved.channelId,
    category: curated.category,
    languageRegion: curated.languageRegion ?? null,
    isLive: true,
    subscriberCount: resolved.subscriberCount,
    lastFetchedAt: new Date(),
  };

  const recentVideos = await getRecentVideos(
    resolved.channelId,
    maxRecentVideos,
    resolved.uploadsPlaylistId ?? undefined
  );

  const stats = await getVideoStats(recentVideos.map((v) => v.videoId));
  const statsByVideoId = new Map(stats.map((s) => [s.videoId, s]));

  const videos: IngestedVideo[] = [];
  for (const video of recentVideos) {
    const videoStats = statsByVideoId.get(video.videoId);
    const topComments = await getTopComments(video.videoId, maxCommentsPerVideo);

    videos.push({
      id: `yt-${video.videoId}`,
      source: "youtube",
      channelId: channelSlug,
      rssSourceId: null,
      title: video.title,
      snippet: video.description ? video.description.slice(0, 500) : null,
      url: video.url,
      publishedAt: new Date(video.publishedAt),
      likeCount: videoStats?.likeCount ?? null,
      commentCount: videoStats?.commentCount ?? null,
      viewCount: videoStats?.viewCount ?? null,
      guessedConstituencyId: null,
      guessedState: curated.expectedPrimaryState ?? null,
      topComments,
    });
  }

  return { channel: channelRow, videos };
}

/**
 * Ingest several curated channels sequentially (not in parallel - keeps
 * concurrent quota usage/rate limits predictable for a cron-style batch
 * job). A failure on one channel (e.g. a stale/wrong handle 404ing) does
 * not abort the others; it's captured in `errors` so the caller can log
 * and skip rather than fail the whole run.
 */
export async function ingestChannels(
  curatedChannels: CuratedChannel[],
  opts: { maxRecentVideos?: number; maxCommentsPerVideo?: number } = {}
): Promise<{ results: IngestedChannel[]; errors: Array<{ handle: string; error: unknown }> }> {
  const results: IngestedChannel[] = [];
  const errors: Array<{ handle: string; error: unknown }> = [];

  for (const curated of curatedChannels) {
    try {
      results.push(await ingestChannel(curated, opts));
    } catch (error) {
      errors.push({ handle: curated.handle, error });
    }
  }

  return { results, errors };
}
