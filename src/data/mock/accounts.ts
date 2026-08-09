/**
 * Fictional Indian-context creator/publisher account roster — the successor
 * to the earlier `src/data/dummy-channels.ts` module (see git history and
 * PROJECT_BRIEF.md Section 7), reshaped into a stable `Account` contract
 * that every later mock module (posts, sentiment, influence graph, growth
 * alerts, leaderboards) joins against via `Account.id`.
 *
 * Everything below is invented: names, handles, bios, and follower counts.
 * None of it refers to or is modeled on any real person, channel, or outlet
 * — deliberately generic/archetypal names were chosen for that reason, and
 * bios are kept neutral/plausible rather than caricatures of any real,
 * identifiable person or outlet. What's still REAL: the constituency records
 * (`src/data/constituencies.ts`) these accounts are optionally linked to via
 * `primaryConstituencyId`, and any analysis later run over this fabricated
 * content — see /methodology.
 *
 * Diversity principle carried over unchanged from the original module: an
 * even-handed spread of political leanings, languages, and regions, so no
 * single viewpoint or geography dominates the illustrative dataset. Spans
 * all four platforms named in the source PRD (YouTube, X, Instagram,
 * Facebook). Per the original file's aggregate-only rule, nothing in this
 * module or anything built on top of it should carry individual-commenter
 * identity data — only aggregate counts.
 *
 * `id` is a stable slug and is the join key every other mock module uses;
 * once other modules are built on top of this, treat existing ids as a
 * frozen contract — add new accounts rather than renaming/removing old ones.
 */

import type { Platform } from "@/lib/types";

export type AccountCategory = "established-influencer" | "rising-new-media";

export interface Account {
  /** Stable slug, e.g. "bharatbytes" — the join key used by every other mock module. */
  id: string;
  handle: string;
  displayName: string;
  platform: Platform;
  category: AccountCategory;
  languageRegion: string;
  /** Must match a real id from src/data/constituencies.ts when set. */
  primaryConstituencyId?: string;
  /** Fictional persona description — invented, not a real bio. */
  bio: string;
  /** Deterministic seed used to derive a generated avatar. No real photos, no external image URLs. */
  avatarSeed: string;
  baseFollowerCount: number;
  /** Ids of this same fictional persona/brand's OTHER accounts on other platforms. Kept symmetric. */
  linkedAccountIds?: string[];
}

// ---------------------------------------------------------------------------
// National / pan-India accounts (not tied to a single constituency)
// ---------------------------------------------------------------------------

const NATIONAL_ACCOUNTS: Account[] = [
  {
    id: "bharatbytes",
    handle: "@bharatbytes",
    displayName: "Bharat Bytes",
    platform: "youtube",
    category: "established-influencer",
    languageRegion: "Hindi/English - National",
    bio: "A large national explainer-format channel with a government-critical, data-driven approach to policy-rollout stories.",
    avatarSeed: "bharatbytes",
    baseFollowerCount: 8_400_000,
  },
  {
    id: "netaupdate",
    handle: "@netaupdate",
    displayName: "Neta Update",
    platform: "youtube",
    category: "established-influencer",
    languageRegion: "Hindi - National",
    bio: "A fact-check and explainer channel positioned as deliberately centrist, cross-checking claims from government and opposition sources alike.",
    avatarSeed: "netaupdate",
    baseFollowerCount: 3_200_000,
  },
  {
    id: "saffronscoop",
    handle: "@saffronscoop",
    displayName: "Saffron Scoop",
    platform: "x",
    category: "established-influencer",
    languageRegion: "Hindi/English - National",
    bio: "A right-of-centre commentary account highlighting infrastructure and governance milestones alongside official statistics.",
    avatarSeed: "saffronscoop",
    baseFollowerCount: 2_600_000,
  },
  {
    id: "kisankibaat",
    handle: "@kisankibaat",
    displayName: "Kisan Ki Baat",
    platform: "facebook",
    category: "established-influencer",
    languageRegion: "Hindi - Rural/Agricultural, National",
    bio: "An agriculture and rural-issues channel covering subsidy disbursement, procurement prices, and farmer-welfare schemes across multiple states.",
    avatarSeed: "kisankibaat",
    baseFollowerCount: 1_450_000,
  },
  {
    id: "groundreportdesk",
    handle: "@groundreportdesk",
    displayName: "Ground Report Desk",
    platform: "instagram",
    category: "rising-new-media",
    languageRegion: "English - National",
    bio: "A fast-growing digital-native investigative outlet that checks whether announced government schemes have actually reached people on the ground.",
    avatarSeed: "groundreportdesk",
    baseFollowerCount: 640_000,
    linkedAccountIds: ["groundreportdesk_x"],
  },
  {
    id: "groundreportdesk_x",
    handle: "@groundreportdesk_x",
    displayName: "Ground Report Desk",
    platform: "x",
    category: "rising-new-media",
    languageRegion: "English - National",
    bio: "Ground Report Desk's companion X account for rapid-fire threads and follow-ups to its longer on-ground video investigations.",
    avatarSeed: "groundreportdesk_x",
    baseFollowerCount: 310_000,
    linkedAccountIds: ["groundreportdesk"],
  },
  {
    id: "youthquakeindia",
    handle: "@youthquakeindia",
    displayName: "Youthquake India",
    platform: "instagram",
    category: "rising-new-media",
    languageRegion: "Hindi/English - National, youth-skewing",
    bio: "A youth- and employment-focused channel tracking government exam and recruitment timelines against actual result dates.",
    avatarSeed: "youthquakeindia",
    baseFollowerCount: 720_000,
  },
  {
    id: "loksabhalive",
    handle: "@loksabhalive",
    displayName: "Loksabha Live",
    platform: "x",
    category: "rising-new-media",
    languageRegion: "Hindi/English - National",
    bio: "A low-commentary account that live-tracks parliamentary proceedings, bill statuses, and voting records as they happen.",
    avatarSeed: "loksabhalive",
    baseFollowerCount: 460_000,
  },
];

// ---------------------------------------------------------------------------
// Uttar Pradesh (Hindi)
// ---------------------------------------------------------------------------

const UP_ACCOUNTS: Account[] = [
  {
    id: "awadhawaaz",
    handle: "@awadhawaaz",
    displayName: "Awadh Awaaz",
    platform: "youtube",
    category: "established-influencer",
    languageRegion: "Hindi - Uttar Pradesh (Awadh region)",
    primaryConstituencyId: "up-amethi",
    bio: "A long-running channel covering Awadh-region development projects and constituency-level political contests.",
    avatarSeed: "awadhawaaz",
    baseFollowerCount: 1_900_000,
  },
  {
    id: "purvanchalpulse",
    handle: "@purvanchalpulse",
    displayName: "Purvanchal Pulse",
    platform: "x",
    category: "rising-new-media",
    languageRegion: "Hindi - Uttar Pradesh (Purvanchal region)",
    primaryConstituencyId: "up-kannauj",
    bio: "A rising account tracking migration and unemployment trends across eastern Uttar Pradesh's districts.",
    avatarSeed: "purvanchalpulse",
    baseFollowerCount: 260_000,
  },
  {
    id: "gangakinare",
    handle: "@gangakinare",
    displayName: "Ganga Kinare",
    platform: "instagram",
    category: "established-influencer",
    languageRegion: "Hindi - Uttar Pradesh (western UP)",
    primaryConstituencyId: "up-muzaffarnagar",
    bio: "A photo- and reel-led account covering agrarian issues and sugarcane-belt politics along western UP's Ganga-Yamuna doab.",
    avatarSeed: "gangakinare",
    baseFollowerCount: 1_100_000,
  },
  {
    id: "upupdatedesk",
    handle: "@upupdatedesk",
    displayName: "UP Update Desk",
    platform: "facebook",
    category: "rising-new-media",
    languageRegion: "Hindi - Uttar Pradesh",
    primaryConstituencyId: "up-amethi",
    bio: "A verification-focused page that checks state government scheme announcements against on-record disbursement data.",
    avatarSeed: "upupdatedesk",
    baseFollowerCount: 145_000,
  },
];

// ---------------------------------------------------------------------------
// Delhi (Hindi/English)
// ---------------------------------------------------------------------------

const DELHI_ACCOUNTS: Account[] = [
  {
    id: "capitalcircuit",
    handle: "@capitalcircuit",
    displayName: "Capital Circuit",
    platform: "youtube",
    category: "established-influencer",
    languageRegion: "Hindi/English - Delhi",
    primaryConstituencyId: "dl-chandnichowk",
    bio: "An established channel covering Delhi municipal governance, from civic services to inter-agency jurisdiction disputes.",
    avatarSeed: "capitalcircuit",
    baseFollowerCount: 2_050_000,
  },
  {
    id: "rajpathreport",
    handle: "@rajpathreport",
    displayName: "Rajpath Report",
    platform: "x",
    category: "rising-new-media",
    languageRegion: "English - Delhi",
    primaryConstituencyId: "dl-chandnichowk",
    bio: "A rising account tracking Delhi's air quality, water supply, and public-transport metrics against official targets.",
    avatarSeed: "rajpathreport",
    baseFollowerCount: 210_000,
  },
  {
    id: "dillidastak",
    handle: "@dillidastak",
    displayName: "Dilli Dastak",
    platform: "instagram",
    category: "rising-new-media",
    languageRegion: "Hindi - Delhi, youth-skewing",
    primaryConstituencyId: "dl-chandnichowk",
    bio: "A youth-oriented account covering civic-engagement drives and ward-level issues across the capital.",
    avatarSeed: "dillidastak",
    baseFollowerCount: 330_000,
  },
  {
    id: "yamunabeat",
    handle: "@yamunabeat",
    displayName: "Yamuna Beat",
    platform: "facebook",
    category: "established-influencer",
    languageRegion: "Hindi/English - Delhi",
    primaryConstituencyId: "dl-chandnichowk",
    bio: "A long-standing page covering Delhi's infrastructure and river-pollution-control projects with a documentary-style format.",
    avatarSeed: "yamunabeat",
    baseFollowerCount: 980_000,
  },
];

// ---------------------------------------------------------------------------
// Chandigarh (Punjabi/Hindi/English, UT)
// ---------------------------------------------------------------------------

const CHANDIGARH_ACCOUNTS: Account[] = [
  {
    id: "tricitytribune",
    handle: "@tricitytribune",
    displayName: "Tricity Tribune",
    platform: "youtube",
    category: "established-influencer",
    languageRegion: "Hindi/Punjabi - Chandigarh tri-city area",
    primaryConstituencyId: "ch-chandigarh",
    bio: "An established channel covering urban governance across the Chandigarh-Mohali-Panchkula tri-city region.",
    avatarSeed: "tricitytribune",
    baseFollowerCount: 640_000,
  },
  {
    id: "sukhnasignal",
    handle: "@sukhnasignal",
    displayName: "Sukhna Signal",
    platform: "x",
    category: "rising-new-media",
    languageRegion: "English - Chandigarh",
    primaryConstituencyId: "ch-chandigarh",
    bio: "A rising civic-affairs account covering Chandigarh's municipal planning and youth-employment initiatives.",
    avatarSeed: "sukhnasignal",
    baseFollowerCount: 175_000,
  },
  {
    id: "utupdate",
    handle: "@utupdate",
    displayName: "UT Update",
    platform: "instagram",
    category: "rising-new-media",
    languageRegion: "Hindi/English - Chandigarh",
    primaryConstituencyId: "ch-chandigarh",
    bio: "A lifestyle-meets-civics account for UT residents, mixing local-issue explainers with community event coverage.",
    avatarSeed: "utupdate",
    baseFollowerCount: 120_000,
  },
  {
    id: "chandigarhcircuit",
    handle: "@chandigarhcircuit",
    displayName: "Chandigarh Circuit",
    platform: "facebook",
    category: "established-influencer",
    languageRegion: "Hindi/Punjabi - Chandigarh",
    primaryConstituencyId: "ch-chandigarh",
    bio: "An established regional-news digest page summarizing the week's civic and administrative developments in the UT.",
    avatarSeed: "chandigarhcircuit",
    baseFollowerCount: 560_000,
  },
];

// ---------------------------------------------------------------------------
// Gujarat (Gujarati)
// ---------------------------------------------------------------------------

const GUJARAT_ACCOUNTS: Account[] = [
  {
    id: "gujaratgati",
    handle: "@gujaratgati",
    displayName: "Gujarat Gati",
    platform: "youtube",
    category: "established-influencer",
    languageRegion: "Gujarati - Gujarat",
    primaryConstituencyId: "gj-gandhinagar",
    bio: "An established channel tracking Gujarat's industrial-policy announcements against on-ground project timelines.",
    avatarSeed: "gujaratgati",
    baseFollowerCount: 1_650_000,
  },
  {
    id: "saurashtrasur",
    handle: "@saurashtrasur",
    displayName: "Saurashtra Sur",
    platform: "x",
    category: "rising-new-media",
    languageRegion: "Gujarati - Saurashtra region",
    primaryConstituencyId: "gj-gandhinagar",
    bio: "A rising account covering agriculture and coastal-fishing-community issues across the Saurashtra region.",
    avatarSeed: "saurashtrasur",
    baseFollowerCount: 230_000,
  },
  {
    id: "amdavadawaaz",
    handle: "@amdavadawaaz",
    displayName: "Amdavad Awaaz",
    platform: "instagram",
    category: "rising-new-media",
    languageRegion: "Gujarati - Ahmedabad",
    primaryConstituencyId: "gj-gandhinagar",
    bio: "A rising Ahmedabad-focused account covering urban youth issues, local elections, and civic infrastructure.",
    avatarSeed: "amdavadawaaz",
    baseFollowerCount: 290_000,
  },
  {
    id: "kutchkranti",
    handle: "@kutchkranti",
    displayName: "Kutch Kranti",
    platform: "facebook",
    category: "established-influencer",
    languageRegion: "Gujarati - Kutch region",
    primaryConstituencyId: "gj-gandhinagar",
    bio: "An established page covering Kutch-region development, port-led industrial growth, and border-district issues.",
    avatarSeed: "kutchkranti",
    baseFollowerCount: 480_000,
  },
];

// ---------------------------------------------------------------------------
// Rajasthan (Hindi/Rajasthani)
// ---------------------------------------------------------------------------

const RAJASTHAN_ACCOUNTS: Account[] = [
  {
    id: "registanreport",
    handle: "@registanreport",
    displayName: "Registan Report",
    platform: "youtube",
    category: "established-influencer",
    languageRegion: "Hindi/Rajasthani - Rajasthan (border districts)",
    primaryConstituencyId: "rj-barmer",
    bio: "An established channel covering desert-district development and border-infrastructure projects in western Rajasthan.",
    avatarSeed: "registanreport",
    baseFollowerCount: 720_000,
  },
  {
    id: "marwarmanch",
    handle: "@marwarmanch",
    displayName: "Marwar Manch",
    platform: "x",
    category: "rising-new-media",
    languageRegion: "Rajasthani - Marwar region",
    primaryConstituencyId: "rj-barmer",
    bio: "A rising account covering water-scarcity and agricultural issues across the Marwar region of western Rajasthan.",
    avatarSeed: "marwarmanch",
    baseFollowerCount: 195_000,
  },
  {
    id: "rajasthanreport_ig",
    handle: "@rajasthanreport",
    displayName: "Rajasthan Report",
    platform: "instagram",
    category: "rising-new-media",
    languageRegion: "Hindi - Rajasthan",
    primaryConstituencyId: "rj-barmer",
    bio: "A digital-native outlet covering water security and desert-agriculture issues in western Rajasthan, with photo-led coverage on Instagram.",
    avatarSeed: "rajasthanreport_ig",
    baseFollowerCount: 260_000,
    linkedAccountIds: ["rajasthanreport_fb"],
  },
  {
    id: "rajasthanreport_fb",
    handle: "@rajasthanreport",
    displayName: "Rajasthan Report",
    platform: "facebook",
    category: "rising-new-media",
    languageRegion: "Hindi - Rajasthan",
    primaryConstituencyId: "rj-barmer",
    bio: "Rajasthan Report's Facebook page, carrying longer-form versions of the same water-security and desert-agriculture coverage as its Instagram account.",
    avatarSeed: "rajasthanreport_fb",
    baseFollowerCount: 210_000,
    linkedAccountIds: ["rajasthanreport_ig"],
  },
];

// ---------------------------------------------------------------------------
// Madhya Pradesh (Hindi)
// ---------------------------------------------------------------------------

const MP_ACCOUNTS: Account[] = [
  {
    id: "malwamanch",
    handle: "@malwamanch",
    displayName: "Malwa Manch",
    platform: "youtube",
    category: "established-influencer",
    languageRegion: "Hindi - Madhya Pradesh/Rajasthan",
    primaryConstituencyId: "mp-bhopal",
    bio: "An established Hindi-belt commentary channel covering Madhya Pradesh and Rajasthan state politics and water-supply projects.",
    avatarSeed: "malwamanch",
    baseFollowerCount: 590_000,
  },
  {
    id: "bhopalbulletin",
    handle: "@bhopalbulletin",
    displayName: "Bhopal Bulletin",
    platform: "x",
    category: "rising-new-media",
    languageRegion: "Hindi - Madhya Pradesh (Bhopal)",
    primaryConstituencyId: "mp-bhopal",
    bio: "A rising account covering civic and urban-planning issues in and around the state capital.",
    avatarSeed: "bhopalbulletin",
    baseFollowerCount: 205_000,
  },
  {
    id: "nimarnazariya",
    handle: "@nimarnazariya",
    displayName: "Nimar Nazariya",
    platform: "instagram",
    category: "established-influencer",
    languageRegion: "Hindi - Madhya Pradesh (Malwa-Nimar belt)",
    primaryConstituencyId: "mp-bhopal",
    bio: "An established account covering agriculture and irrigation issues across the Malwa-Nimar agricultural belt.",
    avatarSeed: "nimarnazariya",
    baseFollowerCount: 780_000,
  },
  {
    id: "mpmudda",
    handle: "@mpmudda",
    displayName: "MP Mudda",
    platform: "facebook",
    category: "rising-new-media",
    languageRegion: "Hindi - Madhya Pradesh",
    primaryConstituencyId: "mp-bhopal",
    bio: "A rising page tracking state government welfare-scheme rollouts against their announced targets.",
    avatarSeed: "mpmudda",
    baseFollowerCount: 160_000,
  },
];

// ---------------------------------------------------------------------------
// Punjab (Punjabi)
// ---------------------------------------------------------------------------

const PUNJAB_ACCOUNTS: Account[] = [
  {
    id: "doabadiary",
    handle: "@doabadiary",
    displayName: "Doaba Diary",
    platform: "youtube",
    category: "rising-new-media",
    languageRegion: "Punjabi - Doaba region",
    primaryConstituencyId: "pb-gurdaspur",
    bio: "A rising channel covering migration patterns and the NRI-linked local economy across Punjab's Doaba region.",
    avatarSeed: "doabadiary",
    baseFollowerCount: 240_000,
  },
  {
    id: "punjabpulse_x",
    handle: "@punjabpulse",
    displayName: "Punjab Pulse",
    platform: "x",
    category: "established-influencer",
    languageRegion: "Punjabi/Hindi - Punjab (border districts)",
    primaryConstituencyId: "pb-gurdaspur",
    bio: "An established account covering agriculture and border-district security issues, posting quick-hit updates on X.",
    avatarSeed: "punjabpulse_x",
    baseFollowerCount: 890_000,
    linkedAccountIds: ["punjabpulse_fb"],
  },
  {
    id: "majhamanch",
    handle: "@majhamanch",
    displayName: "Majha Manch",
    platform: "instagram",
    category: "rising-new-media",
    languageRegion: "Punjabi - Majha region",
    primaryConstituencyId: "pb-gurdaspur",
    bio: "A rising account covering local governance and farmer-welfare issues across Punjab's Majha region.",
    avatarSeed: "majhamanch",
    baseFollowerCount: 175_000,
  },
  {
    id: "punjabpulse_fb",
    handle: "@punjabpulse",
    displayName: "Punjab Pulse",
    platform: "facebook",
    category: "established-influencer",
    languageRegion: "Punjabi/Hindi - Punjab (border districts)",
    primaryConstituencyId: "pb-gurdaspur",
    bio: "Punjab Pulse's Facebook page, carrying longer-form versions of the same agriculture and border-security coverage as its X account.",
    avatarSeed: "punjabpulse_fb",
    baseFollowerCount: 610_000,
    linkedAccountIds: ["punjabpulse_x"],
  },
];

// ---------------------------------------------------------------------------
// Maharashtra (Marathi)
// ---------------------------------------------------------------------------

const MAHARASHTRA_ACCOUNTS: Account[] = [
  {
    id: "vidarbhavoice",
    handle: "@vidarbhavoice",
    displayName: "Vidarbha Voice",
    platform: "youtube",
    category: "established-influencer",
    languageRegion: "Marathi - Vidarbha region",
    primaryConstituencyId: "mh-nagpur",
    bio: "An established channel covering agrarian distress and industrial-policy issues across Maharashtra's Vidarbha region.",
    avatarSeed: "vidarbhavoice",
    baseFollowerCount: 1_250_000,
  },
  {
    id: "punepulse",
    handle: "@punepulse",
    displayName: "Pune Pulse",
    platform: "x",
    category: "rising-new-media",
    languageRegion: "Marathi/English - Pune region",
    primaryConstituencyId: "mh-baramati",
    bio: "A rising account covering urban-rural transition issues in and around Pune and Baramati.",
    avatarSeed: "punepulse",
    baseFollowerCount: 340_000,
  },
  {
    id: "konkankatha",
    handle: "@konkankatha",
    displayName: "Konkan Katha",
    platform: "instagram",
    category: "rising-new-media",
    languageRegion: "Marathi - Konkan coast",
    primaryConstituencyId: "mh-baramati",
    bio: "A rising account covering coastal livelihoods, fisheries, and tourism-economy issues along the Konkan coast.",
    avatarSeed: "konkankatha",
    baseFollowerCount: 190_000,
  },
  {
    id: "maharashtramanch",
    handle: "@maharashtramanch",
    displayName: "Maharashtra Manch",
    platform: "facebook",
    category: "established-influencer",
    languageRegion: "Marathi - Maharashtra",
    primaryConstituencyId: "mh-nagpur",
    bio: "An established statewide page publishing weekly policy digests on Maharashtra's welfare-scheme rollouts.",
    avatarSeed: "maharashtramanch",
    baseFollowerCount: 2_400_000,
  },
];

// ---------------------------------------------------------------------------
// Karnataka (Kannada)
// ---------------------------------------------------------------------------

const KARNATAKA_ACCOUNTS: Account[] = [
  {
    id: "dakshinbulletin_yt",
    handle: "@dakshinbulletin",
    displayName: "Dakshin Bulletin",
    platform: "youtube",
    category: "established-influencer",
    languageRegion: "Kannada - South Karnataka",
    primaryConstituencyId: "ka-hassan",
    bio: "An established channel covering irrigation-project and agriculture policy in South Karnataka, video-led on YouTube.",
    avatarSeed: "dakshinbulletin_yt",
    baseFollowerCount: 1_050_000,
    linkedAccountIds: ["dakshinbulletin_ig"],
  },
  {
    id: "dakshinawaaz",
    handle: "@dakshinawaaz",
    displayName: "Dakshin Awaaz",
    platform: "x",
    category: "rising-new-media",
    languageRegion: "Tamil/Kannada - South India",
    primaryConstituencyId: "ka-bangaloresouth",
    bio: "A South Indian regional digital-native outlet covering Bengaluru infrastructure and Karnataka state politics.",
    avatarSeed: "dakshinawaaz",
    baseFollowerCount: 380_000,
  },
  {
    id: "dakshinbulletin_ig",
    handle: "@dakshinbulletin",
    displayName: "Dakshin Bulletin",
    platform: "instagram",
    category: "established-influencer",
    languageRegion: "Kannada - South Karnataka",
    primaryConstituencyId: "ka-hassan",
    bio: "Dakshin Bulletin's Instagram account, carrying photo-essay versions of the same South Karnataka coverage as its YouTube channel.",
    avatarSeed: "dakshinbulletin_ig",
    baseFollowerCount: 520_000,
    linkedAccountIds: ["dakshinbulletin_yt"],
  },
  {
    id: "nammabengalurubeat",
    handle: "@nammabengalurubeat",
    displayName: "Namma Bengaluru Beat",
    platform: "facebook",
    category: "rising-new-media",
    languageRegion: "Kannada/English - Bengaluru",
    primaryConstituencyId: "ka-bangaloresouth",
    bio: "A rising page covering Bengaluru civic infrastructure, traffic planning, and tech-corridor development.",
    avatarSeed: "nammabengalurubeat",
    baseFollowerCount: 410_000,
  },
];

// ---------------------------------------------------------------------------
// Kerala (Malayalam)
// ---------------------------------------------------------------------------

const KERALA_ACCOUNTS: Account[] = [
  {
    id: "kochicircuit",
    handle: "@kochicircuit",
    displayName: "Kochi Circuit",
    platform: "youtube",
    category: "established-influencer",
    languageRegion: "Malayalam - Kerala (Kochi/Thiruvananthapuram)",
    primaryConstituencyId: "kl-thiruvananthapuram",
    bio: "An established channel covering Kerala's urban and IT-corridor development alongside state welfare-scheme coverage.",
    avatarSeed: "kochicircuit",
    baseFollowerCount: 1_400_000,
  },
  {
    id: "ananthapuriupdate",
    handle: "@ananthapuriupdate",
    displayName: "Ananthapuri Update",
    platform: "x",
    category: "established-influencer",
    languageRegion: "Malayalam - Thiruvananthapuram",
    primaryConstituencyId: "kl-thiruvananthapuram",
    bio: "An established account covering capital-city governance and administrative issues in Thiruvananthapuram.",
    avatarSeed: "ananthapuriupdate",
    baseFollowerCount: 950_000,
  },
  {
    id: "malabarmanch_ig",
    handle: "@malabarmanch",
    displayName: "Malabar Manch",
    platform: "instagram",
    category: "rising-new-media",
    languageRegion: "Malayalam - Wayanad/Malabar region",
    primaryConstituencyId: "kl-wayanad",
    bio: "A rising account covering agriculture and wildlife-conflict issues in the Wayanad/Malabar region.",
    avatarSeed: "malabarmanch_ig",
    baseFollowerCount: 280_000,
    linkedAccountIds: ["malabarmanch_fb"],
  },
  {
    id: "malabarmanch_fb",
    handle: "@malabarmanch",
    displayName: "Malabar Manch",
    platform: "facebook",
    category: "rising-new-media",
    languageRegion: "Malayalam - Wayanad/Malabar region",
    primaryConstituencyId: "kl-wayanad",
    bio: "Malabar Manch's Facebook page, cross-posting longer-form coverage of the same Wayanad/Malabar agriculture and wildlife-conflict issues.",
    avatarSeed: "malabarmanch_fb",
    baseFollowerCount: 230_000,
    linkedAccountIds: ["malabarmanch_ig"],
  },
];

// ---------------------------------------------------------------------------
// Tamil Nadu (Tamil)
// ---------------------------------------------------------------------------

const TAMILNADU_ACCOUNTS: Account[] = [
  {
    id: "kongukural",
    handle: "@kongukural",
    displayName: "Kongu Kural",
    platform: "youtube",
    category: "established-influencer",
    languageRegion: "Tamil - Kongu region (Coimbatore)",
    primaryConstituencyId: "tn-coimbatore",
    bio: "An established channel covering the industrial belt around Coimbatore and its manufacturing-employment trends.",
    avatarSeed: "kongukural",
    baseFollowerCount: 1_800_000,
  },
  {
    id: "kumarikural",
    handle: "@kumarikural",
    displayName: "Kumari Kural",
    platform: "x",
    category: "rising-new-media",
    languageRegion: "Tamil - Kanniyakumari",
    primaryConstituencyId: "tn-kanniyakumari",
    bio: "A rising account covering coastal fishing-community livelihoods and cyclone-preparedness issues near Kanniyakumari.",
    avatarSeed: "kumarikural",
    baseFollowerCount: 165_000,
  },
  {
    id: "chennaisedi",
    handle: "@chennaisedi",
    displayName: "Chennai Sedi",
    platform: "instagram",
    category: "rising-new-media",
    languageRegion: "Tamil - Chennai, youth-skewing",
    primaryConstituencyId: "tn-coimbatore",
    bio: "A rising youth-oriented account covering Chennai's civic issues and local-body election coverage.",
    avatarSeed: "chennaisedi",
    baseFollowerCount: 610_000,
  },
  {
    id: "tamizhagatodar",
    handle: "@tamizhagatodar",
    displayName: "Tamizhaga Todar",
    platform: "facebook",
    category: "established-influencer",
    languageRegion: "Tamil - Tamil Nadu",
    primaryConstituencyId: "tn-kanniyakumari",
    bio: "An established statewide page tracking Tamil Nadu welfare-scheme enrolment against announced targets.",
    avatarSeed: "tamizhagatodar",
    baseFollowerCount: 2_900_000,
  },
];

// ---------------------------------------------------------------------------
// Bihar (Hindi/Bhojpuri/Maithili)
// ---------------------------------------------------------------------------

const BIHAR_ACCOUNTS: Account[] = [
  {
    id: "mithilamanch",
    handle: "@mithilamanch",
    displayName: "Mithila Manch",
    platform: "youtube",
    category: "established-influencer",
    languageRegion: "Maithili/Hindi - Bihar (Mithila region)",
    primaryConstituencyId: "br-begusarai",
    bio: "An established Maithili-language channel covering cultural and political developments across the Mithila region.",
    avatarSeed: "mithilamanch",
    baseFollowerCount: 870_000,
  },
  {
    id: "seemanchalswar",
    handle: "@seemanchalswar",
    displayName: "Seemanchal Swar",
    platform: "x",
    category: "established-influencer",
    languageRegion: "Hindi/Bengali - Bihar (Seemanchal region)",
    primaryConstituencyId: "br-purnia",
    bio: "An established account covering border-region development and flood-management issues in Bihar's Seemanchal belt.",
    avatarSeed: "seemanchalswar",
    baseFollowerCount: 1_050_000,
  },
  {
    id: "biharbytes_ig",
    handle: "@biharbytes",
    displayName: "Bihar Bytes",
    platform: "instagram",
    category: "rising-new-media",
    languageRegion: "Hindi/Bhojpuri - Bihar (Purnia region)",
    primaryConstituencyId: "br-purnia",
    bio: "A rising account covering seasonal flood impact and migration patterns in Bihar's Purnia region, reel-led on Instagram.",
    avatarSeed: "biharbytes_ig",
    baseFollowerCount: 340_000,
    linkedAccountIds: ["biharbytes_fb"],
  },
  {
    id: "biharbytes_fb",
    handle: "@biharbytes",
    displayName: "Bihar Bytes",
    platform: "facebook",
    category: "rising-new-media",
    languageRegion: "Hindi/Bhojpuri - Bihar (Purnia region)",
    primaryConstituencyId: "br-purnia",
    bio: "Bihar Bytes' Facebook page, carrying longer-form versions of the same flood-and-migration coverage as its Instagram account.",
    avatarSeed: "biharbytes_fb",
    baseFollowerCount: 290_000,
    linkedAccountIds: ["biharbytes_ig"],
  },
];

// ---------------------------------------------------------------------------
// Jharkhand (Hindi/Santali)
// ---------------------------------------------------------------------------

const JHARKHAND_ACCOUNTS: Account[] = [
  {
    id: "koylacircuit",
    handle: "@koylacircuit",
    displayName: "Koyla Circuit",
    platform: "youtube",
    category: "established-influencer",
    languageRegion: "Hindi - Jharkhand (Dhanbad coalfields)",
    primaryConstituencyId: "jh-dhanbad",
    bio: "An established channel covering the coalfield economy and labour issues around Dhanbad.",
    avatarSeed: "koylacircuit",
    baseFollowerCount: 640_000,
  },
  {
    id: "santalswar",
    handle: "@santalswar",
    displayName: "Santal Swar",
    platform: "x",
    category: "rising-new-media",
    languageRegion: "Santali/Hindi - Jharkhand tribal belt",
    primaryConstituencyId: "jh-hazaribagh",
    bio: "A rising Santali-language account covering tribal-belt land-rights and displacement issues.",
    avatarSeed: "santalswar",
    baseFollowerCount: 150_000,
  },
  {
    id: "jharkhandjagran",
    handle: "@jharkhandjagran",
    displayName: "Jharkhand Jagran",
    platform: "instagram",
    category: "rising-new-media",
    languageRegion: "Hindi - Jharkhand",
    primaryConstituencyId: "jh-hazaribagh",
    bio: "A rising account covering mining-royalty distribution and displacement-resettlement issues statewide.",
    avatarSeed: "jharkhandjagran",
    baseFollowerCount: 220_000,
  },
  {
    id: "chhotanagpurchronicle",
    handle: "@chhotanagpurchronicle",
    displayName: "Chhotanagpur Chronicle",
    platform: "facebook",
    category: "established-influencer",
    languageRegion: "Hindi - Jharkhand (Chhotanagpur plateau)",
    primaryConstituencyId: "jh-dhanbad",
    bio: "An established page covering plateau-region infrastructure and industrial-employment trends.",
    avatarSeed: "chhotanagpurchronicle",
    baseFollowerCount: 510_000,
  },
];

// ---------------------------------------------------------------------------
// Ladakh (Ladakhi/Hindi, UT)
// ---------------------------------------------------------------------------

const LADAKH_ACCOUNTS: Account[] = [
  {
    id: "ladakhledger",
    handle: "@ladakhledger",
    displayName: "Ladakh Ledger",
    platform: "youtube",
    category: "established-influencer",
    languageRegion: "Ladakhi/Hindi - Ladakh",
    primaryConstituencyId: "la-ladakh",
    bio: "An established channel covering border-infrastructure projects and the tourism economy in the Ladakh UT.",
    avatarSeed: "ladakhledger",
    baseFollowerCount: 210_000,
  },
  {
    id: "highaltitudeupdate",
    handle: "@highaltitudeupdate",
    displayName: "High Altitude Update",
    platform: "x",
    category: "rising-new-media",
    languageRegion: "English/Hindi - Ladakh",
    primaryConstituencyId: "la-ladakh",
    bio: "A rising account covering youth employment and UT-status implementation issues in Ladakh.",
    avatarSeed: "highaltitudeupdate",
    baseFollowerCount: 68_000,
  },
  {
    id: "zanskarzindagi",
    handle: "@zanskarzindagi",
    displayName: "Zanskar Zindagi",
    platform: "instagram",
    category: "rising-new-media",
    languageRegion: "Ladakhi - Zanskar valley",
    primaryConstituencyId: "la-ladakh",
    bio: "A rising account covering civic-access issues in remote Zanskar-valley villages, particularly winter-road connectivity.",
    avatarSeed: "zanskarzindagi",
    baseFollowerCount: 52_000,
  },
  {
    id: "lehlens",
    handle: "@lehlens",
    displayName: "Leh Lens",
    platform: "facebook",
    category: "established-influencer",
    languageRegion: "Ladakhi/Hindi - Leh",
    primaryConstituencyId: "la-ladakh",
    bio: "An established page covering Leh town governance and the practical rollout of Ladakh's UT-status administrative changes.",
    avatarSeed: "lehlens",
    baseFollowerCount: 175_000,
  },
];

// ---------------------------------------------------------------------------
// West Bengal (Bengali)
// ---------------------------------------------------------------------------

const WESTBENGAL_ACCOUNTS: Account[] = [
  {
    id: "bengalnow_yt",
    handle: "@bengalnow",
    displayName: "Bengal Now",
    platform: "youtube",
    category: "established-influencer",
    languageRegion: "Bengali - West Bengal (Kolkata)",
    primaryConstituencyId: "wb-kolkatadakshin",
    bio: "An established channel covering Kolkata civic and industrial-policy issues with a long-form video format.",
    avatarSeed: "bengalnow_yt",
    baseFollowerCount: 1_950_000,
  },
  {
    id: "bengalbulletin",
    handle: "@bengalbulletin",
    displayName: "Bengal Bulletin",
    platform: "x",
    category: "rising-new-media",
    languageRegion: "Bengali - West Bengal",
    primaryConstituencyId: "wb-asansol",
    bio: "A rising Bengali-language account investigating industrial-jobs-scheme claims against filled-position data.",
    avatarSeed: "bengalbulletin",
    baseFollowerCount: 340_000,
  },
  {
    id: "doarsdiary",
    handle: "@doarsdiary",
    displayName: "Doars Diary",
    platform: "instagram",
    category: "rising-new-media",
    languageRegion: "Bengali/Nepali - West Bengal (Darjeeling hills)",
    primaryConstituencyId: "wb-darjeeling",
    bio: "A rising account covering the tea-garden economy and hill-town connectivity issues around Darjeeling.",
    avatarSeed: "doarsdiary",
    baseFollowerCount: 175_000,
  },
  {
    id: "bengalnow_fb",
    handle: "@bengalnow",
    displayName: "Bengal Now",
    platform: "facebook",
    category: "established-influencer",
    languageRegion: "Bengali - West Bengal (Kolkata)",
    primaryConstituencyId: "wb-kolkatadakshin",
    bio: "Bengal Now's Facebook page, carrying community-update versions of the same Kolkata civic and industrial coverage as its YouTube channel.",
    avatarSeed: "bengalnow_fb",
    baseFollowerCount: 1_100_000,
  },
];

// ---------------------------------------------------------------------------
// Assam (Assamese) / Northeast India
// ---------------------------------------------------------------------------

const ASSAM_ACCOUNTS: Account[] = [
  {
    id: "nefrontline_yt",
    handle: "@nefrontline",
    displayName: "Northeast Frontline",
    platform: "youtube",
    category: "established-influencer",
    languageRegion: "Assamese/English - Assam and Northeast India",
    primaryConstituencyId: "as-dhubri",
    bio: "An established channel covering flood-relief disbursement and border-infrastructure projects across Assam and the wider Northeast.",
    avatarSeed: "nefrontline_yt",
    baseFollowerCount: 780_000,
    linkedAccountIds: ["nefrontline_x", "nefrontline_ig"],
  },
  {
    id: "purvottarpulse",
    handle: "@purvottarpulse",
    displayName: "Purvottar Pulse",
    platform: "facebook",
    category: "rising-new-media",
    languageRegion: "English - Northeast India",
    primaryConstituencyId: "as-dhubri",
    bio: "A rising Northeast India-focused page representing a region often under-covered in national political commentary.",
    avatarSeed: "purvottarpulse",
    baseFollowerCount: 210_000,
  },
  {
    id: "nefrontline_x",
    handle: "@nefrontline",
    displayName: "Northeast Frontline",
    platform: "x",
    category: "established-influencer",
    languageRegion: "Assamese/English - Assam and Northeast India",
    primaryConstituencyId: "as-dhubri",
    bio: "Northeast Frontline's X account for rapid updates on flood-relief and border-infrastructure stories between longer video releases.",
    avatarSeed: "nefrontline_x",
    baseFollowerCount: 420_000,
    linkedAccountIds: ["nefrontline_yt", "nefrontline_ig"],
  },
  {
    id: "nefrontline_ig",
    handle: "@nefrontline",
    displayName: "Northeast Frontline",
    platform: "instagram",
    category: "established-influencer",
    languageRegion: "Assamese/English - Assam and Northeast India",
    primaryConstituencyId: "as-dhubri",
    bio: "Northeast Frontline's Instagram account, carrying photo-essay coverage of the same flood-relief and border-infrastructure stories.",
    avatarSeed: "nefrontline_ig",
    baseFollowerCount: 510_000,
    linkedAccountIds: ["nefrontline_yt", "nefrontline_x"],
  },
];

export const ACCOUNTS: Account[] = [
  ...NATIONAL_ACCOUNTS,
  ...UP_ACCOUNTS,
  ...DELHI_ACCOUNTS,
  ...CHANDIGARH_ACCOUNTS,
  ...GUJARAT_ACCOUNTS,
  ...RAJASTHAN_ACCOUNTS,
  ...MP_ACCOUNTS,
  ...PUNJAB_ACCOUNTS,
  ...MAHARASHTRA_ACCOUNTS,
  ...KARNATAKA_ACCOUNTS,
  ...KERALA_ACCOUNTS,
  ...TAMILNADU_ACCOUNTS,
  ...BIHAR_ACCOUNTS,
  ...JHARKHAND_ACCOUNTS,
  ...LADAKH_ACCOUNTS,
  ...WESTBENGAL_ACCOUNTS,
  ...ASSAM_ACCOUNTS,
];
