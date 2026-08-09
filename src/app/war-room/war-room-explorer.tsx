"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { ActionItem, UrgencyBand } from "@/lib/action-items";
import { Heatmap, type HeatmapCell } from "@/components/charts/heatmap";
import { Sparkline } from "@/components/charts/sparkline";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TierBadge, CoverageTierBadge } from "@/app/constituencies/tier-badge";
import { slugifyTopic } from "@/lib/topic-slug";
import { SENTIMENT_NEGATIVE, SENTIMENT_NEUTRAL, SENTIMENT_POSITIVE } from "@/lib/palette";
import { cn } from "@/lib/utils";

type TierFilter = "all" | "competitive";

const URGENCY_BANDS: UrgencyBand[] = ["Critical", "High", "Watch", "Stable"];

/** Maps each urgency band to an existing Badge variant — no new colors
 *  introduced, per AGENTS.md. */
const URGENCY_BAND_VARIANT: Record<UrgencyBand, "destructive" | "default" | "secondary" | "outline"> = {
  Critical: "destructive",
  High: "default",
  Watch: "secondary",
  Stable: "outline",
};

function trendColor(trendLabel: ActionItem["brief"]["trendLabel"]): string {
  if (trendLabel === "trending up") return SENTIMENT_POSITIVE;
  if (trendLabel === "trending down") return SENTIMENT_NEGATIVE;
  return SENTIMENT_NEUTRAL;
}

export interface WarRoomExplorerProps {
  actionItems: ActionItem[];
  heatmapRowLabels: { id: string; label: string }[];
  heatmapColLabels: { id: string; label: string }[];
  heatmapCells: HeatmapCell[];
}

/**
 * Client half of the War Room page: the heatmap (needs `onCellClick` to
 * drill into `/issues/[slug]`) and the ranked action-item queue (needs tier
 * + urgency-band filter state). Receives everything already computed as
 * plain serializable props from the server page (`page.tsx`) — no
 * recomputation happens here.
 */
export function WarRoomExplorer({
  actionItems,
  heatmapRowLabels,
  heatmapColLabels,
  heatmapCells,
}: WarRoomExplorerProps) {
  const router = useRouter();
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [selectedBands, setSelectedBands] = useState<Set<UrgencyBand>>(
    () => new Set(URGENCY_BANDS)
  );

  const toggleBand = (band: UrgencyBand) => {
    setSelectedBands((prev) => {
      const next = new Set(prev);
      if (next.has(band)) {
        // Keep at least one band selected so the queue is never forced empty
        // by a single accidental click.
        if (next.size > 1) next.delete(band);
      } else {
        next.add(band);
      }
      return next;
    });
  };

  const filteredItems = useMemo(
    () =>
      actionItems.filter((item) => {
        if (!selectedBands.has(item.urgencyBand)) return false;
        if (tierFilter === "competitive" && item.tier !== "Swing" && item.tier !== "Toss-up") {
          return false;
        }
        return true;
      }),
    [actionItems, selectedBands, tierFilter]
  );

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-medium">Issue &times; constituency sentiment</h2>
          <p className="text-sm text-muted-foreground">
            Top {heatmapRowLabels.length} constituencies by urgency score against the top{" "}
            {heatmapColLabels.length} most-discussed issues nationally. Cell color is average
            sentiment where that issue is discussed in this seat (blank = no matched content);
            click a cell to open that issue&apos;s page.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <Heatmap
            rowLabels={heatmapRowLabels}
            colLabels={heatmapColLabels}
            cells={heatmapCells}
            onCellClick={(cell) => router.push(`/issues/${slugifyTopic(cell.colId)}`)}
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-medium">Ranked action-item queue</h2>
            <p className="text-sm text-muted-foreground">
              Every tracked constituency, sorted by urgency score, descending.
            </p>
          </div>
          <Tabs value={tierFilter} onValueChange={(value) => setTierFilter(value as TierFilter)}>
            <TabsList>
              <TabsTrigger value="all">All tiers</TabsTrigger>
              <TabsTrigger value="competitive">Swing + Toss-up only</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Urgency:</span>
          {URGENCY_BANDS.map((band) => {
            const active = selectedBands.has(band);
            return (
              <button
                key={band}
                type="button"
                onClick={() => toggleBand(band)}
                aria-pressed={active}
                className="cursor-pointer"
              >
                <Badge
                  variant={active ? URGENCY_BAND_VARIANT[band] : "outline"}
                  className={cn(!active && "text-muted-foreground opacity-60")}
                >
                  {band}
                </Badge>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Constituency</TableHead>
                <TableHead>Swing tier</TableHead>
                <TableHead>Coverage</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead>Recommended action</TableHead>
                <TableHead>Sentiment trend</TableHead>
                <TableHead>Top drivers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow
                  key={item.constituencyId}
                  className="cursor-pointer"
                  onClick={() => router.push(`/constituencies/${item.constituencyId}`)}
                >
                  <TableCell className="max-w-48 whitespace-normal">
                    <div className="font-medium text-foreground">{item.constituencyName}</div>
                    <div className="text-xs text-muted-foreground">{item.state}</div>
                  </TableCell>
                  <TableCell>
                    <TierBadge tier={item.tier} />
                  </TableCell>
                  <TableCell>
                    <CoverageTierBadge tier={item.coverageTier} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={URGENCY_BAND_VARIANT[item.urgencyBand]}>
                      {item.urgencyBand}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.urgencyScore.toFixed(2)}
                  </TableCell>
                  <TableCell
                    className="max-w-72 min-w-56 whitespace-normal text-xs text-muted-foreground"
                    title={item.recommendedAction}
                  >
                    {item.recommendedAction}
                  </TableCell>
                  <TableCell>
                    <Sparkline
                      data={item.brief.sentimentSeries.map((point) => point.sentiment)}
                      color={trendColor(item.brief.trendLabel)}
                    />
                  </TableCell>
                  <TableCell className="max-w-40 whitespace-normal">
                    <div className="flex flex-wrap gap-1">
                      {item.brief.driverNames.slice(0, 2).map((name) => (
                        <Badge key={name} variant="outline" className="text-[10px]">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filteredItems.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No constituencies match the current filters.
          </p>
        )}
      </section>
    </div>
  );
}
