/**
 * Curated real Indian news RSS sources.
 *
 * Every feed below was independently verified twice before being added to
 * this list (see the PR/commit notes for the verification session):
 *   1. `curl` against the live URL, confirmed HTTP 200 and a well-formed
 *      <rss>/<atom> body containing real <item>/<entry> elements.
 *   2. Parsed end-to-end with the actual `rss-parser` library used by
 *      `src/lib/rss/client.ts`, confirmed it returns real, current article
 *      items (not an empty channel, not an HTML error/challenge page).
 *
 * Several plausible-looking feed URLs for other well-known outlets (e.g.
 * DNA India, Zee News, The Wire, Scroll.in, ThePrint, The Quint,
 * Newslaundry, The Tribune, Deccan Herald, News18, Firstpost, Business
 * Standard, The Telegraph, Lokmat Times, Manorama English) were tried and
 * dropped because they 403'd, 404'd, returned an anti-bot/JS-challenge
 * page, or returned an empty channel at fetch time. Do not re-add a feed
 * URL without re-verifying it the same way.
 *
 * Curation intent: a mix of mainstream national outlets across the
 * editorial spectrum (not clustered on one ownership group or leaning),
 * plus regional English-language dailies from different parts of India,
 * plus one Hindi-language national feed for language diversity. Outlets
 * span:
 *  - Mainstream centrist/broadsheet: The Hindu, Times of India,
 *    Hindustan Times, The Indian Express, NDTV, India Today, Mint.
 *  - Right-of-centre / pro-government-leaning commentary: OpIndia, Organiser
 *    (the RSS-affiliated publication).
 *  - Fact-checking / media-watchdog (often read as left-of-centre in
 *    Indian media debates): Alt News.
 *  - Hindi-language national broadcast: ABP Live.
 *  - Regional dailies covering different states/regions: Free Press
 *    Journal (Mumbai/Maharashtra), EastMojo (Northeast India), Kashmir
 *    Reader (Jammu & Kashmir), Orissa Post (Odisha), Telangana Today
 *    (Telangana).
 *
 * This list is a prototype seed set, not an exhaustive or perfectly
 * balanced media census — see PROJECT_BRIEF.md's framing rules.
 */

export type OutletType = "national" | "regional";

export interface RssSource {
  id: string;
  name: string;
  feedUrl: string;
  outletType: OutletType;
  languageRegion: string | null;
}

export const rssSources: RssSource[] = [
  // --- National, English, mainstream ---
  {
    id: "the-hindu",
    name: "The Hindu",
    feedUrl: "https://www.thehindu.com/news/national/feeder/default.rss",
    outletType: "national",
    languageRegion: "en-IN",
  },
  {
    id: "times-of-india",
    name: "The Times of India",
    feedUrl: "https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms",
    outletType: "national",
    languageRegion: "en-IN",
  },
  {
    id: "hindustan-times",
    name: "Hindustan Times",
    feedUrl: "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml",
    outletType: "national",
    languageRegion: "en-IN",
  },
  {
    id: "indian-express",
    name: "The Indian Express",
    feedUrl: "https://indianexpress.com/section/india/feed/",
    outletType: "national",
    languageRegion: "en-IN",
  },
  {
    id: "ndtv",
    name: "NDTV",
    feedUrl: "https://feeds.feedburner.com/ndtvnews-india-news",
    outletType: "national",
    languageRegion: "en-IN",
  },
  {
    id: "india-today",
    name: "India Today",
    feedUrl: "https://www.indiatoday.in/rss/1206514",
    outletType: "national",
    languageRegion: "en-IN",
  },
  {
    id: "livemint",
    name: "Mint (Livemint)",
    feedUrl: "https://www.livemint.com/rss/news",
    outletType: "national",
    languageRegion: "en-IN",
  },

  // --- National, English, right-of-centre / pro-government-leaning commentary ---
  {
    id: "opindia",
    name: "OpIndia",
    feedUrl: "https://www.opindia.com/feed/",
    outletType: "national",
    languageRegion: "en-IN",
  },
  {
    id: "organiser",
    name: "Organiser",
    feedUrl: "https://organiser.org/feed/",
    outletType: "national",
    languageRegion: "en-IN",
  },

  // --- National, English, fact-checking / media-watchdog ---
  {
    id: "alt-news",
    name: "Alt News",
    feedUrl: "https://www.altnews.in/feed/",
    outletType: "national",
    languageRegion: "en-IN",
  },

  // --- National, Hindi-language broadcast (language diversity) ---
  {
    id: "abp-live",
    name: "ABP Live",
    feedUrl: "https://www.abplive.com/news/india/feed",
    outletType: "national",
    languageRegion: "hi-IN",
  },

  // --- Regional dailies, different states/regions ---
  {
    id: "free-press-journal",
    name: "Free Press Journal",
    feedUrl: "https://www.freepressjournal.in/stories.rss",
    outletType: "regional",
    languageRegion: "en-IN-MH", // Maharashtra / Mumbai
  },
  {
    id: "eastmojo",
    name: "EastMojo",
    feedUrl: "https://www.eastmojo.com/feed/",
    outletType: "regional",
    languageRegion: "en-IN-NE", // Northeast India
  },
  {
    id: "kashmir-reader",
    name: "Kashmir Reader",
    feedUrl: "https://kashmirreader.com/feed/",
    outletType: "regional",
    languageRegion: "en-IN-JK", // Jammu & Kashmir
  },
  {
    id: "orissa-post",
    name: "Orissa Post",
    feedUrl: "https://www.orissapost.com/feed/",
    outletType: "regional",
    languageRegion: "en-IN-OD", // Odisha
  },
  {
    id: "telangana-today",
    name: "Telangana Today",
    feedUrl: "https://telanganatoday.com/feed",
    outletType: "regional",
    languageRegion: "en-IN-TS", // Telangana
  },
];
