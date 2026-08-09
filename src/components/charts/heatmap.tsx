"use client";

import { Fragment } from "react";

import { cn } from "@/lib/utils";
import { MAP_NEUTRAL, SENTIMENT_NEGATIVE, SENTIMENT_POSITIVE } from "@/lib/palette";

export interface HeatmapCell {
  rowId: string;
  colId: string;
  /** -1..1 for sentiment, or any comparable magnitude — caller decides the meaning. */
  value: number;
  /** Optional: shown in the cell's tooltip/title for extra context. */
  detail?: string;
}

export interface HeatmapProps {
  rowLabels: { id: string; label: string }[];
  colLabels: { id: string; label: string }[];
  /** Sparse is fine — missing (row,col) pairs render as an empty/neutral cell. */
  cells: HeatmapCell[];
  /** Color scale: defaults to the app's diverging blue/red sentiment scale (-1..1). Pass a custom one for non-sentiment data. */
  colorScale?: (value: number) => string;
  /** Called when a cell is clicked — e.g. to drill into that column's issue page. */
  onCellClick?: (cell: HeatmapCell) => void;
  className?: string;
}

/** Parses a `#rrggbb` hex string into an `[r, g, b]` byte triple. */
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const value = parseInt(clean, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

/** Linear interpolation between two hex colors, `t` in 0..1. */
function interpolateColor(from: string, to: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(from);
  const [r2, g2, b2] = hexToRgb(to);
  return rgbToHex([
    Math.round(r1 + (r2 - r1) * t),
    Math.round(g1 + (g2 - g1) * t),
    Math.round(b1 + (b2 - b1) * t),
  ]);
}

/**
 * Default diverging color scale for -1..1 sentiment-shaped values: linearly
 * interpolates negative -> neutral -> positive through the app's shared
 * blue/red polarity pair (see `src/lib/palette.ts`), rather than a fixed
 * bucketed palette, so intermediate magnitudes read proportionally.
 */
function defaultSentimentColorScale(value: number): string {
  const clamped = Math.max(-1, Math.min(1, value));
  if (clamped < 0) {
    return interpolateColor(SENTIMENT_NEGATIVE, MAP_NEUTRAL.fill, clamped + 1);
  }
  return interpolateColor(MAP_NEUTRAL.fill, SENTIMENT_POSITIVE, clamped);
}

/**
 * CSS-grid heatmap — plain colored `<div>` cells, no chart library. Row
 * labels sit in a fixed left column, column labels run along the top
 * (rotated + truncated with a native `title` for overflow), and each data
 * cell's fill comes from `colorScale`. Cells with no matching entry in
 * `cells` render as an empty `bg-muted` square instead of erroring, so
 * sparse matrices are safe to pass directly.
 *
 * A Client Component (rather than the app's usual server-rendered chart
 * wrappers) purely so `onCellClick` can wire up interactivity when callers
 * need click-to-drill-down; with no `onCellClick` it behaves the same as a
 * static render.
 */
export function Heatmap({
  rowLabels,
  colLabels,
  cells,
  colorScale = defaultSentimentColorScale,
  onCellClick,
  className,
}: HeatmapProps) {
  const cellByKey = new Map<string, HeatmapCell>();
  for (const cell of cells) {
    cellByKey.set(`${cell.rowId}::${cell.colId}`, cell);
  }

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `minmax(96px, auto) repeat(${colLabels.length}, minmax(28px, 1fr))`,
        }}
      >
        {/* Top-left corner spacer, then rotated column headers. */}
        <div />
        {colLabels.map((col) => (
          <div key={col.id} className="flex h-14 items-end justify-center overflow-visible pb-1">
            <span
              className="origin-bottom-left -rotate-45 truncate text-[11px] whitespace-nowrap text-muted-foreground"
              style={{ maxWidth: 72 }}
              title={col.label}
            >
              {col.label}
            </span>
          </div>
        ))}

        {rowLabels.map((row) => (
          <Fragment key={row.id}>
            <div
              className="flex items-center truncate pr-2 text-right text-xs font-medium text-foreground"
              title={row.label}
            >
              {row.label}
            </div>
            {colLabels.map((col) => {
              const cell = cellByKey.get(`${row.id}::${col.id}`);
              const clickable = Boolean(onCellClick && cell);
              return (
                <div
                  key={`${row.id}-${col.id}`}
                  role={clickable ? "button" : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  title={
                    cell
                      ? cell.detail ?? `${row.label} × ${col.label}: ${cell.value.toFixed(2)}`
                      : `${row.label} × ${col.label}: no data`
                  }
                  onClick={cell && onCellClick ? () => onCellClick(cell) : undefined}
                  onKeyDown={
                    cell && onCellClick
                      ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onCellClick(cell);
                          }
                        }
                      : undefined
                  }
                  className={cn(
                    "aspect-square w-full rounded-sm",
                    cell ? "" : "bg-muted",
                    clickable && "cursor-pointer transition-transform hover:scale-[1.08] focus-visible:outline-2 focus-visible:outline-ring"
                  )}
                  style={cell ? { backgroundColor: colorScale(cell.value) } : undefined}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
