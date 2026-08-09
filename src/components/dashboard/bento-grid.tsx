import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * Asymmetric grid container for a dashboard's "top narratives / rising
 * accounts / leaderboard" section. Purely a grid-layout primitive — give
 * each child `BentoCard` a `className` like `"md:col-span-2"` or
 * `"md:row-span-2"` to build the asymmetric layout; the grid itself just
 * sets up equal-height auto rows for those spans to work against.
 *
 * No client-side JS (hover effects on `BentoCard` are pure CSS), so this
 * stays server-renderable.
 */
export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      data-slot="bento-grid"
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:auto-rows-[15rem]",
        className
      )}
    >
      {children}
    </div>
  );
}

export interface BentoCardProps {
  /** Grid placement, e.g. `"sm:col-span-2 lg:row-span-2"` for a hero cell. */
  className?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  /**
   * Small icon badge shown top-right of the title. Pass an already-rendered
   * element (e.g. `<Flame className="size-4.5" />`), NOT a bare component
   * reference — this card is a Client Component, and a Server Component
   * parent can't pass a function/component type as a prop across that
   * boundary (only serializable values and rendered elements cross it).
   */
  icon?: ReactNode;
  /**
   * Decorative visual filling the card behind the text content — a mini
   * chart, gradient, sparkline, avatar stack, etc. Rendered full-bleed
   * behind everything else, so keep it low-contrast or let `children`
   * carry the real content instead.
   */
  header?: ReactNode;
  /**
   * Primary content — a leaderboard list, a chart, a set of pills. Rendered
   * below the title/description and allowed to grow to fill remaining
   * height.
   */
  children?: ReactNode;
  href?: string;
  cta?: string;
}

/**
 * Single bento cell. Restyled from MagicUI's public `bento-grid` registry
 * component (https://magicui.design/r/bento-grid.json — one of the
 * community sources 21st.dev showcases under aceternity/bento-grid;
 * 21st.dev's own CLI registry endpoint requires an authenticated API key we
 * don't have, see the module doc in this folder's README-equivalent comment
 * in `index.ts`) onto this app's card/token conventions instead of the
 * original's raw dark-mode Tailwind classes, and generalized past the
 * original's fixed background/Icon/cta shape to also accept a `children`
 * slot so a later page can drop a `LeaderboardBarChart` or list straight
 * in. The hover lift/translate motion from the original is kept, done in
 * pure CSS (`group-hover:*`) rather than a JS animation library.
 */
export function BentoCard({
  className,
  eyebrow,
  title,
  description,
  icon,
  header,
  children,
  href,
  cta,
}: BentoCardProps) {
  return (
    <div
      data-slot="bento-card"
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm ring-1 ring-foreground/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/15",
        className
      )}
    >
      {header && (
        <div className="pointer-events-none absolute inset-0 -z-0 opacity-90 transition-opacity duration-300 group-hover:opacity-100">
          {header}
        </div>
      )}

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          {eyebrow && (
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {eyebrow}
            </span>
          )}
          <h3 className="font-heading text-base font-semibold text-foreground transition-transform duration-300 group-hover:translate-x-0.5">
            {title}
          </h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {icon && (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-4.5">
            {icon}
          </span>
        )}
      </div>

      {children && <div className="relative z-10 mt-3 flex-1 min-h-0">{children}</div>}

      {href && cta && (
        <a
          href={href}
          className="relative z-10 mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        >
          {cta}
          <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </a>
      )}
    </div>
  );
}
