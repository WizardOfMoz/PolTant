import { unstable_cache } from "next/cache";
import { getDb, schema } from "@/db/client";
import { DUMMY_CHANNELS } from "@/data/dummy-channels";
import { desc, eq } from "drizzle-orm";

/**
 * Real rising-channel growth alerts, computed from actual snapshots
 * recorded over time by src/lib/pipeline/channels.ts (each time its 1h
 * cache refreshes and DATABASE_URL is configured). This is the one feature
 * that genuinely needs cross-time persistence — Next's Data Cache alone
 * can't compare "now" against "an hour/day ago" once a value is evicted.
 *
 * Honest limitation, surfaced to the caller rather than hidden: with no
 * DATABASE_URL, or fewer than two recorded snapshots yet for a channel,
 * there is nothing true to say about its growth — we report that
 * explicitly instead of fabricating a number.
 */

export interface GrowthAlert {
  handle: string;
  displayName: string;
  category: string;
  latestSubscriberCount: number | null;
  previousSubscriberCount: number | null;
  /** Percent change between the two most recent snapshots, or null if
   *  fewer than two snapshots exist yet. */
  growthPct: number | null;
  latestCapturedAt: string;
  previousCapturedAt: string | null;
}

export interface AlertsResult {
  databaseConfigured: boolean;
  /** True once every tracked channel has at least 2 snapshots, meaning
   *  growth figures below are real rather than partially unavailable. */
  alerts: GrowthAlert[];
}

async function computeGrowthAlerts(): Promise<AlertsResult> {
  const db = getDb();
  if (!db) return { databaseConfigured: false, alerts: [] };

  const alerts: GrowthAlert[] = [];

  for (const curated of DUMMY_CHANNELS) {
    const handleSlug = `yt-${curated.handle.replace(/^@/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

    const channelRow = await db.query.channels.findFirst({
      where: (t, { eq: eqOp }) => eqOp(t.id, handleSlug),
    });
    if (!channelRow) continue;

    const snapshots = await db
      .select()
      .from(schema.channelSnapshots)
      .where(eq(schema.channelSnapshots.channelId, handleSlug))
      .orderBy(desc(schema.channelSnapshots.capturedAt))
      .limit(2);

    if (snapshots.length === 0) continue;

    const [latest, previous] = snapshots;
    const growthPct =
      previous && latest.subscriberCount != null && previous.subscriberCount != null && previous.subscriberCount > 0
        ? Math.round(
            ((latest.subscriberCount - previous.subscriberCount) / previous.subscriberCount) *
              1000 *
              100
          ) / 1000
        : null;

    alerts.push({
      handle: curated.handle,
      displayName: channelRow.displayName,
      category: channelRow.category,
      latestSubscriberCount: latest.subscriberCount,
      previousSubscriberCount: previous?.subscriberCount ?? null,
      growthPct,
      latestCapturedAt: latest.capturedAt.toISOString(),
      previousCapturedAt: previous?.capturedAt.toISOString() ?? null,
    });
  }

  alerts.sort((a, b) => (b.growthPct ?? -Infinity) - (a.growthPct ?? -Infinity));

  return { databaseConfigured: true, alerts };
}

export const getGrowthAlerts = unstable_cache(computeGrowthAlerts, ["growth-alerts-v1"], {
  revalidate: 1800,
});
