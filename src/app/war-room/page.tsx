import Link from "next/link";
import { AlertTriangle, Eye, Flag, Flame, ShieldCheck, Zap } from "lucide-react";

import { computeActionItems, type UrgencyBand } from "@/lib/action-items";
import { getAllAmplificationEvents } from "@/data/mock/amplification";
import { REFERENCE_TODAY } from "@/data/mock/growth-history";
import { analyzeAllPosts, TOPIC_VOCABULARY } from "@/data/mock/mock-analysis";
import { StatCard } from "@/components/dashboard/stat-card";
import type { HeatmapCell } from "@/components/charts/heatmap";
import { FormattedLeaderboard } from "@/components/charts/formatted-leaderboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WarRoomExplorer } from "./war-room-explorer";

export const metadata = {
  title: "War Room — Constituency Pulse",
};

// This app has no database and no live APIs — every number below is derived
// from the deterministic mock data modules (action-items.ts, amplification.ts,
// mock-analysis.ts), so the page renders the same content on every request.

const DAY_MS = 24 * 60 * 60 * 1000;
const HEATMAP_ROW_COUNT = 12;
const HEATMAP_COL_COUNT = 10;

function average(values: number[]): number {
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 100) / 100;
}

/** Top `limit` topics from TOPIC_VOCABULARY by overall mention frequency
 *  across every analyzed post — deliberately sourced from mock-analysis.ts's
 *  topic taxonomy, not graph.ts's (see AGENTS.md's taxonomy-mismatch note). */
function topTopicsByFrequency(limit: number): string[] {
  const counts = new Map<string, number>();
  for (const analysis of analyzeAllPosts()) {
    for (const topic of analysis.topics) {
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
  }
  return [...TOPIC_VOCABULARY]
    .sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0))
    .slice(0, limit);
}

export default function WarRoomPage() {
  const actionItems = computeActionItems();

  // ---------------------------------------------------------------------
  // KPI strip
  // ---------------------------------------------------------------------
  const bandCounts: Record<UrgencyBand, number> = { Critical: 0, High: 0, Watch: 0, Stable: 0 };
  for (const item of actionItems) bandCounts[item.urgencyBand] += 1;
  const flagged = bandCounts.Critical + bandCounts.High;

  const amplificationThisWeek = getAllAmplificationEvents().filter(
    (event) => Date.parse(REFERENCE_TODAY) - Date.parse(event.occurredAt) <= 7 * DAY_MS
  ).length;

  // ---------------------------------------------------------------------
  // Issue x constituency heatmap: rows = top N action items by urgency,
  // cols = top N topics by overall mention frequency. Cell value = average
  // sentiment across that constituency's analyzed posts mentioning that
  // topic; cell omitted entirely when there are zero matches.
  // ---------------------------------------------------------------------
  const heatmapRowItems = actionItems.slice(0, HEATMAP_ROW_COUNT);
  const heatmapRowLabels = heatmapRowItems.map((item) => ({
    id: item.constituencyId,
    label: item.constituencyName,
  }));

  const topTopics = topTopicsByFrequency(HEATMAP_COL_COUNT);
  const heatmapColLabels = topTopics.map((topic) => ({ id: topic, label: topic }));

  const heatmapCells: HeatmapCell[] = [];
  for (const item of heatmapRowItems) {
    for (const topic of topTopics) {
      const matches = item.brief.analyzedPosts.filter((entry) =>
        entry.analysis.topics.includes(topic)
      );
      if (matches.length === 0) continue;
      const value = average(matches.map((entry) => entry.analysis.sentimentScore));
      heatmapCells.push({
        rowId: item.constituencyId,
        colId: topic,
        value,
        detail: `${item.constituencyName} × ${topic}: ${value.toFixed(2)} avg sentiment (${matches.length} post${matches.length === 1 ? "" : "s"})`,
      });
    }
  }

  // ---------------------------------------------------------------------
  // By-state rollup: count of Critical+High constituencies per state.
  // ---------------------------------------------------------------------
  const stateCounts = new Map<string, number>();
  for (const item of actionItems) {
    if (item.urgencyBand !== "Critical" && item.urgencyBand !== "High") continue;
    stateCounts.set(item.state, (stateCounts.get(item.state) ?? 0) + 1);
  }
  const stateRollup = [...stateCounts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">War Room</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          A single ranked action-item queue across every tracked constituency, sorted by urgency
          score — the seats and narratives needing attention right now surface first. See{" "}
          <Link href="/methodology" className="underline underline-offset-2 hover:text-foreground">
            Methodology
          </Link>{" "}
          for how urgency scores, swing tiers, and coverage tiers are computed.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard size="sm" label="Critical" value={bandCounts.Critical} icon={<Flame />} />
        <StatCard size="sm" label="High" value={bandCounts.High} icon={<AlertTriangle />} />
        <StatCard size="sm" label="Watch" value={bandCounts.Watch} icon={<Eye />} />
        <StatCard size="sm" label="Stable" value={bandCounts.Stable} icon={<ShieldCheck />} />
        <StatCard size="sm" label="Flagged (Critical + High)" value={flagged} icon={<Flag />} />
        <StatCard
          size="sm"
          label="Amplification this week"
          value={amplificationThisWeek}
          icon={<Zap />}
        />
      </div>

      <WarRoomExplorer
        actionItems={actionItems}
        heatmapRowLabels={heatmapRowLabels}
        heatmapColLabels={heatmapColLabels}
        heatmapCells={heatmapCells}
      />

      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-medium">Flagged constituencies by state</h2>
          <p className="text-sm text-muted-foreground">
            Count of Critical + High urgency constituencies per state. States with none flagged
            are omitted.
          </p>
        </div>
        {stateRollup.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No state currently has a Critical or High urgency constituency.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Critical + High constituencies</CardTitle>
              <CardDescription>Ranked by count, descending.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormattedLeaderboard data={stateRollup} format="count" />
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
