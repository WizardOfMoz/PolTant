/**
 * Color/style mapping for the Influence Network Graph, shared between the
 * server-rendered legend in `page.tsx` and the client-side force-graph in
 * `network-graph-client.tsx`. Deliberately reuses existing tokens from
 * `src/lib/palette.ts` rather than introducing new hues — three tints of
 * the shared brand blue (`ACCENT`/`TIER_COLORS`) for the three
 * "structural" node types plus the shared neutral grey for the "topic"
 * node type, matching this app's restrained, light-theme palette used
 * everywhere else (the constituency map, the Recharts wrappers).
 */

import { ACCENT, SENTIMENT_NEUTRAL, TIER_COLORS } from "@/lib/palette";
import type { GraphEdgeType, GraphNodeType } from "@/data/mock/graph";

/** Node color by type — three blue tints (account/constituency/policy) + neutral grey (issue). */
export const NODE_TYPE_COLORS: Record<GraphNodeType, string> = {
  account: ACCENT,
  constituency: TIER_COLORS.Safe,
  policy: TIER_COLORS["Toss-up"],
  issue: SENTIMENT_NEUTRAL,
};

export const NODE_TYPE_LABELS: Record<GraphNodeType, string> = {
  account: "Account / channel",
  constituency: "Constituency",
  issue: "Issue",
  policy: "Policy / scheme",
};

export const NODE_TYPE_ORDER: GraphNodeType[] = ["account", "constituency", "issue", "policy"];

/** Edge color by type — same restrained palette, opacity does the differentiating. */
export const EDGE_TYPE_COLORS: Record<GraphEdgeType, string> = {
  DISCUSSED_IN: "rgba(138, 143, 152, 0.38)",
  DRIVEN_BY: "rgba(37, 106, 191, 0.45)",
  ADDRESSES: "rgba(16, 66, 129, 0.55)",
  LINKED_ACCOUNT: "rgba(37, 106, 191, 0.85)",
};

export const EDGE_TYPE_LABELS: Record<GraphEdgeType, string> = {
  DISCUSSED_IN: "Discussed in — account/constituency raises an issue",
  DRIVEN_BY: "Driven by — issue's top accounts by reach",
  ADDRESSES: "Addresses — policy targets an issue",
  LINKED_ACCOUNT: "Linked account — same persona, another platform",
};

export const EDGE_TYPE_ORDER: GraphEdgeType[] = [
  "DISCUSSED_IN",
  "DRIVEN_BY",
  "ADDRESSES",
  "LINKED_ACCOUNT",
];

/** LINKED_ACCOUNT edges get a dash pattern (in addition to their color) so cross-platform
 *  links read as visually distinct from the narrative-graph edges without adding a new hue. */
export const EDGE_TYPE_DASH: Partial<Record<GraphEdgeType, [number, number]>> = {
  LINKED_ACCOUNT: [3, 2],
};

export const EDGE_TYPE_WIDTH: Record<GraphEdgeType, number> = {
  DISCUSSED_IN: 1,
  DRIVEN_BY: 1,
  ADDRESSES: 1.2,
  LINKED_ACCOUNT: 1.6,
};
