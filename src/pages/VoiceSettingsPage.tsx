import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VoiceProfileForm } from "@/components/postcraft/voice-profile-form";
import { parseVoiceProfile } from "@/lib/voice-profile";
import { useProfile } from "@/providers";

export function VoiceSettingsPage() {
  const { profile } = useProfile();
  const voice = parseVoiceProfile(profile?.voice_profile_json ?? null);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Voice profile</h1>
        <p className="text-muted-foreground">
          Everything generated on PostCraft references this profile.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your system</CardTitle>
          <CardDescription>Editable anytime—your posts stay on-brand.</CardDescription>
        </CardHeader>
        <CardContent>
          <VoiceProfileForm
            initial={voice}
            linkedInUrl={profile?.profile_url}
            submitLabel="Save changes"
            redirectTo="/settings/voice"
          />
        </CardContent>
      </Card>
    </div>
  );
}
