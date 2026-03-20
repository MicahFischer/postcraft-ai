/** Seeded hook / topic library (Phase 1 — no live scraping). */

export const TOPICS = [
  "Design systems",
  "AI in product",
  "Career pivots",
  "Startup lessons",
  "Leadership",
  "Developer experience",
  "User research",
  "Personal branding",
] as const;

export const HOOKS: string[] = [
  "Most designers overcomplicate design systems. Here’s why.",
  "I rejected a $X offer. Best decision I made this year.",
  "The best PMs don’t ship faster. They ship clearer.",
  "Your portfolio isn’t the problem. Your narrative is.",
  "AI won’t replace you. Someone using AI will.",
  "If your roadmap is a wish list, you’re not prioritizing.",
  "I spent 10 years learning this so you don’t have to.",
  "Stop asking for feedback. Start asking for decisions.",
  "Remote work didn’t kill culture. Bad leadership did.",
  "The metric everyone tracks is lying to you.",
];

export function dailySuggestions(seed: string, pillars: string[]) {
  const day = hashDay(seed);
  const hooks = [...HOOKS];
  const topics = [...TOPICS];

  const pick = <T>(arr: T[], i: number) => arr[i % arr.length];

  const pillarMatch = pillars.length
    ? hooks.filter((h) =>
        pillars.some((p) => h.toLowerCase().includes(p.slice(0, 4).toLowerCase())),
      )
    : [];

  const pool = pillarMatch.length >= 3 ? pillarMatch : hooks;
  const out: { hook: string; topic: string }[] = [];
  for (let i = 0; i < 5; i++) {
    out.push({
      hook: pick(pool, day + i),
      topic: pick(topics, day + i * 2),
    });
  }
  return out;
}

function hashDay(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const d = new Date();
  const key = `${s}-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h;
}
