/**
 * Cross-platform amplification events — the source PRD's example: "content
 * first appeared on Instagram, amplified to X within 6 hours." Each event
 * describes one narrative's jump from an origin account/platform to a
 * target account/platform, which is what a "catch it fast" alert feed would
 * surface.
 *
 * Deliberately self-contained against `accounts.ts` (for account ids and
 * platforms) and `graph.ts` (for issue ids and constituency ids, both of
 * which are themselves derived only from `accounts.ts`/`constituencies.ts`)
 * — this module does NOT reference the sibling `posts.ts`/`mock-analysis.ts`
 * module built in parallel by another agent, so there is no post-id or
 * build-ordering dependency between the two. `headline` is a short
 * standalone description of the spreading narrative, not a specific post.
 *
 * The 23 events below are hand-curated (not `Math.random()`-generated) so
 * each headline reads as a plausible, specific narrative rather than a
 * templated string, but every account id, platform, issue id, and
 * constituency id referenced is real and cross-checked against
 * `accounts.ts` / `buildIntelligenceGraph()`. Re-running this module always
 * yields the exact same fixed list.
 */

import type { Platform } from "@/lib/types";
import { buildIntelligenceGraph } from "./graph";
import { REFERENCE_TODAY } from "./growth-history";

export interface AmplificationEvent {
  id: string;
  /** Short description of the narrative that spread, e.g. "Coverage of delayed disbursement in the employment scheme". */
  headline: string;
  /** Matches a GraphNode id of type "issue" from graph.ts. */
  issueId: string;
  /** Matches an Account.id. */
  originAccountId: string;
  originPlatform: Platform;
  /** Optional: a specific account that picked it up on the target platform. */
  amplifiedToAccountId?: string;
  targetPlatform: Platform;
  /** Time between origin post and cross-platform amplification. */
  hoursDelay: number;
  /** e.g. 3.2x the reach on the target platform vs origin. */
  spreadMultiplier: number;
  /** Which constituency this narrative is most relevant to, if any. */
  constituencyId?: string;
  /** ISO date (YYYY-MM-DD) this event occurred, deterministically derived
   *  from `id` (seeded PRNG, not Math.random()) as a date within the ~30
   *  days ending at growth-history.ts's REFERENCE_TODAY anchor — same
   *  determinism contract as every other mock module. */
  occurredAt: string;
}

/** The 23 hand-curated events, minus the derived `occurredAt` field added below. */
type AmplificationEventSeed = Omit<AmplificationEvent, "occurredAt">;

// ---------------------------------------------------------------------------
// Seeded PRNG helpers (self-contained, mirroring growth-history.ts's
// mulberry32 + string-hash approach) — used only to derive `occurredAt`
// below, so this module still has no runtime dependency on
// Math.random()/Date.now().
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

function isoDateDaysBefore(referenceDate: string, daysBefore: number): string {
  const d = new Date(`${referenceDate}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - daysBefore);
  return d.toISOString().slice(0, 10);
}

/** Deterministic date within the last ~30 days ending at REFERENCE_TODAY, seeded by the event's id. */
function occurredAtFor(eventId: string): string {
  const random = mulberry32(hashStringToSeed(eventId));
  const daysBefore = Math.floor(random() * 30); // 0-29 days before REFERENCE_TODAY
  return isoDateDaysBefore(REFERENCE_TODAY, daysBefore);
}

const AMPLIFICATION_EVENT_SEEDS: AmplificationEventSeed[] = [
  {
    id: "amp-001",
    headline: "Local clip alleging delayed PM Employment Generation Scheme disbursement in Amethi camps",
    issueId: "issue-employment-schemes",
    originAccountId: "upupdatedesk",
    originPlatform: "facebook",
    amplifiedToAccountId: "awadhawaaz",
    targetPlatform: "youtube",
    hoursDelay: 18,
    spreadMultiplier: 3.4,
    constituencyId: "up-amethi",
  },
  {
    id: "amp-002",
    headline: "Youthquake India's recruitment-timeline tracker goes viral after an exam-result delay",
    issueId: "issue-employment-schemes",
    originAccountId: "youthquakeindia",
    originPlatform: "instagram",
    amplifiedToAccountId: "loksabhalive",
    targetPlatform: "x",
    hoursDelay: 6,
    spreadMultiplier: 5.1,
  },
  {
    id: "amp-003",
    headline: "Coalfield labour-dispute footage from Dhanbad picked up statewide",
    issueId: "issue-industrial-jobs",
    originAccountId: "koylacircuit",
    originPlatform: "youtube",
    amplifiedToAccountId: "chhotanagpurchronicle",
    targetPlatform: "facebook",
    hoursDelay: 30,
    spreadMultiplier: 2.2,
    constituencyId: "jh-dhanbad",
  },
  {
    id: "amp-004",
    headline: "Bengal Bulletin's probe into industrial-jobs-scheme vacancy counts spreads to Bengal Now's audience",
    issueId: "issue-industrial-jobs",
    originAccountId: "bengalbulletin",
    originPlatform: "x",
    amplifiedToAccountId: "bengalnow_yt",
    targetPlatform: "youtube",
    hoursDelay: 40,
    spreadMultiplier: 2.8,
    constituencyId: "wb-asansol",
  },
  {
    id: "amp-005",
    headline: "Chandigarh municipal road-repair backlog thread amplified by Tricity Tribune",
    issueId: "issue-infrastructure-roads",
    originAccountId: "sukhnasignal",
    originPlatform: "x",
    amplifiedToAccountId: "tricitytribune",
    targetPlatform: "youtube",
    hoursDelay: 10,
    spreadMultiplier: 3.0,
    constituencyId: "ch-chandigarh",
  },
  {
    id: "amp-006",
    headline: "Bharat Bytes' explainer on national highway milestones cross-posted by Saffron Scoop",
    issueId: "issue-infrastructure-roads",
    originAccountId: "bharatbytes",
    originPlatform: "youtube",
    amplifiedToAccountId: "saffronscoop",
    targetPlatform: "x",
    hoursDelay: 22,
    spreadMultiplier: 2.1,
  },
  {
    id: "amp-007",
    headline: "Marwar Manch's water-scarcity photo essay reaches Rajasthan Report's Instagram followers within hours",
    issueId: "issue-water-supply",
    originAccountId: "marwarmanch",
    originPlatform: "x",
    amplifiedToAccountId: "rajasthanreport_ig",
    targetPlatform: "instagram",
    hoursDelay: 4,
    spreadMultiplier: 4.6,
    constituencyId: "rj-barmer",
  },
  {
    id: "amp-008",
    headline: "Bhopal Bulletin's Jal Jeevan Mission shortfall thread picked up by Malwa Manch",
    issueId: "issue-water-supply",
    originAccountId: "bhopalbulletin",
    originPlatform: "x",
    amplifiedToAccountId: "malwamanch",
    targetPlatform: "youtube",
    hoursDelay: 26,
    spreadMultiplier: 1.8,
    constituencyId: "mp-bhopal",
  },
  {
    id: "amp-009",
    headline: "Ground Report Desk's exam-timeline investigation cross-posted to its own rapid-fire X thread",
    issueId: "issue-education-policy",
    originAccountId: "groundreportdesk",
    originPlatform: "instagram",
    amplifiedToAccountId: "groundreportdesk_x",
    targetPlatform: "x",
    hoursDelay: 3,
    spreadMultiplier: 2.5,
  },
  {
    id: "amp-010",
    headline: "Kochi Circuit's report on state health-scheme enrolment gaps amplified by Ananthapuri Update",
    issueId: "issue-healthcare-access",
    originAccountId: "kochicircuit",
    originPlatform: "youtube",
    amplifiedToAccountId: "ananthapuriupdate",
    targetPlatform: "x",
    hoursDelay: 16,
    spreadMultiplier: 2.9,
    constituencyId: "kl-thiruvananthapuram",
  },
  {
    id: "amp-011",
    headline: "Majha Manch's farmer-welfare enrolment reel amplified to Punjab Pulse's national X following overnight",
    issueId: "issue-farm-agriculture-policy",
    originAccountId: "majhamanch",
    originPlatform: "instagram",
    amplifiedToAccountId: "punjabpulse_x",
    targetPlatform: "x",
    hoursDelay: 8,
    spreadMultiplier: 6.3,
    constituencyId: "pb-gurdaspur",
  },
  {
    id: "amp-012",
    headline: "Kisan Ki Baat's subsidy-disbursement data thread picked up by Ground Report Desk's investigative team",
    issueId: "issue-farm-agriculture-policy",
    originAccountId: "kisankibaat",
    originPlatform: "facebook",
    amplifiedToAccountId: "groundreportdesk",
    targetPlatform: "instagram",
    hoursDelay: 34,
    spreadMultiplier: 2.0,
  },
  {
    id: "amp-013",
    headline: "Dilli Dastak's women's-safety patrol clip amplified by Capital Circuit's civic-affairs coverage",
    issueId: "issue-womens-safety",
    originAccountId: "dillidastak",
    originPlatform: "instagram",
    amplifiedToAccountId: "capitalcircuit",
    targetPlatform: "youtube",
    hoursDelay: 5,
    spreadMultiplier: 3.7,
    constituencyId: "dl-chandnichowk",
  },
  {
    id: "amp-014",
    headline: "Namma Bengaluru Beat's digital-governance app-rollout post amplified by Dakshin Awaaz within the day",
    issueId: "issue-digital-governance",
    originAccountId: "nammabengalurubeat",
    originPlatform: "facebook",
    amplifiedToAccountId: "dakshinawaaz",
    targetPlatform: "x",
    hoursDelay: 12,
    spreadMultiplier: 3.3,
    constituencyId: "ka-bangaloresouth",
  },
  {
    id: "amp-015",
    headline: "Doaba Diary's border-district law-and-order footage amplified to Punjab Pulse's Facebook audience",
    issueId: "issue-law-and-order",
    originAccountId: "doabadiary",
    originPlatform: "youtube",
    amplifiedToAccountId: "punjabpulse_fb",
    targetPlatform: "facebook",
    hoursDelay: 20,
    spreadMultiplier: 2.6,
    constituencyId: "pb-gurdaspur",
  },
  {
    id: "amp-016",
    headline: "Purvottar Pulse's flood-relief disbursement post goes cross-platform via Northeast Frontline's X account within 2 hours",
    issueId: "issue-flood-disaster-relief",
    originAccountId: "purvottarpulse",
    originPlatform: "facebook",
    amplifiedToAccountId: "nefrontline_x",
    targetPlatform: "x",
    hoursDelay: 2,
    spreadMultiplier: 7.8,
    constituencyId: "as-dhubri",
  },
  {
    id: "amp-017",
    headline: "Bihar Bytes' flood-impact reel amplified by Seemanchal Swar's follower base overnight",
    issueId: "issue-flood-disaster-relief",
    originAccountId: "biharbytes_ig",
    originPlatform: "instagram",
    amplifiedToAccountId: "seemanchalswar",
    targetPlatform: "x",
    hoursDelay: 9,
    spreadMultiplier: 4.1,
    constituencyId: "br-purnia",
  },
  {
    id: "amp-018",
    headline: "Malabar Manch's wildlife-conflict resettlement photo essay cross-posted from Facebook to its own Instagram",
    issueId: "issue-housing-schemes",
    originAccountId: "malabarmanch_fb",
    originPlatform: "facebook",
    amplifiedToAccountId: "malabarmanch_ig",
    targetPlatform: "instagram",
    hoursDelay: 3,
    spreadMultiplier: 1.9,
    constituencyId: "kl-wayanad",
  },
  {
    id: "amp-019",
    headline: "Ground Report Desk's PM Awas Yojana ground-check thread amplified nationally by Bharat Bytes",
    issueId: "issue-housing-schemes",
    originAccountId: "groundreportdesk_x",
    originPlatform: "x",
    amplifiedToAccountId: "bharatbytes",
    targetPlatform: "youtube",
    hoursDelay: 45,
    spreadMultiplier: 2.4,
  },
  {
    id: "amp-020",
    headline: "High Altitude Update's border-infrastructure post amplified by Ladakh Ledger's video coverage",
    issueId: "issue-border-security",
    originAccountId: "highaltitudeupdate",
    originPlatform: "x",
    amplifiedToAccountId: "ladakhledger",
    targetPlatform: "youtube",
    hoursDelay: 14,
    spreadMultiplier: 2.7,
    constituencyId: "la-ladakh",
  },
  {
    id: "amp-021",
    headline: "Registan Report's border-district development story amplified via Marwar Manch's rapid-fire thread",
    issueId: "issue-border-security",
    originAccountId: "registanreport",
    originPlatform: "youtube",
    amplifiedToAccountId: "marwarmanch",
    targetPlatform: "x",
    hoursDelay: 28,
    spreadMultiplier: 1.6,
    constituencyId: "rj-barmer",
  },
  {
    id: "amp-022",
    headline: "Santal Swar's tribal land-rights thread amplified by Jharkhand Jagran's mining-royalty investigation",
    issueId: "issue-tribal-land-rights",
    originAccountId: "santalswar",
    originPlatform: "x",
    amplifiedToAccountId: "jharkhandjagran",
    targetPlatform: "instagram",
    hoursDelay: 17,
    spreadMultiplier: 3.5,
    constituencyId: "jh-hazaribagh",
  },
  {
    id: "amp-023",
    headline: "Capital Circuit's civic-jurisdiction dispute explainer amplified into Rajpath Report's quick-hit thread",
    issueId: "issue-urban-civic-services",
    originAccountId: "capitalcircuit",
    originPlatform: "youtube",
    amplifiedToAccountId: "rajpathreport",
    targetPlatform: "x",
    hoursDelay: 24,
    spreadMultiplier: 2.3,
    constituencyId: "dl-chandnichowk",
  },
];

const AMPLIFICATION_EVENTS: AmplificationEvent[] = AMPLIFICATION_EVENT_SEEDS.map((event) => ({
  ...event,
  occurredAt: occurredAtFor(event.id),
}));

// Fail loudly in dev if a future edit typos an issue id — keeps this module
// honest against graph.ts's actual taxonomy without importing test tooling.
const VALID_ISSUE_IDS = new Set(
  buildIntelligenceGraph().nodes.filter((n) => n.type === "issue").map((n) => n.id)
);
for (const event of AMPLIFICATION_EVENTS) {
  if (!VALID_ISSUE_IDS.has(event.issueId)) {
    throw new Error(`amplification.ts: unknown issueId "${event.issueId}" on event "${event.id}"`);
  }
  if (event.originPlatform === event.targetPlatform) {
    throw new Error(`amplification.ts: originPlatform === targetPlatform on event "${event.id}"`);
  }
}

export function getAllAmplificationEvents(): AmplificationEvent[] {
  return AMPLIFICATION_EVENTS;
}

export function getAmplificationForConstituency(constituencyId: string): AmplificationEvent[] {
  return AMPLIFICATION_EVENTS.filter((event) => event.constituencyId === constituencyId);
}
