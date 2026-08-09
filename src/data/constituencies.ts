/**
 * Curated real subset of ~27 Lok Sabha constituencies (not all 543), spanning
 * 15 states/UTs, a deliberate mix of parties and regions, and — per the PRD
 * formula — a mix of genuinely competitive (Swing/Toss-up) seats alongside a
 * meaningful number of Safe/Lean seats for contrast.
 *
 * swingTier, marginVolatility, flipFrequency, closenessIndex, and
 * coverageTier are NOT hand-asserted: they are computed below by calling
 * src/lib/election/tiering.ts over the real per-cycle results in
 * src/data/election-results.ts. Only identity fields (id/pcNumber/name/state)
 * and the real, cited digitalEngagementIndex input are set directly.
 *
 * ECI PC numbers were cross-checked against multiple independent sources
 * (each constituency's own Wikipedia infobox, electionpandit.com's PC-number
 * URL scheme, indiastatelections.com, and the relevant
 * "List of Lok Sabha constituencies in <state>" Wikipedia page) since this
 * is the join key a later map module will use — see the pcNumberSourceNote
 * on any seat where sources needed reconciling.
 *
 * Digital Engagement Index methodology: NFHS-5 (National Family Health
 * Survey, 2019-21, Ministry of Health & Family Welfare / IIPS), indicators
 * "18. Women who have ever used the internet (%)" and "19. Men who have
 * ever used the internet (%)", total population, per state/UT (source CSV:
 * https://github.com/pratapvardhan/NFHS-5, NFHS-5-States.csv, itself
 * transcribed from the official NFHS-5 state factsheets). For each state we
 * average the male and female "total" figures, then min-max normalize that
 * average onto a 0-100 scale against the full national range across all
 * 36 states/UTs in the survey (min: Bihar at 32.1 -> 0; max: Chandigarh at
 * 83.55 -> 100). See normalizeDigitalEngagementIndex in tiering.ts and the
 * per-row digitalEngagementSourceNote for the exact state figures used.
 */

import { electionResults, type ElectionResult } from "./election-results";
import {
  computeSwingMetrics,
  classifyCoverageTier,
  normalizeDigitalEngagementIndex,
} from "@/lib/election/tiering";
import type { Constituency } from "@/lib/types";

export type { Constituency };

/** Identity + input fields only — everything else is derived below. */
interface ConstituencySeed {
  id: string;
  pcNumber: number;
  name: string;
  state: string;
  /** NFHS-5 average of male+female "ever used internet, total" (%) for this state/UT. */
  stateInternetUsageAvgPct: number;
  digitalEngagementSourceNote: string;
}

// National min/max of the NFHS-5 male/female-average "ever used internet"
// figure across all 36 surveyed states/UTs, used to normalize every seat's
// digitalEngagementIndex onto a common 0-100 scale (see file header).
const NATIONAL_MIN_INTERNET_USAGE_AVG = 32.1; // Bihar: female 20.6%, male 43.6%
const NATIONAL_MAX_INTERNET_USAGE_AVG = 83.55; // Chandigarh: female 75.2%, male 91.9%

function dei(femalePct: number, malePct: number, stateLabel: string, reportedAs: string): {
  avg: number;
  note: string;
} {
  const avg = Math.round(((femalePct + malePct) / 2) * 100) / 100;
  return {
    avg,
    note:
      `NFHS-5 (2019-21) "ever used the internet, total population": ${stateLabel} women ${femalePct}%, men ${malePct}% (avg ${avg.toFixed(
        2
      )}). Normalized 0-100 against the full national state/UT range (min Bihar avg 32.1 -> 0, max Chandigarh avg 83.55 -> 100). Reported for constituency via its state/UT: ${reportedAs}.`,
  };
}

const up = dei(30.6, 59.1, "Uttar Pradesh", "Uttar Pradesh");
const dl = dei(63.8, 85.2, "NCT of Delhi", "Delhi");
const ch = dei(75.2, 91.9, "Chandigarh (UT)", "Chandigarh");
const gj = dei(30.8, 58.9, "Gujarat", "Gujarat");
const rj = dei(36.9, 65.2, "Rajasthan", "Rajasthan");
const mp = dei(26.9, 55.7, "Madhya Pradesh", "Madhya Pradesh");
const pb = dei(54.8, 78.2, "Punjab", "Punjab");
const mh = dei(38.0, 61.5, "Maharashtra", "Maharashtra");
const ka = dei(35.0, 62.4, "Karnataka", "Karnataka");
const kl = dei(61.1, 76.1, "Kerala", "Kerala");
const tn = dei(46.9, 70.2, "Tamil Nadu", "Tamil Nadu");
const br = dei(20.6, 43.6, "Bihar", "Bihar");
const jh = dei(31.4, 58.0, "Jharkhand", "Jharkhand");
const la = dei(56.4, 67.8, "Ladakh (UT)", "Ladakh");
const wb = dei(25.5, 46.7, "West Bengal", "West Bengal");
const as_ = dei(28.2, 42.3, "Assam", "Assam");

const SEEDS: ConstituencySeed[] = [
  { id: "up-amethi", pcNumber: 37, name: "Amethi", state: "Uttar Pradesh", stateInternetUsageAvgPct: up.avg, digitalEngagementSourceNote: up.note },
  { id: "up-kannauj", pcNumber: 42, name: "Kannauj", state: "Uttar Pradesh", stateInternetUsageAvgPct: up.avg, digitalEngagementSourceNote: up.note },
  { id: "up-muzaffarnagar", pcNumber: 3, name: "Muzaffarnagar", state: "Uttar Pradesh", stateInternetUsageAvgPct: up.avg, digitalEngagementSourceNote: up.note },
  { id: "dl-chandnichowk", pcNumber: 1, name: "Chandni Chowk", state: "Delhi", stateInternetUsageAvgPct: dl.avg, digitalEngagementSourceNote: dl.note },
  { id: "ch-chandigarh", pcNumber: 1, name: "Chandigarh", state: "Chandigarh", stateInternetUsageAvgPct: ch.avg, digitalEngagementSourceNote: ch.note },
  { id: "gj-gandhinagar", pcNumber: 6, name: "Gandhinagar", state: "Gujarat", stateInternetUsageAvgPct: gj.avg, digitalEngagementSourceNote: gj.note },
  { id: "rj-barmer", pcNumber: 17, name: "Barmer", state: "Rajasthan", stateInternetUsageAvgPct: rj.avg, digitalEngagementSourceNote: rj.note },
  { id: "mp-bhopal", pcNumber: 19, name: "Bhopal", state: "Madhya Pradesh", stateInternetUsageAvgPct: mp.avg, digitalEngagementSourceNote: mp.note },
  { id: "pb-gurdaspur", pcNumber: 1, name: "Gurdaspur", state: "Punjab", stateInternetUsageAvgPct: pb.avg, digitalEngagementSourceNote: pb.note },
  { id: "mh-baramati", pcNumber: 35, name: "Baramati", state: "Maharashtra", stateInternetUsageAvgPct: mh.avg, digitalEngagementSourceNote: mh.note },
  { id: "mh-nagpur", pcNumber: 10, name: "Nagpur", state: "Maharashtra", stateInternetUsageAvgPct: mh.avg, digitalEngagementSourceNote: mh.note },
  { id: "ka-mandya", pcNumber: 20, name: "Mandya", state: "Karnataka", stateInternetUsageAvgPct: ka.avg, digitalEngagementSourceNote: ka.note },
  { id: "ka-bangaloresouth", pcNumber: 26, name: "Bangalore South", state: "Karnataka", stateInternetUsageAvgPct: ka.avg, digitalEngagementSourceNote: ka.note },
  { id: "ka-hassan", pcNumber: 16, name: "Hassan", state: "Karnataka", stateInternetUsageAvgPct: ka.avg, digitalEngagementSourceNote: ka.note },
  { id: "kl-wayanad", pcNumber: 4, name: "Wayanad", state: "Kerala", stateInternetUsageAvgPct: kl.avg, digitalEngagementSourceNote: kl.note },
  { id: "kl-thiruvananthapuram", pcNumber: 20, name: "Thiruvananthapuram", state: "Kerala", stateInternetUsageAvgPct: kl.avg, digitalEngagementSourceNote: kl.note },
  { id: "tn-coimbatore", pcNumber: 20, name: "Coimbatore", state: "Tamil Nadu", stateInternetUsageAvgPct: tn.avg, digitalEngagementSourceNote: tn.note },
  { id: "tn-kanniyakumari", pcNumber: 39, name: "Kanniyakumari", state: "Tamil Nadu", stateInternetUsageAvgPct: tn.avg, digitalEngagementSourceNote: tn.note },
  { id: "br-begusarai", pcNumber: 24, name: "Begusarai", state: "Bihar", stateInternetUsageAvgPct: br.avg, digitalEngagementSourceNote: br.note },
  { id: "br-purnia", pcNumber: 12, name: "Purnia", state: "Bihar", stateInternetUsageAvgPct: br.avg, digitalEngagementSourceNote: br.note },
  { id: "jh-dhanbad", pcNumber: 7, name: "Dhanbad", state: "Jharkhand", stateInternetUsageAvgPct: jh.avg, digitalEngagementSourceNote: jh.note },
  { id: "jh-hazaribagh", pcNumber: 14, name: "Hazaribagh", state: "Jharkhand", stateInternetUsageAvgPct: jh.avg, digitalEngagementSourceNote: jh.note },
  { id: "la-ladakh", pcNumber: 1, name: "Ladakh", state: "Ladakh", stateInternetUsageAvgPct: la.avg, digitalEngagementSourceNote: la.note },
  { id: "wb-kolkatadakshin", pcNumber: 23, name: "Kolkata Dakshin", state: "West Bengal", stateInternetUsageAvgPct: wb.avg, digitalEngagementSourceNote: wb.note },
  { id: "wb-asansol", pcNumber: 40, name: "Asansol", state: "West Bengal", stateInternetUsageAvgPct: wb.avg, digitalEngagementSourceNote: wb.note },
  { id: "wb-darjeeling", pcNumber: 4, name: "Darjeeling", state: "West Bengal", stateInternetUsageAvgPct: wb.avg, digitalEngagementSourceNote: wb.note },
  { id: "as-dhubri", pcNumber: 4, name: "Dhubri", state: "Assam", stateInternetUsageAvgPct: as_.avg, digitalEngagementSourceNote: as_.note },
];

function resultsFor(constituencyId: string): ElectionResult[] {
  return electionResults.filter((r) => r.constituencyId === constituencyId);
}

export const constituencies: Constituency[] = SEEDS.map((seed) => {
  const results = resultsFor(seed.id);
  const metrics = computeSwingMetrics(results);
  const digitalEngagementIndex = normalizeDigitalEngagementIndex(
    seed.stateInternetUsageAvgPct,
    NATIONAL_MIN_INTERNET_USAGE_AVG,
    NATIONAL_MAX_INTERNET_USAGE_AVG
  );
  return {
    id: seed.id,
    pcNumber: seed.pcNumber,
    name: seed.name,
    state: seed.state,
    tier: metrics.tier,
    marginVolatility: metrics.marginVolatility,
    flipFrequency: metrics.flipFrequency,
    closenessIndex: metrics.closenessIndex,
    digitalEngagementIndex,
    digitalEngagementSourceNote: seed.digitalEngagementSourceNote,
    coverageTier: classifyCoverageTier(metrics.tier, digitalEngagementIndex),
  };
});
