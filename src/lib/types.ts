export type PostStatus = "DRAFT" | "SCHEDULED" | "POSTED";
export type CarouselTemplate = "MINIMAL" | "BOLD" | "EDITORIAL";

export type CalendarPost = {
  id: string;
  content: string;
  status: PostStatus;
  scheduledAt: string | null;
  updatedAt: string;
};
