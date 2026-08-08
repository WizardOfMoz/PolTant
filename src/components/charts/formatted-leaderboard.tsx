"use client";

import { LeaderboardBarChart, type LeaderboardItem } from "./leaderboard-bar-chart";

/**
 * Thin client wrapper around LeaderboardBarChart for the common tooltip
 * value formats used across pages. Exists because Server Components can't
 * pass functions as props to Client Components (RSC serialization limit)
 * — pages were doing `valueFormatter={(v) => ...}` directly, which crashed
 * at runtime ("Functions cannot be passed directly to Client Components").
 * Since this wrapper is itself a Client Component, it can define the
 * formatter locally and hand it to LeaderboardBarChart without crossing
 * the server/client boundary.
 */
export type LeaderboardValueFormat = "count" | "subscribers" | "percent-signed";

const FORMATTERS: Record<LeaderboardValueFormat, (v: number) => string> = {
  count: (v) => v.toLocaleString(),
  subscribers: (v) => `${v.toLocaleString()} subscribers`,
  "percent-signed": (v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`,
};

export interface FormattedLeaderboardProps {
  data: LeaderboardItem[];
  format: LeaderboardValueFormat;
  height?: number;
  colorBySign?: boolean;
  className?: string;
}

export function FormattedLeaderboard({
  data,
  format,
  height,
  colorBySign,
  className,
}: FormattedLeaderboardProps) {
  return (
    <LeaderboardBarChart
      data={data}
      height={height}
      colorBySign={colorBySign}
      className={className}
      valueFormatter={FORMATTERS[format]}
    />
  );
}
