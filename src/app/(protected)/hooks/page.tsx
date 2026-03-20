import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { parseVoiceProfile } from "@/lib/voice-profile";
import { dailySuggestions } from "@/lib/prompts/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function HooksPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id },
  });
  const voice = parseVoiceProfile(user?.voiceProfileJson ?? null);
  const pillars = voice?.content_pillars ?? [];
  const suggestions = dailySuggestions(session!.user!.id, pillars);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hooks & topics</h1>
        <p className="text-muted-foreground">
          Curated seeds (no live scraping in MVP). Picks rotate daily and lean on your content
          pillars when they match.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {suggestions.map((s, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="text-base leading-snug">{s.hook}</CardTitle>
              <CardDescription>Topic: {s.topic}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href={`/generate?topic=${encodeURIComponent(s.topic + " — " + s.hook)}`}
                className={cn(buttonVariants({ size: "sm", variant: "secondary" }))}
              >
                Use in generator
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
