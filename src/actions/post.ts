"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { generateLinkedInPosts, type GeneratePostInput } from "@/lib/openai/post-generator";
import type { VoiceProfile } from "@/lib/voice-profile";
import { revalidatePath } from "next/cache";

export async function generatePostsAction(input: Omit<GeneratePostInput, "voice">) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const voice = user?.voiceProfileJson as VoiceProfile | null;
  if (!voice) {
    return { ok: false as const, error: "Complete voice profile first" };
  }

  try {
    const variants = await generateLinkedInPosts({ ...input, voice });
    return { ok: true as const, variants };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Generation failed";
    return { ok: false as const, error: msg };
  }
}

export async function saveDraftPost(input: {
  content: string;
  variants: string[];
  metadata?: Record<string, unknown>;
}) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };

  const post = await prisma.post.create({
    data: {
      userId: session.user.id,
      content: input.content,
      variantsJson: input.variants,
      status: "DRAFT",
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  return { ok: true as const, id: post.id };
}

export async function updatePostContent(id: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };

  const post = await prisma.post.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!post) return { ok: false as const, error: "Not found" };

  await prisma.post.update({
    where: { id },
    data: { content },
  });
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function listPosts() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.post.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
}
