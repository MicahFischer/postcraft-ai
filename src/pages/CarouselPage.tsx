import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPostById } from "@/lib/api/posts";
import { supabase } from "@/lib/supabase";
import { splitPostToSlides } from "@/lib/carousel/split-post";
import type { CarouselSlide } from "@/lib/carousel/split-post";
import type { CarouselTemplate } from "@/lib/types";
import { CarouselBuilder } from "@/components/postcraft/carousel-builder";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function CarouselPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postId, setPostId] = useState<string | null>(null);
  const [template, setTemplate] = useState<CarouselTemplate>("MINIMAL");
  const [slides, setSlides] = useState<CarouselSlide[]>([]);

  useEffect(() => {
    if (!id) {
      setError("Missing post id");
      setLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      const post = await getPostById(id);
      if (cancelled) return;
      if (!post) {
        setError("Post not found");
        setLoading(false);
        return;
      }

      setPostId(post.id);

      const { data: carousel } = await supabase
        .from("carousels")
        .select("*")
        .eq("post_id", post.id)
        .maybeSingle();

      if (carousel) {
        const sj = carousel.slides_json as unknown;
        const arr = Array.isArray(sj) ? sj : [];
        setSlides(arr as CarouselSlide[]);
        setTemplate(carousel.template as CarouselTemplate);
      } else {
        const initial = splitPostToSlides(post.content);
        const { error: insErr } = await supabase.from("carousels").insert({
          post_id: post.id,
          template: "MINIMAL",
          slides_json: initial,
        });
        if (insErr) {
          setError(insErr.message);
          setLoading(false);
          return;
        }
        setSlides(initial);
        setTemplate("MINIMAL");
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !postId) {
    return (
      <p className="text-destructive">{error ?? "Not found"}</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Carousel</h1>
          <p className="text-muted-foreground">
            LinkedIn-sized slides. Export PDF and upload as a document carousel.
          </p>
        </div>
        <Link to="/generate" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to generator
        </Link>
      </div>
      <CarouselBuilder
        postId={postId}
        initialTemplate={template}
        initialSlides={slides}
      />
    </div>
  );
}
