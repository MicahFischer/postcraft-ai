/**
 * Supabase Postgres expects TLS. Prisma/Node often fail without sslmode=require.
 * Mutates process.env so Prisma datasource reads corrected URLs (fixes Vercel if env omits SSL).
 */
export function patchSupabaseDatabaseEnv(): void {
  for (const key of ["DATABASE_URL", "DIRECT_URL"] as const) {
    const v = process.env[key];
    if (!v) continue;
    if (!isSupabaseHost(v)) continue;
    if (/[?&]sslmode=/i.test(v)) continue;
    process.env[key] = `${v}${v.includes("?") ? "&" : "?"}sslmode=require`;
  }
}

function isSupabaseHost(url: string): boolean {
  try {
    const u = new URL(url.replace(/^postgresql:/i, "https:"));
    const host = u.hostname.toLowerCase();
    return host.endsWith(".supabase.co") || host.endsWith("pooler.supabase.com");
  } catch {
    return /\.supabase\.co\b|pooler\.supabase\.com/i.test(url);
  }
}
