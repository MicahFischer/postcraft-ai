import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { splitPostToSlides } from "@/lib/carousel/split-post";
import type { CarouselSlide } from "@/lib/carousel/split-post";
import { CarouselBuilder } from "@/components/postcraft/carousel-builder";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

export default async function CarouselPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const post = await prisma.post.findFirst({
    where: { id, userId: session!.user!.id },
    include: { carousel: true },
  });
  if (!post) notFound();

  let carousel = post.carousel;
  if (!carousel) {
    const slides = splitPostToSlides(post.content);
    carousel = await prisma.carousel.create({
      data: {
        postId: post.id,
        template: "MINIMAL",
        slidesJson: slides,
      },
    });
  }

  const slides = carousel.slidesJson as unknown as CarouselSlide[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Carousel</h1>
          <p className="text-muted-foreground">
            LinkedIn-sized slides. Export PDF and upload as a document carousel.
          </p>
        </div>
        <Link
          href="/generate"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Back to generator
        </Link>
      </div>
      <CarouselBuilder
        postId={post.id}
        initialTemplate={carousel.template}
        initialSlides={Array.isArray(slides) ? slides : []}
      />
    </div>
  );
}
