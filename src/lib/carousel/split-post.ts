export type CarouselSlide = {
  order: number;
  title?: string;
  body: string;
};

/** Split post text into slides: hook, key points, CTA when detectable. */
export function splitPostToSlides(text: string): CarouselSlide[] {
  const trimmed = text.trim();
  if (!trimmed) return [{ order: 0, body: "Add your idea" }];

  const lines = trimmed
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const slides: CarouselSlide[] = [];
  slides.push({ order: 0, title: "Hook", body: lines[0] ?? trimmed });

  const rest = lines.slice(1);
  if (rest.length === 0) {
    slides.push({
      order: 1,
      title: "Takeaway",
      body: "Add bullets or short paragraphs in your post to fill more slides.",
    });
    return slides;
  }

  const bulletOrNumbered = rest.filter((l) => /^[-•*]\s|^\d+\.\s/.test(l));
  const useLines = bulletOrNumbered.length ? bulletOrNumbered : rest;

  useLines.forEach((line, i) => {
    const clean = line.replace(/^[-•*]\s|^\d+\.\s/, "").trim();
    if (!clean) return;
    slides.push({
      order: i + 1,
      title: `Point ${i + 1}`,
      body: clean,
    });
  });

  const last = lines[lines.length - 1];
  const first = lines[0];
  if (
    last &&
    last !== first &&
    (/\?$/.test(last) ||
      /follow|comment|dm|subscribe|reply/i.test(last))
  ) {
    const already = slides.some((s) => s.body === last);
    if (!already) {
      slides.push({ order: slides.length, title: "CTA", body: last });
    }
  }

  return slides.map((s, i) => ({ ...s, order: i }));
}
