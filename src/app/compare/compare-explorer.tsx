"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";

import type { Constituency } from "@/data/constituencies";
import { getConstituencyBrief, type ConstituencyBrief } from "@/lib/constituency-brief";
import { SENTIMENT_NEGATIVE, SENTIMENT_NEUTRAL, SENTIMENT_POSITIVE } from "@/lib/palette";
import { slugifyTopic } from "@/lib/topic-slug";
import { cn } from "@/lib/utils";
import { SentimentLineChart } from "@/components/charts/sentiment-line-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TierBadge, CoverageTierBadge } from "@/app/constituencies/tier-badge";

/** Same threshold the constituency detail page uses — below this many
 *  matched posts, a sentiment-over-time line is mostly empty/singleton
 *  buckets, so an aggregate number is shown instead. */
const MIN_POSTS_FOR_TIMESERIES = 6;

function sentimentColor(score: number): string {
  if (score > 0.05) return SENTIMENT_POSITIVE;
  if (score < -0.05) return SENTIMENT_NEGATIVE;
  return SENTIMENT_NEUTRAL;
}

/** Bolds whichever of two numbers is larger so a scan down the column shows
 *  magnitude at a glance. This is a "which is bigger" cue, not a value
 *  judgment — a higher margin-volatility isn't "better" than a lower one. */
function magnitudeClass(value: number, other: number): string {
  if (value === other) return "text-muted-foreground";
  return value > other ? "font-semibold text-foreground" : "text-muted-foreground";
}

function ConstituencyPicker({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Constituency[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={(v) => v && onChange(v)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a constituency">
            {(id: string) => options.find((c) => c.id === id)?.name}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name} — {c.state}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function CompareResult({
  a,
  b,
  briefA,
  briefB,
}: {
  a: Constituency;
  b: Constituency;
  briefA: ConstituencyBrief;
  briefB: ConstituencyBrief;
}) {
  const pairs = [
    { c: a, brief: briefA },
    { c: b, brief: briefB },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        {pairs.map(({ c }) => (
          <div key={c.id} className="space-y-1.5">
            <Link
              href={`/constituencies/${c.id}`}
              className="text-lg font-semibold tracking-tight hover:underline"
            >
              {c.name}
            </Link>
            <div className="flex flex-wrap items-center gap-1.5">
              <TierBadge tier={c.tier} />
              <CoverageTierBadge tier={c.coverageTier} />
            </div>
            <p className="text-xs text-muted-foreground">
              {c.state} · PC #{c.pcNumber}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              <TableHead className="text-right">{a.name}</TableHead>
              <TableHead className="text-right">{b.name}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="text-muted-foreground">Digital engagement index</TableCell>
              <TableCell
                className={cn(
                  "text-right tabular-nums",
                  magnitudeClass(a.digitalEngagementIndex, b.digitalEngagementIndex)
                )}
              >
                {a.digitalEngagementIndex.toFixed(1)}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right tabular-nums",
                  magnitudeClass(b.digitalEngagementIndex, a.digitalEngagementIndex)
                )}
              >
                {b.digitalEngagementIndex.toFixed(1)}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="text-muted-foreground">Latest margin (closeness)</TableCell>
              <TableCell
                className={cn(
                  "text-right tabular-nums",
                  magnitudeClass(a.closenessIndex, b.closenessIndex)
                )}
              >
                {a.closenessIndex.toFixed(2)}%
              </TableCell>
              <TableCell
                className={cn(
                  "text-right tabular-nums",
                  magnitudeClass(b.closenessIndex, a.closenessIndex)
                )}
              >
                {b.closenessIndex.toFixed(2)}%
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="text-muted-foreground">Margin volatility</TableCell>
              <TableCell
                className={cn(
                  "text-right tabular-nums",
                  magnitudeClass(a.marginVolatility, b.marginVolatility)
                )}
              >
                {a.marginVolatility.toFixed(2)} pp
              </TableCell>
              <TableCell
                className={cn(
                  "text-right tabular-nums",
                  magnitudeClass(b.marginVolatility, a.marginVolatility)
                )}
              >
                {b.marginVolatility.toFixed(2)} pp
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="text-muted-foreground">Party flips since 2014</TableCell>
              <TableCell
                className={cn(
                  "text-right tabular-nums",
                  magnitudeClass(a.flipFrequency, b.flipFrequency)
                )}
              >
                {a.flipFrequency}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right tabular-nums",
                  magnitudeClass(b.flipFrequency, a.flipFrequency)
                )}
              >
                {b.flipFrequency}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="text-muted-foreground">Aggregate sentiment</TableCell>
              <TableCell
                className="text-right font-medium tabular-nums"
                style={{ color: sentimentColor(briefA.aggregateSentiment) }}
              >
                {briefA.aggregateSentiment.toFixed(2)}
              </TableCell>
              <TableCell
                className="text-right font-medium tabular-nums"
                style={{ color: sentimentColor(briefB.aggregateSentiment) }}
              >
                {briefB.aggregateSentiment.toFixed(2)}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="text-muted-foreground">Trend</TableCell>
              <TableCell className="text-right capitalize">{briefA.trendLabel}</TableCell>
              <TableCell className="text-right capitalize">{briefB.trendLabel}</TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="text-muted-foreground">Dominant topic</TableCell>
              {pairs.map(({ c, brief }) => (
                <TableCell key={c.id} className="text-right">
                  {brief.dominantTopic ? (
                    <Link href={`/issues/${slugifyTopic(brief.dominantTopic)}`}>
                      <Badge variant="outline" className="text-[11px]">
                        {brief.dominantTopic}
                      </Badge>
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              ))}
            </TableRow>

            <TableRow>
              <TableCell className="text-muted-foreground">Matched posts analyzed</TableCell>
              <TableCell
                className={cn(
                  "text-right tabular-nums",
                  magnitudeClass(briefA.matchedPosts.length, briefB.matchedPosts.length)
                )}
              >
                {briefA.matchedPosts.length}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right tabular-nums",
                  magnitudeClass(briefB.matchedPosts.length, briefA.matchedPosts.length)
                )}
              >
                {briefB.matchedPosts.length}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="text-muted-foreground">Amplification events</TableCell>
              <TableCell
                className={cn(
                  "text-right tabular-nums",
                  magnitudeClass(briefA.amplificationEvents.length, briefB.amplificationEvents.length)
                )}
              >
                {briefA.amplificationEvents.length}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right tabular-nums",
                  magnitudeClass(briefB.amplificationEvents.length, briefA.amplificationEvents.length)
                )}
              >
                {briefB.amplificationEvents.length}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="text-muted-foreground">Top drivers</TableCell>
              {pairs.map(({ c, brief }) => (
                <TableCell key={c.id} className="text-right">
                  <div className="flex flex-wrap justify-end gap-1">
                    {brief.driverNames.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      brief.driverNames.slice(0, 2).map((name) => (
                        <Badge key={name} variant="secondary" className="text-[11px]">
                          {name}
                        </Badge>
                      ))
                    )}
                  </div>
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium">Sentiment over time</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {pairs.map(({ c, brief }) => (
            <Card key={c.id}>
              <CardContent className="space-y-2 pt-4">
                <p className="text-xs font-medium text-muted-foreground">{c.name}</p>
                {brief.matchedPosts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No matched content for this seat.
                  </p>
                ) : brief.matchedPosts.length < MIN_POSTS_FOR_TIMESERIES ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Aggregate sentiment</span>
                    <span
                      className="font-medium"
                      style={{ color: sentimentColor(brief.aggregateSentiment) }}
                    >
                      {brief.aggregateSentiment.toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <SentimentLineChart data={brief.sentimentSeries} height={180} />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

/**
 * Two constituency pickers on the left, a side-by-side comparison on the
 * right. All comparison data is static/synchronous mock data (see
 * getConstituencyBrief), so selection recomputes instantly client-side —
 * no navigation or server round-trip needed at this dataset size.
 */
export function CompareExplorer({ constituencies }: { constituencies: Constituency[] }) {
  const sorted = useMemo(
    () => [...constituencies].sort((x, y) => x.name.localeCompare(y.name)),
    [constituencies]
  );

  const [aId, setAId] = useState<string>(sorted[0]?.id ?? "");
  const [bId, setBId] = useState<string>(sorted[1]?.id ?? sorted[0]?.id ?? "");

  const a = constituencies.find((c) => c.id === aId);
  const b = constituencies.find((c) => c.id === bId);
  const briefA = useMemo(() => (a ? getConstituencyBrief(a.id) : null), [a]);
  const briefB = useMemo(() => (b ? getConstituencyBrief(b.id) : null), [b]);

  function swap() {
    setAId(bId);
    setBId(aId);
  }

  return (
    <div className="grid gap-8 md:grid-cols-[300px_1fr]">
      <div className="space-y-3 md:sticky md:top-6 md:self-start">
        <ConstituencyPicker
          label="Constituency A"
          options={sorted.filter((c) => c.id !== bId)}
          value={aId}
          onChange={setAId}
        />
        <div className="flex justify-center">
          <Button variant="ghost" size="icon" aria-label="Swap constituencies" title="Swap" onClick={swap}>
            <ArrowLeftRight className="size-4" />
          </Button>
        </div>
        <ConstituencyPicker
          label="Constituency B"
          options={sorted.filter((c) => c.id !== aId)}
          value={bId}
          onChange={setBId}
        />
      </div>

      <div className="min-w-0 space-y-6">
        {a && b && briefA && briefB ? (
          <CompareResult a={a} b={b} briefA={briefA} briefB={briefB} />
        ) : (
          <p className="text-sm text-muted-foreground">Select two constituencies to compare.</p>
        )}
      </div>
    </div>
  );
}
