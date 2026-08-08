/**
 * Idempotent seed script: upserts the curated real constituency set and
 * their real election results into Neon. Run with `npm run db:seed`
 * (== `tsx src/db/seed.ts`).
 *
 * Per PROJECT_BRIEF.md: getDb() returns undefined when DATABASE_URL isn't
 * set (true in local dev until Neon is wired up) — this script must not
 * throw in that case, just skip gracefully with a console message. Pages
 * fall back to the static data in src/data/ regardless of whether the DB
 * has been seeded.
 */

import { getDb, schema } from "./client";
import { constituencies } from "@/data/constituencies";
import { electionResults } from "@/data/election-results";
import { sql } from "drizzle-orm";

async function main() {
  const db = getDb();
  if (!db) {
    console.log(
      "[seed] DATABASE_URL is not set — skipping seed. Static data in src/data/ is used by the app until Neon is configured."
    );
    return;
  }

  console.log(`[seed] Upserting ${constituencies.length} constituencies...`);
  for (const c of constituencies) {
    await db
      .insert(schema.constituencies)
      .values(c)
      .onConflictDoUpdate({
        target: schema.constituencies.id,
        set: {
          pcNumber: c.pcNumber,
          name: c.name,
          state: c.state,
          tier: c.tier,
          marginVolatility: c.marginVolatility,
          flipFrequency: c.flipFrequency,
          closenessIndex: c.closenessIndex,
          digitalEngagementIndex: c.digitalEngagementIndex,
          digitalEngagementSourceNote: c.digitalEngagementSourceNote,
          coverageTier: c.coverageTier,
        },
      });
  }

  console.log(`[seed] Upserting ${electionResults.length} election results...`);
  for (const r of electionResults) {
    // electionResults has no natural unique key in the schema beyond the
    // serial `id`, so we upsert on the (constituencyId, year) pair that
    // uniquely identifies a real result and is idempotent across re-runs.
    const existing = await db
      .select({ id: schema.electionResults.id })
      .from(schema.electionResults)
      .where(
        sql`${schema.electionResults.constituencyId} = ${r.constituencyId} and ${schema.electionResults.year} = ${r.year}`
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(schema.electionResults)
        .set({
          winningParty: r.winningParty,
          runnerUpParty: r.runnerUpParty,
          marginPct: r.marginPct,
          totalVotes: r.totalVotes,
          sourceNote: r.sourceNote,
        })
        .where(sql`${schema.electionResults.id} = ${existing[0].id}`);
    } else {
      await db.insert(schema.electionResults).values(r);
    }
  }

  console.log("[seed] Done.");
}

main()
  .catch((err) => {
    console.error("[seed] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit(process.exitCode ?? 0);
  });
