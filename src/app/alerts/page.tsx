import { getGrowthAlerts, type GrowthAlert } from "@/lib/pipeline/alerts";
import { FormattedLeaderboard } from "@/components/charts/formatted-leaderboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { SENTIMENT_POSITIVE, SENTIMENT_NEGATIVE } from "@/lib/palette";

// This page reads live snapshot history from the database on every request
// (growth can only be computed by comparing snapshots recorded hours/days
// apart, so there is nothing meaningful to pre-render at build time).
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Rising channel alerts — Constituency Pulse",
};

const CATEGORY_LABEL: Record<string, string> = {
  "established-influencer": "Established influencer",
  "rising-new-media": "Rising new media",
};

function formatCount(n: number | null): string {
  if (n == null) return "—";
  return n.toLocaleString();
}

/** Short absolute date + a relative-time hint, e.g. "Aug 8, 2026 (3h ago)". */
function formatCapturedAt(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const absolute = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const diffMs = Date.now() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  let relative: string;
  if (diffHours < 1) {
    relative = "under 1h ago";
  } else if (diffHours < 48) {
    relative = `${Math.round(diffHours)}h ago`;
  } else {
    relative = `${Math.round(diffHours / 24)}d ago`;
  }

  return `${absolute} (${relative})`;
}

function GrowthValue({ growthPct }: { growthPct: number }) {
  const color = growthPct >= 0 ? SENTIMENT_POSITIVE : SENTIMENT_NEGATIVE;
  const sign = growthPct > 0 ? "+" : "";
  return (
    <span className="font-medium" style={{ color }}>
      {sign}
      {growthPct.toFixed(1)}%
    </span>
  );
}

export default async function AlertsPage() {
  const { databaseConfigured, alerts } = await getGrowthAlerts();

  const intro = (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Rising channel alerts</h1>
      <p className="text-muted-foreground">
        This mirrors the source PRD&apos;s &quot;Rising Channel Alert&quot; concept: real
        subscriber growth between two recorded snapshots is used as one signal for channels
        crossing into more prominence, so they can be prioritized for closer tracking alongside
        the established set.
      </p>
    </div>
  );

  if (!databaseConfigured) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
        {intro}
        <Alert>
          <AlertTitle>Growth tracking needs a database</AlertTitle>
          <AlertDescription>
            Detecting rising channels requires comparing at least two subscriber-count snapshots
            recorded hours or days apart, which means it needs persistent storage — this
            deployment doesn&apos;t have <code>DATABASE_URL</code> configured, so there is no
            snapshot history to compare yet. See the &quot;Environment variables&quot; section of
            the project README for how to add a Neon Postgres connection string, then redeploy.
            Until then, this page has nothing real to show.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const ranked = alerts
    .filter((a): a is GrowthAlert & { growthPct: number } => a.growthPct != null)
    .sort((a, b) => b.growthPct - a.growthPct);
  const unranked = alerts.filter((a) => a.growthPct == null);

  if (ranked.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
        {intro}
        <Alert>
          <AlertTitle>No growth data yet</AlertTitle>
          <AlertDescription>
            Growth requires at least two snapshots recorded over time for a channel, and none of
            the tracked channels have that yet. The channels page records one snapshot
            automatically roughly every hour — check back in a day or two once a few snapshots
            have accumulated.
          </AlertDescription>
        </Alert>
        {unranked.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {unranked.length} channel{unranked.length === 1 ? "" : "s"} currently tracked, waiting
            on a second snapshot.
          </p>
        )}
      </div>
    );
  }

  const chartData = ranked.map((a) => ({ label: a.displayName, value: a.growthPct }));

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      {intro}

      <Card>
        <CardHeader>
          <CardTitle>Subscriber growth by channel</CardTitle>
          <CardDescription>
            Percent change between each channel&apos;s two most recent recorded snapshots, ranked
            highest to lowest. Positive and negative growth are both real, reportable outcomes —
            a decline is shown the same way a rise is.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormattedLeaderboard data={chartData} format="percent-signed" colorBySign />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>Channels with at least two recorded snapshots.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Latest subscribers</TableHead>
                <TableHead className="text-right">Previous subscribers</TableHead>
                <TableHead className="text-right">Growth</TableHead>
                <TableHead>Latest snapshot</TableHead>
                <TableHead>Previous snapshot</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranked.map((a) => (
                <TableRow key={a.handle}>
                  <TableCell>
                    <div className="font-medium">{a.displayName}</div>
                    <div className="text-xs text-muted-foreground">{a.handle}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{CATEGORY_LABEL[a.category] ?? a.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCount(a.latestSubscriberCount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCount(a.previousSubscriberCount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <GrowthValue growthPct={a.growthPct} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatCapturedAt(a.latestCapturedAt)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatCapturedAt(a.previousCapturedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {unranked.length > 0 && (
        <>
          <Separator />
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                Not enough history yet
              </CardTitle>
              <CardDescription>
                These channels have only one recorded snapshot so far, so no growth figure can be
                computed honestly. They&apos;ll appear in the leaderboard above once a second
                snapshot is recorded.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Latest subscribers</TableHead>
                    <TableHead>Latest snapshot</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unranked.map((a) => (
                    <TableRow key={a.handle} className="text-muted-foreground">
                      <TableCell>
                        <div className="font-medium text-foreground/80">{a.displayName}</div>
                        <div className="text-xs">{a.handle}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-muted-foreground">
                          {CATEGORY_LABEL[a.category] ?? a.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCount(a.latestSubscriberCount)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatCapturedAt(a.latestCapturedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
