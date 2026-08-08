# Constituency Pulse

A constituency-level social/new-media sentiment and influence-tracking prototype for Indian Lok
Sabha seats — real historical election data for swing-tier classification, real public news RSS
feeds, and fictional Indian-context creator personas standing in for tracked channels, all
analyzed by a real LLM (Claude) for topic/sentiment/narrative. Built from
`docs/PRD_Social_Sentiment_Constituency_Platform.pdf`.

**Why fictional channels**: an earlier pass of this prototype tracked real, named YouTube
channels. That was deliberately replaced with invented personas (`src/data/dummy-channels.ts`) —
attaching computed sentiment/narrative scores to real named creators, even genuinely computed
rather than fabricated, was judged too close to the defamation/reputational risk the source PRD's
own Section 7 warns about, for a link meant to be shared around. The election data and RSS news
sources are real; the creator layer is not. See `/methodology` in the running app.

X, Instagram, and Facebook are **not live** in this build — their official public-content APIs
require paid/approved access this prototype doesn't have. They're wired as inactive
"connect your API key" adapters, not scrapers (see `PROJECT_BRIEF.md` for why).

See `/methodology` in the running app for full scope, data sources, and compliance notes.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

### Environment variables

| Variable | Required for | Where to get it |
|---|---|---|
| `DATABASE_URL` | Persisting channel snapshots for real growth-over-time alerts | Neon Postgres connection string — via Vercel's "Neon" marketplace integration (Storage tab → Browse Marketplace → Neon), or directly from [console.neon.tech](https://console.neon.tech) |
| `ANTHROPIC_API_KEY` | Real sentiment/topic/narrative analysis (runs over the RSS feeds and the fictional creator content) | [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) |
| `SITE_PASSWORD` | The login gate | Any string you choose — share it out-of-band with people you send the link to |
| `YOUTUBE_API_KEY` | Not used by default (see above) — only if you switch `src/lib/pipeline/channels.ts` back to the unused real-ingestion code in `src/lib/youtube/` | [Google Cloud Console](https://console.cloud.google.com/) → enable **YouTube Data API v3** → Credentials → API key |
| `X_BEARER_TOKEN`, `META_ACCESS_TOKEN` | Optional — activates the X/Meta adapters | Only if you separately have paid X API / approved Meta Page Public Content Access |

Without `DATABASE_URL`/`ANTHROPIC_API_KEY` set, the app still runs and is navigable —
data-dependent sections say so explicitly rather than silently faking data (growth alerts need
`DATABASE_URL`; real sentiment/narrative analysis needs `ANTHROPIC_API_KEY`).

Once `DATABASE_URL` is set:

```bash
npm run db:generate   # generate SQL migration from src/db/schema.ts
npm run db:migrate     # apply it to Neon
npm run db:seed        # load the curated real constituency/election dataset
```

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import it in Vercel ([vercel.com/new](https://vercel.com/new)) or run `vercel --prod` from this
   directory.
3. Add the environment variables above in Vercel's Project Settings, and add the Neon integration
   from the Storage tab for `DATABASE_URL`.
4. Redeploy after adding env vars so they take effect.

## Stack

Next.js 16 (App Router, TypeScript) · Tailwind v4 + shadcn/ui · Recharts · react-simple-maps
(real India constituency boundaries, no map API key needed) · Drizzle ORM + Neon Postgres ·
YouTube Data API v3 · Anthropic Claude for analysis.
