/**
 * Curated real YouTube channels tracked by the platform (platform="youtube").
 *
 * Deliberate design choice: we store each channel's real public @handle,
 * NOT a hardcoded channel ID. Handles are easy to verify by eye (they're
 * the same string you see in the channel's URL) and cheap to get wrong
 * from memory; channel IDs are opaque strings that are easy to hallucinate
 * or mistype and impossible to eyeball-verify. `src/lib/youtube/client.ts`
 * resolves each handle to its real channel ID + live stats at fetch time
 * via `channels.list?forHandle=...` (1 quota unit) and the caller caches
 * the resolved ID (see `src/lib/youtube/ingest.ts`).
 *
 * Every handle below was checked against real, independent sources
 * (channel about pages, press coverage, subscriber-tracking sites) via web
 * search in August 2026 to confirm the channel is real and currently
 * active. Handles can still occasionally be renamed by their owners or be
 * momentarily wrong for the more obscure regional channels below - if
 * `resolveChannelByHandle` 404s for one, that is expected, non-fatal, and
 * exactly why the resolver (not a hardcoded ID) is the source of truth.
 *
 * Selection is deliberately even-handed: it spans pro-government,
 * opposition-sympathetic/critical, and studiously-neutral voices, several
 * languages, and both national and regional (non-Hindi-belt) coverage. See
 * `justification` on each entry for why it was picked, and the /methodology
 * page (later work) for how this list should be presented to users.
 */

export type ChannelCategory = "established-influencer" | "rising-new-media";

export interface CuratedChannel {
  /** Real public YouTube @handle, e.g. "@dhruvrathee". Resolved to a real
   *  channel ID + stats at fetch time - never hardcode the ID here. */
  handle: string;
  displayName: string;
  category: ChannelCategory;
  /** Free-text language/region label, e.g. "Hindi/English - National". */
  languageRegion: string;
  /** Optional best-guess primary state this channel's audience/coverage
   *  skews toward, for regional channels. Omitted for national channels. */
  expectedPrimaryState?: string;
  /** One-line source/justification note - why this channel is on the list
   *  and how it contributes to even-handed coverage. Surfaced on
   *  /methodology per PROJECT_BRIEF.md's citation requirement. */
  justification: string;
}

export const CHANNELS: CuratedChannel[] = [
  // ---- Established influencers/commentators ----------------------------
  {
    handle: "@dhruvrathee",
    displayName: "Dhruv Rathee",
    category: "established-influencer",
    languageRegion: "Hindi/English - National",
    justification:
      "One of India's largest political-explainer channels (30M+ subscribers); frequently critical of the ruling government, included as a high-reach, government-critical/liberal-leaning national voice.",
  },
  {
    handle: "@ravishkumar.official",
    displayName: "Ravish Kumar",
    category: "established-influencer",
    languageRegion: "Hindi - National",
    justification:
      "Former NDTV executive editor turned independent YouTuber (14M+ subscribers) since 2022; long-form, critical/analytical Hindi commentary - counterweight voice to pro-establishment channels.",
  },
  {
    handle: "@FayeDSouza",
    displayName: "Faye D'Souza",
    category: "established-influencer",
    languageRegion: "English - National",
    justification:
      "Independent journalist (ex-Mirror Now) whose channel explicitly brands itself as stripping out 'outrage, opinion and activism' - included as a fact-focused, deliberately centrist English-language voice.",
  },
  {
    handle: "@MOJOSTORY",
    displayName: "Barkha Dutt / Mojo Story",
    category: "established-influencer",
    languageRegion: "English/Hindi - National",
    justification:
      "Barkha Dutt's independent ground-reportage and interview platform (~1M subscribers); adds a senior-journalist voice with cross-spectrum interview format rather than a single ideological lean.",
  },
  {
    handle: "@thedeshbhakt",
    displayName: "The Deshbhakt (Akash Banerjee)",
    category: "established-influencer",
    languageRegion: "Hindi/English - National",
    justification:
      "Satirical socio-political commentary (~6.7M subscribers), widely reported as one of India's biggest YouTube channels; left-of-center/government-critical satire counterbalanced elsewhere in this list by right-leaning satire (Ajeet Bharti) and commentary (Maridhas, Abhijit Chavda).",
  },
  {
    handle: "@AbhijitChavda",
    displayName: "Abhijit Chavda",
    category: "established-influencer",
    languageRegion: "English/Hindi - National",
    justification:
      "Geopolitics/history commentator (~950K subscribers) popular with nationalist-leaning audiences - included to balance the government-critical voices above with a right-of-center perspective.",
  },
  {
    handle: "@AjeetBharti",
    displayName: "Ajeet Bharti",
    category: "established-influencer",
    languageRegion: "Hindi - National",
    justification:
      "Independent right-leaning political satirist and former mainstream (Times of India/Economic Times) journalist; balances left-leaning satire (The Deshbhakt) with an equivalent right-leaning voice.",
  },
  {
    handle: "@MaridhasAnswers",
    displayName: "Maridhas (Maridhas Answers)",
    category: "established-influencer",
    languageRegion: "Tamil - Tamil Nadu",
    expectedPrimaryState: "Tamil Nadu",
    justification:
      "Prominent right-leaning/BJP-sympathetic Tamil political commentator (~1.1M subscribers) covering Tamil Nadu politics - adds non-Hindi-belt regional and right-of-center representation.",
  },
  {
    handle: "@pratipaksha5926",
    displayName: "Bhau Torsekar / Pratipaksha",
    category: "established-influencer",
    languageRegion: "Marathi/Hindi - Maharashtra",
    expectedPrimaryState: "Maharashtra",
    justification:
      "Marathi-language political commentary channel (~850K subscribers) run by senior journalist Bhau Torsekar, explicitly positioned as an alternative to mainstream media framing on Maharashtra and national politics; adds Marathi-language and right-of-center-adjacent regional coverage.",
  },

  // ---- Rising new-media news channels (platform-native, not legacy TV) --
  {
    handle: "@thelallantop",
    displayName: "The Lallantop",
    category: "rising-new-media",
    languageRegion: "Hindi - National",
    justification:
      "Digital-first Hindi news/explainer format (34M+ subscribers) built for YouTube rather than a TV simulcast; fast-growing, youth-skewing, broadly centrist news coverage.",
  },
  {
    handle: "@newslaundry",
    displayName: "Newslaundry",
    category: "rising-new-media",
    languageRegion: "English/Hindi - National",
    justification:
      "India's first subscription-funded independent digital news outlet (~2M+ subscribers); media-criticism/watchdog focus, not tied to any legacy TV network or single ideological camp.",
  },
  {
    handle: "@TheWireNews",
    displayName: "The Wire",
    category: "rising-new-media",
    languageRegion: "English/Hindi - National",
    justification:
      "Independent, reader/community-funded digital news site (~5.9M subscribers) known for investigative reporting; included as a left-of-center-critical, non-legacy-TV national voice.",
  },
  {
    handle: "@opindia_com",
    displayName: "OpIndia",
    category: "rising-new-media",
    languageRegion: "Hindi/English - National",
    justification:
      "Right-leaning independent digital news portal and YouTube channel, launched 2014, not affiliated with any legacy TV broadcaster; balances The Wire/Newslaundry on the right of the spectrum.",
  },
  {
    handle: "@thequint",
    displayName: "The Quint",
    category: "rising-new-media",
    languageRegion: "English/Hindi - National",
    justification:
      "Digital-first news platform from Quintillion Media (~3.6M subscribers), built natively for web/video rather than as a TV channel's YouTube feed; broadly centrist national coverage.",
  },
  {
    handle: "@thenewsminute",
    displayName: "The News Minute",
    category: "rising-new-media",
    languageRegion: "English - South India",
    expectedPrimaryState: "Karnataka",
    justification:
      "Bangalore-based independent digital news outlet covering Karnataka, Tamil Nadu, Kerala, Andhra Pradesh and Telangana; adds South Indian regional coverage outside the Hindi belt without any legacy-TV parent.",
  },
  {
    handle: "@eastmojo",
    displayName: "EastMojo",
    category: "rising-new-media",
    languageRegion: "English - Northeast India",
    expectedPrimaryState: "Assam",
    justification:
      "Guwahati-headquartered digital-native news platform (founded 2017) dedicated to the 8 Northeast Indian states - a region badly underrepresented in national political-commentary coverage; not a legacy broadcaster.",
  },
  {
    handle: "@PratidhvaniNews",
    displayName: "Pratidhvani",
    category: "rising-new-media",
    languageRegion: "Kannada - Karnataka",
    expectedPrimaryState: "Karnataka",
    justification:
      "Independent Kannada-language digital news outlet run by a non-profit (Truth Pro Foundation India); legally challenged Karnataka's digital-news IT rules alongside The Wire, underscoring its independence from any TV network.",
  },
  {
    handle: "@MarunadanTV",
    displayName: "Marunadan TV / Marunadan Malayali",
    category: "rising-new-media",
    languageRegion: "Malayalam - Kerala",
    expectedPrimaryState: "Kerala",
    justification:
      "Self-described first independent online news channel in Malayalam; adds Kerala/Malayalam-language regional coverage with no legacy-broadcaster ownership.",
  },
  {
    handle: "@sumantvtelugulive",
    displayName: "SumanTV Telugu",
    category: "rising-new-media",
    languageRegion: "Telugu - Telangana/Andhra Pradesh",
    expectedPrimaryState: "Telangana",
    justification:
      "Telugu-language digital-native news network (self-described 'South India's premier digital network'), covering Telangana/Andhra Pradesh politics and interviews; adds Telugu-language regional coverage.",
  },
  {
    handle: "@nitishrajput",
    displayName: "Nitish Rajput",
    category: "rising-new-media",
    languageRegion: "Hindi - National",
    justification:
      "Fast-growing (0 to 8M+ subscribers since 2020) Hindi explainer/civic-issues channel, YouTube-native format; deliberately more issue-focused than partisan, balancing the more opinionated channels on this list.",
  },
];
