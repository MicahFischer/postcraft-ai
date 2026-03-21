import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  addDays,
  addWeeks,
  format,
  isSameDay,
  startOfWeek,
  setHours,
  setMinutes,
} from "date-fns";
import { reschedulePost } from "@/lib/api/posts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, GripVertical } from "lucide-react";
import type { CalendarPost } from "@/lib/types";

export type { CalendarPost };

function PostCard({
  post,
  dragId,
}: {
  post: CalendarPost;
  dragId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: dragId, data: { post } });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "opacity-50" : ""}>
      <Card className="cursor-grab active:cursor-grabbing">
        <CardHeader className="flex flex-row items-start gap-2 space-y-0 p-3 pb-2">
          <button
            type="button"
            className="mt-0.5 text-muted-foreground hover:text-foreground"
            {...listeners}
            {...attributes}
            aria-label="Drag to reschedule"
          >
            <GripVertical className="size-4" />
          </button>
          <div className="min-w-0 flex-1">
            <Badge variant="outline" className="text-[10px]">
              {post.status}
            </Badge>
            <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
              {post.content}
            </p>
          </div>
        </CardHeader>
        <CardContent className="flex gap-2 p-3 pt-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => void navigator.clipboard.writeText(post.content)}
          >
            <Copy className="mr-1 size-3" />
            Copy
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function DayColumn({
  day,
  children,
}: {
  day: Date;
  children: React.ReactNode;
}) {
  const id = format(day, "yyyy-MM-dd");
  const { setNodeRef, isOver } = useDroppable({ id: `day-${id}` });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[220px] flex-1 rounded-lg border border-dashed p-2 transition-colors ${
        isOver ? "border-primary bg-primary/5" : "border-muted bg-muted/20"
      }`}
    >
      <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
        {format(day, "EEE")}
        <br />
        <span className="text-foreground">{format(day, "MMM d")}</span>
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function ContentCalendar({ initialPosts }: { initialPosts: CalendarPost[] }) {
  const [view, setView] = useState<"week" | "month">("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [posts, setPosts] = useState(initialPosts);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const weekStart = useMemo(
    () => addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset),
    [weekOffset],
  );

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const monthDays = useMemo(
    () => Array.from({ length: 35 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  function postsForDay(day: Date) {
    return posts.filter((p) => {
      if (!p.scheduledAt) return false;
      return isSameDay(new Date(p.scheduledAt), day);
    });
  }

  function unscheduled() {
    return posts.filter((p) => p.status === "DRAFT" && !p.scheduledAt);
  }

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const postId = String(e.active.id).replace("post-", "");
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId || !overId.startsWith("day-")) return;

    const dayStr = overId.replace("day-", "");
    const [y, m, d] = dayStr.split("-").map(Number);
    const base = new Date(y, m - 1, d);
    const newDate = setMinutes(setHours(base, 9), 0);

    startTransition(async () => {
      const res = await reschedulePost(postId, newDate);
      if (!res.ok) return;
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, scheduledAt: newDate.toISOString(), status: "SCHEDULED" }
            : p,
        ),
      );
    });
  }

  const activePost = activeId
    ? posts.find((p) => `post-${p.id}` === activeId)
    : undefined;

  const days = view === "week" ? weekDays : monthDays;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Content calendar</h1>
          <p className="text-sm text-muted-foreground">
            Drag drafts or scheduled posts onto a day. Times default to 9:00 (adjust in a
            follow-up). Best windows: Tue–Thu 8–10am in your timezone.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("week")}
          >
            Week
          </Button>
          <Button
            variant={view === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("month")}
          >
            Month
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w - 1)}>
            Prev
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset((w) => w + 1)}>
            Next
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unscheduled / inbox</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {unscheduled().length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing waiting—nice.</p>
              ) : (
                unscheduled().map((p) => (
                  <PostCard key={p.id} post={p} dragId={`post-${p.id}`} />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div
          className={
            view === "week"
              ? "mt-6 flex flex-col gap-2 md:flex-row"
              : "mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7"
          }
        >
          {days.map((day) => (
            <DayColumn key={day.toISOString()} day={day}>
              {postsForDay(day).map((p) => (
                <PostCard key={p.id} post={p} dragId={`post-${p.id}`} />
              ))}
            </DayColumn>
          ))}
        </div>
        <DragOverlay>
          {activePost ? (
            <Card className="w-56 p-2 text-xs opacity-90 shadow-lg">
              <p className="line-clamp-4">{activePost.content}</p>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      {pending && (
        <p className="text-xs text-muted-foreground">Updating schedule…</p>
      )}
    </div>
  );
}
