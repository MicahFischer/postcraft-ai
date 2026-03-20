"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function schedulePost(postId: string, scheduledAt: Date) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };

  const post = await prisma.post.findFirst({
    where: { id: postId, userId: session.user.id },
  });
  if (!post) return { ok: false as const, error: "Not found" };

  await prisma.post.update({
    where: { id: postId },
    data: {
      status: "SCHEDULED",
      scheduledAt,
    },
  });

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function reschedulePost(postId: string, scheduledAt: Date | null) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };

  const post = await prisma.post.findFirst({
    where: { id: postId, userId: session.user.id },
  });
  if (!post) return { ok: false as const, error: "Not found" };

  await prisma.post.update({
    where: { id: postId },
    data: {
      scheduledAt,
      status: scheduledAt ? "SCHEDULED" : "DRAFT",
    },
  });

  revalidatePath("/calendar");
  return { ok: true as const };
}

export async function markPosted(postId: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };

  await prisma.post.updateMany({
    where: { id: postId, userId: session.user.id },
    data: { status: "POSTED", scheduledAt: null },
  });

  revalidatePath("/calendar");
  return { ok: true as const };
}

export async function calendarPosts() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.post.findMany({
    where: {
      userId: session.user.id,
      status: { in: ["DRAFT", "SCHEDULED", "POSTED"] },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
}
