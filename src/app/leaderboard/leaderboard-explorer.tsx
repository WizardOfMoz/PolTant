"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import type { AccountCategory } from "@/data/mock/accounts";
import type { Platform } from "@/lib/types";
import type { AccountRow } from "@/lib/account-metrics";
import { CATEGORY_LABEL, PLATFORM_LABEL } from "@/lib/account-metrics";
import { AccountAvatar } from "@/components/accounts/account-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormattedLeaderboard } from "@/components/charts/formatted-leaderboard";
import { SENTIMENT_NEGATIVE, SENTIMENT_POSITIVE } from "@/lib/palette";

type RankMode = "engagement" | "reach" | "growth";
type PlatformFilter = "all" | Platform;
type CategoryFilter = "all" | AccountCategory;

const RANK_MODE_LABEL: Record<RankMode, string> = {
  engagement: "Top by engagement rate",
  reach: "Top by reach (followers)",
  growth: "Top by growth",
};

const RANK_MODE_DESCRIPTION: Record<RankMode, string> = {
  engagement: "Ranked by each account's most recent (day-90) engagement rate.",
  reach: "Ranked by base follower/subscriber count — raw audience size, not engagement.",
  growth:
    "Only accounts currently flagged as rising (trailing 14-day follower growth above the alert threshold — see src/lib/alerts.ts).",
};

const followerFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatFollowers(value: number): string {
  return followerFormatter.format(value);
}

function formatEngagementRate(rate: number | null): string {
  if (rate === null) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

function GrowthBadge({ row }: { row: AccountRow }) {
  if (!row.alert) {
    return <span className="text-xs text-muted-foreground">Steady</span>;
  }
  const up = row.alert.direction === "up";
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  const color = up ? SENTIMENT_POSITIVE : SENTIMENT_NEGATIVE;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color }}>
      <Icon className="size-3.5" />
      {up ? "+" : ""}
      {row.alert.growthPct.toFixed(1)}%
    </span>
  );
}

interface LeaderboardExplorerProps {
  rows: AccountRow[];
}

const CHART_SIZE = 10;

export function LeaderboardExplorer({ rows }: LeaderboardExplorerProps) {
  const router = useRouter();
  const [rankMode, setRankMode] = useState<RankMode>("engagement");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        if (platformFilter !== "all" && row.account.platform !== platformFilter) return false;
        if (categoryFilter !== "all" && row.account.category !== categoryFilter) return false;
        return true;
      }),
    [rows, platformFilter, categoryFilter]
  );

  const ranked = useMemo(() => {
    if (rankMode === "reach") {
      return [...filtered].sort((a, b) => b.account.baseFollowerCount - a.account.baseFollowerCount);
    }
    if (rankMode === "growth") {
      return filtered
        .filter((row) => row.alert && row.alert.direction === "up")
        .sort((a, b) => (b.alert?.growthPct ?? 0) - (a.alert?.growthPct ?? 0));
    }
    // engagement
    return [...filtered]
      .filter((row) => row.latestEngagementRate !== null)
      .sort((a, b) => (b.latestEngagementRate ?? 0) - (a.latestEngagementRate ?? 0));
  }, [filtered, rankMode]);

  const chartData = useMemo(() => {
    const top = ranked.slice(0, CHART_SIZE);
    if (rankMode === "reach") {
      return top.map((row) => ({ label: row.account.displayName, value: row.account.baseFollowerCount }));
    }
    if (rankMode === "growth") {
      return top.map((row) => ({ label: row.account.displayName, value: row.alert?.growthPct ?? 0 }));
    }
    return top.map((row) => ({
      label: row.account.displayName,
      value: Math.round((row.latestEngagementRate ?? 0) * 1000) / 10,
    }));
  }, [ranked, rankMode]);

  const chartFormat = rankMode === "reach" ? "count" : rankMode === "growth" ? "percent-signed" : "percent";

  return (
    <div className="space-y-6">
      <Tabs value={rankMode} onValueChange={(value) => setRankMode(value as RankMode)}>
        <TabsList>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="reach">Reach</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={platformFilter} onValueChange={(value) => setPlatformFilter(value as PlatformFilter)}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">All platforms</TabsTrigger>
            <TabsTrigger value="youtube">YouTube</TabsTrigger>
            <TabsTrigger value="x">X</TabsTrigger>
            <TabsTrigger value="instagram">Instagram</TabsTrigger>
            <TabsTrigger value="facebook">Facebook</TabsTrigger>
          </TabsList>
        </Tabs>

        <Tabs value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as CategoryFilter)}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">Any category</TabsTrigger>
            <TabsTrigger value="established-influencer">Established</TabsTrigger>
            <TabsTrigger value="rising-new-media">Rising</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{RANK_MODE_LABEL[rankMode]}</CardTitle>
          <CardDescription>{RANK_MODE_DESCRIPTION[rankMode]}</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <FormattedLeaderboard data={chartData} format={chartFormat} colorBySign={rankMode === "growth"} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No accounts match the current filters{rankMode === "growth" ? " and rising threshold" : ""}.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Engagement</TableHead>
              <TableHead className="text-right">Followers</TableHead>
              <TableHead>Growth</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranked.map((row, index) => {
              const { account } = row;
              return (
                <TableRow
                  key={account.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/channels/${account.id}`)}
                >
                  <TableCell className="text-muted-foreground tabular-nums">{index + 1}</TableCell>
                  <TableCell className="max-w-56 whitespace-normal">
                    <div className="flex items-center gap-2.5">
                      <AccountAvatar seed={account.avatarSeed} name={account.displayName} size="sm" />
                      <div>
                        <div className="font-medium text-foreground">{account.displayName}</div>
                        <div className="text-xs text-muted-foreground">{account.handle}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{PLATFORM_LABEL[account.platform]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{CATEGORY_LABEL[account.category]}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatEngagementRate(row.latestEngagementRate)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatFollowers(account.baseFollowerCount)}
                  </TableCell>
                  <TableCell>
                    <GrowthBadge row={row} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {ranked.length === 0 && (
        <p className="text-sm text-muted-foreground">No accounts match the current filters.</p>
      )}
    </div>
  );
}
