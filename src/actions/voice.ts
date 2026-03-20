"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { voiceProfileSchema, type VoiceProfile } from "@/lib/voice-profile";
import { revalidatePath } from "next/cache";

export async function saveVoiceProfile(profile: VoiceProfile) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };

  const parsed = voiceProfileSchema.safeParse(profile);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid profile" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { voiceProfileJson: parsed.data },
  });

  revalidatePath("/");
  revalidatePath("/settings/voice");
  revalidatePath("/onboarding");
  return { ok: true as const };
}

export async function saveProfileUrl(profileUrl: string | null) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { profileUrl: profileUrl || null },
  });
  return { ok: true as const };
}

export async function saveTimezone(timezone: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { timezone },
  });
  revalidatePath("/calendar");
  return { ok: true as const };
}
