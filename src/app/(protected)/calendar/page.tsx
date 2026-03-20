import { calendarPosts } from "@/actions/schedule";
import { ContentCalendar } from "@/components/postcraft/content-calendar";

export default async function CalendarPage() {
  const raw = await calendarPosts();
  const initialPosts = raw.map((p) => ({
    id: p.id,
    content: p.content,
    status: p.status,
    scheduledAt: p.scheduledAt?.toISOString() ?? null,
    updatedAt: p.updatedAt.toISOString(),
  }));

  return <ContentCalendar initialPosts={initialPosts} />;
}
