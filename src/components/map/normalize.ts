/**
 * Normalizes GeoJSON/TopoJSON feature `properties` for the India Lok Sabha
 * parliamentary-constituency boundaries into a clean, typed shape.
 *
 * We don't assume a specific source's property naming — the file actually
 * bundled at `src/data/india-pc-boundaries.json` (datameet/maps,
 * `parliamentary-constituencies/india_pc_2019_simplified.geojson`) keys its
 * properties as lowercase `pc_no`, `pc_id`, `pc_name`, `st_name`, `st_code`,
 * but other real sources use `PC_NO`, `ls_seat_no`, `PCNO`, etc. — so every
 * lookup here tries a list of known aliases, case-insensitively, before
 * giving up.
 *
 * IMPORTANT caveat on `pcNumber`: real ECI PC numbers are only unique
 * *within a state* (e.g. Uttar Pradesh's PC 1 "Saharanpur" and Himachal
 * Pradesh's PC 1 "Kangra" are different seats that both carry the number
 * 1) — there is no official globally-unique 1..543 numbering. This module
 * still surfaces a flat numeric `pcNumber` (matching the shape the map's
 * `highlighted: Record<pcNumber, ...>` prop expects, and the
 * `pcNumber`/`pc_number` column already defined in `src/db/schema.ts`), but
 * a consumer that needs full disambiguation should also compare
 * `stateName`/`stateCode`, or use the source's own globally-unique `pcId`
 * (exposed below) as a secondary key.
 */

export interface NormalizedPcProperties {
  /** ECI-style constituency number. Unique within a state, NOT nationally — see file header. */
  pcNumber: number;
  /** Constituency name, e.g. "Varanasi". */
  pcName: string | null;
  /** State/UT name, e.g. "Uttar Pradesh". */
  stateName: string | null;
  /** Numeric state/UT code, if the source provides one. */
  stateCode: number | null;
  /** Source's own globally-unique feature id, if present (e.g. `pc_id`). Useful to disambiguate same-numbered seats across states. */
  pcId: number | null;
}

type RawProperties = Record<string, unknown> | null | undefined;

// Every alias is compared case-insensitively, so listing one case is enough,
// but we keep a few common variants explicit for clarity/searchability.
const PC_NUMBER_KEYS = [
  "pc_no",
  "PC_NO",
  "pcno",
  "pc_number",
  "pcNumber",
  "ls_seat_no",
  "LS_SEAT_NO",
  "constituency_no",
  "constituency_number",
  "cons_no",
];
const PC_NAME_KEYS = [
  "pc_name",
  "PC_NAME",
  "name",
  "NAME",
  "constituency_name",
  "cons_name",
];
const STATE_NAME_KEYS = ["st_name", "STATE_NAME", "state_name", "state", "ST_NM"];
const STATE_CODE_KEYS = ["st_code", "STATE_CODE", "state_code", "ST_CODE"];
const PC_ID_KEYS = ["pc_id", "PC_ID", "id", "ID", "fid", "FID"];

/** Case-insensitive lookup across a list of candidate key aliases. */
function pick(props: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (props[key] !== undefined && props[key] !== null) return props[key];
  }
  const lowerToActual = new Map(
    Object.keys(props).map((k) => [k.toLowerCase(), k] as const)
  );
  for (const key of keys) {
    const actual = lowerToActual.get(key.toLowerCase());
    if (actual !== undefined) {
      const value = props[actual];
      if (value !== undefined && value !== null) return value;
    }
  }
  return undefined;
}

/** Pulls the first integer out of a number or a string like "PC-80"/"80". */
function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const match = value.match(/-?\d+/);
    if (match) {
      const parsed = Number(match[0]);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) return value;
  if (typeof value === "number") return String(value);
  return null;
}

/**
 * Normalizes a single feature's `properties` object. Returns `null` if no
 * usable PC number could be found (so callers can skip/flag malformed
 * features instead of rendering a bogus "0").
 */
export function normalizePcProperties(
  properties: RawProperties
): NormalizedPcProperties | null {
  if (!properties || typeof properties !== "object") return null;

  const pcNumber = toNumber(pick(properties, PC_NUMBER_KEYS));
  if (pcNumber === null) return null;

  return {
    pcNumber,
    pcName: toStringOrNull(pick(properties, PC_NAME_KEYS)),
    stateName: toStringOrNull(pick(properties, STATE_NAME_KEYS)),
    stateCode: toNumber(pick(properties, STATE_CODE_KEYS)),
    pcId: toNumber(pick(properties, PC_ID_KEYS)),
  };
}
