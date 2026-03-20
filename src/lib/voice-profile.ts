import { z } from "zod";

export const voiceProfileSchema = z.object({
  tone: z.string().min(1),
  sentence_structure: z.string().optional(),
  content_pillars: z.array(z.string()).default([]),
  hook_style: z.enum(["contrarian", "story", "educational", "question"]).default("educational"),
  reading_level: z.string().optional(),
  format_preferences: z.array(z.string()).default([]),
  audience: z.string().optional(),
  writing_length: z.enum(["short", "medium", "long"]).default("medium"),
});

export type VoiceProfile = z.infer<typeof voiceProfileSchema>;

export function parseVoiceProfile(json: unknown): VoiceProfile | null {
  const r = voiceProfileSchema.safeParse(json);
  return r.success ? r.data : null;
}
