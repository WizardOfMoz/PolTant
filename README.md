# Constituency Pulse

A constituency-level social/new-media sentiment and influence-tracking prototype for Indian Lok
Sabha seats — real historical election data for swing-tier classification, real YouTube content
and real public news RSS feeds, analyzed by a real LLM (Claude) for topic/sentiment/narrative.
Built from `docs/PRD_Social_Sentiment_Constituency_Platform.pdf`.

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
| `DATABASE_URL` | Persisting real fetched data / caching LLM analysis | Neon Postgres connection string — via Vercel's "Neon" marketplace integration (Storage tab → Browse Marketplace → Neon), or directly from [console.neon.tech](https://console.neon.tech) |
| `YOUTUBE_API_KEY` | Real YouTube ingestion | [Google Cloud Console](https://console.cloud.google.com/) → create/select a project → APIs & Services → Library → enable **YouTube Data API v3** → Credentials → Create Credentials → API key. Restrict the key to "YouTube Data API v3" only. |
| `ANTHROPIC_API_KEY` | Real sentiment/topic/narrative analysis | [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) |
| `SITE_PASSWORD` | The login gate | Any string you choose — share it out-of-band with people you send the link to |
| `X_BEARER_TOKEN`, `META_ACCESS_TOKEN` | Optional — activates the X/Meta adapters | Only if you separately have paid X API / approved Meta Page Public Content Access |

Without `DATABASE_URL`/`YOUTUBE_API_KEY`/`ANTHROPIC_API_KEY` set, the app still runs and is
navigable — data-dependent sections say so explicitly rather than silently faking data.

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
