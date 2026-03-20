"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { splitPostToSlides } from "@/lib/carousel/split-post";
import { CarouselTemplate } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function saveCarousel(input: {
  postId: string;
  template: CarouselTemplate;
  text?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };

  const post = await prisma.post.findFirst({
    where: { id: input.postId, userId: session.user.id },
  });
  if (!post) return { ok: false as const, error: "Post not found" };

  const body = input.text ?? post.content;
  const slides = splitPostToSlides(body);

  await prisma.carousel.upsert({
    where: { postId: post.id },
    create: {
      postId: post.id,
      template: input.template,
      slidesJson: slides,
    },
    update: {
      template: input.template,
      slidesJson: slides,
    },
  });

  revalidatePath(`/posts/${post.id}/carousel`);
  return { ok: true as const };
}

export async function saveCarouselSlides(postId: string, slides: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };

  const post = await prisma.post.findFirst({
    where: { id: postId, userId: session.user.id },
  });
  if (!post) return { ok: false as const, error: "Not found" };

  const carousel = await prisma.carousel.findUnique({ where: { postId } });
  if (!carousel) return { ok: false as const, error: "No carousel" };

  await prisma.carousel.update({
    where: { id: carousel.id },
    data: { slidesJson: slides as object[] },
  });

  revalidatePath(`/posts/${postId}/carousel`);
  return { ok: true as const };
}
