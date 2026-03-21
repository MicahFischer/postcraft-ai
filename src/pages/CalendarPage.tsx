import { useEffect, useState } from "react";
import { calendarPosts, toCalendarPost } from "@/lib/api/posts";
import { ContentCalendar } from "@/components/postcraft/content-calendar";
import type { CalendarPost } from "@/lib/types";
import { Loader2 } from "lucide-react";

export function CalendarPage() {
  const [initialPosts, setInitialPosts] = useState<CalendarPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const raw = await calendarPosts();
      if (cancelled) return;
      setInitialPosts(
        raw.map((p) =>
          toCalendarPost({
            id: p.id,
            content: p.content,
            status: p.status,
            scheduled_at: p.scheduled_at,
            updated_at: p.updated_at,
          }),
        ),
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <ContentCalendar initialPosts={initialPosts} />;
}
