/**
 * Shared dashboard primitives for the "wow" analytics-dashboard redesign.
 *
 * Provenance note: the task brief asked for these to be sourced via the
 * shadcn CLI against the 21st.dev community registry. 21st.dev's CLI-facing
 * registry endpoint (`https://21st.dev/r/<author>/<slug>`) now requires an
 * authenticated API key for every item — including free ones — and returns
 * `401`/`403 authentication_required` with no key configured in this
 * environment. Rather than fabricate a pull, we pulled the same two
 * components 21st.dev's community authors mirror from their own public,
 * unauthenticated registries (the exact CLI mechanism, just not gated):
 *
 * - `StatCard` wraps `NumberTicker` (src/components/ui/number-ticker.tsx),
 *   pulled from https://magicui.design/r/number-ticker.json — a spring
 *   count-up primitive using Motion, kept structurally as-is and restyled
 *   from hardcoded black/white to `text-foreground`.
 * - `BentoGrid`/`BentoCard` were pulled from
 *   https://magicui.design/r/bento-grid.json (the same layout 21st.dev
 *   lists as "aceternity/bento-grid"), then substantially rewritten: the
 *   dark-mode Tailwind classes were swapped for this app's card/token
 *   conventions, the Radix-icon + Button dependency was dropped in favor of
 *   lucide-react (this app's configured icon library), and the card was
 *   generalized to accept a `children` slot for embedding real content
 *   (charts, lists) rather than only a fixed background/CTA shape.
 *
 * `ChartCard` has no 21st.dev origin — no public, unauthenticated registry
 * item fit the narrow "chart wrapper" need, so it's original code composed
 * from the existing `src/components/ui/card.tsx` primitives.
 *
 * Both pulled sources were read in full before being kept: neither makes
 * network calls or ships analytics/telemetry.
 */

export { StatCard, type StatCardProps } from "./stat-card";
export { BentoGrid, BentoCard, type BentoGridProps, type BentoCardProps } from "./bento-grid";
export { ChartCard, type ChartCardProps } from "./chart-card";
