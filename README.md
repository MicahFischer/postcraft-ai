# PostCraft AI

Full-stack LinkedIn content workflow: **voice profile** → **AI post generation** (variants) → **carousel PDF** → **calendar scheduling** (manual copy to LinkedIn; no LinkedIn API in MVP).

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind + shadcn/ui  
- **PostgreSQL** + **Prisma**  
- **Auth.js** (NextAuth v5) with email/password (bcrypt)  
- **OpenAI** (`gpt-4o-mini`) for post generation  
- **html2canvas** + **pdf-lib** for carousel PDF export  

## Setup

### 1. Supabase database

Step-by-step (new project + passwords + URLs): **[docs/supabase-new-database.md](docs/supabase-new-database.md)**.

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard) (**New project**).
2. Open **Project Settings → Database** and find **Connection string**.
3. Copy your **database password** (set when the project was created; reset it here if needed).
4. Configure `.env` (see [`.env.example`](.env.example)):

   **Simplest (direct connection, good for local dev):**  
   Use the **URI** labeled **Direct connection** (port `5432`). Set **`DATABASE_URL`** and **`DIRECT_URL`** to the **same** string (Prisma uses `DIRECT_URL` for migrations).

   **Pooled connection (e.g. Vercel / serverless):**  
   - **`DATABASE_URL`**: **Transaction pooler** URI (port `6543`) and append **`?pgbouncer=true`**.  
   - **`DIRECT_URL`**: **Direct connection** URI (port `5432`) — used only for `prisma migrate`.

5. **IPv4 network** (if `Can't reach database server` from your machine):  
   In Supabase **Project Settings → Database → Network restrictions**, allow your IP or use the pooler as documented in [Supabase networking](https://supabase.com/docs/guides/database/connecting-to-postgres).

### 2. Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable        | Purpose |
| --------------- | ------- |
| `DATABASE_URL`  | Postgres URL (direct or pooled; see above) |
| `DIRECT_URL`    | Direct Postgres URL (same as `DATABASE_URL` if not using pooler) |
| `AUTH_SECRET`   | Long random string: `openssl rand -base64 32` |
| `OPENAI_API_KEY`| OpenAI API key |

### 3. Migrate & run

```bash
npm install
npx prisma generate
npx prisma migrate deploy
# first time / dev schema iteration:
# npx prisma migrate dev

npm run dev
```

Open [http://localhost:3000](http://localhost:3000), register, complete onboarding, then use **Generate**, **Calendar**, and **Carousel**.

### Local Postgres (optional)

If you prefer Docker instead of Supabase, use `docker compose up -d` and set **`DATABASE_URL`** and **`DIRECT_URL`** to the same local URL (see comments in `.env.example`).

## Deploy to Vercel

The app is a standard Next.js project; the build runs **`prisma generate`** automatically (see `package.json` → `build`).

### 1. Push code to Git

Vercel deploys from GitHub/GitLab/Bitbucket, or you can use the [Vercel CLI](https://vercel.com/docs/cli).

### 2. Create the project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import your repository.
2. **Framework Preset:** Next.js (default).
3. **Build Command:** `npm run build` (default — already includes Prisma).
4. **Install Command:** `npm install` (default).

### 3. Environment variables (Vercel → Project → Settings → Environment Variables)

Add these for **Production** (and Preview if you want preview DB/auth behavior):

| Name | Value | Notes |
|------|--------|--------|
| `DATABASE_URL` | Supabase **Transaction pooler** URI + `?pgbouncer=true` | Port **6543**; avoids exhausting connections on serverless. [Supabase + Prisma](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler) |
| `DIRECT_URL` | Supabase **Direct** connection URI | Port **5432**; required by Prisma schema (migrations / introspection). |
| `AUTH_SECRET` | Long random string | Same as local: `openssl rand -base64 32` |
| `AUTH_URL` | `https://<your-project>.vercel.app` | Your production URL (no trailing slash). Update if you add a custom domain. |
| `OPENAI_API_KEY` | Your OpenAI key | Required for Generate. |

`trustHost` is already enabled in auth config so Vercel hostnames work; `AUTH_URL` still keeps callbacks and links correct.

### 4. Run database migrations (once per schema change)

Migrations are **not** run on each Vercel build (by design). After the first deploy (or when you add migrations), apply them against Supabase from your machine:

```bash
# Use the same DIRECT_URL (or DATABASE_URL if direct-only) as in Supabase
export DIRECT_URL="postgresql://postgres:...@db....supabase.co:5432/postgres"
export DATABASE_URL="$DIRECT_URL"   # or your pooled URL if Prisma accepts it for migrate
npx prisma migrate deploy
```

Or set `DATABASE_URL` / `DIRECT_URL` in a local `.env` pointing at Supabase and run `npx prisma migrate deploy`.

### 5. Redeploy

Trigger a redeploy from the Vercel dashboard after changing env vars.

### CLI (optional)

```bash
npx vercel login
npx vercel link
npx vercel env pull .env.local   # optional: sync env for local preview
npx vercel --prod
```

---

## Scripts

| Command              | Description              |
| -------------------- | ------------------------ |
| `npm run dev`        | Development server       |
| `npm run build`      | `prisma generate` + production build (Vercel uses this) |
| `npm run db:migrate` | Prisma migrate (dev)     |
| `npm run db:push`    | Push schema (prototyping)|

## Notes

- **Scheduling**: Drag drafts onto a day; times default to **9:00** local. There is no LinkedIn auto-post—use **Copy** and paste manually.
- **Carousel PDF**: Client-side render to canvas then PDF; very long posts may need shorter slides.
- **Hooks & topics**: Seeded library only (no live scraping in MVP).
