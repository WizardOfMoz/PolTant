# Constituency Pulse — internal build brief

Read this before writing code. It's the shared context for every module in this repo.

## What this is

A prototype dashboard: constituency-level social/new-media sentiment intelligence for India's Lok Sabha seats. Real ECI election data drives swing-tier classification; real YouTube data + real news RSS feeds are analyzed by a real LLM (Claude) for topic/sentiment/narrative. X/Instagram/Facebook are NOT live (official APIs require paid/approved access not obtainable here) — they're wired as inactive "connect your API key" adapters with the same interface shape as YouTube, not scrapers.

## Non-negotiable framing rules (do not skip)

- **No fabricated data presented as real.** If you can't get/verify a real number, either fetch it live, source it from a citable real dataset, or clearly mark it as an illustrative placeholder in the UI — never silently invent a number and label it as real.
- **Neutral, analytical tone only.** This tool computes automated sentiment/topic classification about real named YouTube channels. Never use accusatory framing ("spreading misinformation", "attacking the government", "biased against X party") in UI copy, prompts, or seed data descriptions. Use neutral language: "content sentiment toward policy X: -0.3", "topics discussed", "engagement metrics". The LLM analysis prompt itself must instruct balance and neutrality.
- **No individual commenter data.** Per the source PRD, never store commenter names/profile links/identifiers — only aggregate counts (likeCount, commentCount as numbers).
- **Channel selection must be even-handed.** If you're curating a list of real YouTube political-commentary/news channels, include a range of perspectives/regions, not a one-sided set.
- **Cite sources.** Any real dataset used (election results, TRAI/digital-penetration figures, channel lists) needs a short source note stored in the data (see `sourceNote` / `digitalEngagementSourceNote` fields in the schema) and surfaced on the `/methodology` page.

## Stack & conventions

- Next.js 16 App Router, TypeScript, `src/` dir, import alias `@/*`.
- Tailwind v4 + shadcn/ui (components already added: button, card, badge, table, tabs, select, input, label, separator, dropdown-menu, skeleton, alert, avatar, sheet — in `src/components/ui/`). Clean, light, modern SaaS look — think Linear/Vercel/Notion, NOT a dark command-center theme. Use shadcn defaults, don't fight the theme.
- DB: Neon Postgres via Drizzle ORM. Schema already defined in `src/db/schema.ts`, client in `src/db/client.ts` — import `{ getDb, schema }` from `@/db/client`. **`getDb()` returns `undefined` when `DATABASE_URL` isn't set** (true in local dev until the user wires up Neon) — every module that touches the DB must handle that gracefully (fall back to static data in `src/data/`, never throw).
- `.npmrc` already sets `legacy-peer-deps=true` (react-simple-maps hasn't published React 19 peer ranges yet but works fine) — just use plain `npm install <pkg>`, no flags needed.
- Path/dir conventions: `src/lib/youtube/`, `src/lib/rss/`, `src/lib/analysis/`, `src/lib/election/` for data-fetching/computation modules; `src/data/` for curated static seed data (constituencies, channels, rss sources, topojson); `src/components/` for shared UI; `src/app/` for pages (App Router).
- Server-only API keys (`YOUTUBE_API_KEY`, `ANTHROPIC_API_KEY`, `DATABASE_URL`, future `X_BEARER_TOKEN`/`META_ACCESS_TOKEN`, `SITE_PASSWORD`) are read via `process.env` in server-side code only (Route Handlers, Server Components, Server Actions) — never expose them to the client. Add every new env var to `.env.example` with a one-line comment on where to get it.
- Money/time: this is a prototype. Prefer simple, direct code over abstraction. No premature config layers.

## Where things stand

Schema, DB client, Next.js scaffold, Tailwind/shadcn are done. Parallel work is happening now on: election/constituency seed data, YouTube ingestion, RSS ingestion, Anthropic analysis module, design system + map component. Pages come after, wired to whatever these modules export.

Each module should export clean, typed functions/data that a page can import — assume the page-building step happens in a later pass by someone who will only read your exported interface, not your internals.
