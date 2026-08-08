/**
 * Typed, quota-aware client for the YouTube Data API v3 REST endpoints.
 *
 * Server-only: reads `process.env.YOUTUBE_API_KEY`. Never import this from
 * a Client Component. Deliberately does NOT use the `googleapis` package
 * (not installed, and unnecessary weight for a serverless function calling
 * a handful of REST endpoints) - plain `fetch` against
 * https://www.googleapis.com/youtube/v3/... instead.
 *
 * ---- Quota strategy ----------------------------------------------------
 * YouTube's default project quota is 10,000 units/day. Approximate cost of
 * each endpoint used here, per call (independent of maxResults):
 *   - channels.list        -> 1 unit
 *   - playlistItems.list   -> 1 unit
 *   - videos.list          -> 1 unit (batch up to 50 ids per call)
 *   - commentThreads.list  -> 1 unit
 *   - search.list is NEVER used here (100 units/call!) - recent videos are
 *     fetched via the channel's "uploads" playlist instead, which is the
 *     whole reason getRecentVideos below costs ~2 units instead of ~100.
 *
 * For a full run over ~20-25 tracked channels (resolve + 5 recent videos +
 * batched stats + up to 10 comments/video), the rough per-channel cost is:
 *   1 (resolve, incl. contentDetails)
 *   + 1 (playlistItems for recent videos)
 *   + 1 (videos.list stats, batched across all of that channel's videos)
 *   + up to 5 (commentThreads, one call per video)
 *   = ~8 units/channel -> ~200 units for 25 channels -> comfortably inside
 *   the 10,000/day quota even run several times a day. Every function here
 *   also accepts a maxResults/budget parameter so callers can trim further.
 */

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

/** Thrown by every exported function when YOUTUBE_API_KEY is missing, so
 *  calling code can catch this specific error and fall back gracefully
 *  (e.g. render static/placeholder data) instead of crashing page render. */
export class YouTubeNotConfiguredError extends Error {
  constructor() {
    super("YOUTUBE_API_KEY is not set - YouTube ingestion is disabled.");
    this.name = "YouTubeNotConfiguredError";
  }
}

/** Thrown for any non-2xx response from the YouTube API itself (bad key,
 *  quota exceeded, handle not found, comments disabled, etc). */
export class YouTubeApiError extends Error {
  status?: number;
  endpoint?: string;
  constructor(message: string, status?: number, endpoint?: string) {
    super(message);
    this.name = "YouTubeApiError";
    this.status = status;
    this.endpoint = endpoint;
  }
}

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new YouTubeNotConfiguredError();
  return key;
}

async function youtubeGet<T>(
  endpoint: string,
  params: Record<string, string | number>
): Promise<T> {
  const key = getApiKey();
  const url = new URL(`${YOUTUBE_API_BASE}/${endpoint}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }
  url.searchParams.set("key", key);

  const res = await fetch(url.toString(), { method: "GET" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new YouTubeApiError(
      `YouTube API "${endpoint}" failed with ${res.status}: ${body.slice(0, 300)}`,
      res.status,
      endpoint
    );
  }
  return (await res.json()) as T;
}

function numOrNull(v: string | undefined): number | null {
  if (v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// -------------------------------------------------------------------------
// resolveChannelByHandle - 1 quota unit
// -------------------------------------------------------------------------

export interface ResolvedChannel {
  channelId: string;
  /** Normalized (always "@"-prefixed) handle, echoing what was requested. */
  handle: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  subscriberCount: number | null;
  viewCount: number | null;
  videoCount: number | null;
  /** Uploads playlist id, used by getRecentVideos - fetched in the same
   *  call so a caller doesn't need a second request. */
  uploadsPlaylistId: string | null;
}

interface YtChannelListResponse {
  items?: Array<{
    id: string;
    snippet?: {
      title: string;
      description: string;
      thumbnails?: { default?: { url: string }; medium?: { url: string } };
    };
    statistics?: {
      subscriberCount?: string;
      viewCount?: string;
      videoCount?: string;
      hiddenSubscriberCount?: boolean;
    };
    contentDetails?: { relatedPlaylists?: { uploads?: string } };
  }>;
}

/**
 * Resolve a curated real @handle (see src/data/channels.ts) to its real
 * channel ID + current stats. This is the deliberate alternative to
 * hardcoding a channel ID from memory: handles are what a human can
 * actually verify by eye, so we look up the ID at fetch time instead.
 *
 * Cost: 1 quota unit (snippet + statistics + contentDetails all requested
 * in a single call, so getRecentVideos can reuse uploadsPlaylistId without
 * a second lookup).
 */
export async function resolveChannelByHandle(
  handle: string
): Promise<ResolvedChannel> {
  const cleanHandle = handle.startsWith("@") ? handle : `@${handle}`;
  const data = await youtubeGet<YtChannelListResponse>("channels", {
    part: "id,snippet,statistics,contentDetails",
    forHandle: cleanHandle,
  });

  const item = data.items?.[0];
  if (!item) {
    throw new YouTubeApiError(
      `No YouTube channel found for handle ${cleanHandle}`,
      404,
      "channels.forHandle"
    );
  }

  return {
    channelId: item.id,
    handle: cleanHandle,
    title: item.snippet?.title ?? cleanHandle,
    description: item.snippet?.description ?? "",
    thumbnailUrl:
      item.snippet?.thumbnails?.medium?.url ??
      item.snippet?.thumbnails?.default?.url,
    subscriberCount: item.statistics?.hiddenSubscriberCount
      ? null
      : numOrNull(item.statistics?.subscriberCount),
    viewCount: numOrNull(item.statistics?.viewCount),
    videoCount: numOrNull(item.statistics?.videoCount),
    uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads ?? null,
  };
}

// -------------------------------------------------------------------------
// getRecentVideos - via uploads playlist, ~1-2 quota units total
// -------------------------------------------------------------------------

export interface RecentVideo {
  videoId: string;
  title: string;
  description: string;
  /** ISO 8601 publish timestamp. */
  publishedAt: string;
  url: string;
}

interface YtPlaylistItemsResponse {
  items?: Array<{
    contentDetails?: { videoId?: string; videoPublishedAt?: string };
    snippet?: { title?: string; description?: string; publishedAt?: string };
  }>;
}

/**
 * Fetch a channel's most recent uploads via its "uploads" playlist
 * (playlistItems.list, 1 unit) rather than search.list (100 units) - this
 * is a deliberate quota-saving choice, not an oversight. Pass the
 * `uploadsPlaylistId` already resolved by resolveChannelByHandle to skip
 * the extra channels.list lookup (otherwise this fetches it itself for
 * 1 more unit).
 */
export async function getRecentVideos(
  channelId: string,
  maxResults = 5,
  uploadsPlaylistId?: string
): Promise<RecentVideo[]> {
  let playlistId = uploadsPlaylistId;

  if (!playlistId) {
    // 1 unit - only needed if the caller didn't already resolve this.
    const data = await youtubeGet<YtChannelListResponse>("channels", {
      part: "contentDetails",
      id: channelId,
    });
    playlistId = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  }

  if (!playlistId) return [];

  // 1 unit, regardless of maxResults.
  const data = await youtubeGet<YtPlaylistItemsResponse>("playlistItems", {
    part: "snippet,contentDetails",
    playlistId,
    maxResults: Math.min(Math.max(maxResults, 1), 50),
  });

  return (data.items ?? [])
    .filter((it) => Boolean(it.contentDetails?.videoId))
    .map((it) => {
      const videoId = it.contentDetails!.videoId!;
      return {
        videoId,
        title: it.snippet?.title ?? "",
        description: it.snippet?.description ?? "",
        publishedAt:
          it.contentDetails?.videoPublishedAt ??
          it.snippet?.publishedAt ??
          new Date().toISOString(),
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };
    });
}

// -------------------------------------------------------------------------
// getVideoStats - 1 quota unit for up to 50 videos
// -------------------------------------------------------------------------

export interface VideoStats {
  videoId: string;
  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
}

interface YtVideosListResponse {
  items?: Array<{
    id: string;
    statistics?: {
      viewCount?: string;
      likeCount?: string;
      commentCount?: string;
    };
  }>;
}

/**
 * Fetch view/like/comment counts for up to 50 video ids in a single
 * videos.list call (1 unit total, not 1-per-video). If more than 50 ids
 * are passed, only the first 50 are fetched - batch your own calls for
 * larger sets to stay quota-aware.
 */
export async function getVideoStats(
  videoIds: string[]
): Promise<VideoStats[]> {
  if (videoIds.length === 0) return [];
  const batch = videoIds.slice(0, 50);

  const data = await youtubeGet<YtVideosListResponse>("videos", {
    part: "statistics",
    id: batch.join(","),
  });

  return (data.items ?? []).map((it) => ({
    videoId: it.id,
    viewCount: numOrNull(it.statistics?.viewCount),
    likeCount: numOrNull(it.statistics?.likeCount),
    commentCount: numOrNull(it.statistics?.commentCount),
  }));
}

// -------------------------------------------------------------------------
// getTopComments - 1 quota unit, aggregate/text-only, NO commenter identity
// -------------------------------------------------------------------------

/**
 * Aggregate, text-only comment data for sentiment context. Deliberately
 * excludes authorDisplayName / authorChannelUrl / authorChannelId even
 * though the raw YouTube API response includes them - per
 * PROJECT_BRIEF.md and src/db/schema.ts, this platform never stores
 * individual commenter identity, only aggregate counts and comment text
 * for downstream (in-memory) LLM sentiment analysis.
 */
export interface CommentTextOnly {
  text: string;
  likeCount: number;
  publishedAt: string;
}

interface YtCommentThreadsResponse {
  items?: Array<{
    snippet?: {
      topLevelComment?: {
        snippet?: {
          textDisplay?: string;
          likeCount?: number;
          publishedAt?: string;
          // authorDisplayName / authorChannelUrl / authorChannelId also
          // exist on the real API response - intentionally never read.
        };
      };
    };
  }>;
}

/**
 * Fetch up to `maxResults` top-level comments for a video (commentThreads
 * .list, 1 unit). Returns [] (rather than throwing) when comments are
 * disabled on the video, since that's an expected, non-fatal state.
 */
export async function getTopComments(
  videoId: string,
  maxResults = 10
): Promise<CommentTextOnly[]> {
  let data: YtCommentThreadsResponse;
  try {
    data = await youtubeGet<YtCommentThreadsResponse>("commentThreads", {
      part: "snippet",
      videoId,
      maxResults: Math.min(Math.max(maxResults, 1), 100),
      order: "relevance",
      textFormat: "plainText",
    });
  } catch (err) {
    // 403 commentsDisabled (or similar) is an expected outcome, not a
    // failure of the ingestion run - degrade to "no comments" gracefully.
    if (err instanceof YouTubeApiError && err.status === 403) return [];
    throw err;
  }

  return (data.items ?? [])
    .map((it) => it.snippet?.topLevelComment?.snippet)
    .filter(
      (snippet): snippet is NonNullable<typeof snippet> =>
        Boolean(snippet?.textDisplay)
    )
    .map((snippet) => ({
      text: snippet.textDisplay!,
      likeCount: snippet.likeCount ?? 0,
      publishedAt: snippet.publishedAt ?? new Date().toISOString(),
    }));
}
