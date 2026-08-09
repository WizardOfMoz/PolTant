/**
 * Issue drill-down page — every topic badge across the app links here
 * (constituency briefs, analyzed-content topic chips, etc. — see
 * `src/lib/topic-slug.ts`, which owns the slug<->topic contract this page
 * depends on).
 *
 * Built entirely from `getAllPosts()` + `analyzePost()`
 * (`src/data/mock/mock-analysis.ts`) so the core sections (sentiment trend,
 * top accounts, top constituencies) are fully self-consistent. The
 * cross-platform amplification section is the one exception: it does a
 * best-effort join against `graph.ts`'s separately-built issue taxonomy,
 * which only partially overlaps `TOPIC_VOCABULARY` (see AGENTS.md's
 * taxonomy note) — a topic with no matching graph node, or zero matching
 * events, is an expected, honest empty state, not a bug.
 */

import Link from "next/link";
import { notFound } from "next/navigation";

import { ACCOUNTS } from "@/data/mock/accounts";
import { getAllPosts, getPostsForAccount, type Post } from "@/data/mock/posts";
import { analyzePost } from "@/data/mock/mock-analysis";
import { constituencies } from "@/data/constituencies";
import { getAllAmplificationEvents } from "@/data/mock/amplification";
import { buildIntelligenceGraph } from "@/data/mock/graph";
import { unslugifyTopic } from "@/lib/topic-slug";
import { PLATFORM_LABEL } from "@/lib/account-metrics";
import { SentimentLineChart, type SentimentPoint } from "@/components/charts/sentiment-line-chart";
import { SENTIMENT_NEGATIVE, SENTIMENT_NEUTRAL, SENTIMENT_POSITIVE } from "@/lib/palette";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Below this many matched posts, a sentiment-over-time chart would be more
 *  misleading than informative (mostly empty/singleton buckets), so an
 *  aggregate number is shown instead — same "too little data" pattern used
 *  on the constituency detail page. */
const MIN_POSTS_FOR_TIMESERIES = 6;

/** How many ranked rows to show in the top-accounts / top-constituencies
 *  leaderboards below. */
const MAX_RANKED_ROWS = 8;

/** How many individual posts to sample in the "Recent content" section. */
const MAX_SAMPLE_POSTS = 6;

interface PageParams {
  params: Promise<{ issueSlug: string }>;
}

function average(scores: number[]): number {
  if (scores.length === 0) return 0;
  return Math.round((scores.reduce((sum, v) => sum + v, 0) / scores.length) * 100) / 100;
}

/** Sentiment polarity color, matching the diverging blue/red convention used
 *  everywhere else in the app (see src/lib/palette.ts). */
function sentimentColor(score: number): string {
  if (score > 0.05) return SENTIMENT_POSITIVE;
  if (score < -0.05) return SENTIMENT_NEGATIVE;
  return SENTIMENT_NEUTRAL;
}

/** Buckets posts into 7-day windows (from the earliest matched post onward)
 *  and averages `analyzePost().sentimentScore` within each window — same
 *  style as the helper that used to live inline in the constituency detail
 *  page, rewritten locally here since this page has its own working set. */
function bucketSentimentByWeek(posts: Post[]): SentimentPoint[] {
  if (posts.length === 0) return [];
  const withMs = posts
    .map((post) => ({ post, ms: Date.parse(post.publishedAt) }))
    .sort((a, b) => a.ms - b.ms);
  const startMs = withMs[0].ms;

  const buckets = new Map<number, { label: string; scores: number[] }>();
  for (const { post, ms } of withMs) {
    const index = Math.floor((ms - startMs) / (7 * DAY_MS));
    const bucketStartMs = startMs + index * 7 * DAY_MS;
    const label = new Date(bucketStartMs).toISOString().slice(0, 10);
    const bucket = buckets.get(index) ?? { label, scores: [] };
    bucket.scores.push(analyzePost(post).sentimentScore);
    buckets.set(index, bucket);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, bucket]) => ({ date: bucket.label, sentiment: average(bucket.scores) }));
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export async function generateMetadata({ params }: PageParams) {
  const { issueSlug } = await params;
  const topic = unslugifyTopic(issueSlug);
  return {
    title: topic ? `${topic} — Constituency Pulse` : "Issue not found — Constituency Pulse",
  };
}

export default async function IssueDetailPage({ params }: PageParams) {
  const { issueSlug } = await params;
  const topic = unslugifyTopic(issueSlug);
  if (!topic) notFound();

  const matchedPosts = getAllPosts().filter((post) => analyzePost(post).topics.includes(topic));
  const analyzedPosts = matchedPosts
    .map((post) => ({ post, analysis: analyzePost(post) }))
    .sort((a, b) => (a.post.publishedAt < b.post.publishedAt ? 1 : -1));
  const aggregateSentiment = average(analyzedPosts.map((entry) => entry.analysis.sentimentScore));
  const sentimentSeries = bucketSentimentByWeek(matchedPosts);

  const accountRows = ACCOUNTS.map((account) => {
    const accountTopicPosts = getPostsForAccount(account.id).filter((post) =>
      analyzePost(post).topics.includes(topic)
    );
    return {
      account,
      count: accountTopicPosts.length,
      avgSentiment: average(accountTopicPosts.map((post) => analyzePost(post).sentimentScore)),
    };
  })
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count || b.account.baseFollowerCount - a.account.baseFollowerCount)
    .slice(0, MAX_RANKED_ROWS);

  const constituencyRows = constituencies
    .map((constituency) => {
      const posts = matchedPosts.filter((post) => post.guessedConstituencyId === constituency.id);
      return {
        constituency,
        count: posts.length,
        avgSentiment: average(posts.map((post) => analyzePost(post).sentimentScore)),
      };
    })
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_RANKED_ROWS);

  // Best-effort join into graph.ts's separately-built issue taxonomy — see
  // AGENTS.md's taxonomy note. A missing node, or zero matching events, is
  // an honest expected outcome for some topics.
  const graph = buildIntelligenceGraph();
  const matchingIssueNode = graph.nodes.find((node) => node.type === "issue" && node.label === topic);
  const amplificationEvents = matchingIssueNode
    ? getAllAmplificationEvents().filter((event) => event.issueId === matchingIssueNode.id)
    : [];

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <div className="space-y-3">
        <Link
          href="/"
          className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          ← Constituency Pulse
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{topic}</h1>
          <Badge variant="secondary">{matchedPosts.length} matched posts</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Issue-level drill-down aggregated across every analyzed post mentioning this topic.
        </p>
      </div>

      {matchedPosts.length === 0 ? (
        <Alert>
          <AlertTitle>No matched content</AlertTitle>
          <AlertDescription>
            No content has been matched to this issue in the current dataset. This can happen for
            topics that only ever appear alongside other, more dominant topics on a post.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-medium">Sentiment over time</h2>
            {matchedPosts.length < MIN_POSTS_FOR_TIMESERIES ? (
              <Card>
                <CardContent className="space-y-2 pt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Aggregate sentiment</span>
                    <span
                      className="font-medium"
                      style={{ color: sentimentColor(aggregateSentiment) }}
                    >
                      {aggregateSentiment.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Only {matchedPosts.length} matched post{matchedPosts.length === 1 ? "" : "s"}{" "}
                    were found for this issue — too few to plot a meaningful trend line, so an
                    aggregate score is shown instead.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-4">
                  <SentimentLineChart data={sentimentSeries} />
                </CardContent>
              </Card>
            )}
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-medium">Top accounts discussing this issue</h2>
            {accountRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No accounts have posted matched content for this issue.
              </p>
            ) : (
              <div className="space-y-2">
                {accountRows.map(({ account, count, avgSentiment }) => (
                  <Link key={account.id} href={`/channels/${account.id}`} className="block">
                    <Card className="transition-colors hover:bg-muted/50">
                      <CardContent className="flex items-center justify-between gap-3 pt-4">
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-sm font-medium">
                            {account.displayName}{" "}
                            <span className="text-muted-foreground">{account.handle}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {PLATFORM_LABEL[account.platform]} ·{" "}
                            {account.baseFollowerCount.toLocaleString("en-IN")} followers
                          </p>
                        </div>
                        <div className="shrink-0 space-y-0.5 text-right">
                          <p className="text-sm font-medium">
                            {count} post{count === 1 ? "" : "s"}
                          </p>
                          <p
                            className="text-xs font-medium"
                            style={{ color: sentimentColor(avgSentiment) }}
                          >
                            avg sentiment {avgSentiment.toFixed(2)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-medium">Top constituencies discussing this issue</h2>
            {constituencyRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No constituency-matched content is available for this issue.
              </p>
            ) : (
              <div className="space-y-2">
                {constituencyRows.map(({ constituency, count, avgSentiment }) => (
                  <Link
                    key={constituency.id}
                    href={`/constituencies/${constituency.id}`}
                    className="block"
                  >
                    <Card className="transition-colors hover:bg-muted/50">
                      <CardContent className="flex items-center justify-between gap-3 pt-4">
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-sm font-medium">{constituency.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {constituency.state} · PC #{constituency.pcNumber}
                          </p>
                        </div>
                        <div className="shrink-0 space-y-0.5 text-right">
                          <p className="text-sm font-medium">
                            {count} post{count === 1 ? "" : "s"}
                          </p>
                          <p
                            className="text-xs font-medium"
                            style={{ color: sentimentColor(avgSentiment) }}
                          >
                            avg sentiment {avgSentiment.toFixed(2)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-medium">Recent content mentioning this issue</h2>
            <div className="space-y-2">
              {analyzedPosts.slice(0, MAX_SAMPLE_POSTS).map(({ post, analysis }) => {
                const account = ACCOUNTS.find((a) => a.id === post.accountId);
                return (
                  <Card key={post.id}>
                    <CardContent className="space-y-1.5 pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium">{post.title}</p>
                        <span
                          className="shrink-0 text-sm font-medium"
                          style={{ color: sentimentColor(analysis.sentimentScore) }}
                        >
                          {analysis.sentimentScore.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {account?.displayName ?? post.accountId}
                        {account ? ` · ${PLATFORM_LABEL[account.platform]}` : ""} ·{" "}
                        {formatDate(post.publishedAt)}
                      </p>
                      <p className="text-sm text-muted-foreground">{analysis.narrativeSummary}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        </>
      )}

      <Separator />

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Cross-platform amplification</h2>
        {amplificationEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No cross-platform amplification events are currently tagged to this issue.
          </p>
        ) : (
          <div className="space-y-2">
            {amplificationEvents.map((event) => (
              <Card key={event.id}>
                <CardContent className="space-y-1.5 pt-4">
                  <p className="text-sm font-medium">{event.headline}</p>
                  <p className="text-xs text-muted-foreground">
                    {PLATFORM_LABEL[event.originPlatform]} → {PLATFORM_LABEL[event.targetPlatform]}
                    {" · "}
                    {event.hoursDelay}h delay · {event.spreadMultiplier.toFixed(1)}x spread
                    {event.constituencyId
                      ? ` · ${constituencies.find((c) => c.id === event.constituencyId)?.name ?? event.constituencyId}`
                      : ""}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
