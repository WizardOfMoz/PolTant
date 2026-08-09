/**
 * Deterministic, rule-based stand-in for what used to be a real Anthropic
 * LLM call over post/video content (`src/lib/analysis`, now removed as part
 * of the pivot to a fully mock/synthetic-data demo — see AGENTS.md and
 * PROJECT_BRIEF.md's "Non-negotiable framing rules").
 *
 * This is NOT a live model call and does NOT use `Math.random()` per
 * render: topic/sentiment classification is driven by a small keyword map
 * applied to each post's title+snippet, and any remaining numeric variance
 * comes from a PRNG seeded off `Post.id`, so the same post always produces
 * the same `ContentAnalysis` across renders and days — same determinism
 * contract as `growth-history.ts` and `posts.ts`.
 *
 * Framing rule carried over unchanged from the real analysis module's
 * history: sentiment/summary describe the POLICY OR ISSUE, never any
 * person's or party's character. Never use accusatory/politically-loaded
 * language ("attacking the government", "spreading misinformation",
 * "biased") anywhere below — see the file header of this repo's deleted
 * dummy-channels.ts and PROJECT_BRIEF.md for the same rule as it applied to
 * the real LLM prompt this module replaces.
 */

import { getAllPosts, type Post } from "./posts";

export interface ContentAnalysis {
  postId: string;
  /** -1..1, sentiment toward the POLICY/ISSUE discussed, never toward people. */
  sentimentScore: number;
  /** 2-4 short neutral topic labels drawn from TOPIC_VOCABULARY. */
  topics: string[];
  /** 1-2 neutral analytical sentences, no accusatory framing toward any party/person. */
  narrativeSummary: string;
}

/** Fixed vocabulary every post's `topics` array is drawn from — mirrors the
 *  15 topic keys posts.ts organizes its templates around. */
export const TOPIC_VOCABULARY: string[] = [
  "Employment Schemes",
  "Infrastructure & Roads",
  "Water Supply",
  "Education Policy",
  "Healthcare Access",
  "Agriculture & Farm Policy",
  "Women's Safety",
  "Digital Governance",
  "Law & Order",
  "Industrial Jobs",
  "Flood & Disaster Relief",
  "Welfare Scheme Disbursement",
  "Housing & Urban Development",
  "Public Transport",
  "Border & Regional Development",
];

/** Keyword -> topic map. Substring-matched (case-insensitive) against each
 *  post's title+snippet. Deliberately generous/overlapping — multiple
 *  topics matching the same post is expected and desired (posts.ts often
 *  touches 1-2 topics directly plus adjacent scheme/governance language). */
const TOPIC_KEYWORDS: Record<string, string[]> = {
  "Employment Schemes": ["employment scheme", "unemployment", "recruitment", "vacancy", "exam result"],
  "Infrastructure & Roads": ["highway", "road project", "bridge", "infrastructure project", "bypass"],
  "Water Supply": ["water supply", "piped water", "irrigation", "drinking water", "water security", "canal"],
  "Education Policy": ["education policy", "school", "curriculum", "admission", "enrolment", "dropout"],
  "Healthcare Access": ["healthcare", "hospital", "health centre", "medical staff", "primary health"],
  "Agriculture & Farm Policy": ["farm", "msp", "procurement price", "crop procurement", "farmer"],
  "Women's Safety": ["women's safety", "helpline", "safety audit", "street lighting"],
  "Digital Governance": ["digital portal", "e-governance", "online application", "citizen-services", "citizen services"],
  "Law & Order": ["crime statistics", "law and order", "police"],
  "Industrial Jobs": ["industrial jobs", "manufacturing", "factory", "mining royalty", "manufacturing park"],
  "Flood & Disaster Relief": ["flood", "disaster relief", "cyclone", "relief fund", "embankment"],
  "Welfare Scheme Disbursement": ["welfare scheme", "subsidy", "pension", "ration", "disbursement", "beneficiary"],
  "Housing & Urban Development": ["housing scheme", "urban development", "slum redevelopment", "municipal"],
  "Public Transport": ["public transport", "bus service", "metro", "ridership"],
  "Border & Regional Development": ["border", "tribal", "displacement", "remote village", "winter connectivity", "land-rights"],
};

// Note: "delay" alone already matches "delayed"/"delays" as a substring —
// keeping both would double-count a single mention and skew scores lower
// than intended, so each concept below appears exactly once.
const NEGATIVE_WORDS = [
  "delay",
  "pending",
  "stuck",
  "still waiting",
  "backlog",
  "shortage",
  "crisis",
  "gap",
  "unresolved",
  "overdue",
  "shortfall",
  "crashed",
  "buggy",
  "cut off",
  "left off",
  "sticking point",
  "complaint",
  "hasn't received",
  "hasn't announced",
];

// Deliberately strong/unambiguous phrases only — generic connector words
// like "progress", "faster", or "held" turned out to appear as filler in
// plenty of neutrally-worded posts too (e.g. "against on-ground
// construction progress"), which skewed sentiment toward positive far more
// than intended. Multi-word phrases keep the false-positive rate low.
const POSITIVE_WORDS = [
  "improved",
  "completed",
  "ahead of schedule",
  "wrapped up ahead",
  "opened ahead",
  "released ahead",
  "moved faster",
  "rose sharply",
  "milestone",
  "resolved",
  "expanded",
  "upgraded",
  "handed over",
  "sped up",
  "fully operational",
];

// ---------------------------------------------------------------------------
// Seeded PRNG helpers (self-contained; same mulberry32 + string-hash
// approach used throughout this mock data layer).
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStringToSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (Math.imul(31, hash) + input.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Short neutral noun phrase for a topic, used inside narrativeSummary
 *  sentences (e.g. "the employment scheme rollout"). */
const TOPIC_PHRASES: Record<string, string> = {
  "Employment Schemes": "the employment scheme rollout",
  "Infrastructure & Roads": "an infrastructure and roads project",
  "Water Supply": "water supply access",
  "Education Policy": "education policy implementation",
  "Healthcare Access": "healthcare access",
  "Agriculture & Farm Policy": "farm and agriculture policy",
  "Women's Safety": "women's safety measures",
  "Digital Governance": "a digital governance service",
  "Law & Order": "law and order statistics",
  "Industrial Jobs": "industrial jobs and manufacturing activity",
  "Flood & Disaster Relief": "flood and disaster relief efforts",
  "Welfare Scheme Disbursement": "welfare scheme disbursement",
  "Housing & Urban Development": "housing and urban development",
  "Public Transport": "public transport services",
  "Border & Regional Development": "border and regional development",
};

type SentimentBand = "strongly-negative" | "mildly-negative" | "neutral" | "mildly-positive" | "strongly-positive";

function bandFor(score: number): SentimentBand {
  if (score < -0.55) return "strongly-negative";
  if (score < -0.15) return "mildly-negative";
  if (score <= 0.15) return "neutral";
  if (score <= 0.55) return "mildly-positive";
  return "strongly-positive";
}

const SUMMARY_TEMPLATES: Record<SentimentBand, ((phrase: string) => string)[]> = {
  "strongly-negative": [
    (p) => `Content raises concerns about persistent delays in ${p}, drawing significant engagement.`,
    (p) => `Coverage centers on unresolved gaps in ${p}, generating a strong wave of engagement.`,
    (p) => `The post highlights a notable shortfall in ${p}, attracting heavy audience reaction.`,
  ],
  "mildly-negative": [
    (p) => `Content flags emerging concerns around ${p}, with a moderately critical audience response.`,
    (p) => `Coverage points to some friction in ${p}, drawing a mixed-to-critical reaction.`,
    (p) => `The post questions the pace of progress on ${p}, prompting cautious audience commentary.`,
  ],
  neutral: [
    (p) => `Content offers a factual overview of ${p}, drawing a balanced, largely descriptive audience response.`,
    (p) => `Coverage presents current data on ${p} without a strong positive or negative framing.`,
    (p) => `The post walks through status updates on ${p}, generating measured audience discussion.`,
  ],
  "mildly-positive": [
    (p) => `Content notes steady progress on ${p}, drawing a generally favorable audience response.`,
    (p) => `Coverage highlights early improvements in ${p}, with mostly positive audience commentary.`,
    (p) => `The post points to incremental gains in ${p}, prompting encouraging audience reaction.`,
  ],
  "strongly-positive": [
    (p) => `Content highlights measurable progress on ${p}, drawing broad positive engagement.`,
    (p) => `Coverage documents a completed milestone in ${p}, generating strongly favorable audience reaction.`,
    (p) => `The post describes a clear improvement in ${p}, attracting enthusiastic audience response.`,
  ],
};

function countOccurrences(text: string, words: string[]): number {
  let count = 0;
  for (const word of words) {
    if (text.includes(word)) count += 1;
  }
  return count;
}

function matchedTopics(text: string, random: () => number): string[] {
  const matched = TOPIC_VOCABULARY.filter((topic) =>
    TOPIC_KEYWORDS[topic].some((keyword) => text.includes(keyword))
  );

  // Pad below the 2-topic floor with a deterministic-but-varied pick from
  // the remaining vocabulary (seeded per post) rather than a fixed pool —
  // an earlier version always reached for the same one or two "generic"
  // topics first, which made them dominate almost every post's topic list
  // regardless of actual content.
  const padded = [...matched];
  while (padded.length < 2) {
    const remaining = TOPIC_VOCABULARY.filter((topic) => !padded.includes(topic));
    if (remaining.length === 0) break;
    padded.push(remaining[Math.floor(random() * remaining.length)]);
  }

  // Trim above the 4-topic ceiling, keeping a deterministic-but-shuffled
  // subset (seeded per post) rather than always the first four.
  if (padded.length > 4) {
    const shuffled = [...padded].sort(() => random() - 0.5);
    return shuffled.slice(0, 4);
  }

  return padded;
}

export function analyzePost(post: Post): ContentAnalysis {
  const random = mulberry32(hashStringToSeed(post.id));
  const text = `${post.title} ${post.snippet}`.toLowerCase();

  const topics = matchedTopics(text, random);

  const negativeHits = countOccurrences(text, NEGATIVE_WORDS);
  const positiveHits = countOccurrences(text, POSITIVE_WORDS);

  const keywordScore = (positiveHits - negativeHits) * 0.28;
  const jitter = (random() - 0.5) * 0.16;
  const sentimentScore = Math.round(clamp(keywordScore + jitter, -1, 1) * 100) / 100;

  const band = bandFor(sentimentScore);
  const primaryTopic = topics[0] ?? "Welfare Scheme Disbursement";
  const phrase = TOPIC_PHRASES[primaryTopic] ?? "the policy issue raised";
  const variants = SUMMARY_TEMPLATES[band];
  const variant = variants[Math.floor(random() * variants.length)];
  const narrativeSummary = variant(phrase);

  return {
    postId: post.id,
    sentimentScore,
    topics,
    narrativeSummary,
  };
}

let cachedAllAnalyses: ContentAnalysis[] | null = null;

export function analyzeAllPosts(): ContentAnalysis[] {
  if (!cachedAllAnalyses) {
    cachedAllAnalyses = getAllPosts().map(analyzePost);
  }
  return cachedAllAnalyses;
}
