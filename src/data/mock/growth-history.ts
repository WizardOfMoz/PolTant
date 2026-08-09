/**
 * Deterministic 90-day daily growth history for every account in
 * `src/data/mock/accounts.ts`. This app has no database and no live APIs —
 * data is regenerated on every request in dev — so every value here is
 * derived from a seeded PRNG keyed off `Account.id` rather than
 * `Math.random()`/`Date.now()`, meaning the same account always produces
 * the exact same 90-day series across renders, reloads, and days.
 *
 * `REFERENCE_TODAY` below is a fixed anchor date (not the real current
 * date) for the same determinism reason: the *values* must never drift
 * between requests, and pulling in the real "today" would make the window
 * boundary non-deterministic across days even though each individual call
 * would still be internally consistent.
 *
 * A small, explicitly engineered subset of accounts (see
 * `SPIKE_ACCOUNT_IDS` / `DIP_ACCOUNT_IDS` below) gets an unambiguous
 * growth spike or engagement dip in the last 1-2 weeks of the series, to
 * give later "rising channel" / growth-alert features real signal to
 * detect — mirroring the source PRD's "crossed 500K subscribers in 45
 * days, growth rate in top 2%" example. Every other account gets gradual,
 * noisy-but-coherent organic growth: day-to-day dips are fine, but the
 * overall 90-day trend per account stays sensible (no random craters).
 */

import { ACCOUNTS } from "./accounts";

export interface GrowthSnapshot {
  /** ISO date string (YYYY-MM-DD), one per day. */
  date: string;
  followerCount: number;
  /** 0-1, e.g. (likes+comments+shares)/followers on that day's content. */
  engagementRate: number;
}

export interface AccountGrowthHistory {
  /** Matches Account.id. */
  accountId: string;
  /** 90 daily points ending at the fixed reference date, oldest first. */
  snapshots: GrowthSnapshot[];
}

const HISTORY_LENGTH_DAYS = 90;

/** Fixed anchor for "today" — see file header on why this isn't Date.now().
 *  Exported so other deterministic mock modules (e.g. amplification.ts,
 *  action-items.ts) anchor their own date math to this same "now" instead of
 *  inventing a second one. */
export const REFERENCE_TODAY = "2026-08-09";

/** Accounts engineered to show a clear, unambiguous growth spike in the
 *  last ~10 days of the series — a mix of both categories and platforms. */
const SPIKE_ACCOUNT_IDS = new Set<string>([
  "groundreportdesk", // rising-new-media, instagram
  "youthquakeindia", // rising-new-media, instagram
  "biharbytes_ig", // rising-new-media, instagram
  "loksabhalive", // rising-new-media, x
  "nefrontline_yt", // established-influencer, youtube
  "dakshinbulletin_yt", // established-influencer, youtube
]);

/** Accounts engineered to show a clear engagement/growth dip in the last
 *  ~2 weeks of the series (e.g. a backlash/controversy moment), rather
 *  than a spike. Kept a small minority per the "most show a spike" rule. */
const DIP_ACCOUNT_IDS = new Set<string>([
  "saffronscoop", // established-influencer, x
  "sukhnasignal", // rising-new-media, x
]);

type GrowthPattern = "normal" | "spike" | "dip";

function patternFor(accountId: string): GrowthPattern {
  if (SPIKE_ACCOUNT_IDS.has(accountId)) return "spike";
  if (DIP_ACCOUNT_IDS.has(accountId)) return "dip";
  return "normal";
}

/** Tiny seeded PRNG (mulberry32) — deterministic given the same seed. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Simple deterministic 32-bit string hash, used to seed the PRNG per account. */
function hashStringToSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (Math.imul(31, hash) + input.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

function isoDateDaysBefore(referenceDate: string, daysBefore: number): string {
  const d = new Date(`${referenceDate}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - daysBefore);
  return d.toISOString().slice(0, 10);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function generateSnapshots(accountId: string, baseFollowerCount: number): GrowthSnapshot[] {
  const random = mulberry32(hashStringToSeed(accountId));
  const pattern = patternFor(accountId);

  // Per-account baseline organic daily growth rate and engagement rate —
  // varied but stable across reruns since `random` is seeded by accountId.
  const baseDailyGrowth = 0.0008 + random() * 0.0025; // ~0.08%-0.33%/day
  const baseEngagementRate = 0.02 + random() * 0.05; // 2%-7% baseline

  // Start the 90-day window somewhat below baseFollowerCount so organic
  // growth (plus any engineered spike/dip) lands near it by the final day.
  let followerCount = Math.max(1_000, Math.round(baseFollowerCount * (0.72 + random() * 0.14)));

  const snapshots: GrowthSnapshot[] = [];

  for (let dayIndex = 0; dayIndex < HISTORY_LENGTH_DAYS; dayIndex++) {
    const daysBeforeToday = HISTORY_LENGTH_DAYS - 1 - dayIndex;
    const date = isoDateDaysBefore(REFERENCE_TODAY, daysBeforeToday);

    const dailyNoise = (random() - 0.5) * 0.004; // +/-0.2% day-to-day noise
    let dailyGrowth = baseDailyGrowth + dailyNoise;
    let engagementRate = baseEngagementRate + (random() - 0.5) * 0.01;

    if (pattern === "spike" && daysBeforeToday < 10) {
      // Ramp the spike in over ~10 days rather than one giant single-day jump.
      const rampProgress = (10 - daysBeforeToday) / 10;
      dailyGrowth += 0.018 * rampProgress + random() * 0.01;
      engagementRate += 0.035 * rampProgress;
    } else if (pattern === "dip" && daysBeforeToday < 14) {
      // Growth flattens/slightly declines and engagement drops over ~2 weeks —
      // a coherent controversy-shaped dip, not a random crater.
      const rampProgress = (14 - daysBeforeToday) / 14;
      dailyGrowth = Math.max(-0.0015, dailyGrowth - 0.0018 * rampProgress);
      engagementRate -= 0.028 * rampProgress;
    }

    followerCount = Math.max(1_000, Math.round(followerCount * (1 + dailyGrowth)));
    engagementRate = clamp(engagementRate, 0.004, 0.35);

    snapshots.push({
      date,
      followerCount,
      engagementRate: Math.round(engagementRate * 10_000) / 10_000,
    });
  }

  return snapshots;
}

const ALL_GROWTH_HISTORIES: AccountGrowthHistory[] = ACCOUNTS.map((account) => ({
  accountId: account.id,
  snapshots: generateSnapshots(account.id, account.baseFollowerCount),
}));

const GROWTH_HISTORY_BY_ACCOUNT_ID = new Map<string, AccountGrowthHistory>(
  ALL_GROWTH_HISTORIES.map((history) => [history.accountId, history])
);

export function getGrowthHistory(accountId: string): AccountGrowthHistory | undefined {
  return GROWTH_HISTORY_BY_ACCOUNT_ID.get(accountId);
}

export function getAllGrowthHistories(): AccountGrowthHistory[] {
  return ALL_GROWTH_HISTORIES;
}
