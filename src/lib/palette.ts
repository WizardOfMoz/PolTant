/**
 * Shared, deliberately small color palette for every data-viz surface in the
 * app (the India constituency map and the Recharts wrappers in
 * `src/components/charts/`). Keeping every chart/map on the same handful of
 * hex values — rather than letting each component invent its own — is what
 * makes the dashboard read as "one system" instead of a pile of widgets.
 *
 * Design notes (see also the accent color mirrored into
 * `src/app/globals.css` as `--primary`):
 * - Sentiment (positive/negative) is a *polarity* metric (which side of a
 *   zero baseline), so it uses a diverging blue/red pair rather than the
 *   more common green/red — green vs red fails colorblind-separation
 *   checks (deuteranopia ΔE ~4, well under the ≥6 floor) when the two
 *   appear together in one chart, whereas blue/red clears every check by a
 *   wide margin. Blue doubles as the app's brand/accent color, which keeps
 *   the total palette to three hues (blue, red, neutral grey) plus a
 *   4-step ordinal ramp for the map tiers below.
 * - The four constituency "tier" colors are an *ordinal* ramp (one hue,
 *   monotone lightness) rather than four unrelated hues, because the tiers
 *   (Safe -> Lean -> Swing -> Toss-up) represent increasing competitiveness
 *   — exactly the case an ordinal ramp is for. Validated with the dataviz
 *   skill's palette checker (monotone lightness, >=0.06 steps, light end
 *   clears 2:1 contrast against a white surface).
 */

export type Tier = "Safe" | "Lean" | "Swing" | "Toss-up";

/** Brand / accent blue — also used as the shadcn `--primary` token. */
export const ACCENT = "#256abf";

/** Positive-sentiment color (reuses the brand blue; see file header). */
export const SENTIMENT_POSITIVE = ACCENT;
/** Negative-sentiment color. */
export const SENTIMENT_NEGATIVE = "#e34948";
/** Neutral color for baselines, gridlines, and "no strong signal" data. */
export const SENTIMENT_NEUTRAL = "#8a8f98";

/** Ordinal ramp for constituency competitiveness tiers, light -> dark. */
export const TIER_COLORS: Record<Tier, string> = {
  Safe: "#86b6ef",
  Lean: "#5598e7",
  Swing: ACCENT,
  "Toss-up": "#104281",
};

export const TIER_ORDER: Tier[] = ["Safe", "Lean", "Swing", "Toss-up"];

/** Map styling for constituencies that aren't part of the tracked/highlighted set. */
export const MAP_NEUTRAL = {
  fill: "#eef0f2",
  fillHover: "#e2e6ec",
  stroke: "#c7cbd1",
};
