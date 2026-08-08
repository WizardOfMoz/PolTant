import { unstable_cache } from "next/cache";
import {
  analyzeContent,
  AnalysisError,
  NEUTRAL_FALLBACK_ANALYSIS,
  type AnalysisResult,
} from "@/lib/analysis/client";

/**
 * Per-content sentiment/topic/narrative analysis, cached per content id for
 * 24h via Next's Data Cache (no DB required — see PROJECT_BRIEF.md; this is
 * simpler than wiring the contentAnalysis table for a prototype, and Next's
 * cache already avoids re-billing Claude for the same video/article on
 * every request). Falls back to a clearly-flagged neutral result if
 * ANTHROPIC_API_KEY is missing or the model call fails — never throws.
 */
export interface AnalysisOutcome extends AnalysisResult {
  /** True when analysis is a fallback, not a real model result (missing
   *  API key or a model/schema error) — callers must show this honestly. */
  unavailable: boolean;
}

export interface AnalyzableContent {
  id: string;
  title: string;
  snippet?: string | null;
  topCommentsText?: string[];
}

async function analyzeOne(item: AnalyzableContent): Promise<AnalysisOutcome> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ...NEUTRAL_FALLBACK_ANALYSIS, unavailable: true };
  }
  try {
    const result = await analyzeContent({
      title: item.title,
      snippet: item.snippet ?? undefined,
      topCommentsText: item.topCommentsText,
    });
    return { ...result, unavailable: false };
  } catch (err) {
    if (err instanceof AnalysisError) {
      console.warn(`[pipeline/analysis] analysis unavailable for "${item.title}":`, err.message);
      return { ...NEUTRAL_FALLBACK_ANALYSIS, unavailable: true };
    }
    throw err;
  }
}

const cachedAnalyzeOne = unstable_cache(
  (item: AnalyzableContent) => analyzeOne(item),
  ["content-analysis-v1"],
  { revalidate: 60 * 60 * 24 }
);

/**
 * Analyze a batch of content items concurrently. A single item's failure
 * (model error, etc.) degrades that item to the neutral/unavailable result
 * rather than failing the whole batch.
 */
export async function analyzeBatch(
  items: AnalyzableContent[]
): Promise<Map<string, AnalysisOutcome>> {
  const settled = await Promise.allSettled(items.map((item) => cachedAnalyzeOne(item)));
  const map = new Map<string, AnalysisOutcome>();
  items.forEach((item, i) => {
    const r = settled[i];
    map.set(
      item.id,
      r.status === "fulfilled" ? r.value : { ...NEUTRAL_FALLBACK_ANALYSIS, unavailable: true }
    );
  });
  return map;
}
