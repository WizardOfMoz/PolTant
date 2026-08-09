/**
 * Slug scheme shared with the `/issues/[issueSlug]` drill-down page (built by
 * a sibling agent) — this is the exact contract it depends on, so keep it
 * simple and deterministic: lowercase, spaces/& collapsed to single hyphens,
 * anything else that isn't alphanumeric-or-hyphen stripped.
 */

import { TOPIC_VOCABULARY } from "@/data/mock/mock-analysis";

/** e.g. "Employment Schemes" -> "employment-schemes", "Water & Sanitation" -> "water-sanitation". */
export function slugifyTopic(topic: string): string {
  return topic
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Reverse lookup against TOPIC_VOCABULARY; undefined if no topic slugifies to a match. */
export function unslugifyTopic(slug: string): string | undefined {
  return TOPIC_VOCABULARY.find((topic) => slugifyTopic(topic) === slug);
}
