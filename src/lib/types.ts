/**
 * Plain TypeScript types superseding the removed Drizzle schema
 * (formerly src/db/schema.ts, deleted as part of the pivot to a fully
 * mock/synthetic-data demo — no database, no live APIs).
 *
 * These interfaces mirror the shape of the old `constituencies`,
 * `election_results`, and `channels` tables so downstream mock-data
 * modules and pages have a stable contract to build against without any
 * DB dependency.
 *
 * Fields that were DB-generated in the old schema (serial/auto ids,
 * `createdAt` defaults) are marked optional here since static/mock data
 * has no reason to set them.
 */

import type { SwingTier, CoverageTier } from "@/lib/election/tiering";

export interface Constituency {
  id: string;
  pcNumber: number;
  name: string;
  state: string;
  tier: SwingTier;
  marginVolatility: number;
  flipFrequency: number;
  closenessIndex: number;
  digitalEngagementIndex: number;
  digitalEngagementSourceNote: string;
  coverageTier: CoverageTier;
  /** DB-generated (`defaultNow()`) in the old schema; optional for static data. */
  createdAt?: Date;
}

export interface ElectionResult {
  /** DB-generated serial PK in the old schema; optional for static data. */
  id?: number;
  constituencyId: string;
  year: number;
  winningParty: string;
  runnerUpParty: string;
  marginPct: number;
  totalVotes: number;
  sourceNote: string;
}

export type Platform = "youtube" | "x" | "instagram" | "facebook";

/**
 * Matches the subset of the old `channels` table that later mock-data
 * modules need. Deliberately excludes DB/live-API-only columns from the
 * old schema (id, externalId, isLive, lastFetchedAt, createdAt).
 */
export interface Channel {
  platform: Platform;
  displayName: string;
  handle: string;
  category: string;
  languageRegion?: string | null;
  subscriberCount?: number | null;
  primaryConstituencyId?: string | null;
}
