import { Link } from "react-router-dom";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

export function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <span className="font-semibold tracking-tight">PostCraft AI</span>
          <div className="flex gap-2">
            <Link to="/login" className={cn(buttonVariants({ variant: "ghost" }))}>
              Log in
            </Link>
            <Link to="/register" className={cn(buttonVariants())}>
              Get started
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-3xl flex-1 flex-col justify-center gap-8 px-4 py-20">
        <p className="text-sm font-medium text-primary">LinkedIn content engine</p>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Your voice. Your calendar. Posts that sound like you.
        </h1>
        <p className="text-lg text-muted-foreground">
          Generate personalized posts and carousels, then schedule or copy to LinkedIn—no
          generic AI slop, no juggling five tools.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/register" className={cn(buttonVariants({ size: "lg" }))}>
            Create account
          </Link>
          <Link
            to="/login"
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
          >
            I have an account
          </Link>
        </div>
      </main>
    </div>
  );
}
