"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";

import { ACCENT, SENTIMENT_NEUTRAL } from "@/lib/palette";

export interface FollowerGrowthPoint {
  date: string;
  followerCount: number;
}

interface FollowerGrowthChartProps {
  data: FollowerGrowthPoint[];
  height?: number;
}

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function FollowerTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  if (typeof value !== "number") return null;

  return (
    <div className="rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs shadow-sm">
      <div className="font-medium text-popover-foreground">{label}</div>
      <div className="mt-0.5 text-muted-foreground">{value.toLocaleString()} followers</div>
    </div>
  );
}

/**
 * 90-day follower-growth area chart for an account's profile page. Uses the
 * shared brand accent color (see src/lib/palette.ts) rather than the
 * sentiment blue/red pair — follower count is a magnitude metric, not a
 * signed polarity one, so it doesn't need the diverging palette.
 */
export function FollowerGrowthChart({ data, height = 260 }: FollowerGrowthChartProps) {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="followerGrowthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity={0.28} />
              <stop offset="100%" stopColor={ACCENT} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: SENTIMENT_NEUTRAL }}
            minTickGap={32}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(value: number) => compactFormatter.format(value)}
            tick={{ fontSize: 11, fill: SENTIMENT_NEUTRAL }}
          />
          <Tooltip content={FollowerTooltip} />
          <Area
            type="monotone"
            dataKey="followerCount"
            stroke={ACCENT}
            strokeWidth={2}
            fill="url(#followerGrowthFill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
