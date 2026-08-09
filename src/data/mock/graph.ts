/**
 * Constituency Intelligence Graph — Layer 4 of the source PRD's
 * architecture. Ties together the four entity types the PRD names as
 * structural (Constituency, Issue, Account/Channel, Policy) into a single
 * typed node/edge graph that later graph-viz and leaderboard pages can
 * traverse without re-deriving relationships themselves.
 *
 * Scope note (deliberate omission): the PRD also lists a `TimeWindow` node
 * type and a `SENTIMENT_TREND` edge type. Both are inherently time-series —
 * they belong with the growth-history/sentiment-scoring data other mock
 * modules own (`src/data/mock/growth-history.ts`, and the sibling
 * `posts.ts`/`mock-analysis.ts` module), not with this structural graph.
 * They are intentionally NOT implemented here.
 *
 * Everything below is derived deterministically from the existing,
 * already-committed attributes on `Account` (`src/data/mock/accounts.ts`)
 * and `Constituency` (`src/data/constituencies.ts`) — no `Math.random()`.
 * Two derivation strategies are used:
 *
 *  1. Keyword heuristics: an account's `bio` + `languageRegion` + `category`
 *     text is scanned for issue-specific substrings (e.g. an account whose
 *     bio mentions "agriculture"/"farm"/"crop" gets wired to Farm &
 *     Agriculture Policy). This is the primary signal and is why most
 *     accounts end up with 1-3 DISCUSSED_IN edges rather than exactly one.
 *  2. Deterministic hash fallback: for the rare account/constituency that
 *     matches none of the keyword lists, a stable string hash of its `id`
 *     picks an issue bucket. Same id always hashes to the same issue across
 *     renders/reloads (per this app's no-DB, regenerate-on-request model),
 *     and this is what guarantees the "no orphan nodes" requirement holds
 *     regardless of how the keyword lists happen to be tuned.
 *
 * This module intentionally does NOT import the sibling `posts.ts` /
 * `mock-analysis.ts` module (built in parallel by another agent) — it is
 * fully self-contained against `accounts.ts` and `constituencies.ts` only,
 * so there is no build-ordering dependency between the two.
 */

import { ACCOUNTS, type Account } from "./accounts";
import { constituencies } from "@/data/constituencies";
import type { Constituency } from "@/lib/types";

export type GraphNodeType = "constituency" | "issue" | "account" | "policy";

export interface GraphNode {
  /** For constituency/account nodes, reuses the real id from constituencies.ts / accounts.ts so pages can join back to full records. Issue/policy nodes get a new slug id. */
  id: string;
  type: GraphNodeType;
  label: string;
  /** Optional per-type metadata a graph-viz page can use for node sizing/coloring. */
  weight?: number;
}

export type GraphEdgeType =
  | "DISCUSSED_IN"
  | "DRIVEN_BY"
  | "ADDRESSES"
  | "LINKED_ACCOUNT";

export interface GraphEdge {
  source: string;
  target: string;
  type: GraphEdgeType;
  weight?: number;
}

export interface IntelligenceGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ---------------------------------------------------------------------------
// Deterministic string hash (djb2 variant) — last-resort fallback only, used
// when an account/constituency matches zero keyword-based issues. Not
// Math.random(): the same id always maps to the same bucket.
// ---------------------------------------------------------------------------

function hashString(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return Math.abs(hash);
}

// ---------------------------------------------------------------------------
// Issue taxonomy (~15 civic/policy issues)
// ---------------------------------------------------------------------------

interface IssueDef {
  id: string;
  label: string;
  /** Lowercase substrings checked against an account's bio+languageRegion+category. */
  keywords: string[];
}

const ISSUES: IssueDef[] = [
  {
    id: "issue-employment-schemes",
    label: "Employment Schemes",
    keywords: ["employment", "recruitment", "exam", "job"],
  },
  {
    id: "issue-industrial-jobs",
    label: "Industrial Jobs",
    keywords: ["industrial", "manufactur", "coalfield", "coal", "labour", "factory", "mining", "royalty"],
  },
  {
    id: "issue-infrastructure-roads",
    label: "Infrastructure & Roads",
    keywords: ["infrastructure", "road", "connectivity", "transport"],
  },
  {
    id: "issue-water-supply",
    label: "Water Supply",
    keywords: ["water", "irrigation"],
  },
  {
    id: "issue-education-policy",
    label: "Education Policy",
    keywords: ["education", "school", "college", "result dates"],
  },
  {
    id: "issue-healthcare-access",
    label: "Healthcare Access",
    keywords: ["health", "hospital"],
  },
  {
    id: "issue-farm-agriculture-policy",
    label: "Farm & Agriculture Policy",
    keywords: ["agri", "farm", "crop", "procurement", "sugarcane", "rural"],
  },
  {
    id: "issue-womens-safety",
    label: "Women's Safety",
    keywords: ["women", "gender"],
  },
  {
    id: "issue-digital-governance",
    label: "Digital Governance",
    keywords: ["digital", "e-governance", "tech-corridor", "it-corridor"],
  },
  {
    id: "issue-law-and-order",
    label: "Law & Order",
    keywords: ["law and order", "crime", "security"],
  },
  {
    id: "issue-flood-disaster-relief",
    label: "Flood & Disaster Relief",
    keywords: ["flood", "disaster", "cyclone", "relief"],
  },
  {
    id: "issue-housing-schemes",
    label: "Housing Schemes",
    keywords: ["housing", "resettlement"],
  },
  {
    id: "issue-border-security",
    label: "Border Security",
    keywords: ["border"],
  },
  {
    id: "issue-urban-civic-services",
    label: "Urban Civic Services",
    keywords: ["civic", "municipal", "urban", "traffic", "ward-level", "jurisdiction", "governance across"],
  },
  {
    id: "issue-tribal-land-rights",
    label: "Tribal Land & Displacement",
    keywords: ["tribal", "land-rights", "displacement", "santali", "adivasi"],
  },
];

const ISSUE_IDS = ISSUES.map((i) => i.id);

// ---------------------------------------------------------------------------
// Policy taxonomy (~10 named policies/schemes), ADDRESSES -> issue
// ---------------------------------------------------------------------------

interface PolicyDef {
  id: string;
  label: string;
  addressesIssueIds: string[];
}

const POLICIES: PolicyDef[] = [
  {
    id: "policy-pmegp-employment-drive",
    label: "PM Employment Generation & Recruitment Drive",
    addressesIssueIds: ["issue-employment-schemes", "issue-industrial-jobs"],
  },
  {
    id: "policy-bharatmala-roads",
    label: "Bharatmala National & Rural Roads Programme",
    addressesIssueIds: ["issue-infrastructure-roads"],
  },
  {
    id: "policy-jal-jeevan-mission",
    label: "Jal Jeevan Mission (Water Supply)",
    addressesIssueIds: ["issue-water-supply"],
  },
  {
    id: "policy-nep-implementation",
    label: "National Education Policy Implementation",
    addressesIssueIds: ["issue-education-policy"],
  },
  {
    id: "policy-ayushman-bharat",
    label: "Ayushman Bharat Health Scheme",
    addressesIssueIds: ["issue-healthcare-access"],
  },
  {
    id: "policy-pm-fasal-bima-yojana",
    label: "PM Fasal Bima Yojana (Crop Insurance & MSP Support)",
    addressesIssueIds: ["issue-farm-agriculture-policy"],
  },
  {
    id: "policy-nirbhaya-safety-fund",
    label: "Nirbhaya Fund — Women's Safety Infrastructure",
    addressesIssueIds: ["issue-womens-safety", "issue-law-and-order"],
  },
  {
    id: "policy-digital-india-governance",
    label: "Digital India Governance Push",
    addressesIssueIds: ["issue-digital-governance"],
  },
  {
    id: "policy-pm-awas-yojana",
    label: "PM Awas Yojana (Housing Scheme)",
    addressesIssueIds: ["issue-housing-schemes", "issue-urban-civic-services"],
  },
  {
    id: "policy-border-tribal-development",
    label: "Border & Tribal Area Development Programme",
    addressesIssueIds: [
      "issue-border-security",
      "issue-tribal-land-rights",
      "issue-flood-disaster-relief",
    ],
  },
];

// ---------------------------------------------------------------------------
// Account -> issue assignment
// ---------------------------------------------------------------------------

const MAX_ISSUES_PER_ACCOUNT = 3;

function matchIssuesForText(text: string): string[] {
  const lower = text.toLowerCase();
  const matches: string[] = [];
  for (const issue of ISSUES) {
    if (issue.keywords.some((kw) => lower.includes(kw))) {
      matches.push(issue.id);
      if (matches.length >= MAX_ISSUES_PER_ACCOUNT) break;
    }
  }
  return matches;
}

function issuesForAccount(account: Account): string[] {
  const text = `${account.bio} ${account.languageRegion} ${account.category}`;
  const matched = matchIssuesForText(text);
  if (matched.length > 0) return matched;
  // Deterministic fallback: no keyword matched, hash the id into a bucket
  // so this account still gets exactly one DISCUSSED_IN edge.
  const bucket = hashString(account.id) % ISSUE_IDS.length;
  return [ISSUE_IDS[bucket]];
}

// ---------------------------------------------------------------------------
// Constituency -> issue assignment
// ---------------------------------------------------------------------------

function issuesForConstituency(
  constituency: Constituency,
  accountIssuesByConstituency: Map<string, Set<string>>
): string[] {
  const fromAccounts = accountIssuesByConstituency.get(constituency.id);
  if (fromAccounts && fromAccounts.size > 0) {
    return Array.from(fromAccounts);
  }
  // Deterministic fallback for a constituency with no primarily-linked
  // account (e.g. ka-mandya) — hash the constituency id + state into a
  // bucket so it still gets exactly one DISCUSSED_IN edge.
  const bucket = hashString(`${constituency.id}:${constituency.state}`) % ISSUE_IDS.length;
  return [ISSUE_IDS[bucket]];
}

// ---------------------------------------------------------------------------
// Graph builder
// ---------------------------------------------------------------------------

export function buildIntelligenceGraph(): IntelligenceGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Issue nodes (weight = aggregate mention count, filled in after edges are built).
  const issueMentionCount = new Map<string, number>(ISSUE_IDS.map((id) => [id, 0]));

  // Policy nodes.
  for (const policy of POLICIES) {
    nodes.push({ id: policy.id, type: "policy", label: policy.label });
  }

  // ADDRESSES edges: policy -> issue.
  for (const policy of POLICIES) {
    for (const issueId of policy.addressesIssueIds) {
      edges.push({ source: policy.id, target: issueId, type: "ADDRESSES" });
    }
  }

  // Account nodes + DISCUSSED_IN (account -> issue).
  const accountIssues = new Map<string, string[]>();
  for (const account of ACCOUNTS) {
    nodes.push({
      id: account.id,
      type: "account",
      label: account.displayName,
      weight: account.baseFollowerCount,
    });

    const issues = issuesForAccount(account);
    accountIssues.set(account.id, issues);
    for (const issueId of issues) {
      edges.push({
        source: account.id,
        target: issueId,
        type: "DISCUSSED_IN",
        weight: account.baseFollowerCount,
      });
      issueMentionCount.set(issueId, (issueMentionCount.get(issueId) ?? 0) + 1);
    }
  }

  // Coverage top-up: a handful of issues (e.g. Women's Safety, Healthcare
  // Access, Education Policy) have thin keyword coverage because none of
  // the account bios happen to mention those topics directly — realistic
  // for this fictional roster, but it would leave the DRIVEN_BY
  // leaderboard for those issues nearly empty. Deterministically top each
  // issue up to at least MIN_ACCOUNTS_PER_ISSUE accounts by ranking the
  // remaining accounts via a stable hash of (accountId, issueId) — not
  // Math.random(), same pairing always produces the same ranking.
  const MIN_ACCOUNTS_PER_ISSUE = 3;
  for (const issue of ISSUES) {
    const alreadyLinked = new Set(
      ACCOUNTS.filter((a) => (accountIssues.get(a.id) ?? []).includes(issue.id)).map((a) => a.id)
    );
    if (alreadyLinked.size >= MIN_ACCOUNTS_PER_ISSUE) continue;
    const needed = MIN_ACCOUNTS_PER_ISSUE - alreadyLinked.size;
    const topUpCandidates = ACCOUNTS.filter((a) => !alreadyLinked.has(a.id))
      .sort((a, b) => hashString(`${a.id}:${issue.id}`) - hashString(`${b.id}:${issue.id}`))
      .slice(0, needed);
    for (const account of topUpCandidates) {
      accountIssues.set(account.id, [...(accountIssues.get(account.id) ?? []), issue.id]);
      edges.push({
        source: account.id,
        target: issue.id,
        type: "DISCUSSED_IN",
        weight: account.baseFollowerCount,
      });
      issueMentionCount.set(issue.id, (issueMentionCount.get(issue.id) ?? 0) + 1);
    }
  }

  // Constituency -> issues discussed by accounts primarily tied to it.
  const accountIssuesByConstituency = new Map<string, Set<string>>();
  for (const account of ACCOUNTS) {
    if (!account.primaryConstituencyId) continue;
    const set = accountIssuesByConstituency.get(account.primaryConstituencyId) ?? new Set<string>();
    for (const issueId of accountIssues.get(account.id) ?? []) {
      set.add(issueId);
    }
    accountIssuesByConstituency.set(account.primaryConstituencyId, set);
  }

  // Constituency nodes + DISCUSSED_IN (constituency -> issue).
  for (const constituency of constituencies) {
    nodes.push({
      id: constituency.id,
      type: "constituency",
      label: `${constituency.name} (${constituency.state})`,
      weight: constituency.digitalEngagementIndex,
    });

    const issues = issuesForConstituency(constituency, accountIssuesByConstituency);
    for (const issueId of issues) {
      edges.push({
        source: constituency.id,
        target: issueId,
        type: "DISCUSSED_IN",
      });
      issueMentionCount.set(issueId, (issueMentionCount.get(issueId) ?? 0) + 1);
    }
  }

  // Issue nodes, now that mention counts are known.
  for (const issue of ISSUES) {
    nodes.push({
      id: issue.id,
      type: "issue",
      label: issue.label,
      weight: issueMentionCount.get(issue.id) ?? 0,
    });
  }

  // DRIVEN_BY edges: issue -> top 3-6 accounts by follower count among
  // accounts with a DISCUSSED_IN edge to that issue (the strongest
  // national "drivers" of that issue's narrative).
  for (const issue of ISSUES) {
    const drivers = ACCOUNTS.filter((a) => (accountIssues.get(a.id) ?? []).includes(issue.id))
      .sort((a, b) => b.baseFollowerCount - a.baseFollowerCount)
      .slice(0, 6);
    for (const driver of drivers) {
      edges.push({
        source: issue.id,
        target: driver.id,
        type: "DRIVEN_BY",
        weight: driver.baseFollowerCount,
      });
    }
  }

  // LINKED_ACCOUNT edges: materialize Account.linkedAccountIds as-is.
  const seenLinks = new Set<string>();
  for (const account of ACCOUNTS) {
    for (const linkedId of account.linkedAccountIds ?? []) {
      const key = [account.id, linkedId].sort().join("::");
      if (seenLinks.has(key)) continue; // avoid duplicate edges for symmetric pairs
      seenLinks.add(key);
      edges.push({ source: account.id, target: linkedId, type: "LINKED_ACCOUNT" });
    }
  }

  return { nodes, edges };
}
