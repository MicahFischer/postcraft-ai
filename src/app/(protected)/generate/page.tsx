import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { parseVoiceProfile } from "@/lib/voice-profile";
import { PostGenerator } from "@/components/postcraft/post-generator";

export default async function GeneratePage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string; topic?: string }>;
}) {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id },
  });
  const voice = parseVoiceProfile(user?.voiceProfileJson ?? null);

  const sp = await searchParams;
  const topicHint =
    typeof sp.topic === "string" ? decodeURIComponent(sp.topic) : undefined;
  const draftId = sp.draft;
  let initialDraft: {
    topic: string;
    variants: string[];
  } | null = null;
  if (draftId) {
    const post = await prisma.post.findFirst({
      where: { id: draftId, userId: session!.user!.id },
    });
    if (post) {
      const variants = post.variantsJson as string[];
      initialDraft = {
        topic: post.content.slice(0, 800),
        variants: Array.isArray(variants) ? variants : [post.content],
      };
    }
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
        key={[draftId ?? "new", topicHint ?? ""].join("::")}
        voice={voice}
        initialDraft={initialDraft}
        topicHint={topicHint}
      />
    </div>
  );
}
