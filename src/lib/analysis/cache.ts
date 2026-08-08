/**
 * Staleness helpers for LLM analysis caching.
 *
 * The whole point of `contentAnalysis` and `narrativeBriefs` existing as DB
 * tables (see src/db/schema.ts) is to avoid re-calling Claude for content
 * that's already been analyzed recently — every LLM call costs money and
 * latency, so callers should treat existing rows as a cache and only
 * re-invoke `analyzeContent` / `synthesizeConstituencyBrief` (client.ts,
 * brief.ts) when the cached row is missing or stale.
 *
 * This module intentionally contains no DB code — the actual read/write
 * wiring happens in a later integration step, once a page or route handler
 * owns the `getDb()` call. What's here is the pure staleness predicate plus
 * the documented pattern callers should follow.
 */

/**
 * Returns true if `analyzedAt` is old enough that the cached analysis
 * should be treated as stale and recomputed.
 *
 * @param analyzedAt  The `analyzedAt` / `generatedAt` timestamp from the
 *                     cached row (contentAnalysis.analyzedAt or
 *                     narrativeBriefs.generatedAt).
 * @param maxAgeHours  How old a cached row is allowed to be before it's
 *                     considered stale. Defaults to 24 hours — content
 *                     sentiment/topics rarely need to be fresher than that
 *                     for a weekly constituency brief, and re-running the
 *                     LLM more often than that mostly burns cost for no
 *                     visible benefit.
 */
export function isStale(analyzedAt: Date, maxAgeHours = 24): boolean {
  const ageMs = Date.now() - analyzedAt.getTime();
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  return ageMs > maxAgeMs;
}

/**
 * Intended caller pattern (implemented once DB wiring lands — sketch only,
 * not wired to `getDb()` here):
 *
 * Per-content analysis (`contentAnalysis` table, keyed by `contentId`):
 *
 * ```ts
 * const db = getDb();
 * if (!db) {
 *   // DATABASE_URL unset — fall back to static/seed data, never throw.
 *   return fallbackAnalysisFor(content);
 * }
 *
 * const existing = await db.query.contentAnalysis.findFirst({
 *   where: (t, { eq }) => eq(t.contentId, content.id),
 *   orderBy: (t, { desc }) => desc(t.analyzedAt),
 * });
 *
 * if (existing && !isStale(existing.analyzedAt)) {
 *   return existing; // cache hit — no LLM call
 * }
 *
 * try {
 *   const result = await analyzeContent({
 *     title: content.title,
 *     snippet: content.snippet ?? undefined,
 *     topCommentsText: aggregateTopComments(content),
 *   });
 *   await db.insert(schema.contentAnalysis).values({
 *     contentId: content.id,
 *     sentimentScore: result.sentimentScore,
 *     topics: result.topics,
 *     narrativeSummary: result.narrativeSummary,
 *     model: getAnalysisModel(),
 *   });
 *   // (or upsert/update the existing row instead of always inserting,
 *   // depending on whether contentAnalysis is treated as append-only
 *   // history or a single current row per content item.)
 *   return result;
 * } catch (err) {
 *   if (err instanceof AnalysisError) {
 *     // Missing key / model failure — fall back to the last known-good
 *     // `existing` row if there is one, or an "analysis unavailable" UI
 *     // state. Never let this throw crash the page.
 *     return existing ?? null;
 *   }
 *   throw err;
 * }
 * ```
 *
 * Constituency-level brief (`narrativeBriefs` table, keyed by
 * `constituencyId` + `windowLabel`, e.g. "2026-W32"):
 *
 * ```ts
 * const existing = await db.query.narrativeBriefs.findFirst({
 *   where: (t, { and, eq }) =>
 *     and(eq(t.constituencyId, constituencyId), eq(t.windowLabel, windowLabel)),
 * });
 *
 * if (existing && !isStale(existing.generatedAt)) {
 *   return existing; // cache hit — no LLM call
 * }
 *
 * // Gather this window's per-content analyses (each already cached per the
 * // pattern above) plus the previous window's brief for previousSentimentScore,
 * // then call synthesizeConstituencyBrief(...) once and upsert the result
 * // keyed on (constituencyId, windowLabel).
 * ```
 *
 * The shared idea: staleness checks happen *before* any LLM call, keyed on
 * the natural identity of the row (contentId, or constituencyId+windowLabel),
 * and a cache hit means analyzeContent/synthesizeConstituencyBrief are never
 * invoked at all for that request.
 */
