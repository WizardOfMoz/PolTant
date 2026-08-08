import { Badge } from "@/components/ui/badge";
import { TIER_COLORS, type Tier } from "@/lib/palette";
import { cn } from "@/lib/utils";
import type { CoverageTier } from "@/lib/election/tiering";

/**
 * Small shared badge helpers for the constituency list/detail pages, colored
 * from the app-wide palette (`src/lib/palette.ts`) rather than inventing new
 * colors per page — same ordinal ramp the map uses for tiers.
 */

export function TierBadge({ tier, className }: { tier: Tier; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent text-white", className)}
      style={{ backgroundColor: TIER_COLORS[tier] }}
    >
      {tier}
    </Badge>
  );
}

const COVERAGE_TIER_VARIANT: Record<CoverageTier, "default" | "secondary" | "outline"> = {
  "Tier 1": "default",
  "Tier 2": "secondary",
  "Tier 3": "outline",
};

export function CoverageTierBadge({
  tier,
  className,
}: {
  tier: CoverageTier;
  className?: string;
}) {
  return (
    <Badge variant={COVERAGE_TIER_VARIANT[tier]} className={className}>
      {tier}
    </Badge>
  );
}
