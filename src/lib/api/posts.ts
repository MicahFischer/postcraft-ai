import { supabase } from "@/lib/supabase";
import type { CalendarPost, PostStatus } from "@/lib/types";

async function getUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function saveDraftPost(input: {
  content: string;
  variants: string[];
  metadata?: Record<string, unknown>;
}) {
  const userId = await getUserId();
  if (!userId) return { ok: false as const, error: "Unauthorized" };

  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: userId,
      content: input.content,
      variants_json: input.variants,
      status: "DRAFT",
      metadata: input.metadata ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[saveDraftPost]", error);
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const, id: data.id };
}

export async function listPosts() {
  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[listPosts]", error);
    return [];
  }
  return data ?? [];
}

export async function schedulePost(postId: string, scheduledAt: Date) {
  const userId = await getUserId();
  if (!userId) return { ok: false as const, error: "Unauthorized" };

  const { data: row } = await supabase
    .from("posts")
    .select("id")
    .eq("id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!row) return { ok: false as const, error: "Not found" };

  const { error } = await supabase
    .from("posts")
    .update({
      status: "SCHEDULED",
      scheduled_at: scheduledAt.toISOString(),
    })
    .eq("id", postId);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function reschedulePost(postId: string, scheduledAt: Date | null) {
  const userId = await getUserId();
  if (!userId) return { ok: false as const, error: "Unauthorized" };

  const { data: row } = await supabase
    .from("posts")
    .select("id")
    .eq("id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!row) return { ok: false as const, error: "Not found" };

  const { error } = await supabase
    .from("posts")
    .update({
      scheduled_at: scheduledAt ? scheduledAt.toISOString() : null,
      status: scheduledAt ? "SCHEDULED" : "DRAFT",
    })
    .eq("id", postId);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function markPosted(postId: string) {
  const userId = await getUserId();
  if (!userId) return { ok: false as const, error: "Unauthorized" };

  const { error } = await supabase
    .from("posts")
    .update({ status: "POSTED", scheduled_at: null })
    .eq("id", postId)
    .eq("user_id", userId);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function calendarPosts() {
  const userId = await getUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["DRAFT", "SCHEDULED", "POSTED"])
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[calendarPosts]", error);
    return [];
  }
  return data ?? [];
}

export async function getPostById(id: string) {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[getPostById]", error);
    return null;
  }
  return data;
}

export function toCalendarPost(p: {
  id: string;
  content: string;
  status: string;
  scheduled_at: string | null;
  updated_at: string;
}): CalendarPost {
  return {
    id: p.id,
    content: p.content,
    status: p.status as PostStatus,
    scheduledAt: p.scheduled_at,
    updatedAt: p.updated_at,
  };
}
