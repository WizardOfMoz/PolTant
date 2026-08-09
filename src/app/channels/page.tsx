import Link from "next/link";

import { buildAccountRows } from "@/lib/account-metrics";
import { FormattedLeaderboard } from "@/components/charts/formatted-leaderboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChannelsExplorer } from "./channels-explorer";

export const metadata = {
  title: "Accounts — Constituency Pulse",
};

const FOLLOWER_LEADERBOARD_SIZE = 15;

export default function ChannelsPage() {
  const rows = buildAccountRows();

  const leaderboardData = [...rows]
    .sort((a, b) => b.account.baseFollowerCount - a.account.baseFollowerCount)
    .slice(0, FOLLOWER_LEADERBOARD_SIZE)
    .map((row) => ({ label: row.account.displayName, value: row.account.baseFollowerCount }));

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
        <p className="text-muted-foreground">
          All {rows.length} fictional accounts in this demo, spanning YouTube, X, Instagram, and
          Facebook. Every account below is shown as <strong>connected</strong>, with fully
          synthetic, illustrative data — there are no live platform APIs and no database behind
          this build. See{" "}
          <Link href="/methodology" className="underline underline-offset-2 hover:text-foreground">
            Methodology
          </Link>{" "}
          for how the numbers, posts, and sentiment analysis are generated.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Followers leaderboard</CardTitle>
          <CardDescription>
            Top {leaderboardData.length} of {rows.length} accounts across all four platforms, ranked
            by follower count.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormattedLeaderboard data={leaderboardData} format="count" />
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-medium">All accounts</h2>
          <p className="text-sm text-muted-foreground">
            Filter by platform or category. Click a row to open its profile — follower-growth
            history, recent posts, and each post&apos;s sentiment/topic analysis.
          </p>
        </div>
        <ChannelsExplorer rows={rows} />
      </section>
    </div>
  );
}
