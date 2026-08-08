"use client";

import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";

import { cn } from "@/lib/utils";
import { ACCENT, SENTIMENT_NEGATIVE, SENTIMENT_NEUTRAL } from "@/lib/palette";

export interface LeaderboardItem {
  /** Row label, e.g. a channel or constituency name. */
  label: string;
  value: number;
}

export interface LeaderboardBarChartProps {
  data: LeaderboardItem[];
  height?: number;
  /** Formats the value shown in the tooltip and (optionally) axis. Defaults to a plain number. */
  valueFormatter?: (value: number) => string;
  /**
   * When true, bars for negative values are colored with the "negative"
   * palette color instead of the default accent — for leaderboards of a
   * signed metric (e.g. sentiment delta) rather than a plain magnitude
   * ranking. Nominal magnitude leaderboards should leave this off, per the
   * "don't color nominal bars by their value" rule — one accent hue for
   * every bar is correct there.
   */
  colorBySign?: boolean;
  className?: string;
}

function LeaderboardTooltip({
  active,
  payload,
  valueFormatter,
}: TooltipContentProps & { valueFormatter: (v: number) => string }) {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  const value = point?.value;
  const label = (point?.payload as LeaderboardItem | undefined)?.label;
  if (typeof value !== "number") return null;

  return (
    <div className="rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs shadow-sm">
      <div className="font-medium text-popover-foreground">{label}</div>
      <div className="mt-0.5 text-muted-foreground">{valueFormatter(value)}</div>
    </div>
  );
}

/**
 * Horizontal leaderboard bar chart — a thin Recharts wrapper for ranking
 * lists (top channels, most-covered constituencies, etc). Single-series
 * bars all take the same accent hue by default (nominal ranking: identity
 * doesn't need a color per bar, the label + bar length already show it).
 */
export function LeaderboardBarChart({
  data,
  height,
  valueFormatter = (v) => v.toLocaleString(),
  colorBySign = false,
  className,
}: LeaderboardBarChartProps) {
  const resolvedHeight = height ?? Math.max(120, data.length * 36 + 24);

  return (
    <div className={cn("w-full", className)} style={{ height: resolvedHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
        >
          <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: SENTIMENT_NEUTRAL }}
          />
          <YAxis
            type="category"
            dataKey="label"
            tickLine={false}
            axisLine={false}
            width={128}
            tick={{ fontSize: 12, fill: "var(--foreground)" }}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            content={(props) => (
              <LeaderboardTooltip {...props} valueFormatter={valueFormatter} />
            )}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
            {data.map((item) => (
              <Cell
                key={item.label}
                fill={colorBySign && item.value < 0 ? SENTIMENT_NEGATIVE : ACCENT}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
