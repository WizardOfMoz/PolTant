"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";

import { cn } from "@/lib/utils";
import {
  SENTIMENT_NEGATIVE,
  SENTIMENT_NEUTRAL,
  SENTIMENT_POSITIVE,
} from "@/lib/palette";

export interface SentimentPoint {
  /** X-axis label — an ISO date, or a window label like "2026-W32". */
  date: string;
  /** Sentiment score in the -1..1 range used across the schema. */
  sentiment: number;
}

export interface SentimentLineChartProps {
  data: SentimentPoint[];
  height?: number;
  /** Domain for the sentiment axis; defaults to the schema's -1..1 range. */
  domain?: [number, number];
  /** Optional neutral benchmark (e.g. a national/category average) drawn as a dashed neutral line. */
  referenceValue?: number;
  referenceLabel?: string;
  className?: string;
}

function SentimentTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  if (typeof value !== "number") return null;
  const color = value >= 0 ? SENTIMENT_POSITIVE : SENTIMENT_NEGATIVE;

  return (
    <div className="rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs shadow-sm">
      <div className="font-medium text-popover-foreground">{label}</div>
      <div className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
        <span
          className="size-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        sentiment {value.toFixed(2)}
      </div>
    </div>
  );
}

/**
 * Sentiment-over-time line chart. Renders a single sentiment series as a
 * split-fill area (blue above the zero baseline, red below it — see
 * `src/lib/palette.ts` for why blue/red rather than green/red) so polarity
 * reads from color without needing a second series or legend.
 */
export function SentimentLineChart({
  data,
  height = 240,
  domain = [-1, 1],
  referenceValue,
  referenceLabel,
  className,
}: SentimentLineChartProps) {
  const gradientId = useId();

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SENTIMENT_POSITIVE} stopOpacity={0.28} />
              <stop offset="50%" stopColor={SENTIMENT_POSITIVE} stopOpacity={0.04} />
              <stop offset="50%" stopColor={SENTIMENT_NEGATIVE} stopOpacity={0.04} />
              <stop offset="100%" stopColor={SENTIMENT_NEGATIVE} stopOpacity={0.28} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: SENTIMENT_NEUTRAL }}
            minTickGap={24}
          />
          <YAxis
            domain={domain}
            tickLine={false}
            axisLine={false}
            width={32}
            tick={{ fontSize: 11, fill: SENTIMENT_NEUTRAL }}
          />
          <ReferenceLine y={0} stroke={SENTIMENT_NEUTRAL} strokeDasharray="4 4" />
          {referenceValue !== undefined && (
            <ReferenceLine
              y={referenceValue}
              stroke={SENTIMENT_NEUTRAL}
              strokeDasharray="2 2"
              label={
                referenceLabel
                  ? { value: referenceLabel, position: "insideTopRight", fontSize: 11, fill: SENTIMENT_NEUTRAL }
                  : undefined
              }
            />
          )}
          <Tooltip content={SentimentTooltip} />
          <Area
            type="monotone"
            dataKey="sentiment"
            stroke={SENTIMENT_POSITIVE}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
