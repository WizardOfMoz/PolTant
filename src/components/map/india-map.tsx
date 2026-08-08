"use client";

import { memo, useCallback, useMemo, useState, type CSSProperties } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import type { FeatureCollection, Geometry } from "geojson";

import { MAP_NEUTRAL, TIER_COLORS, type Tier } from "@/lib/palette";
import indiaPcBoundaries from "@/data/india-pc-boundaries.json";
import { normalizePcProperties } from "./normalize";

/**
 * Real India Lok Sabha parliamentary-constituency boundaries (543 seats),
 * source: datameet/maps, `parliamentary-constituencies/india_pc_2019_simplified.geojson`
 * (https://github.com/datameet/maps) — a simplified GeoJSON derived from the
 * ECI's official 2019 delimitation shapefile, ~1.9MB. See `src/data/README`
 * note in the map's normalize.ts for property-key details.
 */
const geoJson = indiaPcBoundaries as unknown as FeatureCollection<
  Geometry,
  Record<string, unknown>
>;

export interface HighlightedConstituency {
  tier: Tier;
  label: string;
}

/**
 * Every feature in the bundled boundary file carries a `pc_id` that IS
 * globally unique (unlike ECI `pc_no`, which repeats across states — see
 * `./normalize.ts`), so this is the key used for both `highlighted` lookups
 * and the `onSelect`/`onHover` callback payload. Falls back to `pcNumber`
 * only if a feature is somehow missing `pcId` (shouldn't happen with the
 * bundled dataset — all 543 features have one).
 */
function featureKey(normalized: { pcId: number | null; pcNumber: number }): number {
  return normalized.pcId ?? normalized.pcNumber;
}

export interface IndiaMapProps {
  /**
   * Tracked subset of constituencies to color by tier, keyed by the
   * feature's globally-unique `pcId` (see `featureKey` above) — NOT by raw
   * ECI PC number, which repeats across states. Build this with
   * `src/lib/election/match-boundary.ts`, not by hand. Everything not
   * present here renders as a neutral, untracked seat.
   */
  highlighted?: Record<number, HighlightedConstituency>;
  /** Fired on click with the clicked feature's key (see `featureKey`). */
  onSelect?: (featureKey: number) => void;
  /** Fired on hover/unhover with the feature's key, or `null` on mouse-leave. */
  onHover?: (featureKey: number | null) => void;
  className?: string;
  width?: number;
  height?: number;
}

interface PreparedGeography {
  rsmKey: string;
  svgPath: string;
  properties: Record<string, unknown>;
}

const PROJECTION_CONFIG = { center: [83, 22.5] as [number, number], scale: 1050 };

function IndiaMapImpl({
  highlighted,
  onSelect,
  onHover,
  className,
  width = 800,
  height = 850,
}: IndiaMapProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const highlightedMap = useMemo(() => highlighted ?? {}, [highlighted]);

  const handleEnter = useCallback(
    (geo: PreparedGeography) => {
      const normalized = normalizePcProperties(geo.properties);
      setHoveredKey(geo.rsmKey);
      onHover?.(normalized ? featureKey(normalized) : null);
    },
    [onHover]
  );

  const handleLeave = useCallback(() => {
    setHoveredKey(null);
    onHover?.(null);
  }, [onHover]);

  const handleClick = useCallback(
    (geo: PreparedGeography) => {
      const normalized = normalizePcProperties(geo.properties);
      if (normalized) onSelect?.(featureKey(normalized));
    },
    [onSelect]
  );

  // Precompute fill styling per feature only when the highlighted set or
  // hover state changes — the SVG path geometry itself is memoized inside
  // react-simple-maps (keyed on the geography object + projection), so this
  // never re-projects on every render.
  const styleFor = useCallback(
    (geo: PreparedGeography) => {
      const normalized = normalizePcProperties(geo.properties);
      const entry = normalized ? highlightedMap[featureKey(normalized)] : undefined;
      const isHovered = geo.rsmKey === hoveredKey;

      const fill = entry
        ? TIER_COLORS[entry.tier]
        : isHovered
          ? MAP_NEUTRAL.fillHover
          : MAP_NEUTRAL.fill;

      return {
        fill,
        stroke: entry ? "#ffffff" : MAP_NEUTRAL.stroke,
        strokeWidth: entry ? 0.6 : 0.5,
        outline: "none",
        cursor: "pointer",
        transition: "fill 120ms ease-in-out",
      } satisfies CSSProperties;
    },
    [highlightedMap, hoveredKey]
  );

  return (
    <div className={className}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={PROJECTION_CONFIG}
        width={width}
        height={height}
        style={{ width: "100%", height: "auto" }}
        role="img"
        aria-label="Map of India's Lok Sabha parliamentary constituencies"
      >
        <Geographies geography={geoJson}>
          {({ geographies }) =>
            (geographies as PreparedGeography[]).map((geo) => {
              const normalized = normalizePcProperties(geo.properties);
              const entry = normalized
                ? highlightedMap[featureKey(normalized)]
                : undefined;
              const label =
                entry?.label ??
                normalized?.pcName ??
                `PC ${normalized?.pcNumber ?? "?"}`;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={() => handleEnter(geo)}
                  onMouseLeave={handleLeave}
                  onClick={() => handleClick(geo)}
                  style={{ default: styleFor(geo) }}
                  aria-label={
                    normalized?.stateName ? `${label}, ${normalized.stateName}` : label
                  }
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}

export const IndiaMap = memo(IndiaMapImpl);

export type { Tier };
export type { NormalizedPcProperties } from "./normalize";
