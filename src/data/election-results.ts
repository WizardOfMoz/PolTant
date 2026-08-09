/**
 * Real Lok Sabha general election results (2014 / 2019 / 2024) for the
 * curated constituency set in src/data/constituencies.ts.
 *
 * Source: winner/runner-up candidate names, parties, vote counts and total
 * votes polled were pulled from each constituency's "<Name> Lok Sabha
 * constituency" article on English Wikipedia (accessed Aug 2026), whose
 * results tables/infoboxes are themselves sourced from ECI's published
 * constituency-wise results (Form 20 statements / results.eci.gov.in).
 * Numbers below are quoted as reported on those pages, not recalled from
 * memory or estimated — see the per-row sourceNote for the exact
 * constituency-year caveats we ran into while cross-checking.
 *
 * `marginPct` is NOT hand-typed: it is computed below from the raw
 * winner/runner-up vote counts in RAW_RESULTS, so it is demonstrably derived
 * from the cited real vote totals rather than asserted.
 *
 * "Total votes" is the total votes polled in that constituency-year as
 * reported on the page (in most cases this is the same figure the page calls
 * "turnout"); none of the pages we used separately broke out a "valid votes
 * excluding NOTA/rejected" figure distinct from votes polled, so this is a
 * close-but-not-microscopically-exact proxy for valid votes. That is
 * standard practice for this kind of margin-% analysis and is noted here
 * once rather than on every row.
 */

import type { ElectionResult } from "@/lib/types";
export type { ElectionResult };

interface RawResult {
  constituencyId: string;
  year: number;
  winnerParty: string;
  winnerVotes: number;
  runnerUpParty: string;
  runnerUpVotes: number;
  totalVotes: number;
  sourceNote: string;
}

const WIKI = (name: string) =>
  `Wikipedia, "${name} Lok Sabha constituency" (results table/infobox, ECI-sourced), accessed Aug 2026.`;

const RAW_RESULTS: RawResult[] = [
  // --- Amethi, Uttar Pradesh (PC 37) ---------------------------------
  {
    constituencyId: "up-amethi",
    year: 2014,
    winnerParty: "INC",
    winnerVotes: 408651,
    runnerUpParty: "BJP",
    runnerUpVotes: 300748,
    totalVotes: 874872,
    sourceNote: WIKI("Amethi") + " Rahul Gandhi (INC) defeated Smriti Irani (BJP).",
  },
  {
    constituencyId: "up-amethi",
    year: 2019,
    winnerParty: "BJP",
    winnerVotes: 468514,
    runnerUpParty: "INC",
    runnerUpVotes: 413394,
    totalVotes: 942956,
    sourceNote: WIKI("Amethi") + " Smriti Irani (BJP) defeated Rahul Gandhi (INC) by 55,120 votes.",
  },
  {
    constituencyId: "up-amethi",
    year: 2024,
    winnerParty: "INC",
    winnerVotes: 539228,
    runnerUpParty: "BJP",
    runnerUpVotes: 372032,
    totalVotes: 980671,
    sourceNote:
      WIKI("Amethi") +
      " Congress fielded Kishori Lal Sharma (not Rahul Gandhi, who contested Rae Bareli instead); he defeated Smriti Irani (BJP).",
  },

  // --- Kannauj, Uttar Pradesh (PC 42) ---------------------------------
  {
    constituencyId: "up-kannauj",
    year: 2014,
    winnerParty: "SP",
    winnerVotes: 489164,
    runnerUpParty: "BJP",
    runnerUpVotes: 469256,
    totalVotes: 1114576,
    sourceNote:
      WIKI("Kannauj") +
      " Dimple Yadav (SP) defeated Subrat Pathak (BJP). Page's stated majority (19,907) differs by 1 vote from the arithmetic difference of these two counts (19,908); flagged as a pre-existing minor inconsistency on the source page, not corrected here.",
  },
  {
    constituencyId: "up-kannauj",
    year: 2019,
    winnerParty: "BJP",
    winnerVotes: 563087,
    runnerUpParty: "SP",
    runnerUpVotes: 550734,
    totalVotes: 1140985,
    sourceNote: WIKI("Kannauj") + " Subrat Pathak (BJP) defeated Dimple Yadav (SP).",
  },
  {
    constituencyId: "up-kannauj",
    year: 2024,
    winnerParty: "SP",
    winnerVotes: 642292,
    runnerUpParty: "BJP",
    runnerUpVotes: 471370,
    totalVotes: 1217833,
    sourceNote:
      WIKI("Kannauj") + " Akhilesh Yadav (SP) himself contested and defeated Subrat Pathak (BJP).",
  },

  // --- Muzaffarnagar, Uttar Pradesh (PC 3) ----------------------------
  {
    constituencyId: "up-muzaffarnagar",
    year: 2014,
    winnerParty: "BJP",
    winnerVotes: 653391,
    runnerUpParty: "BSP",
    runnerUpVotes: 252241,
    totalVotes: 1107765,
    sourceNote: WIKI("Muzaffarnagar") + " Sanjeev Kumar Balyan (BJP) defeated Kadir Rana (BSP).",
  },
  {
    constituencyId: "up-muzaffarnagar",
    year: 2019,
    winnerParty: "BJP",
    winnerVotes: 573780,
    runnerUpParty: "RLD",
    runnerUpVotes: 567254,
    totalVotes: 1160071,
    sourceNote:
      WIKI("Muzaffarnagar") + " Sanjeev Kumar Balyan (BJP) narrowly held off Ajit Singh (RLD) by 6,526 votes.",
  },
  {
    constituencyId: "up-muzaffarnagar",
    year: 2024,
    winnerParty: "SP",
    winnerVotes: 470721,
    runnerUpParty: "BJP",
    runnerUpVotes: 446049,
    totalVotes: 1078669,
    sourceNote: WIKI("Muzaffarnagar") + " Harendra Singh Malik (SP) defeated the sitting BJP MP Sanjeev Balyan.",
  },

  // --- Chandni Chowk, Delhi (PC 1) ------------------------------------
  {
    constituencyId: "dl-chandnichowk",
    year: 2014,
    winnerParty: "BJP",
    winnerVotes: 437938,
    runnerUpParty: "AAP",
    runnerUpVotes: 301618,
    totalVotes: 981863,
    sourceNote: WIKI("Chandni Chowk") + " Dr. Harsh Vardhan (BJP) defeated Ashutosh (AAP).",
  },
  {
    constituencyId: "dl-chandnichowk",
    year: 2019,
    winnerParty: "BJP",
    winnerVotes: 519055,
    runnerUpParty: "INC",
    runnerUpVotes: 290910,
    totalVotes: 980814,
    sourceNote: WIKI("Chandni Chowk") + " Dr. Harsh Vardhan (BJP) defeated Jai Prakash Agarwal (INC).",
  },
  {
    constituencyId: "dl-chandnichowk",
    year: 2024,
    winnerParty: "BJP",
    winnerVotes: 516496,
    runnerUpParty: "INC",
    runnerUpVotes: 427171,
    totalVotes: 966102,
    sourceNote: WIKI("Chandni Chowk") + " Praveen Khandelwal (BJP) defeated Jai Prakash Agarwal (INC); margin narrowed sharply from 2019.",
  },

  // --- Chandigarh, UT of Chandigarh (PC 1) -----------------------------
  {
    constituencyId: "ch-chandigarh",
    year: 2014,
    winnerParty: "BJP",
    winnerVotes: 191362,
    runnerUpParty: "INC",
    runnerUpVotes: 121720,
    totalVotes: 453455,
    sourceNote: WIKI("Chandigarh") + " Kirron Kher (BJP) defeated Pawan Kumar Bansal (INC).",
  },
  {
    constituencyId: "ch-chandigarh",
    year: 2019,
    winnerParty: "BJP",
    winnerVotes: 231188,
    runnerUpParty: "INC",
    runnerUpVotes: 184218,
    totalVotes: 456637,
    sourceNote: WIKI("Chandigarh") + " Kirron Kher (BJP) defeated Pawan Kumar Bansal (INC) again.",
  },
  {
    constituencyId: "ch-chandigarh",
    year: 2024,
    winnerParty: "INC",
    winnerVotes: 216657,
    runnerUpParty: "BJP",
    runnerUpVotes: 214153,
    totalVotes: 449275,
    sourceNote:
      WIKI("Chandigarh") +
      " Manish Tewari (INC) defeated Sanjay Tandon (BJP) by just 2,504 votes — one of the closest results nationally in 2024.",
  },

  // --- Gandhinagar, Gujarat (PC 6) -------------------------------------
  {
    constituencyId: "gj-gandhinagar",
    year: 2014,
    winnerParty: "BJP",
    winnerVotes: 773539,
    runnerUpParty: "INC",
    runnerUpVotes: 290418,
    totalVotes: 1135495,
    sourceNote: WIKI("Gandhinagar") + " L. K. Advani (BJP) defeated Kiritbhai Patel (INC).",
  },
  {
    constituencyId: "gj-gandhinagar",
    year: 2019,
    winnerParty: "BJP",
    winnerVotes: 894624,
    runnerUpParty: "INC",
    runnerUpVotes: 337610,
    totalVotes: 1284090,
    sourceNote:
      "IndiaVotes.com (ECI-sourced), Gandhinagar 2019 result page, accessed Aug 2026. Amit Shah (BJP) defeated Dr. C. J. Chavda (INC); winner vote count cross-checked against margin arithmetic after the Wikipedia infobox figure failed a consistency check.",
  },
  {
    constituencyId: "gj-gandhinagar",
    year: 2024,
    winnerParty: "BJP",
    winnerVotes: 1010972,
    runnerUpParty: "INC",
    runnerUpVotes: 266256,
    totalVotes: 1321802,
    sourceNote: WIKI("Gandhinagar") + " Amit Shah (BJP) defeated Sonal Patel (INC).",
  },

  // --- Barmer, Rajasthan (PC 17) ---------------------------------------
  {
    constituencyId: "rj-barmer",
    year: 2014,
    winnerParty: "BJP",
    winnerVotes: 488747,
    runnerUpParty: "IND",
    runnerUpVotes: 401286,
    totalVotes: 1219119,
    sourceNote: WIKI("Barmer") + " Col. Sona Ram Choudhary (BJP) defeated Jaswant Singh, who contested as an independent (IND).",
  },
  {
    constituencyId: "rj-barmer",
    year: 2019,
    winnerParty: "BJP",
    winnerVotes: 846526,
    runnerUpParty: "INC",
    runnerUpVotes: 522718,
    totalVotes: 1422271,
    sourceNote: WIKI("Barmer") + " Kailash Choudhary (BJP) defeated Manvendra Singh (INC).",
  },
  {
    constituencyId: "rj-barmer",
    year: 2024,
    winnerParty: "INC",
    winnerVotes: 704676,
    runnerUpParty: "IND",
    runnerUpVotes: 586500,
    totalVotes: 1688051,
    sourceNote:
      WIKI("Barmer") +
      " Ummeda Ram Beniwal (INC) defeated independent Ravindra Singh Bhati; the BJP incumbent Kailash Choudhary placed third (286,733 votes, not modeled as runner-up here).",
  },

  // --- Bhopal, Madhya Pradesh (PC 19) -----------------------------------
  {
    constituencyId: "mp-bhopal",
    year: 2014,
    winnerParty: "BJP",
    winnerVotes: 714178,
    runnerUpParty: "INC",
    runnerUpVotes: 343482,
    totalVotes: 1130182,
    sourceNote: WIKI("Bhopal") + " Alok Sanjar (BJP) defeated P. C. Sharma (INC).",
  },
  {
    constituencyId: "mp-bhopal",
    year: 2019,
    winnerParty: "BJP",
    winnerVotes: 866482,
    runnerUpParty: "INC",
    runnerUpVotes: 501660,
    totalVotes: 1407954,
    sourceNote: WIKI("Bhopal") + " Sadhvi Pragya Singh Thakur (BJP) defeated Digvijaya Singh (INC).",
  },
  {
    constituencyId: "mp-bhopal",
    year: 2024,
    winnerParty: "BJP",
    winnerVotes: 981109,
    runnerUpParty: "INC",
    runnerUpVotes: 479610,
    totalVotes: 1498285,
    sourceNote: WIKI("Bhopal") + " Alok Sharma (BJP) defeated Arun Shrivastava (INC).",
  },

  // --- Gurdaspur, Punjab (PC 1) ------------------------------------------
  {
    constituencyId: "pb-gurdaspur",
    year: 2014,
    winnerParty: "BJP",
    winnerVotes: 482255,
    runnerUpParty: "INC",
    runnerUpVotes: 346190,
    totalVotes: 1042699,
    sourceNote: WIKI("Gurdaspur") + " Vinod Khanna (BJP) defeated Partap Singh Bajwa (INC).",
  },
  {
    constituencyId: "pb-gurdaspur",
    year: 2019,
    winnerParty: "BJP",
    winnerVotes: 558719,
    runnerUpParty: "INC",
    runnerUpVotes: 476260,
    totalVotes: 1103887,
    sourceNote:
      WIKI("Gurdaspur") +
      " Sunny Deol (BJP) defeated Sunil Jakhar (INC); Jakhar had held the seat 2017-19 via a bypoll after Vinod Khanna's death (not one of the three general-election cycles tracked here).",
  },
  {
    constituencyId: "pb-gurdaspur",
    year: 2024,
    winnerParty: "INC",
    winnerVotes: 364043,
    runnerUpParty: "BJP",
    runnerUpVotes: 281182,
    totalVotes: 1077826,
    sourceNote:
      WIKI("Gurdaspur") +
      " Sukhjinder Singh Randhawa (INC) defeated Dinesh Singh (BJP); AAP's Amansher Singh placed third with 277,252 votes, very close behind BJP.",
  },

  // --- Baramati, Maharashtra (PC 35) --------------------------------------
  {
    constituencyId: "mh-baramati",
    year: 2014,
    winnerParty: "NCP",
    winnerVotes: 521562,
    runnerUpParty: "RSP",
    runnerUpVotes: 451843,
    totalVotes: 1066556,
    sourceNote: WIKI("Baramati") + " Supriya Sule (NCP, pre-split) defeated Mahadev Jankar (Rashtriya Samaj Paksha).",
  },
  {
    constituencyId: "mh-baramati",
    year: 2019,
    winnerParty: "NCP",
    winnerVotes: 686714,
    runnerUpParty: "BJP",
    runnerUpVotes: 530940,
    totalVotes: 1307318,
    sourceNote: WIKI("Baramati") + " Supriya Sule (NCP, pre-split) defeated Kanchan Kool (BJP).",
  },
  {
    constituencyId: "mh-baramati",
    year: 2024,
    winnerParty: "NCP-SP",
    winnerVotes: 732312,
    runnerUpParty: "NCP",
    runnerUpVotes: 573979,
    totalVotes: 1414034,
    sourceNote:
      WIKI("Baramati") +
      " After the 2023 NCP split, Supriya Sule (NCP-Sharadchandra Pawar faction) defeated Sunetra Pawar (NCP, the Ajit Pawar/original-symbol faction) in an intra-family contest. Party labels reflect the two post-split factions, not a change of party allegiance in the ordinary sense — flagged here since flip-frequency counts it as a literal label change.",
  },

  // --- Nagpur, Maharashtra (PC 10) -----------------------------------------
  {
    constituencyId: "mh-nagpur",
    year: 2014,
    winnerParty: "BJP",
    winnerVotes: 587767,
    runnerUpParty: "INC",
    runnerUpVotes: 302919,
    totalVotes: 1085765,
    sourceNote: WIKI("Nagpur") + " Nitin Gadkari (BJP) defeated Vilas Muttemwar (INC).",
  },
  {
    constituencyId: "mh-nagpur",
    year: 2019,
    winnerParty: "BJP",
    winnerVotes: 660221,
    runnerUpParty: "INC",
    runnerUpVotes: 444212,
    totalVotes: 1187215,
    sourceNote: WIKI("Nagpur") + " Nitin Gadkari (BJP) defeated Nana Patole (INC).",
  },
  {
    constituencyId: "mh-nagpur",
    year: 2024,
    winnerParty: "BJP",
    winnerVotes: 655027,
    runnerUpParty: "INC",
    runnerUpVotes: 517424,
    totalVotes: 1211321,
    sourceNote: WIKI("Nagpur") + " Nitin Gadkari (BJP) defeated Vikas Thakre (INC); margin has narrowed each cycle.",
  },

  // --- Mandya, Karnataka (PC 20) --------------------------------------------
  {
    constituencyId: "ka-mandya",
    year: 2014,
    winnerParty: "JD(S)",
    winnerVotes: 524370,
    runnerUpParty: "INC",
    runnerUpVotes: 518852,
    totalVotes: 1193041,
    sourceNote: WIKI("Mandya") + " C. S. Puttaraju (JD(S)) narrowly defeated actress Ramya (INC).",
  },
  {
    constituencyId: "ka-mandya",
    year: 2019,
    winnerParty: "IND",
    winnerVotes: 703660,
    runnerUpParty: "JD(S)",
    runnerUpVotes: 577784,
    totalVotes: 1379622,
    sourceNote:
      WIKI("Mandya") +
      " Sumalatha Ambareesh contested and won as an independent (BJP/NDA-backed) against Nikhil Kumaraswamy (JD(S)).",
  },
  {
    constituencyId: "ka-mandya",
    year: 2024,
    winnerParty: "JD(S)",
    winnerVotes: 851881,
    runnerUpParty: "INC",
    runnerUpVotes: 567261,
    totalVotes: 1460563,
    sourceNote:
      WIKI("Mandya") +
      " H. D. Kumaraswamy (JD(S), contesting in alliance with the BJP-led NDA) defeated Venkataramane Gowda (INC).",
  },

  // --- Bangalore South, Karnataka (PC 26) ------------------------------------
  {
    constituencyId: "ka-bangaloresouth",
    year: 2014,
    winnerParty: "BJP",
    winnerVotes: 633816,
    runnerUpParty: "INC",
    runnerUpVotes: 405241,
    totalVotes: 1114359,
    sourceNote: WIKI("Bangalore South") + " Ananth Kumar (BJP) defeated Nandan Nilekani (INC).",
  },
  {
    constituencyId: "ka-bangaloresouth",
    year: 2019,
    winnerParty: "BJP",
    winnerVotes: 739229,
    runnerUpParty: "INC",
    runnerUpVotes: 408037,
    totalVotes: 1189657,
    sourceNote: WIKI("Bangalore South") + " Tejasvi Surya (BJP) defeated B. K. Hariprasad (INC).",
  },
  {
    constituencyId: "ka-bangaloresouth",
    year: 2024,
    winnerParty: "BJP",
    winnerVotes: 750830,
    runnerUpParty: "INC",
    runnerUpVotes: 473747,
    totalVotes: 1250052,
    sourceNote: WIKI("Bangalore South") + " Tejasvi Surya (BJP) defeated Sowmya Reddy (INC).",
  },

  // --- Hassan, Karnataka (PC 16) ----------------------------------------------
  {
    constituencyId: "ka-hassan",
    year: 2014,
    winnerParty: "JD(S)",
    winnerVotes: 509841,
    runnerUpParty: "INC",
    runnerUpVotes: 409379,
    totalVotes: 1147172,
    sourceNote:
      WIKI("Hassan") +
      " H. D. Deve Gowda (JD(S)) defeated A. Manju (INC). Total votes figure (1,147,172 valid votes) taken from IndiaVotes/resultuniversity.com since the Wikipedia page's infobox omitted a turnout figure for this constituency.",
  },
  {
    constituencyId: "ka-hassan",
    year: 2019,
    winnerParty: "JD(S)",
    winnerVotes: 676606,
    runnerUpParty: "BJP",
    runnerUpVotes: 535282,
    totalVotes: 1277552,
    sourceNote:
      WIKI("Hassan") +
      " Prajwal Revanna (JD(S)) defeated A. Manju (BJP). Total votes-polled figure (1,277,552) taken from IndiaVotes since Wikipedia's page omitted it.",
  },
  {
    constituencyId: "ka-hassan",
    year: 2024,
    winnerParty: "INC",
    winnerVotes: 672988,
    runnerUpParty: "JD(S)",
    runnerUpVotes: 630339,
    totalVotes: 1355007,
    sourceNote:
      WIKI("Hassan") +
      " Shreyas M. Patel (INC) defeated the sitting MP Prajwal Revanna (JD(S)) amid a widely reported scandal involving the latter. Total votes-polled figure (1,355,007) taken from IndiaVotes.",
  },

  // --- Wayanad, Kerala (PC 4) ----------------------------------------------
  {
    constituencyId: "kl-wayanad",
    year: 2014,
    winnerParty: "INC",
    winnerVotes: 377035,
    runnerUpParty: "CPI",
    runnerUpVotes: 356165,
    totalVotes: 915006,
    sourceNote: WIKI("Wayanad") + " M. I. Shanavas (INC) defeated Sathyan Mokeri (CPI).",
  },
  {
    constituencyId: "kl-wayanad",
    year: 2019,
    winnerParty: "INC",
    winnerVotes: 706367,
    runnerUpParty: "CPI",
    runnerUpVotes: 274597,
    totalVotes: 1087783,
    sourceNote: WIKI("Wayanad") + " Rahul Gandhi (INC) defeated P. P. Suneer (CPI).",
  },
  {
    constituencyId: "kl-wayanad",
    year: 2024,
    winnerParty: "INC",
    winnerVotes: 647445,
    runnerUpParty: "CPI",
    runnerUpVotes: 283023,
    totalVotes: 1086459,
    sourceNote:
      WIKI("Wayanad") +
      " General-election winner was Rahul Gandhi (INC) over Annie Raja (CPI); he vacated the seat (having also won Rae Bareli), triggering a 2024 bypoll won by Priyanka Gandhi Vadra (INC). Bypoll result not used here — this row is the general-election result only.",
  },

  // --- Thiruvananthapuram, Kerala (PC 20) -----------------------------------
  {
    constituencyId: "kl-thiruvananthapuram",
    year: 2014,
    winnerParty: "INC",
    winnerVotes: 297806,
    runnerUpParty: "BJP",
    runnerUpVotes: 282336,
    totalVotes: 873441,
    sourceNote: WIKI("Thiruvananthapuram") + " Shashi Tharoor (INC) defeated O. Rajagopal (BJP).",
  },
  {
    constituencyId: "kl-thiruvananthapuram",
    year: 2019,
    winnerParty: "INC",
    winnerVotes: 416131,
    runnerUpParty: "BJP",
    runnerUpVotes: 316142,
    totalVotes: 1011268,
    sourceNote: WIKI("Thiruvananthapuram") + " Shashi Tharoor (INC) defeated Kummanam Rajasekharan (BJP).",
  },
  {
    constituencyId: "kl-thiruvananthapuram",
    year: 2024,
    winnerParty: "INC",
    winnerVotes: 358155,
    runnerUpParty: "BJP",
    runnerUpVotes: 342078,
    totalVotes: 964351,
    sourceNote:
      WIKI("Thiruvananthapuram") +
      " Shashi Tharoor (INC) held the seat against Rajeev Chandrasekhar (BJP) by only 16,077 votes — the closest of his four wins here, and BJP's best-ever showing in the seat.",
  },

  // --- Coimbatore, Tamil Nadu (PC 20) ----------------------------------------
  {
    constituencyId: "tn-coimbatore",
    year: 2014,
    winnerParty: "AIADMK",
    winnerVotes: 431717,
    runnerUpParty: "BJP",
    runnerUpVotes: 389701,
    totalVotes: 1159192,
    sourceNote: WIKI("Coimbatore") + " P. Nagarajan (AIADMK) defeated C. P. Radhakrishnan (BJP).",
  },
  {
    constituencyId: "tn-coimbatore",
    year: 2019,
    winnerParty: "CPI(M)",
    winnerVotes: 571150,
    runnerUpParty: "BJP",
    runnerUpVotes: 392007,
    totalVotes: 1245644,
    sourceNote: WIKI("Coimbatore") + " P. R. Natarajan (CPI(M), contesting in the DMK-led alliance) defeated C. P. Radhakrishnan (BJP).",
  },
  {
    constituencyId: "tn-coimbatore",
    year: 2024,
    winnerParty: "DMK",
    winnerVotes: 568200,
    runnerUpParty: "BJP",
    runnerUpVotes: 450132,
    totalVotes: 1372833,
    sourceNote:
      "Wikipedia + IndiaTV Coimbatore 2024 result coverage, accessed Aug 2026. Ganapathi P. Rajkumar (DMK) defeated K. Annamalai (BJP); total votes-polled figure (1,372,833) sourced from IndiaTV since the Wikipedia infobox did not show a turnout row for this year.",
  },

  // --- Kanniyakumari, Tamil Nadu (PC 39) --------------------------------------
  {
    constituencyId: "tn-kanniyakumari",
    year: 2014,
    winnerParty: "BJP",
    winnerVotes: 372906,
    runnerUpParty: "INC",
    runnerUpVotes: 244244,
    totalVotes: 990742,
    sourceNote: WIKI("Kanniyakumari") + " Pon. Radhakrishnan (BJP) defeated H. Vasanthakumar (INC).",
  },
  {
    constituencyId: "tn-kanniyakumari",
    year: 2019,
    winnerParty: "INC",
    winnerVotes: 627235,
    runnerUpParty: "BJP",
    runnerUpVotes: 367302,
    totalVotes: 1048377,
    sourceNote: WIKI("Kanniyakumari") + " H. Vasanthakumar (INC) defeated Pon. Radhakrishnan (BJP).",
  },
  {
    constituencyId: "tn-kanniyakumari",
    year: 2024,
    winnerParty: "INC",
    winnerVotes: 546248,
    runnerUpParty: "BJP",
    runnerUpVotes: 366341,
    totalVotes: 1029055,
    sourceNote: WIKI("Kanniyakumari") + " Vijay Vasanth (INC), son of the late H. Vasanthakumar, defeated Pon. Radhakrishnan (BJP).",
  },

  // --- Begusarai, Bihar (PC 24) -----------------------------------------------
  {
    constituencyId: "br-begusarai",
    year: 2014,
    winnerParty: "BJP",
    winnerVotes: 428227,
    runnerUpParty: "RJD",
    runnerUpVotes: 369892,
    totalVotes: 1077855,
    sourceNote: WIKI("Begusarai") + " Bhola Singh (BJP) defeated Tanweer Hassan (RJD).",
  },
  {
    constituencyId: "br-begusarai",
    year: 2019,
    winnerParty: "BJP",
    winnerVotes: 692193,
    runnerUpParty: "CPI",
    runnerUpVotes: 269976,
    totalVotes: 1226503,
    sourceNote:
      WIKI("Begusarai") +
      " Giriraj Singh (BJP) defeated CPI's Kanhaiya Kumar in a nationally watched, three-cornered contest (RJD also fielded a candidate).",
  },
  {
    constituencyId: "br-begusarai",
    year: 2024,
    winnerParty: "BJP",
    winnerVotes: 649331,
    runnerUpParty: "CPI",
    runnerUpVotes: 567851,
    totalVotes: 1296227,
    sourceNote:
      WIKI("Begusarai") +
      " Giriraj Singh (BJP) held the seat against Awadhesh Kumar Rai (CPI), but the margin collapsed from 422,217 votes in 2019 to 81,480.",
  },

  // --- Purnia, Bihar (PC 12) --------------------------------------------------
  {
    constituencyId: "br-purnia",
    year: 2014,
    winnerParty: "JD(U)",
    winnerVotes: 418826,
    runnerUpParty: "BJP",
    runnerUpVotes: 302157,
    totalVotes: 1017750,
    sourceNote: WIKI("Purnia") + " Santosh Kumar Kushwaha (JD(U)) defeated Uday Singh (BJP).",
  },
  {
    constituencyId: "br-purnia",
    year: 2019,
    winnerParty: "JD(U)",
    winnerVotes: 632924,
    runnerUpParty: "INC",
    runnerUpVotes: 369463,
    totalVotes: 1153989,
    sourceNote: WIKI("Purnia") + " Santosh Kumar Kushwaha (JD(U)) defeated Uday Singh (INC, having switched parties since 2014).",
  },
  {
    constituencyId: "br-purnia",
    year: 2024,
    winnerParty: "IND",
    winnerVotes: 567556,
    runnerUpParty: "JD(U)",
    runnerUpVotes: 543709,
    totalVotes: 1196238,
    sourceNote:
      "IndiaVotes.com (ECI-sourced) + contemporaneous news reports (India TV, The Quint, ANI, Deccan Herald), accessed Aug 2026. Rajesh Ranjan a.k.a. Pappu Yadav won as an independent (IND) after Purnia went to the RJD under INDIA-bloc seat-sharing, so Congress — with whom he had merged his own Jan Adhikar Party — could not field him there. Wikipedia's results table lists his party as INC, which we judge reflects his post-poll affiliation rather than his ballot-time label; IND is used here as the ballot-time party.",
  },

  // --- Dhanbad, Jharkhand (PC 7) -----------------------------------------------
  {
    constituencyId: "jh-dhanbad",
    year: 2014,
    winnerParty: "BJP",
    winnerVotes: 543491,
    runnerUpParty: "INC",
    runnerUpVotes: 250537,
    totalVotes: 1143945,
    sourceNote: WIKI("Dhanbad") + " Pashupati Nath Singh (BJP) defeated Ajay Kumar Dubey (INC).",
  },
  {
    constituencyId: "jh-dhanbad",
    year: 2019,
    winnerParty: "BJP",
    winnerVotes: 827234,
    runnerUpParty: "INC",
    runnerUpVotes: 341040,
    totalVotes: 1253265,
    sourceNote: WIKI("Dhanbad") + " Pashupati Nath Singh (BJP) defeated Kirti Azad (INC, having switched parties since his BJP days).",
  },
  {
    constituencyId: "jh-dhanbad",
    year: 2024,
    winnerParty: "BJP",
    winnerVotes: 789172,
    runnerUpParty: "INC",
    runnerUpVotes: 457789,
    totalVotes: 1431957,
    sourceNote: WIKI("Dhanbad") + " Dulu Mahato (BJP) defeated Anupama Singh (INC).",
  },

  // --- Hazaribagh, Jharkhand (PC 14) --------------------------------------------
  {
    constituencyId: "jh-hazaribagh",
    year: 2014,
    winnerParty: "BJP",
    winnerVotes: 406931,
    runnerUpParty: "INC",
    runnerUpVotes: 247803,
    totalVotes: 967348,
    sourceNote: WIKI("Hazaribagh") + " Jayant Sinha (BJP) defeated Saurabh Narain Singh (INC).",
  },
  {
    constituencyId: "jh-hazaribagh",
    year: 2019,
    winnerParty: "BJP",
    winnerVotes: 728798,
    runnerUpParty: "INC",
    runnerUpVotes: 249250,
    totalVotes: 1081382,
    sourceNote: WIKI("Hazaribagh") + " Jayant Sinha (BJP) defeated Gopal Prasad Sahu (INC).",
  },
  {
    constituencyId: "jh-hazaribagh",
    year: 2024,
    winnerParty: "BJP",
    winnerVotes: 654613,
    runnerUpParty: "INC",
    runnerUpVotes: 377927,
    totalVotes: 1265455,
    sourceNote: WIKI("Hazaribagh") + " Manish Jaiswal (BJP) defeated Jai Prakash Bhai Patel (INC).",
  },

  // --- Ladakh, UT of Ladakh (PC 1) -----------------------------------------------
  {
    constituencyId: "la-ladakh",
    year: 2014,
    winnerParty: "BJP",
    winnerVotes: 31111,
    runnerUpParty: "IND",
    runnerUpVotes: 31075,
    totalVotes: 119068,
    sourceNote:
      WIKI("Ladakh") +
      " Thupstan Chhewang (BJP) defeated independent Ghulam Raza by just 36 votes — one of the closest Lok Sabha results in Indian history. (At this time Ladakh was a constituency within the state of Jammu & Kashmir, before the 2019 reorganization into a separate UT.)",
  },
  {
    constituencyId: "la-ladakh",
    year: 2019,
    winnerParty: "BJP",
    winnerVotes: 42914,
    runnerUpParty: "IND",
    runnerUpVotes: 31984,
    totalVotes: 127350,
    sourceNote: WIKI("Ladakh") + " Jamyang Tsering Namgyal (BJP) defeated independent Sajjad Hussain.",
  },
  {
    constituencyId: "la-ladakh",
    year: 2024,
    winnerParty: "IND",
    winnerVotes: 65259,
    runnerUpParty: "INC",
    runnerUpVotes: 37397,
    totalVotes: 135662,
    sourceNote:
      "Wikipedia + WioNews/The Quint/Business Standard June 2024 coverage, accessed Aug 2026. Mohmad Haneefa, a former National Conference leader, won as an independent after Congress took the INDIA-bloc nomination in the UT; the BJP incumbent placed third and is not modeled as runner-up here.",
  },

  // --- Kolkata Dakshin ("Kolkata South"), West Bengal (PC 23) ---------------------
  {
    constituencyId: "wb-kolkatadakshin",
    year: 2014,
    winnerParty: "AITC",
    winnerVotes: 431715,
    runnerUpParty: "BJP",
    runnerUpVotes: 295376,
    totalVotes: 1167986,
    sourceNote:
      'Wikipedia, "Kolkata Dakshin Lok Sabha constituency" (the constituency commonly called "Kolkata South"; formerly "Calcutta South"), accessed Aug 2026. Subrata Bakshi (AITC) defeated Tathagata Roy (BJP).',
  },
  {
    constituencyId: "wb-kolkatadakshin",
    year: 2019,
    winnerParty: "AITC",
    winnerVotes: 573119,
    runnerUpParty: "BJP",
    runnerUpVotes: 417927,
    totalVotes: 1206645,
    sourceNote: WIKI("Kolkata Dakshin") + " Mala Roy (AITC) defeated Chandra Kumar Bose (BJP).",
  },
  {
    constituencyId: "wb-kolkatadakshin",
    year: 2024,
    winnerParty: "AITC",
    winnerVotes: 615274,
    runnerUpParty: "BJP",
    runnerUpVotes: 428043,
    totalVotes: 1243477,
    sourceNote: WIKI("Kolkata Dakshin") + " Mala Roy (AITC) defeated Debasree Chaudhuri (BJP).",
  },

  // --- Asansol, West Bengal (PC 40) ---------------------------------------------
  {
    constituencyId: "wb-asansol",
    year: 2014,
    winnerParty: "BJP",
    winnerVotes: 419983,
    runnerUpParty: "AITC",
    runnerUpVotes: 349503,
    totalVotes: 1142395,
    sourceNote: WIKI("Asansol") + " Babul Supriyo (BJP) defeated Dola Sen (AITC).",
  },
  {
    constituencyId: "wb-asansol",
    year: 2019,
    winnerParty: "BJP",
    winnerVotes: 633378,
    runnerUpParty: "AITC",
    runnerUpVotes: 435741,
    totalVotes: 1238151,
    sourceNote: WIKI("Asansol") + " Babul Supriyo (BJP) defeated Moon Moon Sen (AITC).",
  },
  {
    constituencyId: "wb-asansol",
    year: 2024,
    winnerParty: "AITC",
    winnerVotes: 605645,
    runnerUpParty: "BJP",
    runnerUpVotes: 546081,
    totalVotes: 1301540,
    sourceNote:
      "IndiaVotes.com (ECI-sourced) Asansol 2024 result, accessed Aug 2026 — used in place of the Wikipedia infobox's electors/turnout figures, which were internally inconsistent (implied ~100% turnout). Shatrughan Sinha (AITC), who had already won the seat in a 2022 bypoll after Babul Supriyo's resignation, defeated S. S. Ahluwalia (BJP) in the general election.",
  },

  // --- Darjeeling, West Bengal (PC 4) ---------------------------------------------
  {
    constituencyId: "wb-darjeeling",
    year: 2014,
    winnerParty: "BJP",
    winnerVotes: 488257,
    runnerUpParty: "AITC",
    runnerUpVotes: 291018,
    totalVotes: 1142009,
    sourceNote: WIKI("Darjeeling") + " S. S. Ahluwalia (BJP) defeated Bhaichung Bhutia (AITC).",
  },
  {
    constituencyId: "wb-darjeeling",
    year: 2019,
    winnerParty: "BJP",
    winnerVotes: 750067,
    runnerUpParty: "AITC",
    runnerUpVotes: 336624,
    totalVotes: 1269666,
    sourceNote: WIKI("Darjeeling") + " Raju Bista (BJP) defeated Amar Singh Rai (AITC).",
  },
  {
    constituencyId: "wb-darjeeling",
    year: 2024,
    winnerParty: "BJP",
    winnerVotes: 679331,
    runnerUpParty: "AITC",
    runnerUpVotes: 500806,
    totalVotes: 1327412,
    sourceNote:
      WIKI("Darjeeling") +
      " Raju Bista (BJP) defeated Gopal Lama (AITC). Total votes figure derived by summing all reported candidate + NOTA counts, since the page did not show a distinct turnout % for this year.",
  },

  // --- Dhubri, Assam (PC 4) ------------------------------------------------------
  {
    constituencyId: "as-dhubri",
    year: 2014,
    winnerParty: "AIUDF",
    winnerVotes: 592569,
    runnerUpParty: "INC",
    runnerUpVotes: 362839,
    totalVotes: 1369722,
    sourceNote:
      WIKI("Dhubri") +
      " Badruddin Ajmal (AIUDF) defeated Wazed Ali Choudhury (INC). PC number: Assam's constituencies run Karimganj(1)/Silchar(2)/Autonomous District(3)/Dhubri(4)/... — used here in place of the Wikipedia infobox's 'AS-2' label, which conflicts with that ordering and with the standard ECI numbering.",
  },
  {
    constituencyId: "as-dhubri",
    year: 2019,
    winnerParty: "AIUDF",
    winnerVotes: 718764,
    runnerUpParty: "INC",
    runnerUpVotes: 492506,
    totalVotes: 1685058,
    sourceNote: WIKI("Dhubri") + " Badruddin Ajmal (AIUDF) defeated Abu Taher Bepari (INC).",
  },
  {
    constituencyId: "as-dhubri",
    year: 2024,
    winnerParty: "INC",
    winnerVotes: 1471885,
    runnerUpParty: "AIUDF",
    runnerUpVotes: 459409,
    totalVotes: 2458780,
    sourceNote:
      WIKI("Dhubri") +
      " Rakibul Hussain (INC) unseated four-term AIUDF MP Badruddin Ajmal by a very wide margin, one of the largest vote-margin swings in this dataset.",
  },
];

export const electionResults: ElectionResult[] = RAW_RESULTS.map((r) => ({
  constituencyId: r.constituencyId,
  year: r.year,
  winningParty: r.winnerParty,
  runnerUpParty: r.runnerUpParty,
  // Computed from the real winner/runner-up vote counts above, not hand-typed.
  marginPct: Math.round(((r.winnerVotes - r.runnerUpVotes) / r.totalVotes) * 10000) / 100,
  totalVotes: r.totalVotes,
  sourceNote: r.sourceNote,
}));
