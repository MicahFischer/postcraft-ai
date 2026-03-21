# Create a database in Supabase (for PostCraft)

Supabase gives you a **managed Postgres** instance. You create it by creating a **project** (each project = one database).

## 1. Sign up / log in

Open **[supabase.com/dashboard](https://supabase.com/dashboard)** and sign in (GitHub, etc.).

## 2. New project

1. Click **New project**.
2. Choose your **organization** (create one if prompted).
3. **Name:** e.g. `postcraft` or `postcraft-ai`.
4. **Database password:** generate a strong password and **save it** (you’ll need it in connection strings). You can reset it later under **Project Settings → Database**.
5. **Region:** pick one close to you (and close to Vercel if you deploy there, e.g. `us-east-1`).
6. Click **Create new project** and wait until status is **Healthy** (~1–2 minutes).

## 3. Connection strings for PostCraft

1. In the project: **Project Settings** (gear) → **Database**.
2. Under **Connection string**, open the **URI** tab.

### Easiest (local dev or simple deploy)

- Copy **Direct connection** (port **5432**).
- Replace `[YOUR-PASSWORD]` with your database password.
- Use the **same** value for both in `.env` / Vercel:

  - `DATABASE_URL`
  - `DIRECT_URL`

### Recommended for Vercel (serverless)

- **`DATABASE_URL`:** **Transaction pooler** URI (port **6543**), and append **`?pgbouncer=true`** to the query string (if not already there).
- **`DIRECT_URL`:** **Direct connection** URI (port **5432**), no `pgbouncer`.

Optional: append **`&connect_timeout=15`** to avoid long hangs on bad networks.

## 4. Apply PostCraft schema

From your machine (with the same `DATABASE_URL` / `DIRECT_URL` in `.env`):

```bash
npx prisma migrate deploy
```

## 5. Network issues

If Prisma or the app **can’t connect** from your laptop:

- **Project Settings → Database → Network / Connection restrictions** — allow your IP or use the **pooler** URI as in the [Supabase Postgres docs](https://supabase.com/docs/guides/database/connecting-to-postgres).

## 6. Optional: Supabase CLI

To manage projects from the terminal later:

```bash
brew install supabase/tap/supabase   # macOS
supabase login
supabase projects list
```

Creating a **hosted** project is still done in the dashboard (or Supabase API with an access token).
