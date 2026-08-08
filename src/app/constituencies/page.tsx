import Link from "next/link";

import { constituencies } from "@/data/constituencies";
import { matchConstituenciesToBoundaries } from "@/lib/election/match-boundary";
import type { HighlightedConstituency } from "@/components/map/india-map";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ConstituencyMapClient } from "./constituency-map-client";
import { ConstituencyExplorer } from "./constituency-explorer";

export const metadata = {
  title: "Constituencies — Constituency Pulse",
};

/**
 * Fully static: only reads the curated static seed data + the boundary
 * matcher, no live fetching, so this page renders at build time (unlike the
 * detail page, which calls the live-fetching, cached brief pipeline and
 * opts into `dynamic = "force-dynamic"`).
 */
export default function ConstituenciesPage() {
  const { matched, unmatched } = matchConstituenciesToBoundaries(constituencies);

  const highlighted: Record<number, HighlightedConstituency> = {};
  const pcIdToConstituencyId: Record<number, string> = {};
  for (const c of constituencies) {
    const pcId = matched.get(c.id);
    if (pcId === undefined) continue;
    highlighted[pcId] = { tier: c.tier, label: c.name };
    pcIdToConstituencyId[pcId] = c.id;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Constituencies</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Click a highlighted seat on the map, or use the table below, to open its detail page.
        </p>
      </div>

      <Alert>
        <AlertTitle>Only a curated subset is tracked</AlertTitle>
        <AlertDescription>
          {constituencies.length} curated seats tracked in this prototype — out of 543 Lok Sabha
          constituencies nationally. Every other seat on the map renders neutral/untracked. See{" "}
          <Link href="/methodology" className="underline underline-offset-2 hover:text-foreground">
            Methodology
          </Link>{" "}
          for how this subset and its tiers were selected.
          {unmatched.length > 0 && (
            <>
              {" "}
              {unmatched.length} tracked seat(s) couldn&apos;t be matched to a map boundary and
              won&apos;t appear highlighted above, though they still appear in the table below.
            </>
          )}
        </AlertDescription>
      </Alert>

      <div className="rounded-xl border border-border bg-card p-4">
        <ConstituencyMapClient
          highlighted={highlighted}
          pcIdToConstituencyId={pcIdToConstituencyId}
        />
      </div>

      <ConstituencyExplorer constituencies={constituencies} />
    </div>
  );
}
