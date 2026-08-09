/**
 * Shared read-side helpers joining `src/data/mock/accounts.ts` against the
 * other mock modules (growth history, growth alerts, constituencies) for
 * the Accounts hub (`/channels`) and the Engagement Leaderboard
 * (`/leaderboard`). Both pages need the exact same "latest engagement rate /
 * latest follower count / is this account rising or falling" joins, so that
 * logic lives here once rather than being re-derived per page.
 *
 * Pure, server-safe, deterministic — no randomness, no network calls.
 */

import { ACCOUNTS, type Account, type AccountCategory } from "@/data/mock/accounts";
import { getGrowthHistory } from "@/data/mock/growth-history";
import { computeGrowthAlerts, type GrowthAlert } from "@/lib/alerts";
import { constituencies } from "@/data/constituencies";
import type { Platform } from "@/lib/types";

export const PLATFORM_LABEL: Record<Platform, string> = {
  youtube: "YouTube",
  x: "X",
  instagram: "Instagram",
  facebook: "Facebook",
};

export const PLATFORMS: Platform[] = ["youtube", "x", "instagram", "facebook"];

export const CATEGORY_LABEL: Record<AccountCategory, string> = {
  "established-influencer": "Established influencer",
  "rising-new-media": "Rising new media",
};

export const CATEGORIES: AccountCategory[] = ["established-influencer", "rising-new-media"];

const constituencyById = new Map(constituencies.map((c) => [c.id, c]));

/** Resolves a constituency id to a short "Name, State" label, or undefined
 *  when the account has no primary constituency (national accounts). */
export function resolveConstituencyLabel(id?: string): string | undefined {
  if (!id) return undefined;
  const constituency = constituencyById.get(id);
  return constituency ? `${constituency.name}, ${constituency.state}` : undefined;
}

export interface AccountRow {
  account: Account;
  /** Most recent (day-90) snapshot's engagement rate, 0-1. Null if somehow no history exists. */
  latestEngagementRate: number | null;
  /** Most recent snapshot's follower count — will be close to but not identical
   *  to `account.baseFollowerCount` (the 90-day series converges toward it). */
  latestFollowerCount: number | null;
  constituencyLabel?: string;
  /** Present only when this account crosses the rising/falling threshold — see src/lib/alerts.ts. */
  alert?: GrowthAlert;
}

let cachedRows: AccountRow[] | null = null;

/** Builds one joined row per account in `ACCOUNTS`. Cached at module scope
 *  since every input is itself deterministic/static within a single server
 *  process. */
export function buildAccountRows(): AccountRow[] {
  if (cachedRows) return cachedRows;

  const alertsByAccountId = new Map(computeGrowthAlerts().map((a) => [a.accountId, a]));

  cachedRows = ACCOUNTS.map((account) => {
    const history = getGrowthHistory(account.id);
    const latest = history?.snapshots[history.snapshots.length - 1];

    return {
      account,
      latestEngagementRate: latest ? latest.engagementRate : null,
      latestFollowerCount: latest ? latest.followerCount : null,
      constituencyLabel: resolveConstituencyLabel(account.primaryConstituencyId),
      alert: alertsByAccountId.get(account.id),
    };
  });

  return cachedRows;
}

export function getAccountById(id: string): Account | undefined {
  return ACCOUNTS.find((a) => a.id === id);
}
