import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VoiceProfileForm } from "@/components/postcraft/voice-profile-form";
import { useProfile } from "@/providers";

export function OnboardingPage() {
  const { profile } = useProfile();

  return (
    <div className="mx-auto max-w-xl py-12">
      <Card>
        <CardHeader>
          <CardTitle>Shape your voice</CardTitle>
          <CardDescription>
            PostCraft uses this profile on every generation. You can refine it anytime in
            settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VoiceProfileForm
            initial={null}
            linkedInUrl={profile?.profile_url}
            submitLabel="Continue to dashboard"
            redirectTo="/dashboard"
          />
        </CardContent>
      </Card>
    </div>
  );
}
