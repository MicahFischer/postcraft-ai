import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AppShell } from "@/components/postcraft/app-shell";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";
  const isOnboarding = pathname.startsWith("/onboarding");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (user && !user.voiceProfileJson && !isOnboarding) {
    redirect("/onboarding");
  }

  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {children}
      </div>
    );
  }

  return <AppShell user={session.user}>{children}</AppShell>;
}
