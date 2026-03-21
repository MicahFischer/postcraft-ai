import { useRef, useState, useTransition } from "react";
import type { CarouselTemplate } from "@/lib/types";
import { saveCarousel, saveCarouselSlides } from "@/lib/api/carousel";
import type { CarouselSlide } from "@/lib/carousel/split-post";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

const templateClass: Record<
  CarouselTemplate,
  { wrap: string; title: string; body: string }
> = {
  MINIMAL: {
    wrap: "bg-white text-zinc-900 border border-zinc-200",
    title: "text-xs font-semibold uppercase tracking-widest text-zinc-500",
    body: "text-lg font-medium leading-snug",
  },
  BOLD: {
    wrap: "bg-indigo-600 text-white",
    title: "text-xs font-bold uppercase tracking-wider text-indigo-200",
    body: "text-xl font-bold leading-tight",
  },
  EDITORIAL: {
    wrap: "bg-stone-100 text-stone-900 border border-stone-300",
    title: "font-serif text-sm italic text-stone-600",
    body: "font-serif text-2xl leading-snug",
  },
};

export function CarouselBuilder({
  postId,
  initialTemplate,
  initialSlides,
}: {
  postId: string;
  initialTemplate: CarouselTemplate;
  initialSlides: CarouselSlide[];
}) {
  const [template, setTemplate] = useState<CarouselTemplate>(initialTemplate);
  const [slides, setSlides] = useState<CarouselSlide[]>(initialSlides);
  const [pending, startTransition] = useTransition();
  const [exporting, setExporting] = useState(false);
  const deckRef = useRef<HTMLDivElement>(null);

  function updateSlide(i: number, body: string) {
    setSlides((prev) => {
      const next = [...prev];
      const s = next[i];
      if (s) next[i] = { ...s, body };
      return next;
    });
  }

  function onSave() {
    startTransition(async () => {
      await saveCarouselSlides(postId, slides);
    });
  }

  function onRebuild() {
    startTransition(async () => {
      await saveCarousel({ postId, template });
    });
  }

  async function onExportPdf() {
    if (!deckRef.current) return;
    setExporting(true);
    try {
      const [{ PDFDocument }, html2canvas] = await Promise.all([
        import("pdf-lib"),
        import("html2canvas"),
      ]);
      const pdfDoc = await PDFDocument.create();
      const nodes = deckRef.current.querySelectorAll<HTMLElement>("[data-slide]");
      const h2c = html2canvas.default;

      for (let i = 0; i < nodes.length; i++) {
        const el = nodes[i];
        const canvas = await h2c(el, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        });
        const dataUrl = canvas.toDataURL("image/png");
        const res = await fetch(dataUrl);
        const pngBytes = new Uint8Array(await res.arrayBuffer());
        const image = await pdfDoc.embedPng(pngBytes);
        const page = pdfDoc.addPage([1080, 1080]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: 1080,
          height: 1080,
        });
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `postcraft-carousel-${postId.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const tc = templateClass[template];

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Template</Label>
          <Select
            value={template}
            onValueChange={(v) => setTemplate(v as CarouselTemplate)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MINIMAL">Minimal</SelectItem>
              <SelectItem value="BOLD">Bold</SelectItem>
              <SelectItem value="EDITORIAL">Editorial</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          Rebuild applies template and re-splits copy from the post. Edit slides below, then
          save.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={onRebuild} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : "Rebuild from post"}
          </Button>
          <Button type="button" onClick={onSave} disabled={pending}>
            Save slides
          </Button>
        </div>

        <ScrollArea className="h-[480px] rounded-md border p-3">
          <div className="space-y-4">
            {slides.map((s, i) => (
              <div key={s.order} className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Slide {i + 1}
                  {s.title ? ` · ${s.title}` : ""}
                </Label>
                <Textarea
                  value={s.body}
                  onChange={(e) => updateSlide(i, e.target.value)}
                  rows={4}
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Preview (1080×1080)</h2>
          <Button
            type="button"
            onClick={() => void onExportPdf()}
            disabled={exporting || slides.length === 0}
          >
            {exporting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Exporting…
              </>
            ) : (
              "Download PDF"
            )}
          </Button>
        </div>
        <div ref={deckRef} className="space-y-4">
          {slides.map((s, i) => (
            <div
              key={i}
              data-slide
              className={`flex aspect-square w-full max-w-[420px] flex-col justify-between rounded-2xl p-8 shadow-inner ${tc.wrap}`}
            >
              {s.title && <p className={tc.title}>{s.title}</p>}
              <p className={tc.body}>{s.body}</p>
              <p className="text-[10px] opacity-60">
                {i + 1} / {slides.length}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
