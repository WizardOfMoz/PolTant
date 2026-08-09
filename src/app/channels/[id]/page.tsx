import Link from "next/link";
import { notFound } from "next/navigation";

import { getAccountById } from "@/lib/account-metrics";
import { CATEGORY_LABEL, PLATFORM_LABEL, resolveConstituencyLabel } from "@/lib/account-metrics";
import { getGrowthHistory } from "@/data/mock/growth-history";
import { getPostsForAccount } from "@/data/mock/posts";
import { analyzePost } from "@/data/mock/mock-analysis";
import { AccountAvatar } from "@/components/accounts/account-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SENTIMENT_NEGATIVE, SENTIMENT_NEUTRAL, SENTIMENT_POSITIVE } from "@/lib/palette";
import { FollowerGrowthChart } from "./follower-growth-chart";

interface PageParams {
  params: Promise<{ id: string }>;
}

const countFormatter = new Intl.NumberFormat("en-US", { notation: "compact" });

function formatCount(value: number): string {
  return countFormatter.format(value);
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function sentimentColor(score: number): string {
  if (score > 0.15) return SENTIMENT_POSITIVE;
  if (score < -0.15) return SENTIMENT_NEGATIVE;
  return SENTIMENT_NEUTRAL;
}

export async function generateMetadata({ params }: PageParams) {
  const { id } = await params;
  const account = getAccountById(id);
  return {
    title: account ? `${account.displayName} — Constituency Pulse` : "Account not found — Constituency Pulse",
  };
}

export default async function AccountDetailPage({ params }: PageParams) {
  const { id } = await params;
  const account = getAccountById(id);
  if (!account) notFound();

  const history = getGrowthHistory(account.id);
  const chartData = (history?.snapshots ?? []).map((snapshot) => ({
    date: snapshot.date,
    followerCount: snapshot.followerCount,
  }));
  const latestSnapshot = history?.snapshots[history.snapshots.length - 1];

  const linkedAccounts = (account.linkedAccountIds ?? [])
    .map((linkedId) => getAccountById(linkedId))
    .filter((linked): linked is NonNullable<typeof linked> => Boolean(linked));

  const posts = getPostsForAccount(account.id)
    .slice()
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0));

  const constituencyLabel = resolveConstituencyLabel(account.primaryConstituencyId);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <div className="space-y-4">
        <Link
          href="/channels"
          className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          ← All accounts
        </Link>

        <div className="flex flex-wrap items-start gap-4">
          <AccountAvatar seed={account.avatarSeed} name={account.displayName} size="lg" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{account.displayName}</h1>
              <Badge variant="secondary">{PLATFORM_LABEL[account.platform]}</Badge>
              <Badge variant="outline">{CATEGORY_LABEL[account.category]}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{account.handle}</p>
            <p className="text-sm text-muted-foreground">
              {account.languageRegion}
              {constituencyLabel ? ` · ${constituencyLabel}` : ""}
            </p>
          </div>
        </div>

        <p className="text-sm text-foreground/90">{account.bio}</p>

        {linkedAccounts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Also on:</span>
            {linkedAccounts.map((linked) => (
              <Link key={linked.id} href={`/channels/${linked.id}`}>
                <Badge variant="outline" className="gap-1">
                  {PLATFORM_LABEL[linked.platform]}
                  <span className="text-muted-foreground">{linked.handle}</span>
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Separator />

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-medium">Follower growth (90 days)</h2>
          <p className="text-sm text-muted-foreground">
            Deterministic illustrative daily history ending{" "}
            {history ? formatDate(history.snapshots[history.snapshots.length - 1].date) : "—"}.
          </p>
        </div>
        <Card>
          <CardContent className="pt-4">
            {chartData.length > 0 ? (
              <FollowerGrowthChart data={chartData} />
            ) : (
              <p className="text-sm text-muted-foreground">No growth history available.</p>
            )}
          </CardContent>
        </Card>
        <div className="grid gap-3 sm:grid-cols-3">
          <Card size="sm">
            <CardHeader>
              <CardDescription>Base follower count</CardDescription>
              <CardTitle className="text-xl">{formatCount(account.baseFollowerCount)}</CardTitle>
            </CardHeader>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardDescription>Latest follower count</CardDescription>
              <CardTitle className="text-xl">
                {latestSnapshot ? formatCount(latestSnapshot.followerCount) : "—"}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardDescription>Latest engagement rate</CardDescription>
              <CardTitle className="text-xl">
                {latestSnapshot ? `${(latestSnapshot.engagementRate * 100).toFixed(1)}%` : "—"}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-medium">Recent posts ({posts.length})</h2>
          <p className="text-sm text-muted-foreground">
            Fictional content, run through the same deterministic sentiment/topic analysis used
            across this demo — see{" "}
            <Link href="/methodology" className="underline underline-offset-2 hover:text-foreground">
              Methodology
            </Link>
            .
          </p>
        </div>
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No posts available for this account.</p>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => {
              const analysis = analyzePost(post);
              return (
                <Card key={post.id}>
                  <CardContent className="space-y-1.5 pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">{post.title}</p>
                      <span
                        className="shrink-0 text-sm font-medium tabular-nums"
                        style={{ color: sentimentColor(analysis.sentimentScore) }}
                      >
                        {analysis.sentimentScore.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{post.snippet}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span>{formatDate(post.publishedAt)}</span>
                      <span>{formatCount(post.viewCount)} views</span>
                      <span>{formatCount(post.likeCount)} likes</span>
                      <span>{formatCount(post.commentCount)} comments</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{analysis.narrativeSummary}</p>
                    {analysis.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {analysis.topics.map((topic) => (
                          <Badge key={topic} variant="outline" className="text-[10px]">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
