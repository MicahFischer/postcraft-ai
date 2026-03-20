import Link from "next/link";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const session = await auth();
  const posts = await prisma.post.findMany({
    where: { userId: session!.user!.id },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Drafts and scheduled posts. Generate something new or open a draft.
          </p>
        </div>
        <Link href="/generate" className={cn(buttonVariants())}>
          New post
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {posts.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>No posts yet</CardTitle>
              <CardDescription>
                Start with the generator—we will save drafts here automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/generate" className={cn(buttonVariants())}>
                Generate a post
              </Link>
            </CardContent>
          </Card>
        ) : (
          posts.map((p) => (
            <Card key={p.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                <CardTitle className="line-clamp-2 text-base font-medium leading-snug">
                  {p.content.slice(0, 120)}
                  {p.content.length > 120 ? "…" : ""}
                </CardTitle>
                <Badge variant="outline">{p.status}</Badge>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Link
                  href={`/generate?draft=${p.id}`}
                  className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                >
                  Edit in generator
                </Link>
                <Link
                  href={`/posts/${p.id}/carousel`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Carousel
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
