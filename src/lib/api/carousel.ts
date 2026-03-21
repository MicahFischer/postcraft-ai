import { supabase } from "@/lib/supabase";
import { splitPostToSlides } from "@/lib/carousel/split-post";
import type { CarouselTemplate } from "@/lib/types";

export async function saveCarousel(input: {
  postId: string;
  template: CarouselTemplate;
  text?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Unauthorized" };

  const { data: post } = await supabase
    .from("posts")
    .select("id, content")
    .eq("id", input.postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!post) return { ok: false as const, error: "Post not found" };

  const body = input.text ?? post.content;
  const slides = splitPostToSlides(body);

  const { error } = await supabase.from("carousels").upsert(
    {
      post_id: post.id,
      template: input.template,
      slides_json: slides,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "post_id" },
  );

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function saveCarouselSlides(postId: string, slides: unknown) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Unauthorized" };

  const { data: post } = await supabase
    .from("posts")
    .select("id")
    .eq("id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!post) return { ok: false as const, error: "Not found" };

  const { data: carousel } = await supabase
    .from("carousels")
    .select("id")
    .eq("post_id", postId)
    .maybeSingle();

  if (!carousel) return { ok: false as const, error: "No carousel" };

  const { error } = await supabase
    .from("carousels")
    .update({
      slides_json: slides as object[],
      updated_at: new Date().toISOString(),
    })
    .eq("id", carousel.id);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
