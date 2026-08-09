import { computeGrowthAlerts, ALERT_WINDOW_DAYS, ALERT_THRESHOLD_PCT } from "@/lib/alerts";
import { getAllPosts, type Post } from "@/data/mock/posts";
import { analyzePost } from "@/data/mock/mock-analysis";
import { ACCOUNTS, type AccountCategory } from "@/data/mock/accounts";
import type { Platform } from "@/lib/types";
import { FormattedLeaderboard } from "@/components/charts/formatted-leaderboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { SENTIMENT_POSITIVE, SENTIMENT_NEGATIVE, SENTIMENT_NEUTRAL } from "@/lib/palette";

// This app has no database and no live APIs — every alert below is computed
// from the deterministic mock data modules, so the page renders the same
// content on every request and can be statically generated.

export const metadata = {
  title: "Rising channel & sentiment alerts — Constituency Pulse",
};

const CATEGORY_LABEL: Record<AccountCategory, string> = {
  "established-influencer": "Established influencer",
  "rising-new-media": "Rising new media",
};

const PLATFORM_LABEL: Record<Platform, string> = {
  youtube: "YouTube",
  x: "X",
  instagram: "Instagram",
  facebook: "Facebook",
};

function formatCount(n: number): string {
  return n.toLocaleString();
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

function SentimentDeltaValue({ delta }: { delta: number }) {
  const color = delta >= 0 ? SENTIMENT_POSITIVE : SENTIMENT_NEGATIVE;
  const sign = delta > 0 ? "+" : "";
  return (
    <span className="font-medium" style={{ color }}>
      {sign}
      {delta.toFixed(2)}
    </span>
  );
}

function SentimentScore({ score }: { score: number }) {
  const color =
    score > 0.15 ? SENTIMENT_POSITIVE : score < -0.15 ? SENTIMENT_NEGATIVE : SENTIMENT_NEUTRAL;
  const sign = score > 0 ? "+" : "";
  return (
    <span style={{ color }}>
      {sign}
      {score.toFixed(2)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Sentiment-shift alerts — a second alert type layered on top of the shared
// growth-alert logic in `src/lib/alerts.ts`. Kept local to this route (not
// added to that shared file) since it has its own independent trailing-
// window rule over post sentiment rather than follower counts, and that
// shared module is being read by another in-flight page at the same time.
//
// Same trailing-window shape as `computeGrowthAlerts()`: compare each
// account's average post sentiment over the most recent SENTIMENT_WINDOW_DAYS
// against the SENTIMENT_WINDOW_DAYS immediately before that, using the latest
// `publishedAt` across all mock posts as the "today" anchor (rather than the
// real wall-clock date) so this stays consistent with the deterministic mock
// data regardless of when the page happens to render.
// ---------------------------------------------------------------------------

const SENTIMENT_WINDOW_DAYS = 14;
/** Minimum absolute swing in average sentiment (-1..1 scale) to qualify as an alert. */
const SENTIMENT_SHIFT_THRESHOLD = 0.3;

export interface SentimentShiftAlert {
  accountId: string;
  handle: string;
  displayName: string;
  platform: Platform;
  category: AccountCategory;
  recentAvgSentiment: number;
  priorAvgSentiment: number;
  recentPostCount: number;
  priorPostCount: number;
  delta: number;
  direction: "up" | "down";
}

function isoDateDaysBefore(referenceDate: string, daysBefore: number): string {
  const d = new Date(`${referenceDate}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - daysBefore);
  return d.toISOString().slice(0, 10);
}

function averageSentiment(posts: Post[]): number {
  const total = posts.reduce((sum, post) => sum + analyzePost(post).sentimentScore, 0);
  return Math.round((total / posts.length) * 100) / 100;
}

/** All accounts whose recent-vs-prior trailing-window average post sentiment
 *  crosses SENTIMENT_SHIFT_THRESHOLD, sorted by |delta| desc. Accounts with
 *  no posts in either window are skipped — there's nothing to compare. */
function computeSentimentShiftAlerts(): SentimentShiftAlert[] {
  const accountsById = new Map(ACCOUNTS.map((a) => [a.id, a]));
  const posts = getAllPosts();

  const referenceDate = posts.reduce(
    (max, post) => (post.publishedAt > max ? post.publishedAt : max),
    posts[0]?.publishedAt ?? ""
  );
  if (!referenceDate) return [];

  const recentCutoff = isoDateDaysBefore(referenceDate, SENTIMENT_WINDOW_DAYS);
  const priorCutoff = isoDateDaysBefore(referenceDate, SENTIMENT_WINDOW_DAYS * 2);

  const postsByAccount = new Map<string, Post[]>();
  for (const post of posts) {
    const existing = postsByAccount.get(post.accountId);
    if (existing) existing.push(post);
    else postsByAccount.set(post.accountId, [post]);
  }

  const alerts: SentimentShiftAlert[] = [];

  for (const [accountId, accountPosts] of postsByAccount) {
    const account = accountsById.get(accountId);
    if (!account) continue;

    const recent = accountPosts.filter((p) => p.publishedAt > recentCutoff);
    const prior = accountPosts.filter(
      (p) => p.publishedAt <= recentCutoff && p.publishedAt > priorCutoff
    );
    if (recent.length === 0 || prior.length === 0) continue;

    const recentAvgSentiment = averageSentiment(recent);
    const priorAvgSentiment = averageSentiment(prior);
    const delta = Math.round((recentAvgSentiment - priorAvgSentiment) * 100) / 100;

    if (Math.abs(delta) < SENTIMENT_SHIFT_THRESHOLD) continue;

    alerts.push({
      accountId: account.id,
      handle: account.handle,
      displayName: account.displayName,
      platform: account.platform,
      category: account.category,
      recentAvgSentiment,
      priorAvgSentiment,
      recentPostCount: recent.length,
      priorPostCount: prior.length,
      delta,
      direction: delta >= 0 ? "up" : "down",
    });
  }

  return alerts.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

export default function AlertsPage() {
  const growthAlerts = computeGrowthAlerts();
  const sentimentAlerts = computeSentimentShiftAlerts();

  const growthChartData = growthAlerts.map((a) => ({ label: a.displayName, value: a.growthPct }));
  const sentimentChartData = sentimentAlerts.map((a) => ({ label: a.displayName, value: a.delta }));

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Rising channel &amp; sentiment alerts</h1>
        <p className="text-muted-foreground">
          Two independent signals over the same synthetic account roster: follower growth that
          crosses a threshold over a trailing {ALERT_WINDOW_DAYS}-day window, and average post
          sentiment that shifts sharply between two trailing {SENTIMENT_WINDOW_DAYS}-day windows.
          Both are meant to flag accounts worth a closer look, not to make a judgment about them —
          see <span className="font-medium">Methodology</span> for how everything here is computed.
        </p>
      </div>

      {/* --------------------------------------------------------------- */}
      {/* Growth alerts                                                   */}
      {/* --------------------------------------------------------------- */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-medium">Growth alerts</h2>
          <p className="text-sm text-muted-foreground">
            Follower growth between the latest snapshot and the snapshot {ALERT_WINDOW_DAYS} days
            earlier, for every account whose |growth| crosses {ALERT_THRESHOLD_PCT}%. Positive and
            negative growth are both shown the same way.
          </p>
        </div>

        {growthAlerts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No accounts currently cross the {ALERT_THRESHOLD_PCT}% growth threshold.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Follower growth by account</CardTitle>
                <CardDescription>
                  Percent change over the trailing {ALERT_WINDOW_DAYS}-day window, ranked by
                  magnitude.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormattedLeaderboard data={growthChartData} format="percent-signed" colorBySign />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leaderboard</CardTitle>
                <CardDescription>
                  Accounts whose trailing-window growth crosses {ALERT_THRESHOLD_PCT}%.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Latest followers</TableHead>
                      <TableHead className="text-right">Previous followers</TableHead>
                      <TableHead className="text-right">Growth</TableHead>
                      <TableHead>Window</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {growthAlerts.map((a) => (
                      <TableRow key={a.accountId}>
                        <TableCell>
                          <div className="font-medium">{a.displayName}</div>
                          <div className="text-xs text-muted-foreground">{a.handle}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{PLATFORM_LABEL[a.platform]}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{CATEGORY_LABEL[a.category]}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCount(a.latestFollowerCount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCount(a.previousFollowerCount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <GrowthValue growthPct={a.growthPct} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {a.previousDate} &rarr; {a.latestDate}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </section>

      <Separator />

      {/* --------------------------------------------------------------- */}
      {/* Sentiment shift alerts                                          */}
      {/* --------------------------------------------------------------- */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-medium">Sentiment shift alerts</h2>
          <p className="text-sm text-muted-foreground">
            Average post sentiment (-1..1) over the trailing {SENTIMENT_WINDOW_DAYS} days compared
            against the {SENTIMENT_WINDOW_DAYS} days before that, for every account whose swing is
            at least &plusmn;{SENTIMENT_SHIFT_THRESHOLD.toFixed(1)}. Accounts with no posts in one
            of the two windows are omitted rather than guessed at.
          </p>
        </div>

        {sentimentAlerts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No accounts currently cross the &plusmn;{SENTIMENT_SHIFT_THRESHOLD.toFixed(1)}{" "}
              sentiment-shift threshold.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Sentiment shift by account</CardTitle>
                <CardDescription>
                  Change in average post sentiment between the two trailing windows, ranked by
                  magnitude.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormattedLeaderboard
                  data={sentimentChartData}
                  format="decimal-signed"
                  colorBySign
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leaderboard</CardTitle>
                <CardDescription>
                  Accounts whose sentiment swing crosses &plusmn;
                  {SENTIMENT_SHIFT_THRESHOLD.toFixed(1)}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Recent avg. sentiment</TableHead>
                      <TableHead className="text-right">Prior avg. sentiment</TableHead>
                      <TableHead className="text-right">Shift</TableHead>
                      <TableHead className="text-right">Posts (recent / prior)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sentimentAlerts.map((a) => (
                      <TableRow key={a.accountId}>
                        <TableCell>
                          <div className="font-medium">{a.displayName}</div>
                          <div className="text-xs text-muted-foreground">{a.handle}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{PLATFORM_LABEL[a.platform]}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{CATEGORY_LABEL[a.category]}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <SentimentScore score={a.recentAvgSentiment} />
                        </TableCell>
                        <TableCell className="text-right">
                          <SentimentScore score={a.priorAvgSentiment} />
                        </TableCell>
                        <TableCell className="text-right">
                          <SentimentDeltaValue delta={a.delta} />
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {a.recentPostCount} / {a.priorPostCount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </section>
    </div>
  );
}
