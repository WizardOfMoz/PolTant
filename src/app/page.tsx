import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Database,
  ExternalLink,
  TrendingUp,
  Video,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { constituencies } from "@/data/constituencies";
import { getChannelsWithLiveData } from "@/lib/pipeline/channels";
import { getGrowthAlerts, type GrowthAlert } from "@/lib/pipeline/alerts";
import type { Platform } from "@/data/dummy-channels";
import {
  TIER_COLORS,
  TIER_ORDER,
  SENTIMENT_NEGATIVE,
  SENTIMENT_NEUTRAL,
  SENTIMENT_POSITIVE,
} from "@/lib/palette";

const PLATFORM_LABEL: Record<Platform, string> = {
  youtube: "YouTube",
  x: "X",
  instagram: "Instagram",
  facebook: "Facebook",
};

function sentimentColor(score: number): string {
  if (score > 0.15) return SENTIMENT_POSITIVE;
  if (score < -0.15) return SENTIMENT_NEGATIVE;
  return SENTIMENT_NEUTRAL;
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FormattedLeaderboard } from "@/components/charts/formatted-leaderboard";

// This page calls live-fetching pipeline functions (getChannelsWithLiveData,
// getGrowthAlerts). Those functions are cached internally via
// unstable_cache, but the *page* itself must not be statically prerendered
// at build time — a build has no API keys / DB connection, and a static
// prerender would bake in a permanent "not configured" result. Rendering
// per-request keeps the page fresh while the pipeline cache keeps it cheap.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Overview — Constituency Pulse",
};

/** Small inline error state for a single section — a pipeline failure here
 *  should never blank the rest of the page. */
function SectionErrorAlert({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertTriangle />
      <AlertTitle>Couldn&apos;t load this section</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function toErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function Hero() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
      <p className="max-w-2xl text-muted-foreground">
        A national-level summary of the tracked constituencies and channels this dashboard
        follows: how the seats break down by competitiveness, which curated channels have the
        largest reach, their most recent public videos, and which channels are gaining
        subscribers fastest.
      </p>
      <p className="text-sm text-muted-foreground">
        See{" "}
        <Link href="/methodology" className="underline underline-offset-2 hover:text-foreground">
          Methodology
        </Link>{" "}
        for data sources, scope, and limitations.
      </p>
    </div>
  );
}

function TierSummary() {
  const counts: Record<string, number> = {};
  for (const tier of TIER_ORDER) counts[tier] = 0;
  for (const c of constituencies) counts[c.tier] = (counts[c.tier] ?? 0) + 1;
  const stateCount = new Set(constituencies.map((c) => c.state)).size;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium">Tracked constituencies by swing tier</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TIER_ORDER.map((tier) => (
          <Card key={tier}>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold tabular-nums">{counts[tier]}</p>
                <p className="text-sm text-muted-foreground">{tier}</p>
              </div>
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: TIER_COLORS[tier] }}
                aria-hidden
              />
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {constituencies.length} constituencies tracked across {stateCount} states/UTs. Tiers are
        computed from real historical margin/flip data — see{" "}
        <Link href="/methodology" className="underline underline-offset-2 hover:text-foreground">
          Methodology
        </Link>
        .
      </p>
    </section>
  );
}

/**
 * "Channels to watch" and "Recent coverage" both read from the same
 * getChannelsWithLiveData() call (one pipeline, so a single fetch/try-catch
 * naturally covers both). A failure here is still isolated from the
 * constituency summary above and the growth-alerts section below.
 *
 * Tracked channels are fictional personas (see /methodology) — their
 * stats/content are illustrative, not fetched from a real API — so
 * `youtubeConfigured` is effectively always true now; the branch below is
 * kept only because it costs nothing to leave a graceful fallback in place.
 */
async function ChannelsAndCoverage() {
  let result: Awaited<ReturnType<typeof getChannelsWithLiveData>>;
  try {
    result = await getChannelsWithLiveData();
  } catch (err) {
    const message = toErrorMessage(err);
    return (
      <>
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Channels to watch</h2>
          <SectionErrorAlert message={message} />
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Recent coverage</h2>
          <SectionErrorAlert message={message} />
        </section>
      </>
    );
  }

  const { youtubeConfigured, channels } = result;

  if (!youtubeConfigured) {
    return (
      <>
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Channels to watch</h2>
          <Alert>
            <Video />
            <AlertTitle>Channel data unavailable</AlertTitle>
            <AlertDescription>
              The {channels.length} curated channels below have no illustrative stats/videos to
              show right now. See <Link href="/methodology">Methodology</Link> for how this
              section works.
            </AlertDescription>
          </Alert>
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Recent coverage</h2>
          <p className="text-sm text-muted-foreground">
            No recent videos to show right now — see the section above.
          </p>
        </section>
      </>
    );
  }

  const liveWithSubs = channels
    .filter((c) => c.isLive && c.subscriberCount != null)
    .sort((a, b) => (b.subscriberCount ?? 0) - (a.subscriberCount ?? 0));
  const topBySubs = liveWithSubs.slice(0, 8);

  const allVideos = channels.flatMap((c) =>
    c.recentVideos.map((v) => ({ ...v, channelName: c.displayName, platform: c.platform }))
  );
  const recentVideos = [...allVideos]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 6);

  return (
    <>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Channels to watch</h2>
          <Link
            href="/channels"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            View all channels <ArrowRight className="size-3.5" />
          </Link>
        </div>
        {topBySubs.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Top tracked channels by subscribers</CardTitle>
              </CardHeader>
              <CardContent>
                <FormattedLeaderboard
                  data={topBySubs.map((c) => ({
                    label: c.displayName,
                    value: c.subscriberCount ?? 0,
                  }))}
                  format="subscribers"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Category mix</CardTitle>
                <CardDescription>Of {channels.length} curated channels tracked</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {topBySubs.slice(0, 6).map((c) => (
                  <div key={c.handle} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{c.displayName}</span>
                    <Badge variant="outline" className="shrink-0">
                      {c.category === "established-influencer" ? "Established" : "Rising new-media"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Alert>
            <AlertTitle>No live channel data on this request</AlertTitle>
            <AlertDescription>
              A YouTube API key is configured, but no channel returned usable subscriber data —
              this can happen on transient API errors. Try refreshing.
            </AlertDescription>
          </Alert>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Recent coverage</h2>
        {recentVideos.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentVideos.map((v) => (
              <Card key={v.url}>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      {v.channelName} · {PLATFORM_LABEL[v.platform]}
                    </p>
                    {!v.unavailable && (
                      <span
                        className="shrink-0 text-xs font-medium tabular-nums"
                        style={{ color: sentimentColor(v.sentimentScore) }}
                      >
                        {v.sentimentScore.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start gap-1 text-sm font-medium hover:underline"
                  >
                    <span className="line-clamp-2">{v.title}</span>
                    <ExternalLink className="mt-0.5 size-3 shrink-0" />
                  </a>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {v.viewCount != null && <span>{v.viewCount.toLocaleString()} views</span>}
                    {v.likeCount != null && <span>{v.likeCount.toLocaleString()} likes</span>}
                    {v.commentCount != null && (
                      <span>{v.commentCount.toLocaleString()} comments</span>
                    )}
                  </div>
                  {!v.unavailable && v.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {v.topics.slice(0, 3).map((topic) => (
                        <Badge key={topic} variant="outline" className="text-[10px]">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No recent video data returned on this request.
          </p>
        )}
      </section>
    </>
  );
}

function RisingChannelsHeader() {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-medium">Rising channels</h2>
      <Link
        href="/alerts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        View all alerts <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

async function RisingChannels() {
  let result: Awaited<ReturnType<typeof getGrowthAlerts>>;
  try {
    result = await getGrowthAlerts();
  } catch (err) {
    return (
      <section className="space-y-3">
        <RisingChannelsHeader />
        <SectionErrorAlert message={toErrorMessage(err)} />
      </section>
    );
  }

  if (!result.databaseConfigured) {
    return (
      <section className="space-y-3">
        <RisingChannelsHeader />
        <Alert>
          <Database />
          <AlertTitle>Growth tracking isn&apos;t set up yet</AlertTitle>
          <AlertDescription>
            Rising-channel alerts need a connected database (<code>DATABASE_URL</code>) plus at
            least two recorded subscriber snapshots over time for a channel before a real growth
            percentage exists. Check back after this has been running for a while.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  const withGrowth = result.alerts.filter(
    (a): a is GrowthAlert & { growthPct: number } => a.growthPct != null
  );

  if (withGrowth.length === 0) {
    return (
      <section className="space-y-3">
        <RisingChannelsHeader />
        <Alert>
          <TrendingUp />
          <AlertTitle>Not enough history yet</AlertTitle>
          <AlertDescription>
            A database is connected, but at least two snapshots over time are needed per channel
            before growth percentages can be computed. Check back after this has been running for
            a while.
          </AlertDescription>
        </Alert>
      </section>
    );
  }

  const top = withGrowth.slice(0, 5);

  return (
    <section className="space-y-3">
      <RisingChannelsHeader />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {top.map((a) => (
          <Card key={a.handle}>
            <CardContent className="space-y-1">
              <p className="truncate text-sm font-medium">{a.displayName}</p>
              <p
                className={cn(
                  "text-xl font-semibold tabular-nums",
                  a.growthPct < 0 ? "text-destructive" : "text-foreground"
                )}
              >
                {a.growthPct > 0 ? "+" : ""}
                {a.growthPct}%
              </p>
              <p className="text-xs text-muted-foreground">
                {a.latestSubscriberCount?.toLocaleString() ?? "—"} subscribers
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default async function Home() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
      <Hero />
      <TierSummary />
      <ChannelsAndCoverage />
      <RisingChannels />
    </div>
  );
}
