import Link from "next/link";
import { notFound } from "next/navigation";

import { constituencies } from "@/data/constituencies";
import { electionResults } from "@/data/election-results";
import { getConstituencyBrief } from "@/lib/pipeline/constituency";
import { SENTIMENT_NEGATIVE, SENTIMENT_NEUTRAL, SENTIMENT_POSITIVE } from "@/lib/palette";
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
import type { Platform } from "@/data/dummy-channels";

// This page calls the live-fetching, cached narrative-brief pipeline
// (getConstituencyBrief), so it must not be frozen at build time.
export const dynamic = "force-dynamic";

const PLATFORM_LABEL: Record<Platform | "rss", string> = {
  youtube: "YouTube",
  x: "X",
  instagram: "Instagram",
  facebook: "Facebook",
  rss: "News RSS",
};

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

function formatSigned(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}`;
}

export default async function ConstituencyDetailPage({ params }: PageParams) {
  const { id } = await params;
  const constituency = findConstituency(id);
  if (!constituency) notFound();

  const results = electionResults
    .filter((r) => r.constituencyId === constituency.id)
    .sort((a, b) => a.year - b.year);

  const { brief, items, briefUnavailable } = await getConstituencyBrief(constituency);

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
        <h2 className="text-lg font-medium">Narrative brief</h2>
        {briefUnavailable || !brief ? (
          <Alert variant="destructive">
            <AlertTitle>Brief unavailable</AlertTitle>
            <AlertDescription>
              ANTHROPIC_API_KEY not configured or a model error occurred.
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardContent className="space-y-3 pt-4">
              <p className="text-sm">{brief.dominantNarrative}</p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">Aggregate sentiment</span>
                <span
                  className="font-medium"
                  style={{ color: sentimentColor(brief.sentimentScore) }}
                >
                  {brief.sentimentScore.toFixed(2)}
                </span>
                {brief.sentimentDelta !== null && (
                  <span className="text-xs text-muted-foreground">
                    ({formatSigned(brief.sentimentDelta)} vs. prior period)
                  </span>
                )}
              </div>
              {brief.topDrivers.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {brief.topDrivers.map((driver) => (
                    <Badge key={driver} variant="secondary">
                      {driver}
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
        <h2 className="text-lg font-medium">Analyzed content ({items.length})</h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No real content was matched to this constituency in the current window.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <Card key={item.url} className={item.unavailable ? "opacity-60" : undefined}>
                <CardContent className="space-y-1.5 pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:underline"
                    >
                      {item.title}
                    </a>
                    {!item.unavailable && (
                      <span
                        className="shrink-0 text-sm font-medium"
                        style={{ color: sentimentColor(item.sentimentScore) }}
                      >
                        {item.sentimentScore.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.sourceName} · {PLATFORM_LABEL[item.sourceKind]}
                  </p>
                  {item.unavailable ? (
                    <p className="text-xs italic text-muted-foreground">
                      Analysis unavailable for this item.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">{item.narrativeSummary}</p>
                      {item.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.topics.map((topic) => (
                            <Badge key={topic} variant="outline" className="text-[11px]">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
