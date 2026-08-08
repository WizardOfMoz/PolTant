import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Methodology — Constituency Pulse",
};

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Methodology &amp; scope</h1>
        <p className="text-muted-foreground">
          This page explains what this prototype does, what it deliberately excludes, and where
          each number comes from. It&rsquo;s adapted from the platform&rsquo;s own product requirements.
        </p>
      </div>

      <Alert>
        <AlertTitle>Tracked channels are fictional — election data and news feeds are real</AlertTitle>
        <AlertDescription>
          The creators/channels shown on this site (see /channels) are invented personas, not real
          people or channels — deliberately so. An earlier version of this prototype tracked real,
          named YouTube channels; that was replaced because attaching computed sentiment/narrative
          scores to real named creators, even genuinely computed rather than fabricated, was judged
          too close to the defamation/reputational risk this platform&rsquo;s own source PRD (Section 7)
          warns against, for a link meant to be shared around. The election results and news RSS
          feeds are real. The sentiment/topic/narrative analysis is a real LLM call over whichever
          of those two it&rsquo;s given — automated, approximate, and not a definitive judgment of
          anything or anyone.
        </AlertDescription>
      </Alert>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">What this is</h2>
        <p className="text-sm text-muted-foreground">
          A constituency-level read on which issues and narratives are gaining traction on
          social/new media, and which named public accounts are driving that traction —
          prioritized toward electorally competitive (swing) constituencies with high social-media
          penetration. It is political and media intelligence infrastructure, not a generic civic
          dashboard; the swing-constituency and named-account targeting are inherently
          electoral-strategy concepts and this page does not obscure that.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Scope</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">In scope</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>Fictional creator/channel personas (not real people) standing in for the
                named-public-account layer, plus real public news RSS feeds</p>
              <p>Aggregated, constituency-level sentiment</p>
              <p>Public engagement metrics (likes, comment counts, shares) as aggregate numbers</p>
              <p>Real public news RSS today; X/Instagram/Facebook as connect-your-own-key
                adapters, not yet live; YouTube ingestion code exists but is unused by design</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Explicitly out of scope</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>Private individual profiles, closed groups, DMs</p>
              <p>Individual commenter names, profile links, or identifiers</p>
              <p>Cross-referencing against voter rolls or any other PII dataset</p>
              <p>De-anonymizing pseudonymous accounts</p>
              <p>Booth-level or individual-level mapping, voter scoring</p>
              <p>Platform scraping that violates a platform&rsquo;s Terms of Service</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Where the data comes from</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            <strong>Election results &amp; swing-tier classification:</strong> real historical Lok
            Sabha results across multiple cycles for a curated subset of constituencies. Margin
            volatility, vote-share flip frequency, and closeness index are computed from those real
            results — see each constituency&rsquo;s detail page for its specific source citations.
          </li>
          <li>
            <strong>Digital Engagement Index:</strong> a documented per-state proxy derived from
            public telecom/internet-penetration data, cited per constituency.
          </li>
          <li>
            <strong>Tracked &ldquo;channels&rdquo;:</strong> fictional Indian-context creator personas
            (invented names, handles, and video content — see /channels and
            `src/data/dummy-channels.ts`), spanning the same politically-diverse, multi-region
            spread the real-channel design aimed for. Illustrative stats drift slightly over time
            rather than being static, so growth-alert math has something real to compute over.
          </li>
          <li>
            <strong>News narrative signal:</strong> fetched live from public RSS feeds of Indian
            news outlets.
          </li>
          <li>
            <strong>Sentiment, topics, and narrative summaries:</strong> computed by a real LLM
            (Anthropic Claude) over the RSS content and the fictional creator content above,
            cached and periodically refreshed rather than recomputed on every page view.
          </li>
        </ul>
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Compliance notes</h2>
        <p className="text-sm text-muted-foreground">
          A production deployment of a platform like this carries real obligations this prototype
          does not resolve on its own: platform Terms of Service for any automated data collection;
          India&rsquo;s DPDP Act 2023 wherever personal data is processed, even from public posts; the
          Election Commission of India&rsquo;s Model Code of Conduct and political advertising/data-use
          rules if used by or for a party, candidate, or campaign vendor; and defamation risk in how
          sentiment about named commentators is stored, scored, and shared. This prototype mitigates
          the sharpest of these (a login gate, neutral non-accusatory framing, no individual-level
          data) but a legal review is a prerequisite for any real deployment, not an afterthought.
        </p>
      </section>
    </div>
  );
}
