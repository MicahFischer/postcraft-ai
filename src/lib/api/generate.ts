import { supabase } from "@/lib/supabase";
import type { GeneratePostInput } from "@/lib/openai/post-generator";

export async function generatePostsAction(input: Omit<GeneratePostInput, "voice">) {
  const { data, error } = await supabase.functions.invoke<{ variants?: string[] }>(
    "generate-post",
    {
      body: input,
    },
  );

  if (error) {
    console.error("[generate-post]", error);
    return { ok: false as const, error: error.message || "Generation failed" };
  }

  if (data && typeof data === "object" && "error" in data && data.error) {
    return { ok: false as const, error: String(data.error) };
  }

  const variants = Array.isArray(data?.variants) ? data.variants : [];
  return { ok: true as const, variants };
}
