import Anthropic from "@anthropic-ai/sdk";
import type { Tool, ToolUseBlock } from "@anthropic-ai/sdk/resources/messages";
import { z } from "zod";

/**
 * Real LLM-based sentiment/topic/narrative analysis for a single piece of
 * public content (a YouTube video or a news article).
 *
 * SERVER-ONLY: reads process.env.ANTHROPIC_API_KEY directly. Per
 * PROJECT_BRIEF.md's env-var convention, only import this from Route
 * Handlers, Server Components, or Server Actions — never from client
 * components (no "server-only" package guard here since it isn't part of
 * this repo's dependency set; the convention is enforced by discipline, same
 * as src/db/client.ts).
 *
 * Framing (see PROJECT_BRIEF.md "Non-negotiable framing rules"): this module
 * classifies real, named public content. Every prompt below is written to
 * stay neutral/analytical, to score sentiment toward *policy/government
 * performance* rather than toward people, and to flag the output as an
 * automated, approximate signal rather than a factual determination.
 */

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

/** Default model, overridable via ANTHROPIC_MODEL. */
const DEFAULT_MODEL = "claude-sonnet-5";

export class AnalysisError extends Error {
  constructor(
    message: string,
    public readonly code: "missing_api_key" | "invalid_response" | "api_error"
  ) {
    super(message);
    this.name = "AnalysisError";
  }
}

let cachedClient: Anthropic | undefined;

/**
 * Lazily-created singleton Anthropic client. Throws a typed AnalysisError
 * (code: "missing_api_key") when ANTHROPIC_API_KEY isn't set, so callers can
 * catch it and fall back to "analysis unavailable" UI state instead of
 * crashing the request — mirroring how src/db/client.ts's getDb() returns
 * undefined instead of throwing when DATABASE_URL is unset.
 */
export function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AnalysisError(
      "ANTHROPIC_API_KEY is not set — content analysis is unavailable.",
      "missing_api_key"
    );
  }
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey });
  }
  return cachedClient;
}

/** Model name for content analysis, overridable via ANTHROPIC_MODEL. */
export function getAnalysisModel(): string {
  return process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
}

// ---------------------------------------------------------------------------
// Output schema
// ---------------------------------------------------------------------------

/**
 * Matches the shape implied by the `contentAnalysis` table in
 * src/db/schema.ts (sentimentScore, topics, narrativeSummary).
 *
 * `topics` allows an empty array as well as 2-5 items: the model is
 * instructed to return 2-5 neutral topic labels for genuinely civic/political
 * content, but to return an empty array (alongside sentimentScore: 0) as the
 * explicit neutral fallback when the content isn't civic/political at all —
 * see ANALYSIS_SYSTEM_PROMPT rule 5.
 */
export const AnalysisResultSchema = z.object({
  sentimentScore: z
    .number()
    .min(-1)
    .max(1)
    .describe(
      "Sentiment of the content's stance toward the government/policy it discusses, from -1 (strongly critical) to 1 (strongly favorable). 0 for neutral, mixed, or non-civic content."
    ),
  topics: z
    .array(z.string().min(1).max(80))
    .max(5)
    .describe(
      "2-5 short, neutral issue/topic labels for civic/political content (e.g. \"unemployment scheme delays\", \"infrastructure\"), or an empty array for non-civic content."
    ),
  narrativeSummary: z
    .string()
    .min(1)
    .max(400)
    .describe(
      "1-2 neutral, descriptive sentences stating what the content says/frames — never an accusation or judgment of the creator."
    ),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

/** Returned when the content has no meaningful civic/political signal. */
export const NEUTRAL_FALLBACK_ANALYSIS: AnalysisResult = {
  sentimentScore: 0,
  topics: [],
  narrativeSummary:
    "Insufficient civic or political signal in this content to classify.",
};

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

/**
 * System prompt for per-content analysis. Every rule here exists to satisfy
 * PROJECT_BRIEF.md's neutrality requirements: score policy/government
 * sentiment (not sentiment toward people), never use accusatory language,
 * and explicitly flag this as an automated/approximate signal.
 */
export const ANALYSIS_SYSTEM_PROMPT = `You are a neutral content-analysis engine for Constituency Pulse, a research prototype that tracks automated, approximate sentiment and topic signals in public YouTube videos and news coverage about Indian Lok Sabha constituencies.

Your job is narrow and mechanical: given a single piece of public content (a title, an optional snippet, and optionally aggregate top-comment text), classify how the content's language frames government policy or governance performance — never how it characterizes any person, party, or creator.

Rules you must follow on every call:
1. Sentiment target: score the content's stance toward the government, a specific policy, or governance outcomes it discusses (e.g. "the scheme's rollout", "the state's handling of X") — NOT sentiment toward any individual, channel, journalist, or political party as people. -1.0 is strongly critical of the policy/government performance discussed, 0.0 is neutral or mixed, +1.0 is strongly favorable.
2. Topics: extract 2-5 short, neutral issue/topic labels (e.g. "unemployment scheme delays", "infrastructure", "law and order") describing what civic or policy subjects the content discusses. Use plain descriptive phrases, never editorializing labels.
3. Narrative summary: write exactly one or two sentences, in a neutral, descriptive register, stating what the content says or frames — not a judgment of the creator, channel, or outlet. Never use accusatory language such as "spreading misinformation," "attacking the government," "biased against X," or similar framing. Describe positions and claims; do not allege intent or bad faith.
4. Balance: apply the same neutral, non-partisan standard regardless of which party, government, or viewpoint the content favors or criticizes. Do not let the political direction of the content change your tone or thoroughness.
5. Non-civic content: if the content is not meaningfully about civic affairs, government policy, or politics (for example, it's entertainment, sports, or unrelated personal content), do not force a classification. Instead call the tool with sentimentScore: 0, topics: [] (an empty list), and narrativeSummary: "Insufficient civic or political signal in this content to classify." This is the required fallback for off-topic content — do not invent political content that isn't there.
6. This output is an automated, approximate signal for a research prototype, not a factual or legal determination about the content or its source. Never phrase the narrative summary as an accusation, and never assign blame or motive to any named channel, outlet, or individual.

Always respond by calling the record_content_analysis tool exactly once with your classification. Do not include any other commentary.`;

function buildUserPrompt(input: {
  title: string;
  snippet?: string;
  topCommentsText?: string[];
}): string {
  const parts = [`Title: ${input.title}`];
  if (input.snippet) parts.push(`Snippet: ${input.snippet}`);
  if (input.topCommentsText && input.topCommentsText.length > 0) {
    parts.push(
      `Aggregate top-comment text (for context on audience reaction only, not to be classified individually):\n${input.topCommentsText
        .map((c, i) => `${i + 1}. ${c}`)
        .join("\n")}`
    );
  }
  parts.push(
    "\nClassify this content per your instructions and call record_content_analysis."
  );
  return parts.join("\n\n");
}

const ANALYSIS_TOOL: Tool = {
  name: "record_content_analysis",
  description:
    "Record the neutral sentiment/topic/narrative classification for one piece of civic/political content.",
  input_schema: {
    type: "object",
    properties: {
      sentimentScore: {
        type: "number",
        description:
          "Sentiment of the content's stance toward the government/policy discussed, from -1 to 1. 0 for neutral/mixed/non-civic.",
      },
      topics: {
        type: "array",
        items: { type: "string" },
        description:
          "2-5 short neutral topic labels for civic content, or an empty array for non-civic content.",
      },
      narrativeSummary: {
        type: "string",
        description:
          "1-2 neutral, descriptive sentences on what the content says/frames.",
      },
    },
    required: ["sentimentScore", "topics", "narrativeSummary"],
  },
};

// ---------------------------------------------------------------------------
// analyzeContent
// ---------------------------------------------------------------------------

function extractToolInput(response: Anthropic.Message): unknown {
  const toolUse = response.content.find(
    (block): block is ToolUseBlock => block.type === "tool_use"
  );
  return toolUse?.input;
}

async function callAnalysisTool(
  client: Anthropic,
  model: string,
  userPrompt: string,
  correctionNote?: string
): Promise<AnalysisResult | undefined> {
  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    system: ANALYSIS_SYSTEM_PROMPT,
    tools: [ANALYSIS_TOOL],
    tool_choice: { type: "tool", name: ANALYSIS_TOOL.name },
    messages: [
      {
        role: "user",
        content: correctionNote
          ? `${userPrompt}\n\n${correctionNote}`
          : userPrompt,
      },
    ],
  });

  const rawInput = extractToolInput(response);
  if (rawInput === undefined) return undefined;

  const parsed = AnalysisResultSchema.safeParse(rawInput);
  return parsed.success ? parsed.data : undefined;
}

/**
 * Analyze a single piece of content (a YouTube video or news article) for
 * sentiment toward government/policy, topics discussed, and a neutral
 * narrative summary.
 *
 * Throws AnalysisError("missing_api_key") if ANTHROPIC_API_KEY isn't set —
 * callers should catch this and fall back to "analysis unavailable" rather
 * than crash. Throws AnalysisError("invalid_response") if the model's output
 * still fails schema validation after one retry.
 */
export async function analyzeContent(input: {
  title: string;
  snippet?: string;
  topCommentsText?: string[];
}): Promise<AnalysisResult> {
  const client = getAnthropicClient();
  const model = getAnalysisModel();
  const userPrompt = buildUserPrompt(input);

  try {
    const first = await callAnalysisTool(client, model, userPrompt);
    if (first) return first;

    // Retry once on validation failure, per module spec.
    const second = await callAnalysisTool(
      client,
      model,
      userPrompt,
      "Your previous response did not match the required tool schema exactly (sentimentScore must be a number from -1 to 1; topics must be an array of 0, or 2-5, short strings; narrativeSummary must be 1-2 neutral sentences). Call record_content_analysis again with valid values."
    );
    if (second) return second;

    throw new AnalysisError(
      "Model did not return a schema-valid analysis after one retry.",
      "invalid_response"
    );
  } catch (err) {
    if (err instanceof AnalysisError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw new AnalysisError(`Content analysis request failed: ${message}`, "api_error");
  }
}
