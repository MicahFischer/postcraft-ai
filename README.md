# PostCraft AI

LinkedIn content workflow: **voice profile** → **AI post generation** (variants) → **carousel PDF** → **calendar scheduling** (manual copy to LinkedIn; no LinkedIn API in MVP).

## Stack

- **Vite** + **React** + **TypeScript** + **Tailwind** + shadcn/ui  
- **Supabase Auth** (email/password) + **Supabase Postgres** with **Row Level Security**  
- **Supabase Edge Function** `generate-post` — OpenAI `gpt-4o-mini` (API key stays server-side)  
- **html2canvas** + **pdf-lib** for carousel PDF export (browser)  

## Setup

### 1. Supabase project

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. **SQL Editor** (or CLI): run the migration in [`supabase/migrations/20250320190000_vite_supabase.sql`](supabase/migrations/20250320190000_vite_supabase.sql).  
   - If you already have tables with the same names, back up data first or use a fresh project.
3. **Authentication → Providers**: enable **Email**; for local dev you may disable “Confirm email” so sign-up signs in immediately.

### 2. Edge Function (post generation)

OpenAI must not run in the browser. Deploy the bundled function:

```bash
# Install Supabase CLI: https://supabase.com/docs/guides/cli
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set OPENAI_API_KEY=sk-...
supabase functions deploy generate-post
```

The function reads the user’s voice profile from `profiles` and calls OpenAI. `SUPABASE_URL` and `SUPABASE_ANON_KEY` are available in the Edge runtime; set **`OPENAI_API_KEY`** as a function secret.

### 3. Environment variables (Vite app)

Copy `.env.example` to `.env`:

| Variable | Purpose |
| -------- | ------- |
| `VITE_SUPABASE_URL` | Project URL (Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | `anon` `public` key (Settings → API) |

### 4. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (port set in `vite.config.ts`).

## Deploy (e.g. Vercel)

1. **Framework preset:** In **Project → Settings → General**, set **Framework Preset** to **Vite** (not Next.js). If it still says Next.js, the build will fail looking for the `next` package.
2. **Build:** `npm run build` → output in **`dist/`**. [`vercel.json`](vercel.json) pins **`framework`: `vite`**, **`buildCommand`**, **`outputDirectory`**, and SPA **rewrites**.
3. Set **`VITE_SUPABASE_URL`** and **`VITE_SUPABASE_ANON_KEY`** under **Environment Variables** for Production (and Preview if needed).

## Project layout

- `src/` — React app, React Router, UI  
- `src/lib/api/` — Supabase data calls (RLS applies per logged-in user)  
- `supabase/migrations/` — Postgres schema + RLS + auth trigger for `profiles`  
- `supabase/functions/generate-post/` — Edge Function for OpenAI  

## Migrating from the old Next.js + Prisma app

That stack used different tables (`User`, `Post`, …) and Auth.js. This version uses **`auth.users`** + **`public.profiles`**. Treat this as a **new schema**; migrate data manually if needed.
