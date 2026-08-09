/**
 * Shared growth-alert computation over `src/data/mock/growth-history.ts`.
 * Both the Overview page (a KPI count) and the Alerts page (the full
 * leaderboard) need the exact same "what counts as a rising/falling
 * account" rule — this is the single source of truth for that rule so the
 * two pages can't silently disagree on the number.
 *
 * Growth % is measured over the trailing WINDOW_DAYS of the deterministic
 * 90-day series (oldest-first), comparing the latest snapshot's
 * followerCount against the snapshot WINDOW_DAYS earlier.
 */

import { getAllGrowthHistories } from "@/data/mock/growth-history";
import { ACCOUNTS, type AccountCategory } from "@/data/mock/accounts";
import type { Platform } from "@/lib/types";

export const ALERT_WINDOW_DAYS = 14;
/** Minimum absolute trailing-window growth % to qualify as an alert. */
export const ALERT_THRESHOLD_PCT = 12;

export interface GrowthAlert {
  accountId: string;
  handle: string;
  displayName: string;
  platform: Platform;
  category: AccountCategory;
  latestFollowerCount: number;
  previousFollowerCount: number;
  latestDate: string;
  previousDate: string;
  growthPct: number;
  direction: "up" | "down";
}

const accountsById = new Map(ACCOUNTS.map((a) => [a.id, a]));

/** All accounts whose trailing-window growth crosses ALERT_THRESHOLD_PCT, sorted by |growthPct| desc. */
export function computeGrowthAlerts(): GrowthAlert[] {
  const alerts: GrowthAlert[] = [];

  for (const history of getAllGrowthHistories()) {
    const account = accountsById.get(history.accountId);
    if (!account) continue;

    const snapshots = history.snapshots;
    if (snapshots.length <= ALERT_WINDOW_DAYS) continue;

    const latest = snapshots[snapshots.length - 1];
    const previous = snapshots[snapshots.length - 1 - ALERT_WINDOW_DAYS];
    if (!latest || !previous || previous.followerCount === 0) continue;

    const growthPct =
      Math.round(
        ((latest.followerCount - previous.followerCount) / previous.followerCount) * 1000
      ) / 10;

    if (Math.abs(growthPct) < ALERT_THRESHOLD_PCT) continue;

    alerts.push({
      accountId: account.id,
      handle: account.handle,
      displayName: account.displayName,
      platform: account.platform,
      category: account.category,
      latestFollowerCount: latest.followerCount,
      previousFollowerCount: previous.followerCount,
      latestDate: latest.date,
      previousDate: previous.date,
      growthPct,
      direction: growthPct >= 0 ? "up" : "down",
    });
  }

  return alerts.sort((a, b) => Math.abs(b.growthPct) - Math.abs(a.growthPct));
}

export function getActiveAlertCount(): number {
  return computeGrowthAlerts().length;
}
