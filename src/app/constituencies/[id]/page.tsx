import Link from "next/link";
import { notFound } from "next/navigation";

import { constituencies } from "@/data/constituencies";
import { electionResults } from "@/data/election-results";
import { ACCOUNTS, type Account } from "@/data/mock/accounts";
import { SENTIMENT_NEGATIVE, SENTIMENT_NEUTRAL, SENTIMENT_POSITIVE } from "@/lib/palette";
import { getConstituencyBrief } from "@/lib/constituency-brief";
import { buildNarrativeBriefSentence, PLATFORM_LABEL } from "@/lib/narrative-phrasing";
import { slugifyTopic } from "@/lib/topic-slug";
import { SentimentLineChart } from "@/components/charts/sentiment-line-chart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TierBadge, CoverageTierBadge } from "../tier-badge";

/** Below this many matched posts, a sentiment-over-time chart would be more
 *  misleading than informative (mostly empty/singleton buckets), so an
 *  aggregate number is shown instead — see AGENTS.md task brief. */
const MIN_POSTS_FOR_TIMESERIES = 6;

interface PageParams {
  params: Promise<{ id: string }>;
}

function findConstituency(id: string) {
  return constituencies.find((c) => c.id === id);
}

export async function generateMetadata({ params }: PageParams) {
  const { id } = await params;
  const constituency = findConstituency(id);
  return {
    title: constituency
      ? `${constituency.name} — Constituency Pulse`
      : "Constituency not found — Constituency Pulse",
  };
}

/** Sentiment polarity color, matching the diverging blue/red convention used
 *  everywhere else in the app (see src/lib/palette.ts). */
function sentimentColor(score: number): string {
  if (score > 0.05) return SENTIMENT_POSITIVE;
  if (score < -0.05) return SENTIMENT_NEGATIVE;
  return SENTIMENT_NEUTRAL;
}

export default async function ConstituencyDetailPage({ params }: PageParams) {
  const { id } = await params;
  const constituency = findConstituency(id);
  if (!constituency) notFound();

  const results = electionResults
    .filter((r) => r.constituencyId === constituency.id)
    .sort((a, b) => a.year - b.year);

  const primaryAccounts: Account[] = ACCOUNTS.filter(
    (account) => account.primaryConstituencyId === constituency.id
  );

  const brief = getConstituencyBrief(constituency.id);
  const {
    matchedPosts,
    usedAccountFallback,
    analyzedPosts,
    aggregateSentiment,
    sentimentSeries,
    dominantTopic: topic,
    driverIds,
    driverNames,
    amplificationEvents,
  } = brief;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <div className="space-y-3">
        <Link
          href="/constituencies"
          className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          ← All constituencies
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{constituency.name}</h1>
          <TierBadge tier={constituency.tier} />
          <CoverageTierBadge tier={constituency.coverageTier} />
        </div>
        <p className="text-sm text-muted-foreground">
          {constituency.state} · PC #{constituency.pcNumber}
        </p>
      </div>

      <Alert>
        <AlertTitle>Heuristic content matching</AlertTitle>
        <AlertDescription>
          Content shown below is matched to this constituency by a keyword/state heuristic, not
          confirmed geolocation. See{" "}
          <Link href="/methodology" className="underline underline-offset-2">
            Methodology
          </Link>{" "}
          for details and limitations.
        </AlertDescription>
      </Alert>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Historical winning margin</h2>
        {results.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No election-result rows are available for this seat.
          </p>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead>Winner</TableHead>
                    <TableHead>Runner-up</TableHead>
                    <TableHead className="text-right">Margin %</TableHead>
                    <TableHead className="text-right">Total votes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r) => (
                    <TableRow key={r.year}>
                      <TableCell className="font-medium">{r.year}</TableCell>
                      <TableCell>{r.winningParty}</TableCell>
                      <TableCell className="text-muted-foreground">{r.runnerUpParty}</TableCell>
                      <TableCell className="text-right">{r.marginPct.toFixed(2)}%</TableCell>
                      <TableCell className="text-right">
                        {r.totalVotes.toLocaleString("en-IN")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="space-y-1">
              {results.map((r) => (
                <p key={r.year} className="text-xs text-muted-foreground">
                  <span className="font-medium">{r.year}:</span> {r.sourceNote}
                </p>
              ))}
            </div>
          </>
        )}
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Digital Engagement Index</h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-semibold">
              {constituency.digitalEngagementIndex.toFixed(1)}
              <span className="text-sm font-normal text-muted-foreground"> / 100</span>
            </CardTitle>
            <CardDescription>
              State-level proxy, normalized against the national range — see source note below.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {constituency.digitalEngagementSourceNote}
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Sentiment over time</h2>
        {matchedPosts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No matched content is available for this seat to chart sentiment over time.
          </p>
        ) : matchedPosts.length < MIN_POSTS_FOR_TIMESERIES ? (
          <Card>
            <CardContent className="space-y-2 pt-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Aggregate sentiment</span>
                <span className="font-medium" style={{ color: sentimentColor(aggregateSentiment) }}>
                  {aggregateSentiment.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Only {matchedPosts.length} matched post{matchedPosts.length === 1 ? "" : "s"} were
                found for this seat — too few to plot a meaningful trend line, so an aggregate
                score is shown instead.
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
        <h2 className="text-lg font-medium">Narrative brief</h2>
        {matchedPosts.length === 0 || !topic ? (
          <Alert>
            <AlertTitle>Not enough matched content</AlertTitle>
            <AlertDescription>
              No matched posts are available for this seat to synthesize a narrative brief.
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardContent className="space-y-3 pt-4">
              <p className="text-sm">{buildNarrativeBriefSentence(brief)}</p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">Aggregate sentiment</span>
                <span className="font-medium" style={{ color: sentimentColor(aggregateSentiment) }}>
                  {aggregateSentiment.toFixed(2)}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Link href={`/issues/${slugifyTopic(topic)}`}>
                  <Badge variant="outline" className="text-[11px]">
                    {topic}
                  </Badge>
                </Link>
              </div>
              {driverNames.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {driverNames.map((name, i) => (
                    <Badge key={`${driverIds[i]}-${name}`} variant="secondary">
                      {name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Cross-platform amplification</h2>
        {amplificationEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No cross-platform amplification events have been recorded for this seat.
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
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Analyzed content ({matchedPosts.length})</h2>
        {usedAccountFallback && matchedPosts.length > 0 && (
          <p className="text-xs italic text-muted-foreground">
            No geographically matched posts were found for this seat; showing content from
            accounts primarily covering it instead.
          </p>
        )}
        {matchedPosts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No content was matched to this constituency in the current dataset.
          </p>
        ) : (
          <div className="space-y-2">
            {analyzedPosts.map(({ post, analysis }) => {
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
                      {account ? ` · ${PLATFORM_LABEL[account.platform]}` : ""} · {post.publishedAt}
                    </p>
                    <p className="text-sm text-muted-foreground">{analysis.narrativeSummary}</p>
                    {analysis.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {analysis.topics.map((topicLabel) => (
                          <Link key={topicLabel} href={`/issues/${slugifyTopic(topicLabel)}`}>
                            <Badge variant="outline" className="text-[11px]">
                              {topicLabel}
                            </Badge>
                          </Link>
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

      <Separator />

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Accounts primarily covering this seat</h2>
        {primaryAccounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No accounts are primarily associated with this seat in the current dataset.
          </p>
        ) : (
          <div className="space-y-2">
            {primaryAccounts.map((account) => (
              <Link key={account.id} href={`/channels/${account.id}`} className="block">
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center justify-between gap-3 pt-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {account.displayName}{" "}
                        <span className="text-muted-foreground">{account.handle}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {PLATFORM_LABEL[account.platform]} ·{" "}
                        {account.baseFollowerCount.toLocaleString("en-IN")} followers
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
