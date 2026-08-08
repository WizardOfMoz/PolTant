import {
  pgTable,
  text,
  integer,
  real,
  timestamp,
  boolean,
  serial,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Constituencies tracked by the platform. A curated real subset of Lok Sabha
 * seats (not all 543) — see src/data/constituencies.ts for source citations.
 */
export const constituencies = pgTable("constituencies", {
  id: text("id").primaryKey(), // slug, e.g. "up-varanasi"
  pcNumber: integer("pc_number").notNull(), // ECI PC number, matches topojson properties.PC_NO if present
  name: text("name").notNull(),
  state: text("state").notNull(),
  tier: text("tier").notNull(), // Safe | Lean | Swing | Toss-up
  marginVolatility: real("margin_volatility").notNull(),
  flipFrequency: integer("flip_frequency").notNull(),
  closenessIndex: real("closeness_index").notNull(),
  digitalEngagementIndex: real("digital_engagement_index").notNull(), // 0-100
  digitalEngagementSourceNote: text("digital_engagement_source_note").notNull(),
  coverageTier: text("coverage_tier").notNull(), // Tier 1 | Tier 2 | Tier 3
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Real historical election results per constituency, across cycles. */
export const electionResults = pgTable("election_results", {
  id: serial("id").primaryKey(),
  constituencyId: text("constituency_id")
    .notNull()
    .references(() => constituencies.id),
  year: integer("year").notNull(),
  winningParty: text("winning_party").notNull(),
  runnerUpParty: text("runner_up_party").notNull(),
  marginPct: real("margin_pct").notNull(),
  totalVotes: integer("total_votes").notNull(),
  sourceNote: text("source_note").notNull(),
});

/** Tracked named public accounts/channels — one row per platform per account. */
export const channels = pgTable(
  "channels",
  {
    id: text("id").primaryKey(), // slug
    platform: text("platform").notNull(), // youtube | x | instagram | facebook
    displayName: text("display_name").notNull(),
    handle: text("handle").notNull(),
    externalId: text("external_id").notNull(), // e.g. YouTube channel ID
    category: text("category").notNull(), // established-influencer | rising-new-media
    languageRegion: text("language_region"),
    isLive: boolean("is_live").notNull().default(false), // false until real credentials + fetch succeed
    subscriberCount: integer("subscriber_count"),
    lastFetchedAt: timestamp("last_fetched_at"),
    primaryConstituencyId: text("primary_constituency_id").references(
      () => constituencies.id
    ),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    platformExternal: uniqueIndex("channels_platform_external_idx").on(
      t.platform,
      t.externalId
    ),
  })
);

/** Time-series snapshots of channel stats, used for real growth/anomaly detection. */
export const channelSnapshots = pgTable("channel_snapshots", {
  id: serial("id").primaryKey(),
  channelId: text("channel_id")
    .notNull()
    .references(() => channels.id),
  capturedAt: timestamp("captured_at").defaultNow().notNull(),
  subscriberCount: integer("subscriber_count"),
  viewCount: integer("view_count"),
  videoCount: integer("video_count"),
});

/** Real news RSS sources. */
export const rssSources = pgTable("rss_sources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  feedUrl: text("feed_url").notNull(),
  outletType: text("outlet_type").notNull(), // national | regional
  languageRegion: text("language_region"),
});

/** Real fetched public content — YouTube videos or RSS articles. */
export const content = pgTable("content", {
  id: text("id").primaryKey(),
  source: text("source").notNull(), // "youtube" | "rss"
  channelId: text("channel_id").references(() => channels.id),
  rssSourceId: text("rss_source_id").references(() => rssSources.id),
  title: text("title").notNull(),
  snippet: text("snippet"),
  url: text("url").notNull(),
  publishedAt: timestamp("published_at").notNull(),
  likeCount: integer("like_count"),
  commentCount: integer("comment_count"),
  viewCount: integer("view_count"),
  guessedConstituencyId: text("guessed_constituency_id").references(
    () => constituencies.id
  ),
  guessedState: text("guessed_state"),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
});

/** LLM-computed analysis of a piece of content — real, cached, staleness-checked. */
export const contentAnalysis = pgTable("content_analysis", {
  id: serial("id").primaryKey(),
  contentId: text("content_id")
    .notNull()
    .references(() => content.id),
  sentimentScore: real("sentiment_score").notNull(), // -1..1
  topics: jsonb("topics").notNull(), // string[]
  narrativeSummary: text("narrative_summary").notNull(),
  model: text("model").notNull(),
  analyzedAt: timestamp("analyzed_at").defaultNow().notNull(),
});

/** Cached constituency-level narrative brief, regenerated on staleness check. */
export const narrativeBriefs = pgTable("narrative_briefs", {
  id: serial("id").primaryKey(),
  constituencyId: text("constituency_id")
    .notNull()
    .references(() => constituencies.id),
  windowLabel: text("window_label").notNull(), // e.g. "2026-W32"
  dominantNarrative: text("dominant_narrative").notNull(),
  sentimentScore: real("sentiment_score").notNull(),
  sentimentDelta: real("sentiment_delta"),
  topChannelIds: jsonb("top_channel_ids").notNull(), // string[]
  model: text("model").notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});
