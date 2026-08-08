"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { Constituency } from "@/data/constituencies";
import { TIER_ORDER } from "@/lib/palette";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TierBadge, CoverageTierBadge } from "./tier-badge";

const ALL = "all";

/**
 * Client-side filter + table over the already-fetched 27 curated seats — no
 * URL params or server filtering needed at this scale (see task brief).
 */
export function ConstituencyExplorer({
  constituencies,
}: {
  constituencies: Constituency[];
}) {
  const [state, setState] = useState<string>(ALL);
  const [tier, setTier] = useState<string>(ALL);

  const states = useMemo(
    () => Array.from(new Set(constituencies.map((c) => c.state))).sort(),
    [constituencies]
  );

  const filtered = useMemo(() => {
    return constituencies
      .filter((c) => state === ALL || c.state === state)
      .filter((c) => tier === ALL || c.tier === tier)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [constituencies, state, tier]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={state} onValueChange={(value) => setState(value ?? ALL)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All states" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All states</SelectItem>
            {states.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tier} onValueChange={(value) => setTier(value ?? ALL)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All tiers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All tiers</SelectItem>
            {TIER_ORDER.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground">
          {filtered.length} of {constituencies.length} seats
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Constituency</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Coverage</TableHead>
              <TableHead className="text-right">Digital engagement index</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/constituencies/${c.id}`}
                    className="hover:underline"
                  >
                    {c.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{c.state}</TableCell>
                <TableCell>
                  <TierBadge tier={c.tier} />
                </TableCell>
                <TableCell>
                  <CoverageTierBadge tier={c.coverageTier} />
                </TableCell>
                <TableCell className="text-right">
                  {c.digitalEngagementIndex.toFixed(1)}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-6 text-center text-muted-foreground"
                >
                  No seats match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
