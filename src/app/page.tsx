import Link from "next/link";
import {
  Bell,
  Flame,
  Gauge,
  MapPin,
  Newspaper,
  ShieldAlert,
  TrendingUp,
  Users,
  BarChart3,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { constituencies } from "@/data/constituencies";
import { ACCOUNTS } from "@/data/mock/accounts";
import { getAllPosts, getRecentPosts, type Post } from "@/data/mock/posts";
import { analyzeAllPosts, type ContentAnalysis } from "@/data/mock/mock-analysis";
import { buildIntelligenceGraph } from "@/data/mock/graph";
import { getAllGrowthHistories, REFERENCE_TODAY } from "@/data/mock/growth-history";
import { getAllAmplificationEvents } from "@/data/mock/amplification";
import { computeGrowthAlerts, getActiveAlertCount } from "@/lib/alerts";
import { computeActionItems, type UrgencyBand } from "@/lib/action-items";
import { slugifyTopic } from "@/lib/topic-slug";
import {
  SENTIMENT_NEGATIVE,
  SENTIMENT_NEUTRAL,
  SENTIMENT_POSITIVE,
} from "@/lib/palette";
import type { Platform } from "@/lib/types";

import { StatCard } from "@/components/dashboard/stat-card";
import { BentoGrid, BentoCard } from "@/components/dashboard/bento-grid";
import { SentimentLineChart } from "@/components/charts/sentiment-line-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const URGENCY_BADGE_VARIANT: Record<
  UrgencyBand,
  "destructive" | "default" | "secondary" | "outline"
> = {
  Critical: "destructive",
  High: "default",
  Watch: "secondary",
  Stable: "outline",
};

export const metadata = {
  title: "Overview — Constituency Pulse",
};

const PLATFORM_LABEL: Record<Platform, string> = {
  youtube: "YouTube",
  x: "X",
  instagram: "Instagram",
  facebook: "Facebook",
};

const PLATFORM_ABBR: Record<Platform, string> = {
  youtube: "YT",
  x: "X",
  instagram: "IG",
  facebook: "FB",
};

function sentimentColor(score: number): string {
  if (score > 0.15) return SENTIMENT_POSITIVE;
  if (score < -0.15) return SENTIMENT_NEGATIVE;
  return SENTIMENT_NEUTRAL;
}

function daysBetween(laterIso: string, earlierIso: string): number {
  const later = new Date(`${laterIso}T00:00:00.000Z`).getTime();
  const earlier = new Date(`${earlierIso}T00:00:00.000Z`).getTime();
  return Math.round((later - earlier) / 86_400_000);
}

const accountsById = new Map(ACCOUNTS.map((a) => [a.id, a]));

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function Hero() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
      <p className="max-w-2xl text-muted-foreground">
        A national-level command center for {ACCOUNTS.length} fictional creator/publisher
        accounts spanning YouTube, X, Instagram, and Facebook — their recent posts,
        computed sentiment and narratives, engagement growth, and the constituencies they cover.
        Every account, post, and metric on this page is fully synthetic — a demo of the
        analytics surface, not live data from any real API or database.
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

// ---------------------------------------------------------------------------
// KPI hero row
// ---------------------------------------------------------------------------

function KpiRow() {
  const posts = getAllPosts();
  const analyses = analyzeAllPosts();
  const analysisByPostId = new Map(analyses.map((a) => [a.postId, a]));

  const overallAvgSentiment =
    analyses.reduce((sum, a) => sum + a.sentimentScore, 0) / Math.max(1, analyses.length);

  const latestPostDate = posts.reduce(
    (max, p) => (p.publishedAt > max ? p.publishedAt : max),
    posts[0]?.publishedAt ?? ""
  );

  let last14Sum = 0;
  let last14Count = 0;
  let prior14Sum = 0;
  let prior14Count = 0;

  for (const post of posts) {
    const analysis = analysisByPostId.get(post.id);
    if (!analysis) continue;
    const age = daysBetween(latestPostDate, post.publishedAt);
    if (age < 14) {
      last14Sum += analysis.sentimentScore;
      last14Count += 1;
    } else if (age < 28) {
      prior14Sum += analysis.sentimentScore;
      prior14Count += 1;
    }
  }

  const last14Avg = last14Count > 0 ? last14Sum / last14Count : null;
  const prior14Avg = prior14Count > 0 ? prior14Sum / prior14Count : null;
  const sentimentDelta =
    last14Avg !== null && prior14Avg !== null
      ? Math.round((last14Avg - prior14Avg) * 100) / 100
      : undefined;

  const activeAlertCount = getActiveAlertCount();

  const criticalConstituencyCount = computeActionItems().filter(
    (item) => item.urgencyBand === "Critical"
  ).length;

  const amplificationThisWeekCount = getAllAmplificationEvents().filter(
    (event) => Date.parse(REFERENCE_TODAY) - Date.parse(event.occurredAt) <= 7 * 86_400_000
  ).length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <StatCard size="sm" label="Accounts tracked" value={ACCOUNTS.length} icon={<Users />} />
      <StatCard
        size="sm"
        label="Constituencies tracked"
        value={constituencies.length}
        icon={<MapPin />}
      />
      <StatCard
        size="sm"
        label="Avg. sentiment"
        value={Math.round(overallAvgSentiment * 100) / 100}
        icon={<Gauge />}
        decimalPlaces={2}
        prefix={overallAvgSentiment >= 0 ? "+" : undefined}
        delta={sentimentDelta}
        deltaLabel="vs prior 14 days"
        deltaUnit=" pts"
        deltaDecimalPlaces={2}
      />
      <StatCard size="sm" label="Active growth alerts" value={activeAlertCount} icon={<Bell />} />
      <StatCard
        size="sm"
        label="Critical constituencies"
        value={criticalConstituencyCount}
        icon={<ShieldAlert />}
      />
      <StatCard
        size="sm"
        label="Amplification this week"
        value={amplificationThisWeekCount}
        icon={<Zap />}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bento grid: top narratives / highest engagement / rising accounts
// ---------------------------------------------------------------------------

function TopNarrativesCard() {
  const graph = buildIntelligenceGraph();
  const issueNodes = graph.nodes
    .filter((n) => n.type === "issue")
    .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
    .slice(0, 6);

  const driversForIssue = (issueId: string) =>
    graph.edges
      .filter((e) => e.type === "DRIVEN_BY" && e.source === issueId)
      .map((e) => accountsById.get(e.target))
      .filter((a): a is (typeof ACCOUNTS)[number] => Boolean(a))
      .slice(0, 3);

  return (
    <BentoCard
      className="sm:col-span-2 lg:col-span-2 lg:row-span-2"
      eyebrow="This week"
      title="Top narratives"
      description="Most-discussed issues, by tracked-account mentions"
      icon={<Flame />}
      href="/network"
      cta="Explore the network"
    >
      <div className="space-y-2.5">
        {issueNodes.map((issue) => (
          <div key={issue.id} className="space-y-1">
            <Link href={`/issues/${slugifyTopic(issue.label)}`}>
              <Badge variant="secondary" className="max-w-full truncate text-[11px] font-medium">
                {issue.label}
              </Badge>
            </Link>
            <div className="flex flex-wrap gap-1">
              {driversForIssue(issue.id).map((account) => (
                <Badge key={account.id} variant="outline" className="text-[10px]">
                  {account.displayName}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </BentoCard>
  );
}

function HighestEngagementCard() {
  const ranked = getAllGrowthHistories()
    .map((history) => {
      const account = accountsById.get(history.accountId);
      const latest = history.snapshots[history.snapshots.length - 1];
      if (!account || !latest) return null;
      return { account, engagementRate: latest.engagementRate };
    })
    .filter((row): row is { account: (typeof ACCOUNTS)[number]; engagementRate: number } =>
      Boolean(row)
    )
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, 5);

  return (
    <BentoCard
      className="lg:col-span-1"
      eyebrow="Right now"
      title="Highest engagement"
      description="Latest engagement rate, all platforms"
      icon={<BarChart3 />}
      href="/leaderboard"
      cta="View leaderboard"
    >
      <div className="space-y-1.5">
        {ranked.map((row, i) => (
          <div key={row.account.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 truncate">
              <span className="text-xs text-muted-foreground">{i + 1}</span>
              <span className="truncate">{row.account.displayName}</span>
            </span>
            <span className="shrink-0 font-medium tabular-nums text-foreground">
              {(row.engagementRate * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </BentoCard>
  );
}

function RisingAccountsCard() {
  const rising = computeGrowthAlerts()
    .filter((a) => a.direction === "up")
    .slice(0, 5);

  return (
    <BentoCard
      className="lg:col-span-1"
      eyebrow="Last 14 days"
      title="Rising accounts"
      description="Trailing-window growth ≥ 12%"
      icon={<TrendingUp />}
      href="/alerts"
      cta="View all alerts"
    >
      <div className="space-y-1.5">
        {rising.length > 0 ? (
          rising.map((a) => (
            <div key={a.accountId} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate">{a.displayName}</span>
              <span
                className="shrink-0 font-medium tabular-nums"
                style={{ color: SENTIMENT_POSITIVE }}
              >
                +{a.growthPct}%
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No accounts crossed the threshold.</p>
        )}
      </div>
    </BentoCard>
  );
}

function NeedsAttentionCard() {
  const items = computeActionItems().slice(0, 3);

  return (
    <BentoCard
      className="sm:col-span-2 lg:col-span-2"
      eyebrow="War Room"
      title="Needs attention"
      description="Highest-urgency constituencies right now"
      icon={<ShieldAlert />}
      href="/war-room"
      cta="Open War Room"
    >
      <div className="grid gap-2 sm:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.constituencyId}
            className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/30 p-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-sm font-medium text-foreground">
                {item.constituencyName}
                <span className="block text-xs font-normal text-muted-foreground">
                  {item.state}
                </span>
              </p>
              <Badge variant={URGENCY_BADGE_VARIANT[item.urgencyBand]} className="shrink-0 text-[10px]">
                {item.urgencyBand}
              </Badge>
            </div>
            <p className="line-clamp-2 text-xs text-muted-foreground">{item.recommendedAction}</p>
          </div>
        ))}
      </div>
    </BentoCard>
  );
}

// ---------------------------------------------------------------------------
// Sentiment trend
// ---------------------------------------------------------------------------

function SentimentTrendSection() {
  const posts = getAllPosts();
  const analysisByPostId = new Map(analyzeAllPosts().map((a) => [a.postId, a] as const));

  const byDate = new Map<string, { sum: number; count: number }>();
  for (const post of posts) {
    const analysis = analysisByPostId.get(post.id);
    if (!analysis) continue;
    const entry = byDate.get(post.publishedAt) ?? { sum: 0, count: 0 };
    entry.sum += analysis.sentimentScore;
    entry.count += 1;
    byDate.set(post.publishedAt, entry);
  }

  const trend = Array.from(byDate.entries())
    .map(([date, { sum, count }]) => ({ date, sentiment: Math.round((sum / count) * 100) / 100 }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const nationalAvg =
    trend.reduce((sum, p) => sum + p.sentiment, 0) / Math.max(1, trend.length);

  const amplificationMarkers = getAllAmplificationEvents()
    .slice()
    .sort((a, b) => b.spreadMultiplier - a.spreadMultiplier)
    .slice(0, 3)
    .map((event) => ({
      date: event.occurredAt,
      // Short platform-pair code (e.g. "IG→X") rather than a headline
      // excerpt — two of the top-3 events land on adjacent days, and a
      // longer text label there overlaps illegibly with its neighbor.
      label: `${PLATFORM_ABBR[event.originPlatform]}→${PLATFORM_ABBR[event.targetPlatform]}`,
    }));

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium">National sentiment trend</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Daily average sentiment across all tracked posts</CardTitle>
          <CardDescription>
            Aggregated from every tracked account&apos;s posts over the last 30 days, computed via
            the rule-based analysis engine described in{" "}
            <Link href="/methodology" className="underline underline-offset-2 hover:text-foreground">
              Methodology
            </Link>
            . Dashed vertical markers flag the top cross-platform amplification events by spread
            multiplier — see the{" "}
            <Link href="/network" className="underline underline-offset-2 hover:text-foreground">
              Network
            </Link>{" "}
            view for the full amplification picture.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SentimentLineChart
            data={trend}
            height={260}
            markers={amplificationMarkers}
            referenceValue={Math.round(nationalAvg * 100) / 100}
            referenceLabel="30-day avg"
          />
        </CardContent>
      </Card>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Recent coverage
// ---------------------------------------------------------------------------

function RecentCoverageCard({ post, analysis }: { post: Post; analysis: ContentAnalysis }) {
  const account = accountsById.get(post.accountId);

  return (
    <Card>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-muted-foreground">
            {account?.displayName ?? "Unknown account"}
            {account && ` · ${PLATFORM_LABEL[account.platform]}`}
          </p>
          <span
            className="shrink-0 text-xs font-medium tabular-nums"
            style={{ color: sentimentColor(analysis.sentimentScore) }}
          >
            {analysis.sentimentScore > 0 ? "+" : ""}
            {analysis.sentimentScore.toFixed(2)}
          </span>
        </div>
        <p className="line-clamp-2 text-sm font-medium">{post.title}</p>
        <p className="line-clamp-2 text-xs text-muted-foreground">{post.snippet}</p>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>{post.viewCount.toLocaleString()} views</span>
          <span>{post.likeCount.toLocaleString()} likes</span>
          <span>{post.commentCount.toLocaleString()} comments</span>
        </div>
        {analysis.topics.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {analysis.topics.slice(0, 3).map((topic) => (
              <Badge key={topic} variant="outline" className="text-[10px]">
                {topic}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentCoverageSection() {
  const recentPosts = getRecentPosts(6);
  const analysisByPostId = new Map(analyzeAllPosts().map((a) => [a.postId, a] as const));

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-medium">
          <Newspaper className="size-4.5 text-muted-foreground" />
          Recent coverage
        </h2>
        <Link
          href="/channels"
          className={cn(
            "inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          )}
        >
          View all accounts
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {recentPosts.map((post) => {
          const analysis = analysisByPostId.get(post.id);
          if (!analysis) return null;
          return <RecentCoverageCard key={post.id} post={post} analysis={analysis} />;
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
      <Hero />
      <KpiRow />
      <BentoGrid className="lg:grid-cols-4">
        <TopNarrativesCard />
        <HighestEngagementCard />
        <RisingAccountsCard />
        <NeedsAttentionCard />
      </BentoGrid>
      <SentimentTrendSection />
      <RecentCoverageSection />
    </div>
  );
}
