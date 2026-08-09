import { ACCENT } from "@/lib/palette";

export interface SparklineProps {
  /** Just the y-values, in order. */
  data: number[];
  /** Default ~80. */
  width?: number;
  /** Default ~24. */
  height?: number;
  /** Stroke color; defaults to palette ACCENT, or pass SENTIMENT_POSITIVE/NEGATIVE for a signed series. */
  color?: string;
  className?: string;
}

/**
 * Tiny inline trend line for embedding in a table row/list item. Glance-only
 * — no axes, no legend, no tooltip, no Recharts (avoids the
 * `ResponsiveContainer` overhead for something this small). Server-renderable
 * plain SVG: min-max normalizes `data` into the viewBox and draws a single
 * `<polyline>`.
 */
export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = ACCENT,
  className,
}: SparklineProps) {
  if (data.length === 0) {
    return <svg width={width} height={height} className={className} aria-hidden="true" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;

  // Small vertical inset so a flat-top/flat-bottom series doesn't clip the
  // stroke against the viewBox edge.
  const inset = 2;
  const drawableHeight = Math.max(height - inset * 2, 1);

  const points = data
    .map((value, index) => {
      const x = data.length > 1 ? index * stepX : width / 2;
      // A perfectly flat series has nothing to normalize against — draw it
      // through the vertical center rather than pinning it to the bottom.
      const normalized = range === 0 ? 0.5 : (value - min) / range;
      const y = inset + (1 - normalized) * drawableHeight;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label="Trend sparkline"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
