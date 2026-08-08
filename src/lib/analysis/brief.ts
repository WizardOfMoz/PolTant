import Anthropic from "@anthropic-ai/sdk";
import type { Tool, ToolUseBlock } from "@anthropic-ai/sdk/resources/messages";
import { z } from "zod";
import { AnalysisError, getAnalysisModel, getAnthropicClient } from "./client";

/**
 * Constituency-level weekly-brief synthesis: takes already-analyzed content
 * items (from analyzeContent, in client.ts) for one constituency and asks
 * Claude once more to synthesize a dominant narrative and aggregate
 * sentiment. Matches the shape implied by `narrativeBriefs` in
 * src/db/schema.ts (dominantNarrative, sentimentScore, sentimentDelta,
 * topChannelIds — here `topDrivers` before the caller maps display names
 * back to channel/source IDs for storage).
 *
 * SERVER-ONLY, same convention as client.ts.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnalyzedItemInput {
  topics: string[];
  sentimentScore: number;
  narrativeSummary: string;
  /** Channel display name or RSS source name — must be echoed verbatim in
   *  topDrivers if referenced; never invented. */
  channelOrSourceName: string;
}

export interface ConstituencyBriefInput {
  constituencyName: string;
  analyzedItems: AnalyzedItemInput[];
  /** Previous period's sentimentScore, if any, used to compute sentimentDelta. */
  previousSentimentScore?: number;
}

/** The model only ever produces these three fields — sentimentDelta is
 *  always computed deterministically in code below, never by the LLM. */
const BriefToolOutputSchema = z.object({
  dominantNarrative: z.string().min(1).max(600),
  sentimentScore: z.number().min(-1).max(1),
  topDrivers: z.array(z.string().min(1).max(200)).max(8),
});

export interface ConstituencyBrief {
  dominantNarrative: string;
  sentimentScore: number;
  sentimentDelta: number | null;
  /** Channel/source names actually present in the input analyzedItems —
   *  filtered against the input again after the model responds, so a
   *  hallucinated name can never survive even if the model ignores the
   *  system prompt's no-invention rule. */
  topDrivers: string[];
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

/**
 * System prompt for the constituency-level synthesis call. Rules 1 and 2
 * are the load-bearing ones for this module's spec: never invent a driver,
 * never use accusatory/defamatory language about a named source.
 */
export const BRIEF_SYSTEM_PROMPT = `You are a neutral synthesis engine for Constituency Pulse, a research prototype. You receive a list of already-analyzed pieces of public content (YouTube videos or news articles) about a single Lok Sabha constituency, each with its own topics, sentiment score, neutral narrative summary, and source/channel name. Your job is to synthesize these into one constituency-level weekly brief.

Strict rules:
1. Never invent a driver. topDrivers must be an array made up only of channel or source names that literally appear in the channelOrSourceName field of the analyzed items you were given. Do not add, guess, generalize, or rename any source. If you are unsure whether a name appeared, leave it out. List at most the 5 sources most representative of the dominant narrative.
2. Never use accusatory, defamatory, or motive-attributing language about any named source. Describe what the content discusses and what stance it takes toward government/policy topics — never characterize a channel or outlet as "biased," "spreading misinformation," "attacking," or similar. State what the content discusses and what position it takes, not judgments about who is "responsible" for a narrative.
3. dominantNarrative is a short (1-3 sentence), neutral, descriptive summary of the recurring themes/topics and sentiment pattern across the analyzed items — phrased in a "coverage in this period discussed X, with Y sentiment toward Z" style, never as an accusation against any party or source.
4. sentimentScore is your best single neutral estimate (-1 to 1) of the aggregate sentiment across all analyzed items toward government/policy performance, weighted by how representative each item's narrative is of the whole set.
5. Do not compute or return a sentiment delta, trend, or "change since last period" value — that is computed separately by the calling application from data you do not have.
6. This is an automated, approximate signal for a research prototype, not a definitive or factual claim about any source's intent, credibility, or motives.

Always respond by calling the record_constituency_brief tool exactly once with your synthesis.`;

const BRIEF_TOOL: Tool = {
  name: "record_constituency_brief",
  description:
    "Record the neutral constituency-level narrative synthesis for one reporting period.",
  input_schema: {
    type: "object",
    properties: {
      dominantNarrative: {
        type: "string",
        description:
          "1-3 neutral sentences summarizing the recurring themes and sentiment pattern across the analyzed items.",
      },
      sentimentScore: {
        type: "number",
        description:
          "Aggregate sentiment estimate toward government/policy performance, from -1 to 1.",
      },
      topDrivers: {
        type: "array",
        items: { type: "string" },
        description:
          "Up to 5 channel/source names, copied verbatim from the input's channelOrSourceName values, most representative of the dominant narrative. Never invent a name not present in the input.",
      },
    },
    required: ["dominantNarrative", "sentimentScore", "topDrivers"],
  },
};

function buildUserPrompt(input: ConstituencyBriefInput): string {
  const itemsBlock = input.analyzedItems
    .map((item, i) => {
      return [
        `${i + 1}. Source: ${item.channelOrSourceName}`,
        `   Sentiment: ${item.sentimentScore}`,
        `   Topics: ${item.topics.length > 0 ? item.topics.join(", ") : "(none)"}`,
        `   Narrative: ${item.narrativeSummary}`,
      ].join("\n");
    })
    .join("\n");

  return `Constituency: ${input.constituencyName}

Analyzed content items for this reporting period (${input.analyzedItems.length} total):
${itemsBlock}

Synthesize these into one constituency-level brief and call record_constituency_brief. Remember: topDrivers may only contain source names exactly as they appear above.`;
}

function extractToolInput(response: Anthropic.Message): unknown {
  const toolUse = response.content.find(
    (block): block is ToolUseBlock => block.type === "tool_use"
  );
  return toolUse?.input;
}

async function callBriefTool(
  client: Anthropic,
  model: string,
  userPrompt: string,
  correctionNote?: string
): Promise<z.infer<typeof BriefToolOutputSchema> | undefined> {
  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    system: BRIEF_SYSTEM_PROMPT,
    tools: [BRIEF_TOOL],
    tool_choice: { type: "tool", name: BRIEF_TOOL.name },
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

  const parsed = BriefToolOutputSchema.safeParse(rawInput);
  return parsed.success ? parsed.data : undefined;
}

function round(n: number, decimals = 3): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

/**
 * Synthesize a constituency-level weekly brief from a set of already-
 * analyzed content items. Throws AnalysisError("missing_api_key") if
 * ANTHROPIC_API_KEY isn't set, and AnalysisError("invalid_response") if the
 * model's output still fails schema validation after one retry — callers
 * should catch both and fall back to "brief unavailable" UI state.
 */
export async function synthesizeConstituencyBrief(
  input: ConstituencyBriefInput
): Promise<ConstituencyBrief> {
  // No fabricated data: with nothing to synthesize, return an explicit
  // "insufficient data" result deterministically rather than ask the model
  // to invent a narrative from an empty set.
  if (input.analyzedItems.length === 0) {
    return {
      dominantNarrative:
        "No analyzed content is available for this constituency in this period.",
      sentimentScore: 0,
      sentimentDelta: null,
      topDrivers: [],
    };
  }

  const client = getAnthropicClient();
  const model = getAnalysisModel();
  const userPrompt = buildUserPrompt(input);
  const validSourceNames = new Set(
    input.analyzedItems.map((item) => item.channelOrSourceName)
  );

  let raw: z.infer<typeof BriefToolOutputSchema> | undefined;
  try {
    raw = await callBriefTool(client, model, userPrompt);
    if (!raw) {
      raw = await callBriefTool(
        client,
        model,
        userPrompt,
        "Your previous response did not match the required tool schema exactly (dominantNarrative: a short string; sentimentScore: a number from -1 to 1; topDrivers: an array of at most 8 strings, each copied verbatim from a channelOrSourceName above). Call record_constituency_brief again with valid values."
      );
    }
  } catch (err) {
    if (err instanceof AnalysisError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw new AnalysisError(`Constituency brief request failed: ${message}`, "api_error");
  }

  if (!raw) {
    throw new AnalysisError(
      "Model did not return a schema-valid constituency brief after one retry.",
      "invalid_response"
    );
  }

  // Defense in depth: even though the system prompt forbids inventing
  // drivers, re-filter against the actual input so a hallucinated or
  // slightly-reworded name can never reach the caller.
  const topDrivers = raw.topDrivers.filter((name) => validSourceNames.has(name));

  const sentimentDelta =
    input.previousSentimentScore === undefined
      ? null
      : round(raw.sentimentScore - input.previousSentimentScore);

  return {
    dominantNarrative: raw.dominantNarrative,
    sentimentScore: raw.sentimentScore,
    sentimentDelta,
    topDrivers,
  };
}
