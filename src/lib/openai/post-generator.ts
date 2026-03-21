import type { VoiceProfile } from "@/lib/voice-profile";

/** Client-side type for generator inputs; the Edge Function loads voice from Supabase. */
export type GeneratePostInput = {
  topic: string;
  mode: "create" | "rewrite" | "viral";
  voice: VoiceProfile;
  toneStrength: number;
  length: "short" | "medium" | "long";
  hookType: "contrarian" | "story" | "educational" | "question";
  variantCount: number;
};
