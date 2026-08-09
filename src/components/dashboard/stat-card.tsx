"use client";

import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { cn } from "@/lib/utils";
import { SENTIMENT_NEGATIVE, SENTIMENT_NEUTRAL, SENTIMENT_POSITIVE } from "@/lib/palette";
import { NumberTicker } from "@/components/ui/number-ticker";

export interface StatCardProps {
  /** Small label above the number, e.g. "Mentions this week". */
  label: string;
  /** The headline number. Animates from 0 (or `startValue`) on mount/scroll-into-view. */
  value: number;
  /**
   * Optional icon shown top-right in a tinted primary badge. Pass an
   * already-rendered element (e.g. `<Users className="size-4" />`), NOT a
   * bare component reference — a Server Component parent can't pass a
   * function/component type as a prop into this Client Component (React
   * Server Components only allow serializable values and rendered
   * elements across that boundary), so accepting `ReactNode` here rather
   * than a component type is required, not stylistic.
   */
  icon?: ReactNode;
  /**
   * Signed change to render as a trend row below the number (e.g. `12.4` or
   * `-3.1`). Omit entirely to render no trend row.
   */
  delta?: number;
  /** Small caption after the delta, e.g. "vs last 7 days". */
  deltaLabel?: string;
  /**
   * Unit/suffix appended after the formatted delta, e.g. "%" (default) or
   * " pts". Deliberately a string, not a formatter function — this card is
   * used from Server Component pages, and a Server Component can't pass a
   * function prop into a Client Component (only serializable values and
   * elements cross that boundary).
   */
  deltaUnit?: string;
  /** Decimal places for the formatted delta. Defaults to 1. */
  deltaDecimalPlaces?: number;
  /**
   * Set when a *decrease* is the good direction for this metric (e.g.
   * negative-sentiment mention share) so the trend color flips accordingly.
   * Ties into the same blue/red polarity convention as the sentiment charts
   * — see `src/lib/palette.ts`.
   */
  invertTrendColor?: boolean;
  /** Text rendered before the animated number, e.g. "₹". */
  prefix?: string;
  /** Text rendered after the animated number, e.g. "K" or "%". */
  suffix?: string;
  /** Decimal places for the animated number. Defaults to 0. */
  decimalPlaces?: number;
  /**
   * Compact layout for a dense KPI strip (smaller padding, number, and icon
   * badge). Defaults to `"default"`, which stays pixel-identical to the
   * original card — existing callers see no change.
   */
  size?: "default" | "sm";
  className?: string;
}

/**
 * Animated KPI tile for a hero stat row (e.g. "Total mentions", "Net
 * sentiment", "Rising channels"). The count-up animation and spring-physics
 * come from `NumberTicker` (`src/components/ui/number-ticker.tsx`, pulled
 * from MagicUI's public component registry); this wrapper adds the
 * label/icon/trend chrome using this app's existing card and palette
 * conventions so it drops into a `BentoGrid`/hero row without further
 * styling.
 */
export function StatCard({
  label,
  value,
  icon,
  delta,
  deltaLabel,
  deltaUnit = "%",
  deltaDecimalPlaces = 1,
  invertTrendColor = false,
  prefix,
  suffix,
  decimalPlaces = 0,
  size = "default",
  className,
}: StatCardProps) {
  const trend = delta === undefined || delta === 0 ? "flat" : delta > 0 ? "up" : "down";
  const goodDirection = invertTrendColor ? "down" : "up";
  const trendColor =
    trend === "flat"
      ? SENTIMENT_NEUTRAL
      : trend === goodDirection
        ? SENTIMENT_POSITIVE
        : SENTIMENT_NEGATIVE;
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const isSm = size === "sm";

  return (
    <div
      data-slot="stat-card"
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card shadow-sm ring-1 ring-foreground/5 transition-shadow duration-300 hover:shadow-md",
        isSm ? "gap-1.5 p-3" : "gap-3 p-5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn("font-medium text-muted-foreground", isSm ? "text-xs" : "text-sm")}>
          {label}
        </span>
        {icon && (
          <span
            className={cn(
              "flex shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
              isSm ? "size-6 [&_svg]:size-3.5" : "size-8 [&_svg]:size-4"
            )}
          >
            {icon}
          </span>
        )}
      </div>

      <div
        className={cn(
          "flex items-baseline gap-1 font-heading font-semibold tracking-tight text-foreground",
          isSm ? "text-xl" : "text-3xl"
        )}
      >
        {prefix && (
          <span className={cn("font-medium text-muted-foreground", isSm ? "text-sm" : "text-lg")}>
            {prefix}
          </span>
        )}
        <NumberTicker value={value} decimalPlaces={decimalPlaces} />
        {suffix && (
          <span className={cn("font-medium text-muted-foreground", isSm ? "text-sm" : "text-lg")}>
            {suffix}
          </span>
        )}
      </div>

      {delta !== undefined && (
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <span className="flex items-center gap-0.5" style={{ color: trendColor }}>
            <TrendIcon className="size-3.5" />
            {delta > 0 ? "+" : ""}
            {delta.toFixed(deltaDecimalPlaces)}
            {deltaUnit}
          </span>
          {deltaLabel && <span className="font-normal text-muted-foreground">{deltaLabel}</span>}
        </div>
      )}
    </div>
  );
}
