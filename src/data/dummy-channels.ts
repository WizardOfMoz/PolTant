/**
 * Fictional Indian-context creator/channel personas, replacing the earlier
 * real-YouTube-channel design (see PROJECT_BRIEF.md and git history) after
 * a deliberate product decision: attaching computed sentiment/narrative
 * scores to real named creators — even genuinely computed, not fabricated
 * — was judged too close to the defamation/reputational risk the source
 * PRD itself warns against (Section 7) for a link that gets shared widely.
 *
 * Everything below is invented: names, handles, stats, video titles, and
 * comment text. None of it refers to or is modeled on any real person or
 * channel — deliberately generic/archetypal names were chosen for that
 * reason. What's still REAL: the sentiment/topic/narrative analysis run
 * over this fabricated content (via src/lib/analysis, using the actual
 * Anthropic API), and the constituency/election data and RSS news feeds
 * this content is matched against — see /methodology.
 *
 * Diversity principle carried over from the real-channel design: an
 * even-handed spread of political leanings, languages, and regions, so no
 * single viewpoint or geography dominates the illustrative dataset.
 *
 * Spans all four platforms named in the source PRD (YouTube, X, Instagram,
 * Facebook) with illustrative content for each — none of it is fetched
 * from a real platform API (see /methodology on why), but the point of a
 * demo is to actually show what multi-platform tracking + analysis looks
 * like, not just describe it, so every platform gets real fictional
 * content rather than a blank "not connected" placeholder.
 */

export type ChannelCategory = "established-influencer" | "rising-new-media";
export type Platform = "youtube" | "x" | "instagram" | "facebook";

export interface DummyPost {
  title: string;
  snippet: string;
  /** Fabricated but plausible aggregate comment text, aggregate-only per
   *  the platform's own no-individual-commenter-identity rule. */
  topCommentsText: string[];
  baseViewCount: number;
  baseLikeCount: number;
  baseCommentCount: number;
  daysAgo: number;
}

export interface DummyChannel {
  handle: string;
  displayName: string;
  platform: Platform;
  category: ChannelCategory;
  languageRegion: string;
  expectedPrimaryState?: string;
  /** Illustrative persona description — invented, not a real bio. */
  justification: string;
  baseSubscriberCount: number;
  posts: DummyPost[];
}

export const DUMMY_CHANNELS: DummyChannel[] = [
  {
    handle: "@bharatbytes",
    displayName: "Bharat Bytes",
    platform: "youtube",
    category: "established-influencer",
    languageRegion: "Hindi/English - National",
    justification:
      "Illustrative persona: a large national explainer-format channel with a government-critical/analytical bent, standing in for the biggest reach tier of Hindi/English political commentary.",
    baseSubscriberCount: 8_400_000,
    posts: [
      {
        title: "Why is the unemployment scheme rollout stuck in these 5 states?",
        snippet:
          "A breakdown of disbursement delays in a flagship employment scheme, with state-by-state comparison of pending applications.",
        topCommentsText: [
          "Applied 4 months ago, still waiting on my district office.",
          "At least someone is tracking this properly with numbers.",
          "My cousin got his within 6 weeks, depends heavily on the state.",
        ],
        baseViewCount: 2_100_000,
        baseLikeCount: 140_000,
        baseCommentCount: 9_800,
        daysAgo: 2,
      },
      {
        title: "The new highway project: what's actually built vs. what was promised",
        snippet:
          "Comparing the announced timeline for a national highway corridor against on-ground construction progress.",
        topCommentsText: [
          "Drove past this stretch last week, definitely ahead of the last video's estimate.",
          "Land acquisition disputes are the real bottleneck, not construction speed.",
        ],
        baseViewCount: 1_650_000,
        baseLikeCount: 98_000,
        baseCommentCount: 6_200,
        daysAgo: 9,
      },
      {
        title: "Explained: the new digital governance portal, one month in",
        snippet: "A first look at adoption numbers and common complaints about the new citizen-services portal.",
        topCommentsText: [
          "Portal crashed twice when I tried to file my application.",
          "Better than standing in line at the old office, still buggy though.",
        ],
        baseViewCount: 980_000,
        baseLikeCount: 61_000,
        baseCommentCount: 4_100,
        daysAgo: 16,
      },
    ],
  },
  {
    handle: "@netaupdate",
    displayName: "Neta Update",
    platform: "youtube",
    category: "established-influencer",
    languageRegion: "Hindi - National",
    justification:
      "Illustrative persona: a fact-check/explainer channel positioned as deliberately centrist, standing in for the 'strip out the outrage' style of political coverage.",
    baseSubscriberCount: 3_200_000,
    posts: [
      {
        title: "Fact-check: claims about the new farm procurement prices",
        snippet:
          "Verifying competing claims from government and opposition sources about this season's minimum support price hike.",
        topCommentsText: [
          "Finally a video that shows both sides' numbers side by side.",
          "The MSP increase doesn't cover input cost inflation though.",
        ],
        baseViewCount: 720_000,
        baseLikeCount: 45_000,
        baseCommentCount: 3_300,
        daysAgo: 4,
      },
      {
        title: "What the new education policy changes actually mean for state boards",
        snippet: "A neutral walkthrough of curriculum changes and how they roll out differently across state education boards.",
        topCommentsText: [
          "Wish this had come out before admission season started.",
          "Our state board hasn't announced implementation dates yet.",
        ],
        baseViewCount: 540_000,
        baseLikeCount: 31_000,
        baseCommentCount: 2_050,
        daysAgo: 11,
      },
    ],
  },
  {
    handle: "@saffronscoop",
    displayName: "Saffron Scoop",
    platform: "x",
    category: "established-influencer",
    languageRegion: "Hindi/English - National",
    justification:
      "Illustrative persona: a right-of-centre commentary channel, balancing the more government-critical personas on this list with a favorable-to-government perspective.",
    baseSubscriberCount: 2_600_000,
    posts: [
      {
        title: "5 infrastructure milestones the opposition won't talk about",
        snippet: "A roundup of recently completed infrastructure projects and their announced economic impact estimates.",
        topCommentsText: [
          "Good to see the actual completion data laid out clearly.",
          "Would like to see cost overruns mentioned too, not just completion.",
        ],
        baseViewCount: 890_000,
        baseLikeCount: 72_000,
        baseCommentCount: 5_400,
        daysAgo: 3,
      },
      {
        title: "Breaking down the new law and order statistics by state",
        snippet: "Year-over-year crime statistics comparison across major states, sourced from official state police reports.",
        topCommentsText: [
          "Numbers look better on paper but reporting rates vary a lot by state.",
          "Appreciate the state-by-state breakdown instead of just a national average.",
        ],
        baseViewCount: 610_000,
        baseLikeCount: 48_000,
        baseCommentCount: 3_900,
        daysAgo: 8,
      },
    ],
  },
  {
    handle: "@groundreportdesk",
    displayName: "Ground Report Desk",
    platform: "instagram",
    category: "rising-new-media",
    languageRegion: "English - National",
    justification:
      "Illustrative persona: a fast-growing digital-native investigative outlet, standing in for the 'rising new-media' category the PRD calls out separately from established influencers.",
    baseSubscriberCount: 640_000,
    posts: [
      {
        title: "We visited 12 government schools after the new funding announcement",
        snippet: "On-the-ground reporting on whether recently announced school infrastructure funding has reached individual schools yet.",
        topCommentsText: [
          "This kind of ground-level check is rare, more of this please.",
          "Our school still doesn't have the promised computer lab from last year's budget.",
        ],
        baseViewCount: 310_000,
        baseLikeCount: 28_000,
        baseCommentCount: 2_600,
        daysAgo: 1,
      },
      {
        title: "The women's safety helpline: response times, tested",
        snippet: "An on-the-ground test of stated response times for a state women's safety helpline across urban and rural areas.",
        topCommentsText: [
          "Rural response time gap is the real story here.",
          "Glad someone actually tested this instead of just quoting the press release.",
        ],
        baseViewCount: 265_000,
        baseLikeCount: 24_000,
        baseCommentCount: 2_100,
        daysAgo: 7,
      },
    ],
  },
  {
    handle: "@kisankibaat",
    displayName: "Kisan Ki Baat",
    platform: "facebook",
    category: "established-influencer",
    languageRegion: "Hindi - Rural/Agricultural",
    justification:
      "Illustrative persona: an agriculture/rural-issues-focused channel, representing farmer-constituency coverage often under-served by general political commentary.",
    baseSubscriberCount: 1_450_000,
    posts: [
      {
        title: "Fertilizer subsidy delays: farmers in 3 districts speak up",
        snippet: "Coverage of subsidy disbursement delays affecting the current sowing season in three agricultural districts.",
        topCommentsText: [
          "Same issue in our district, subsidy portal shows 'processing' for weeks.",
          "Local cooperative said the funds are stuck at the state level.",
        ],
        baseViewCount: 410_000,
        baseLikeCount: 35_000,
        baseCommentCount: 3_100,
        daysAgo: 5,
      },
    ],
  },
  {
    handle: "@youthquakeindia",
    displayName: "Youthquake India",
    platform: "instagram",
    category: "rising-new-media",
    languageRegion: "Hindi/English - National, youth-skewing",
    justification:
      "Illustrative persona: a fast-growing youth/employment-focused channel, standing in for platform-native channels built around a single demographic rather than general news.",
    baseSubscriberCount: 720_000,
    posts: [
      {
        title: "Government exam recruitment delays: a timeline",
        snippet: "Tracking the gap between announced government job recruitment drives and actual exam/result dates over the past year.",
        topCommentsText: [
          "Been waiting for this exam's results for 8 months now.",
          "At least the timeline makes the pattern of delays clear.",
        ],
        baseViewCount: 780_000,
        baseLikeCount: 88_000,
        baseCommentCount: 7_200,
        daysAgo: 2,
      },
    ],
  },
  {
    handle: "@dakshinawaaz",
    displayName: "Dakshin Awaaz",
    platform: "x",
    category: "rising-new-media",
    languageRegion: "Tamil/Kannada - South India",
    expectedPrimaryState: "Karnataka",
    justification:
      "Illustrative persona: a South Indian regional digital-native outlet, adding non-Hindi-belt regional coverage to the illustrative dataset.",
    baseSubscriberCount: 380_000,
    posts: [
      {
        title: "Bengaluru's tech-corridor traffic infrastructure: 1 year update",
        snippet: "Revisiting a major road-widening project near the city's tech corridor one year after its announced deadline.",
        topCommentsText: [
          "Commute time actually improved on my route, surprisingly.",
          "Still bottlenecked near the flyover junction every evening.",
        ],
        baseViewCount: 195_000,
        baseLikeCount: 15_000,
        baseCommentCount: 1_400,
        daysAgo: 6,
      },
    ],
  },
  {
    handle: "@purvottarpulse",
    displayName: "Purvottar Pulse",
    platform: "facebook",
    category: "rising-new-media",
    languageRegion: "English - Northeast India",
    expectedPrimaryState: "Assam",
    justification:
      "Illustrative persona: a Northeast India-focused outlet, representing a region often under-covered in national political commentary.",
    baseSubscriberCount: 210_000,
    posts: [
      {
        title: "Flood relief fund disbursement: district-by-district status",
        snippet: "Tracking disbursement of an announced flood relief package across affected districts this monsoon season.",
        topCommentsText: [
          "Our village hasn't received anything yet despite being on the list.",
          "Neighboring district got theirs within 3 weeks, uneven rollout.",
        ],
        baseViewCount: 88_000,
        baseLikeCount: 9_200,
        baseCommentCount: 980,
        daysAgo: 4,
      },
    ],
  },
  {
    handle: "@bengalbulletin",
    displayName: "Bengal Bulletin",
    platform: "x",
    category: "rising-new-media",
    languageRegion: "Bengali - West Bengal",
    expectedPrimaryState: "West Bengal",
    justification:
      "Illustrative persona: a Bengali-language regional outlet, adding West Bengal-specific coverage and language diversity to the illustrative dataset.",
    baseSubscriberCount: 340_000,
    posts: [
      {
        title: "Industrial jobs scheme: how many positions actually filled?",
        snippet: "A local investigation into a state industrial-jobs scheme's announced target versus filled-positions data.",
        topCommentsText: [
          "Filled numbers seem inflated compared to what I've seen at the plant.",
          "Good that someone is asking for the actual filled-positions data.",
        ],
        baseViewCount: 145_000,
        baseLikeCount: 11_500,
        baseCommentCount: 1_250,
        daysAgo: 10,
      },
    ],
  },
  {
    handle: "@malwamanch",
    displayName: "Malwa Manch",
    platform: "youtube",
    category: "established-influencer",
    languageRegion: "Hindi - Madhya Pradesh/Rajasthan",
    expectedPrimaryState: "Madhya Pradesh",
    justification:
      "Illustrative persona: a Hindi-belt regional commentary channel covering Madhya Pradesh/Rajasthan state politics, balancing the national-only channels on this list.",
    baseSubscriberCount: 590_000,
    posts: [
      {
        title: "Water supply project delays across 4 districts",
        snippet: "Comparing announced completion dates for a regional piped-water-supply project against current construction status.",
        topCommentsText: [
          "Our tap connection was promised for last year, still nothing.",
          "Two districts over already have running water from this project.",
        ],
        baseViewCount: 210_000,
        baseLikeCount: 17_000,
        baseCommentCount: 1_600,
        daysAgo: 3,
      },
    ],
  },
];
