import Link from "next/link";

import { buildIntelligenceGraph } from "@/data/mock/graph";
import { getAllAmplificationEvents } from "@/data/mock/amplification";
import { ACCOUNTS } from "@/data/mock/accounts";
import { constituencies } from "@/data/constituencies";
import { ChartCard } from "@/components/dashboard/chart-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  NetworkGraphClient,
  type NetworkAccountSummary,
  type NetworkConstituencySummary,
} from "./network-graph-client";
import {
  EDGE_TYPE_COLORS,
  EDGE_TYPE_DASH,
  EDGE_TYPE_LABELS,
  EDGE_TYPE_ORDER,
  NODE_TYPE_COLORS,
  NODE_TYPE_LABELS,
  NODE_TYPE_ORDER,
} from "./network-colors";

export const metadata = {
  title: "Influence Network Graph — Constituency Pulse",
};

/**
 * Server component: builds the PRD's "Constituency Intelligence Graph" and
 * the amplification-event list once, server-side, then hands the plain,
 * already-serializable results down to the client-only force-graph
 * renderer. Also flattens `ACCOUNTS`/`constituencies` into small lookup
 * maps keyed by id so the client detail panel can resolve a clicked
 * account/constituency node to its full profile without needing to import
 * (and bundle) the full mock-data modules into the client.
 */
export default function NetworkPage() {
  const graph = buildIntelligenceGraph();
  const amplificationEvents = getAllAmplificationEvents();

  const accountsById: Record<string, NetworkAccountSummary> = {};
  for (const account of ACCOUNTS) {
    accountsById[account.id] = {
      displayName: account.displayName,
      handle: account.handle,
      platform: account.platform,
      category: account.category,
      languageRegion: account.languageRegion,
      bio: account.bio,
      baseFollowerCount: account.baseFollowerCount,
      primaryConstituencyId: account.primaryConstituencyId,
    };
  }

  const constituenciesById: Record<string, NetworkConstituencySummary> = {};
  for (const constituency of constituencies) {
    constituenciesById[constituency.id] = {
      name: constituency.name,
      state: constituency.state,
      tier: constituency.tier,
    };
  }

  const nodeCounts = { account: 0, constituency: 0, issue: 0, policy: 0 } as Record<string, number>;
  for (const node of graph.nodes) nodeCounts[node.type] += 1;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Influence Network Graph</h1>
        <p className="max-w-3xl text-muted-foreground">
          This visualizes the source PRD&apos;s &ldquo;Constituency Intelligence Graph&rdquo;: the
          same constituencies, issues, accounts, and policies tracked elsewhere in this prototype,
          linked by how narratives are discussed, driven, and addressed — plus the cross-platform
          account links and amplification events that show how a story jumps from one platform to
          another. Node size scales with each node&apos;s weight within its own type (followers for
          accounts, mention count for issues, digital-engagement index for constituencies).
        </p>
      </div>

      <Alert>
        <AlertTitle>Every node and edge below is synthetic demo data</AlertTitle>
        <AlertDescription>
          {graph.nodes.length} nodes ({nodeCounts.account} accounts, {nodeCounts.constituency}{" "}
          constituencies, {nodeCounts.issue} issues, {nodeCounts.policy} policies) and{" "}
          {graph.edges.length} edges, all deterministically derived from the fictional account
          roster and curated constituency subset — none of it is scraped, live, or real social
          activity. See{" "}
          <Link href="/methodology" className="underline underline-offset-2 hover:text-foreground">
            Methodology
          </Link>{" "}
          for how the graph and the amplification events are constructed.
        </AlertDescription>
      </Alert>

      <ChartCard
        title="Constituency Intelligence Graph"
        description="Click any node for its full detail. Toggle node types or focus a single constituency below. Pan, zoom, and drag work out of the box."
        footer={<GraphLegend />}
      >
        <NetworkGraphClient
          nodes={graph.nodes}
          edges={graph.edges}
          amplificationEvents={amplificationEvents}
          accountsById={accountsById}
          constituenciesById={constituenciesById}
        />
      </ChartCard>
    </div>
  );
}

function GraphLegend() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {NODE_TYPE_ORDER.map((type) => (
          <span key={type} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: NODE_TYPE_COLORS[type] }}
            />
            {NODE_TYPE_LABELS[type]}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {EDGE_TYPE_ORDER.map((type) => (
          <span key={type} className="inline-flex items-center gap-1.5">
            <svg width="18" height="8" aria-hidden="true">
              <line
                x1="0"
                y1="4"
                x2="18"
                y2="4"
                stroke={EDGE_TYPE_COLORS[type]}
                strokeWidth={2}
                strokeDasharray={EDGE_TYPE_DASH[type]?.join(" ")}
              />
            </svg>
            {EDGE_TYPE_LABELS[type]}
          </span>
        ))}
      </div>
    </div>
  );
}
