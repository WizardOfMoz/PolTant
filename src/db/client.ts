import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

function getConnectionString(): string | undefined {
  return process.env.DATABASE_URL;
}

/**
 * Lazily-created singleton. DATABASE_URL is absent in local dev until the
 * user wires up Neon, so callers must handle `db` being undefined and fall
 * back to seed/static data (see src/data/*).
 */
let cached: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  const url = getConnectionString();
  if (!url) return undefined;
  if (!cached) {
    const sql = neon(url);
    cached = drizzle(sql, { schema });
  }
  return cached;
}

export { schema };
