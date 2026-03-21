import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PostGenerator } from "@/components/postcraft/post-generator";
import { parseVoiceProfile } from "@/lib/voice-profile";
import { getPostById } from "@/lib/api/posts";
import { useProfile } from "@/providers";
import { Loader2 } from "lucide-react";

export function GeneratePage() {
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get("draft") ?? undefined;
  const topicHint = searchParams.get("topic")
    ? decodeURIComponent(searchParams.get("topic")!)
    : undefined;

  const { profile, loading: profileLoading } = useProfile();
  const voice = parseVoiceProfile(profile?.voice_profile_json ?? null);

  const [initialDraft, setInitialDraft] = useState<{
    topic: string;
    variants: string[];
  } | null>(null);
  const [draftLoading, setDraftLoading] = useState(Boolean(draftId));

  useEffect(() => {
    if (!draftId) {
      setInitialDraft(null);
      setDraftLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const post = await getPostById(draftId);
      if (cancelled || !post) {
        if (!cancelled) setDraftLoading(false);
        return;
      }
      const variants = post.variants_json as unknown;
      const arr = Array.isArray(variants) ? variants : [];
      const strings = arr.filter((v): v is string => typeof v === "string");
      setInitialDraft({
        topic: post.content.slice(0, 800),
        variants: strings.length ? strings : [post.content],
      });
      setDraftLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [draftId]);

  const key = useMemo(() => [draftId ?? "new", topicHint ?? ""].join("::"), [draftId, topicHint]);

  if (profileLoading || draftLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generate</h1>
        <p className="text-muted-foreground">
          Your voice profile is applied to every run. Tune tone, length, and hooks on the left.
        </p>
      </div>
      <PostGenerator
        key={key}
        voice={voice}
        initialDraft={initialDraft}
        topicHint={topicHint}
      />
    </div>
  );
}
