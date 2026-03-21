import { supabase } from "@/lib/supabase";
import { voiceProfileSchema, type VoiceProfile } from "@/lib/voice-profile";

export type ProfileRow = {
  id: string;
  full_name: string | null;
  profile_url: string | null;
  voice_profile_json: unknown;
  timezone: string | null;
};

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[fetchProfile]", error);
    return null;
  }
  return data as ProfileRow | null;
}

export async function saveVoiceProfile(profile: VoiceProfile) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Unauthorized" };

  const parsed = voiceProfileSchema.safeParse(profile);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid profile" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ voice_profile_json: parsed.data, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function saveProfileUrl(profileUrl: string | null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Unauthorized" };

  const { error } = await supabase
    .from("profiles")
    .update({ profile_url: profileUrl || null, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function saveTimezone(timezone: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Unauthorized" };

  const { error } = await supabase
    .from("profiles")
    .update({ timezone, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
