import Link from "next/link";

import { buildAccountRows } from "@/lib/account-metrics";
import { LeaderboardExplorer } from "./leaderboard-explorer";

export const metadata = {
  title: "Engagement Leaderboard — Constituency Pulse",
};

export default function LeaderboardPage() {
  const rows = buildAccountRows();

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Engagement Leaderboard</h1>
        <p className="text-muted-foreground">
          A cross-platform ranking of all {rows.length} fictional accounts — separate from the{" "}
          <Link href="/channels" className="underline underline-offset-2 hover:text-foreground">
            Accounts
          </Link>{" "}
          hub&apos;s follower leaderboard. This page ranks by engagement rate, and separately
          surfaces the top accounts by raw reach (followers) and by growth. All data is fully
          synthetic and deterministic — see{" "}
          <Link href="/methodology" className="underline underline-offset-2 hover:text-foreground">
            Methodology
          </Link>
          .
        </p>
      </div>

      <LeaderboardExplorer rows={rows} />
    </div>
  );
}
