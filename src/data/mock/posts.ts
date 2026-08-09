/**
 * Deterministic fabricated post/video roster for every account in
 * `src/data/mock/accounts.ts`, replacing the deleted `src/data/dummy-channels.ts`
 * (its inline per-channel `posts` arrays) with a standalone, joinable module.
 *
 * Same determinism contract as `growth-history.ts`: no raw `Math.random()`/
 * `Date.now()` in exported values — everything is derived from a seeded PRNG
 * keyed off `Account.id`/`Post.id` plus a fixed `REFERENCE_TODAY` anchor, so
 * the same account always produces the same posts across renders and days.
 *
 * Everything below (titles, snippets, aggregate comment text, counts) is
 * invented. Per this repo's carried-over framing rules (see AGENTS.md /
 * accounts.ts header / the deleted dummy-channels.ts's header, recoverable
 * via `git show HEAD~:src/data/dummy-channels.ts`): neutral, analytical
 * framing only, never accusatory toward any party/person, and no
 * individual-commenter identity data — `topCommentsText` is aggregate-only
 * illustrative text, not attributed to any invented "user".
 */

import { ACCOUNTS, type Account } from "./accounts";
import { constituencies } from "@/data/constituencies";

export interface Post {
  id: string;
  accountId: string;
  title: string;
  snippet: string;
  topCommentsText: string[];
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  guessedConstituencyId?: string;
}

/** Fixed anchor for "today" — same value/rationale as growth-history.ts:
 *  posts span the ~30 days ending here, deterministically. */
const REFERENCE_TODAY = "2026-08-09";

// ---------------------------------------------------------------------------
// Seeded PRNG helpers (self-contained, mirroring growth-history.ts's
// mulberry32 + string-hash approach so this module has no runtime
// dependency on Math.random()/Date.now()).
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

// ---------------------------------------------------------------------------
// Topic templates. These 15 topic keys intentionally match the
// TOPIC_VOCABULARY defined in mock-analysis.ts (kept as parallel string
// literals rather than a shared import, since posts.ts has no dependency on
// the analysis module) so keyword-based analysis reliably recognizes the
// content this module generates.
// ---------------------------------------------------------------------------

type TopicKey =
  | "Employment Schemes"
  | "Infrastructure & Roads"
  | "Water Supply"
  | "Education Policy"
  | "Healthcare Access"
  | "Agriculture & Farm Policy"
  | "Women's Safety"
  | "Digital Governance"
  | "Law & Order"
  | "Industrial Jobs"
  | "Flood & Disaster Relief"
  | "Welfare Scheme Disbursement"
  | "Housing & Urban Development"
  | "Public Transport"
  | "Border & Regional Development";

const TOPIC_KEYS: TopicKey[] = [
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

interface PostTemplate {
  title: (area: string) => string;
  snippet: (area: string) => string;
  comments: (area: string) => string[];
}

const POST_TEMPLATES: Record<TopicKey, PostTemplate[]> = {
  "Employment Schemes": [
    {
      title: (area) => `Why the unemployment scheme rollout in ${area} is still stuck`,
      snippet: (area) =>
        `A breakdown of pending applications and disbursement delays under the employment scheme covering ${area}.`,
      comments: () => [
        "Applied months ago, still no update from the local office.",
        "At least someone is tracking the actual numbers here.",
        "Depends heavily on which office you're dealing with.",
      ],
    },
    {
      title: (area) => `Recruitment drive in ${area}: exam results out ahead of schedule`,
      snippet: (area) =>
        `The latest government recruitment exam results for postings in ${area} were released ahead of the announced timeline.`,
      comments: () => [
        "Finally some good news on the vacancy front.",
        "Hope this pace continues for the next round.",
        "Still waiting on my category's cutoff list though.",
      ],
    },
    {
      title: (area) => `Employment scheme vacancy data in ${area}, checked against official numbers`,
      snippet: (area) =>
        `Cross-checking the number of filled positions under the employment scheme in ${area} against the government's own portal.`,
      comments: () => [
        "Good to see the filled-vs-sanctioned numbers side by side.",
        "Would like a district-wise breakdown too.",
        "Numbers differ slightly between the two portals.",
      ],
    },
  ],
  "Infrastructure & Roads": [
    {
      title: (area) => `The highway project through ${area}: what's built vs. what was promised`,
      snippet: (area) =>
        `Comparing the announced timeline for a highway and bridge infrastructure project near ${area} against on-ground construction progress.`,
      comments: () => [
        "Drove past this stretch last week, actually ahead of the last update.",
        "Land acquisition disputes seem to be the real bottleneck, not construction speed.",
      ],
    },
    {
      title: (area) => `Bridge and road infrastructure in ${area}: a mid-year progress check`,
      snippet: (area) => `A mid-year review of ongoing road and bridge infrastructure work around ${area}.`,
      comments: () => [
        "This road used to flood every monsoon, upgrade was overdue.",
        "Would like to see the contractor's timeline published too.",
        "Still a lot of unfinished stretches on this route.",
      ],
    },
    {
      title: (area) => `Is the ${area} highway bypass actually reducing commute time?`,
      snippet: (area) => `An on-ground test of commute times before and after the new highway bypass near ${area} opened.`,
      comments: () => [
        "Commute is noticeably shorter now, this checks out.",
        "Feeder roads to the highway are still in bad shape.",
      ],
    },
  ],
  "Water Supply": [
    {
      title: (area) => `Piped water supply in ${area}: still not reaching every household`,
      snippet: (area) =>
        `A ground-level look at gaps in the piped drinking water supply scheme across parts of ${area}.`,
      comments: () => [
        "Our street still relies on the tanker, connection never came.",
        "At least the coverage map here is more honest than the press release.",
        "Water security has been the top complaint here for years.",
      ],
    },
    {
      title: (area) => `Irrigation canal repairs in ${area} completed ahead of the sowing season`,
      snippet: (area) => `Local irrigation canal repair work near ${area} wrapped up ahead of this season's sowing window.`,
      comments: () => [
        "Water reached the far fields for the first time in years.",
        "Hope maintenance keeps up once the season ends.",
      ],
    },
    {
      title: (area) => `Drinking water supply data for ${area}, checked block by block`,
      snippet: (area) => `A block-by-block breakdown of piped drinking water supply access across ${area}.`,
      comments: () => [
        "Useful to finally see block-level numbers instead of district averages.",
        "Some blocks here still depend entirely on tankers.",
      ],
    },
  ],
  "Education Policy": [
    {
      title: (area) => `What the new education policy changes mean for schools in ${area}`,
      snippet: (area) => `A neutral walkthrough of curriculum and school-admission changes rolling out across ${area}.`,
      comments: () => [
        "Wish this had come out before admission season started.",
        "Our school hasn't announced implementation dates yet.",
      ],
    },
    {
      title: (area) => `We visited schools in ${area} after the new funding announcement`,
      snippet: (area) =>
        `On-the-ground reporting on whether recently announced school infrastructure funding has actually reached schools in ${area}.`,
      comments: () => [
        "This kind of ground-level check is rare, more of this please.",
        "Our school still doesn't have the promised computer lab from last year's budget.",
      ],
    },
    {
      title: (area) => `Education policy enrolment numbers in ${area}, a closer look`,
      snippet: (area) => `Enrolment and dropout data under the state's education policy for schools around ${area}.`,
      comments: () => [
        "Enrolment is up but dropout after grade 8 is still the real gap.",
        "Would like teacher-vacancy numbers alongside this.",
      ],
    },
  ],
  "Healthcare Access": [
    {
      title: (area) => `Healthcare access in ${area}: how far is the nearest functional hospital?`,
      snippet: (area) => `Mapping distance and staffing at public healthcare centres and hospitals serving ${area}.`,
      comments: () => [
        "Nearest hospital with a doctor on duty is over an hour away.",
        "Health centre exists on paper but is rarely staffed on weekends.",
      ],
    },
    {
      title: (area) => `New primary health centre in ${area} now fully operational`,
      snippet: (area) => `A newly built primary health centre near ${area} has become fully operational with resident staff.`,
      comments: () => [
        "Finally don't have to travel two towns over for basic checkups.",
        "Would be great if they added a pharmacy counter too.",
      ],
    },
    {
      title: (area) => `Healthcare staffing data for ${area}, compared against sanctioned posts`,
      snippet: (area) => `Comparing sanctioned versus filled medical staff positions at healthcare centres around ${area}.`,
      comments: () => [
        "The vacancy gap here is bigger than most people realize.",
        "Good to see actual sanctioned-post numbers instead of vague claims.",
      ],
    },
  ],
  "Agriculture & Farm Policy": [
    {
      title: (area) => `Farm procurement prices in ${area}: do they cover input costs?`,
      snippet: (area) => `Verifying this season's MSP and procurement price changes against farmer input costs around ${area}.`,
      comments: () => [
        "The MSP increase doesn't fully cover input cost inflation.",
        "Procurement centres near ${area} still open late in the season.",
      ],
    },
    {
      title: (area) => `Crop procurement in ${area} moved faster than last season`,
      snippet: (area) => `Farm procurement centres around ${area} cleared this season's crop backlog faster than last year.`,
      comments: () => [
        "Payment actually came within the promised window this time.",
        "Would still like to see a per-farmer payout breakdown.",
      ],
    },
    {
      title: (area) => `Farmer welfare and procurement data for ${area}, checked against records`,
      snippet: (area) => `Cross-checking farmer welfare and crop procurement scheme claims for ${area} against official records.`,
      comments: () => [
        "Numbers roughly match what our village saw this season.",
        "Smaller landholders still report longer waits.",
      ],
    },
  ],
  "Women's Safety": [
    {
      title: (area) => `The women's safety helpline in ${area}: response times, tested`,
      snippet: (area) => `An on-the-ground test of stated response times for the women's safety helpline serving ${area}.`,
      comments: () => [
        "Response time gap between urban and rural stops is the real story here.",
        "Glad someone actually tested this instead of quoting the press release.",
      ],
    },
    {
      title: (area) => `New street lighting and safety audit completed across ${area}`,
      snippet: (area) => `A recently completed women's safety audit and street-lighting upgrade across parts of ${area}.`,
      comments: () => [
        "This stretch feels noticeably safer at night now.",
        "Would like to see similar audits extended to nearby areas.",
      ],
    },
    {
      title: (area) => `Women's safety helpline usage data for ${area}, one year on`,
      snippet: (area) => `A one-year review of call volumes and response times for the women's safety helpline in ${area}.`,
      comments: () => [
        "Interesting to see usage rising alongside awareness campaigns.",
        "Would still like rural response-time data broken out separately.",
      ],
    },
  ],
  "Digital Governance": [
    {
      title: (area) => `The new digital governance portal in ${area}, one month in`,
      snippet: (area) => `A first look at adoption numbers and common complaints about the citizen-services digital portal in ${area}.`,
      comments: () => [
        "Portal crashed twice when I tried to file my application.",
        "Better than standing in line at the old office, still buggy though.",
      ],
    },
    {
      title: (area) => `Online application numbers for the digital portal serving ${area}, up sharply`,
      snippet: (area) => `Adoption of the citizen-services digital portal across ${area} rose sharply after a recent upgrade.`,
      comments: () => [
        "Processing time really did drop after the upgrade.",
        "Still need a helpline for people without smartphones.",
      ],
    },
    {
      title: (area) => `Testing the e-governance portal in ${area}: what actually works`,
      snippet: (area) => `A hands-on test of common citizen-services requests through the e-governance portal covering ${area}.`,
      comments: () => [
        "Certificate download worked instantly, better than expected.",
        "Status tracking for pending applications is still confusing.",
      ],
    },
  ],
  "Law & Order": [
    {
      title: (area) => `Breaking down law and order statistics for ${area} by category`,
      snippet: (area) => `Year-over-year crime statistics for ${area}, sourced from official state police reports.`,
      comments: () => [
        "Numbers look better on paper but reporting rates vary a lot locally.",
        "Appreciate the category-wise breakdown instead of just a headline number.",
      ],
    },
    {
      title: (area) => `Police response-time data for ${area}, verified against call logs`,
      snippet: (area) => `Checking claimed police response times in ${area} against publicly available call-log data.`,
      comments: () => [
        "Response times genuinely improved in the newer beat areas.",
        "Older parts of town still see longer waits.",
      ],
    },
    {
      title: (area) => `Law and order statistics for ${area}: a five-year trend`,
      snippet: (area) => `A five-year trend line of official law and order statistics covering ${area}.`,
      comments: () => [
        "Would like to see this normalized per capita, not just raw counts.",
        "Trend looks steadier than the yearly headlines suggest.",
      ],
    },
  ],
  "Industrial Jobs": [
    {
      title: (area) => `Industrial jobs promised for ${area}: how many actually exist?`,
      snippet: (area) => `Checking manufacturing and industrial jobs announcements for ${area} against factory hiring data.`,
      comments: () => [
        "Factory near us is hiring, but nowhere close to the announced numbers.",
        "Would like a follow-up in six months to see if this holds.",
      ],
    },
    {
      title: (area) => `New industrial jobs at the ${area} manufacturing park, first hiring wave`,
      snippet: (area) => `The first hiring wave at a new manufacturing park near ${area} has begun, with early industrial jobs data.`,
      comments: () => [
        "A few people from our neighbourhood got interview calls already.",
        "Curious how many of these are permanent versus contract roles.",
      ],
    },
    {
      title: (area) => `Mining royalty and industrial jobs data for ${area}, cross-checked`,
      snippet: (area) => `Cross-checking mining royalty distribution and related industrial jobs claims for the ${area} belt.`,
      comments: () => [
        "Royalty figures match what the district office published.",
        "Jobs numbers seem to undercount contract and seasonal labour.",
      ],
    },
  ],
  "Flood & Disaster Relief": [
    {
      title: (area) => `Flood relief disbursement in ${area}: who's actually received it?`,
      snippet: (area) => `Tracking disaster relief fund disbursement to flood-affected households across ${area}.`,
      comments: () => [
        "Our village hasn't seen relief funds despite being on the list.",
        "Neighbouring block got theirs within two weeks, ours is still pending.",
      ],
    },
    {
      title: (area) => `Embankment repairs in ${area} completed before this year's flood season`,
      snippet: (area) => `Embankment and flood-defence repair work near ${area} was completed ahead of this year's flood season.`,
      comments: () => [
        "First monsoon in years this embankment has actually held.",
        "Hope maintenance continues once the season passes.",
      ],
    },
    {
      title: (area) => `Cyclone and flood disaster relief fund data for ${area}, verified`,
      snippet: (area) => `Verifying disaster relief fund disbursement figures for cyclone- and flood-affected areas around ${area}.`,
      comments: () => [
        "Numbers broadly match what our relief camp recorded.",
        "Some households still say they were left off the list.",
      ],
    },
  ],
  "Welfare Scheme Disbursement": [
    {
      title: (area) => `Welfare scheme subsidy disbursement in ${area}, still delayed for many`,
      snippet: (area) => `A look at pending subsidy and pension disbursement under the state welfare scheme covering ${area}.`,
      comments: () => [
        "Pension hasn't come through for two cycles now.",
        "Ration shop nearby says the delay is at the bank's end, not theirs.",
      ],
    },
    {
      title: (area) => `Welfare scheme disbursement in ${area} sped up after portal fix`,
      snippet: (area) => `Subsidy and pension disbursement under the welfare scheme in ${area} improved after a recent portal fix.`,
      comments: () => [
        "Payment actually landed on time this cycle.",
        "Would like to see if this holds for the next few months.",
      ],
    },
    {
      title: (area) => `Welfare scheme beneficiary numbers for ${area}, checked against the rolls`,
      snippet: (area) => `Cross-checking welfare scheme beneficiary rolls for ${area} against actual disbursement records.`,
      comments: () => [
        "Beneficiary count here roughly matches our panchayat's list.",
        "A few names on the list haven't received anything yet.",
      ],
    },
  ],
  "Housing & Urban Development": [
    {
      title: (area) => `Housing scheme construction in ${area}: how many units are actually livable?`,
      snippet: (area) => `Checking how many housing scheme units in ${area} are complete and occupied versus still under municipal review.`,
      comments: () => [
        "Our block's units are done but water connection is still pending.",
        "Slum redevelopment nearby has been slower than this scheme.",
      ],
    },
    {
      title: (area) => `Urban development project in ${area} hands over first completed housing block`,
      snippet: (area) => `The first completed block under an urban development and housing scheme in ${area} was handed over to residents.`,
      comments: () => [
        "Move-in process was smoother than expected.",
        "Would like to know the timeline for the remaining blocks.",
      ],
    },
    {
      title: (area) => `Municipal housing scheme data for ${area}, unit by unit`,
      snippet: (area) => `A unit-by-unit review of municipal housing scheme completion status across ${area}.`,
      comments: () => [
        "Good to finally see unit-level status instead of a vague percentage.",
        "Several units listed 'complete' still lack basic fittings.",
      ],
    },
  ],
  "Public Transport": [
    {
      title: (area) => `Public transport coverage in ${area}: is the new bus service reaching everyone?`,
      snippet: (area) => `Checking new public transport bus service routes in ${area} against actual commuter demand.`,
      comments: () => [
        "New route helps, but frequency is still too low during peak hours.",
        "Some neighbourhoods here still have zero bus connectivity.",
      ],
    },
    {
      title: (area) => `New metro/bus link for ${area} opens ahead of schedule`,
      snippet: (area) => `A new public transport link serving ${area} opened ahead of its announced schedule.`,
      comments: () => [
        "Commute time genuinely dropped for me since this opened.",
        "Last-mile connectivity to the new stops still needs work.",
      ],
    },
    {
      title: (area) => `Public transport ridership data for ${area}, six months in`,
      snippet: (area) => `A six-month ridership review of the public transport bus service expansion around ${area}.`,
      comments: () => [
        "Ridership numbers track with what I see on my daily commute.",
        "Off-peak service is still too sparse to rely on.",
      ],
    },
  ],
  "Border & Regional Development": [
    {
      title: (area) => `Border infrastructure projects near ${area}: what's built vs. announced`,
      snippet: (area) => `Comparing announced border-district infrastructure projects near ${area} against actual construction progress.`,
      comments: () => [
        "This stretch has genuinely seen more activity this year.",
        "Still a long way from the original announced timeline.",
      ],
    },
    {
      title: (area) => `Winter connectivity for remote villages near ${area}, one season later`,
      snippet: (area) => `A follow-up on remote-village winter-road connectivity promises for the border and hill areas near ${area}.`,
      comments: () => [
        "Road stayed open longer this winter than in previous years.",
        "A couple of the more remote hamlets are still cut off in peak winter.",
      ],
    },
    {
      title: (area) => `Tribal belt land-rights and displacement data for ${area}, cross-checked`,
      snippet: (area) => `Cross-checking tribal-belt land-rights and displacement-resettlement claims for the region around ${area}.`,
      comments: () => [
        "Resettlement numbers here match what our community recorded.",
        "Compensation timelines are still the main sticking point.",
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Per-account topic weighting: nudges each account's random topic draws
// toward themes suggested by its bio/languageRegion (e.g. flood coverage
// for Assam-linked accounts, water security for arid-belt accounts) without
// rigidly restricting any account to a single theme — every topic keeps a
// non-zero base weight.
// ---------------------------------------------------------------------------

const AFFINITY_RULES: Array<{ match: RegExp; topics: TopicKey[] }> = [
  { match: /flood|disaster|cyclone/i, topics: ["Flood & Disaster Relief"] },
  { match: /water|irrigation|canal|drought|scarcity/i, topics: ["Water Supply"] },
  { match: /farm|agricultur|crop|sugarcane|procurement/i, topics: ["Agriculture & Farm Policy"] },
  { match: /unemployment|employment|migration|recruitment|exam/i, topics: ["Employment Schemes"] },
  { match: /industrial|manufactur|port|mining|coalfield|factory/i, topics: ["Industrial Jobs"] },
  { match: /women|safety/i, topics: ["Women's Safety"] },
  { match: /infrastructure|highway|road|bridge/i, topics: ["Infrastructure & Roads"] },
  { match: /housing|urban|municipal|slum/i, topics: ["Housing & Urban Development"] },
  { match: /health/i, topics: ["Healthcare Access"] },
  { match: /education|school|curriculum/i, topics: ["Education Policy"] },
  { match: /digital|portal|governance/i, topics: ["Digital Governance"] },
  { match: /crime|law and order|police/i, topics: ["Law & Order"] },
  { match: /border|tribal|displacement|remote|hill|zanskar|connectivity/i, topics: ["Border & Regional Development"] },
  { match: /welfare|subsidy|pension|scheme/i, topics: ["Welfare Scheme Disbursement"] },
  { match: /transport|traffic|metro/i, topics: ["Public Transport"] },
];

function computeTopicWeights(account: Account): Record<TopicKey, number> {
  const weights = {} as Record<TopicKey, number>;
  for (const key of TOPIC_KEYS) weights[key] = 1;
  const text = `${account.bio} ${account.languageRegion}`.toLowerCase();
  for (const rule of AFFINITY_RULES) {
    if (rule.match.test(text)) {
      for (const topic of rule.topics) weights[topic] += 4;
    }
  }
  return weights;
}

function weightedPickTopic(weights: Record<TopicKey, number>, random: () => number): TopicKey {
  const total = TOPIC_KEYS.reduce((sum, key) => sum + weights[key], 0);
  let r = random() * total;
  for (const key of TOPIC_KEYS) {
    r -= weights[key];
    if (r <= 0) return key;
  }
  return TOPIC_KEYS[TOPIC_KEYS.length - 1];
}

/** Derives a short human-readable "area" phrase from an account's
 *  languageRegion field (e.g. "Hindi - Uttar Pradesh (Awadh region)" ->
 *  "the Awadh region"), purely by string parsing — no hardcoded per-account
 *  lookup table needed. */
function areaLabelFromRegion(languageRegion: string): string {
  const afterDash = languageRegion.split(" - ").pop()?.trim() ?? languageRegion;
  const parenMatch = afterDash.match(/\(([^)]+)\)/);
  const core = (parenMatch ? parenMatch[1] : afterDash).trim();
  if (/national/i.test(core)) return "multiple states nationwide";
  // Strip qualifiers like ", youth-skewing" that aren't part of the place name.
  const cleaned = core.replace(/,\s*[^,]*skewing[^,]*$/i, "").trim() || core;
  // Nouns that already read naturally without an extra "area" appended
  // (avoids doubling like "Chandigarh tri-city area area" or "Malwa-Nimar
  // belt area").
  if (/(region|area|belt|coast|coalfields|hills|valley|districts)$/i.test(cleaned)) {
    return `the ${cleaned}`;
  }
  return `the ${cleaned} area`;
}

const CONSTITUENCY_IDS: string[] = constituencies.map((c) => c.id);

function pickGuessedConstituencyId(account: Account, random: () => number): string | undefined {
  if (account.primaryConstituencyId) {
    if (random() < 0.12 && CONSTITUENCY_IDS.length > 1) {
      const others = CONSTITUENCY_IDS.filter((id) => id !== account.primaryConstituencyId);
      return others[Math.floor(random() * others.length)];
    }
    return account.primaryConstituencyId;
  }
  if (random() < 0.35) {
    return CONSTITUENCY_IDS[Math.floor(random() * CONSTITUENCY_IDS.length)];
  }
  return undefined;
}

function generatePostsForAccount(account: Account): Post[] {
  const random = mulberry32(hashStringToSeed(`${account.id}::posts`));
  const postCount = 3 + Math.floor(random() * 4); // 3-6 posts
  const area = areaLabelFromRegion(account.languageRegion);
  const weights = computeTopicWeights(account);

  const posts: Post[] = [];
  for (let i = 0; i < postCount; i++) {
    const topic = weightedPickTopic(weights, random);
    const templates = POST_TEMPLATES[topic];
    const template = templates[Math.floor(random() * templates.length)];

    const daysAgo = Math.floor(random() * 30);
    const publishedAt = isoDateDaysBefore(REFERENCE_TODAY, daysAgo);

    let viewFactor = 0.015 + random() * 0.12;
    if (random() < 0.12) viewFactor *= 1.8 + random() * 1.4; // occasional viral-ish post
    const viewCount = Math.max(500, Math.round(account.baseFollowerCount * viewFactor));
    const likeCount = Math.max(20, Math.round(viewCount * (0.03 + random() * 0.05)));
    const commentCount = Math.max(5, Math.round(viewCount * (0.002 + random() * 0.006)));

    posts.push({
      id: `${account.id}-post-${i + 1}`,
      accountId: account.id,
      title: template.title(area),
      snippet: template.snippet(area),
      topCommentsText: template.comments(area),
      publishedAt,
      viewCount,
      likeCount,
      commentCount,
      guessedConstituencyId: pickGuessedConstituencyId(account, random),
    });
  }

  return posts;
}

const ALL_POSTS: Post[] = ACCOUNTS.flatMap(generatePostsForAccount);

const POSTS_BY_ACCOUNT_ID = new Map<string, Post[]>();
for (const post of ALL_POSTS) {
  const existing = POSTS_BY_ACCOUNT_ID.get(post.accountId);
  if (existing) existing.push(post);
  else POSTS_BY_ACCOUNT_ID.set(post.accountId, [post]);
}

export function getPostsForAccount(accountId: string): Post[] {
  return POSTS_BY_ACCOUNT_ID.get(accountId) ?? [];
}

export function getAllPosts(): Post[] {
  return ALL_POSTS;
}

export function getRecentPosts(limit: number): Post[] {
  return [...ALL_POSTS]
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0))
    .slice(0, limit);
}
