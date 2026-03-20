import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VoiceProfileForm } from "@/components/postcraft/voice-profile-form";

export default async function OnboardingPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id },
  });

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
            linkedInUrl={user?.profileUrl}
            submitLabel="Continue to dashboard"
            redirectTo="/dashboard"
          />
        </CardContent>
      </Card>
    </div>
  );
}
