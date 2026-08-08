import Link from "next/link";

import { getChannelsWithLiveData } from "@/lib/pipeline/channels";
import { FormattedLeaderboard } from "@/components/charts/formatted-leaderboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChannelsExplorer } from "./channels-explorer";
import { InactivePlatformCard } from "./inactive-platform-card";

// This page reads from a cached pipeline (unstable_cache, 1h) whose
// illustrative stats drift slightly between refreshes — force-dynamic so
// it isn't frozen at build time with a stale first roll of that drift.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Channels — Constituency Pulse",
};

export default async function ChannelsPage() {
  const { channels } = await getChannelsWithLiveData();

  const leaderboardData = channels
    .filter((c) => c.subscriberCount !== null)
    .sort((a, b) => (b.subscriberCount ?? 0) - (a.subscriberCount ?? 0))
    .map((c) => ({ label: c.displayName, value: c.subscriberCount as number }));

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Tracked channels</h1>
        <p className="text-muted-foreground">
          {channels.length} fictional creator/channel personas spanning YouTube, X, Instagram, and
          Facebook — illustrative content, run through the same real sentiment/topic/narrative
          analysis (Anthropic Claude) the rest of this prototype uses. See{" "}
          <Link href="/methodology" className="underline underline-offset-2 hover:text-foreground">
            Methodology
          </Link>{" "}
          for why the creators are invented while the analysis engine is real.
        </p>
      </div>

      {leaderboardData.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Followers leaderboard</CardTitle>
            <CardDescription>
              Tracked channels across all four platforms, ranked by follower/subscriber count.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormattedLeaderboard data={leaderboardData} format="count" />
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-medium">All tracked channels</h2>
          <p className="text-sm text-muted-foreground">
            Spanning both national and regional-language coverage and multiple political leanings
            (see each row&apos;s rationale). Click a row for its curation note, recent posts, and
            each post&apos;s real computed sentiment/topics.
          </p>
        </div>
        <ChannelsExplorer channels={channels} />
      </section>

      <Separator />

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-medium">Live API status</h2>
          <p className="text-sm text-muted-foreground">
            None of the four platforms above are fetched from a real, live platform API in this
            build — the content shown is illustrative by design (see /methodology). The adapter
            interfaces below exist and are ready to wire up real credentials later; this prototype
            just doesn&apos;t call any of them.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InactivePlatformCard
            platform="YouTube"
            requirement="Real ingestion code exists (src/lib/youtube/) but is unused by design — see /methodology."
          />
          <InactivePlatformCard
            platform="X (Twitter)"
            requirement="Would require a paid X API tier with sufficient read access."
          />
          <InactivePlatformCard
            platform="Instagram"
            requirement="Would require Meta Page Public Content Access approval."
          />
          <InactivePlatformCard
            platform="Facebook"
            requirement="Would require Meta Page Public Content Access approval."
          />
        </div>
      </section>
    </div>
  );
}
