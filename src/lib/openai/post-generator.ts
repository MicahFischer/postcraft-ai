import OpenAI from "openai";
import type { VoiceProfile } from "@/lib/voice-profile";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type GeneratePostInput = {
  topic: string;
  mode: "create" | "rewrite" | "viral";
  voice: VoiceProfile;
  toneStrength: number;
  length: "short" | "medium" | "long";
  hookType: "contrarian" | "story" | "educational" | "question";
  variantCount: number;
};

const lengthHints: Record<GeneratePostInput["length"], string> = {
  short: "Under 900 characters. Very tight.",
  medium: "Roughly 1200–2000 characters.",
  long: "Up to ~3000 characters with room for nuance.",
};

export async function generateLinkedInPosts(input: GeneratePostInput): Promise<string[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const system = `You are a LinkedIn content strategist. Write posts that match the user's voice profile exactly.
Output must be valid JSON with shape: { "variants": string[] } where each string is a complete LinkedIn post (hook, body, optional CTA, line breaks). No markdown code fences.`;

  const modeInstruction =
    input.mode === "rewrite"
      ? "Rewrite and sharpen the user's idea into a high-performing post."
      : input.mode === "viral"
        ? "Push for bold hooks and strong curiosity—still professional, no clickbait clichés."
        : "Create an original post from the topic.";

  const user = `Voice profile (JSON):
${JSON.stringify(input.voice, null, 2)}

Topic / idea:
${input.topic}

Mode: ${modeInstruction}
Tone intensity (0–100): ${input.toneStrength}
Target length: ${lengthHints[input.length]}
Hook style: ${input.hookType}
Number of distinct variants: ${input.variantCount}

Constraints:
- Strong hook in the first line
- Short paragraphs, line breaks for readability
- No fluff, no "In today's world" filler
- Optional clear CTA on last line when natural
- No hashtags unless they fit the voice profile`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.85,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("No response from model");

  const parsed = JSON.parse(raw) as { variants?: string[] };
  const variants = Array.isArray(parsed.variants) ? parsed.variants : [];
  return variants.filter((v) => typeof v === "string" && v.trim().length > 0);
}
