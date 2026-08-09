# Constituency Pulse — internal build brief

Read this before writing code. It's the shared context for every module in this repo.

## What this is

A technical demo: constituency-level social/new-media sentiment intelligence for India's Lok
Sabha seats, demonstrating the analytics described in
`docs/PRD_Social_Sentiment_Constituency_Platform.pdf` end to end. Real ECI election data drives
swing-tier classification (unchanged since the original build). **Every social-platform layer is
fully synthetic**: accounts, posts, engagement, growth history, sentiment/topic/narrative
"analysis", the cross-account influence graph, and cross-platform amplification are all generated
by deterministic code in `src/data/mock/` — no live platform APIs (YouTube/X/Instagram/Facebook),
no LLM calls, no database.

**Why fully synthetic, not just fictional creators**: an earlier version of this prototype tracked
real, named YouTube channels, then pivoted to invented personas (`src/data/dummy-channels.ts`,
now superseded by `src/data/mock/accounts.ts`) while still running a real Anthropic LLM call over
that fictional content, real RSS feeds, and a real Neon/Drizzle database for growth-snapshot
history. That mixed real/fictional model was judged an unnecessary risk surface (live API keys,
ToS exposure, a DB to provision) for what is fundamentally a demo of the PRD's analytics, not a
product with real users — so the current build removed every live dependency in favor of a
self-contained, deterministic mock-data layer that still demonstrates the same features (leaning
into "wow" visual polish instead, since there's no live-data story to lean on).

## Non-negotiable framing rules (do not skip)

- **Nothing here is a real person, account, or post.** Every account in `src/data/mock/accounts.ts`
  is an invented persona; bios/handles/content must never resemble or caricature a real,
  identifiable person or outlet.
- **Neutral, analytical tone only.** Sentiment/topic/narrative mock-analysis text
  (`src/data/mock/mock-analysis.ts`) scores the *policy/issue*, never a person's or account's
  character. Never use accusatory framing ("spreading misinformation", "attacking the government",
  "biased against X party") anywhere — in UI copy, mock-data generation, or narrative templates.
- **No individual commenter data.** Per the source PRD, only aggregate counts (likeCount,
  commentCount as numbers) — never individual identities, even fabricated ones.
- **Even-handed spread.** The account universe spans a range of political leanings, regions, and
  languages — not a one-sided set.
- **Determinism, not `Math.random()`/`Date.now()`.** This app has no database — every request
  regenerates data from the mock modules, so non-deterministic generation would make numbers
  visibly flicker between page loads. Every `src/data/mock/*` module uses a seeded PRNG (keyed off
  a stable id) so the same input always produces the same output.
- **Cite what's still real.** Election results, constituency boundaries, and the Digital
  Engagement Index (`src/data/constituencies.ts`, `src/data/election-results.ts`,
  `src/lib/election/tiering.ts`) remain real, cited, offline data — keep their sourcing notes
  intact and don't blur them together with the synthetic social-platform layer on `/methodology`.

## Stack & conventions

- Next.js 16 App Router, TypeScript, `src/` dir, import alias `@/*`.
- Tailwind v4 + shadcn/ui (`base-nova` style, components in `src/components/ui/`), plus a small
  `src/components/dashboard/` primitives layer (`StatCard`, `BentoGrid`/`BentoCard`, `ChartCard`)
  for the KPI/bento-grid dashboard look — see that folder's `index.ts` for provenance notes on
  what was adapted from public component registries vs. original code. Clean, light, modern SaaS
  look — Linear/Vercel/Notion, not a dark command-center theme.
- No database, no ORM. `src/lib/types.ts` holds the plain TS interfaces (`Constituency`,
  `ElectionResult`, `Channel`) that used to be Drizzle table schemas.
- `src/data/` holds both the real seed data (`constituencies.ts`, `election-results.ts`,
  `india-pc-boundaries.json`) and the synthetic layer (`src/data/mock/*`: `accounts.ts`,
  `growth-history.ts`, `posts.ts`, `mock-analysis.ts`, `graph.ts`, `amplification.ts`).
- `src/lib/alerts.ts` is the single source of truth for the growth-alert threshold/window — both
  the Overview KPI and the Alerts page read from it rather than forking the logic.
- `react-force-graph-2d` powers the `/network` influence-graph page; it needs `next/dynamic` with
  `ssr: false` since it touches `window`/canvas.
- Money/time: this is a demo. Prefer simple, direct code over abstraction. No premature config
  layers, no env vars beyond the optional `SITE_PASSWORD` login gate.
