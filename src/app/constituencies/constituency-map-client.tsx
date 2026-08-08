"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { IndiaMap, type HighlightedConstituency } from "@/components/map/india-map";

/**
 * `IndiaMap` is a "use client" component (react-simple-maps needs the DOM),
 * so click-to-navigate has to be wired up in a client boundary. This wrapper
 * takes plain, already-serializable data built server-side in
 * `page.tsx` (via `matchConstituenciesToBoundaries`) — a `highlighted` map
 * keyed by the boundary file's globally-unique `pcId` (NOT `pcNumber`, which
 * repeats across states — see `IndiaMap`'s own doc comments) plus the
 * reverse `pcId -> constituencyId` lookup derived from that same match — and
 * turns a map click into a route push to that seat's detail page. Clicks on
 * an untracked (non-highlighted) seat are no-ops, since there's no detail
 * page for a seat outside the curated 27.
 */
export interface ConstituencyMapClientProps {
  highlighted: Record<number, HighlightedConstituency>;
  pcIdToConstituencyId: Record<number, string>;
  className?: string;
}

export function ConstituencyMapClient({
  highlighted,
  pcIdToConstituencyId,
  className,
}: ConstituencyMapClientProps) {
  const router = useRouter();

  const handleSelect = useCallback(
    (featureKey: number) => {
      const constituencyId = pcIdToConstituencyId[featureKey];
      if (constituencyId) router.push(`/constituencies/${constituencyId}`);
    },
    [pcIdToConstituencyId, router]
  );

  return (
    <IndiaMap
      highlighted={highlighted}
      onSelect={handleSelect}
      className={className}
    />
  );
}
