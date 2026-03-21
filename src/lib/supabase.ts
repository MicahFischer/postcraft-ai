import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!url || !anonKey) {
  const hint = import.meta.env.PROD
    ? "Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your host (e.g. Vercel → Project → Settings → Environment Variables) for Production, then redeploy. Names must include the VITE_ prefix."
    : "Copy .env.example to .env and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.";
  throw new Error(`Supabase client: missing env. ${hint}`);
}

export const supabase = createClient(url, anonKey);
