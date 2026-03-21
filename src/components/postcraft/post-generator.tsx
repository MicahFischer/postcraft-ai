import { useState, useTransition } from "react";
import { Link } from "react-router-dom";
import { generatePostsAction } from "@/lib/api/generate";
import { saveDraftPost } from "@/lib/api/posts";
import type { VoiceProfile } from "@/lib/voice-profile";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, Loader2 } from "lucide-react";

type Mode = "create" | "rewrite" | "viral";

export function PostGenerator({
  voice,
  initialDraft,
  topicHint,
}: {
  voice: VoiceProfile | null;
  initialDraft?: { topic: string; variants: string[] } | null;
  topicHint?: string;
}) {
  const [topic, setTopic] = useState(
    () => initialDraft?.topic ?? topicHint ?? "",
  );
  const [mode, setMode] = useState<Mode>("create");
  const [toneStrength, setToneStrength] = useState([55]);
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [hookType, setHookType] = useState<
    "contrarian" | "story" | "educational" | "question"
  >(voice?.hook_style ?? "educational");
  const [variantCount, setVariantCount] = useState(3);
  const [variants, setVariants] = useState<string[]>(
    () => initialDraft?.variants ?? [],
  );
  const [selected, setSelected] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const main = variants[selected] ?? "";

  function setMainText(text: string) {
    setVariants((prev) => {
      const next = [...prev];
      if (next.length === 0) return [text];
      next[selected] = text;
      return next;
    });
  }

  function onGenerate() {
    if (!voice) {
      setError("Set up your voice profile first.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await generatePostsAction({
        topic,
        mode,
        toneStrength: toneStrength[0] ?? 50,
        length,
        hookType,
        variantCount,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setVariants(res.variants);
      setSelected(0);
      setSavedId(null);
    });
  }

  function copyMain() {
    void navigator.clipboard.writeText(main);
    setSaveMsg("Copied to clipboard");
    setTimeout(() => setSaveMsg(null), 2000);
  }

  function onSaveDraft() {
    setSaveMsg(null);
    startTransition(async () => {
      const res = await saveDraftPost({
        content: main,
        variants,
        metadata: {
          toneStrength: toneStrength[0],
          length,
          hookType,
          mode,
        },
      });
      if (!res.ok) {
        setSaveMsg(res.error);
        return;
      }
      setSavedId(res.id);
      setSaveMsg("Draft saved.");
    });
  }

  if (!voice) {
    return (
      <p className="text-muted-foreground">
        <Link to="/settings/voice" className="text-primary underline">
          Complete your voice profile
        </Link>{" "}
        to generate posts.
      </p>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(["create", "rewrite", "viral"] as const).map((m) => (
            <Button
              key={m}
              type="button"
              variant={mode === m ? "default" : "outline"}
              size="sm"
              onClick={() => setMode(m)}
            >
              {m === "create" && "New post"}
              {m === "rewrite" && "Rewrite idea"}
              {m === "viral" && "Viral angle"}
            </Button>
          ))}
        </div>
        <div className="space-y-2">
          <Label htmlFor="topic">Topic or raw idea</Label>
          <Textarea
            id="topic"
            rows={5}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Why we killed our design system roadmap — and what we built instead."
          />
        </div>
        <div className="space-y-2">
          <Label>Tone strength</Label>
          <Slider
            value={toneStrength}
            onValueChange={(v) =>
              setToneStrength(Array.isArray(v) ? [...v] : [v])
            }
            max={100}
            step={1}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Length</Label>
            <Select value={length} onValueChange={(v) => setLength(v as typeof length)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="long">Long</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Hook type</Label>
            <Select
              value={hookType}
              onValueChange={(v) => setHookType(v as typeof hookType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contrarian">Contrarian</SelectItem>
                <SelectItem value="story">Story</SelectItem>
                <SelectItem value="educational">Educational</SelectItem>
                <SelectItem value="question">Question</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Variants (3–5)</Label>
          <Select
            value={String(variantCount)}
            onValueChange={(v) => setVariantCount(Number(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5">5</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={onGenerate} disabled={pending || !topic.trim()}>
          {pending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Generating…
            </>
          ) : (
            "Generate"
          )}
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Output</h2>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={copyMain}>
              <Copy className="mr-1 size-3" />
              Copy
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onSaveDraft}
              disabled={pending || !main.trim()}
            >
              Save draft
            </Button>
            {savedId && (
              <Link
                to={`/posts/${savedId}/carousel`}
                className={cn(buttonVariants({ size: "sm", variant: "secondary" }))}
              >
                Carousel
              </Link>
            )}
          </div>
        </div>
        {saveMsg && <p className="text-sm text-muted-foreground">{saveMsg}</p>}

        {variants.length > 0 ? (
          <Tabs
            value={String(selected)}
            onValueChange={(v) => setSelected(Number(v))}
          >
            <TabsList className="flex h-auto flex-wrap gap-1">
              {variants.map((_, i) => (
                <TabsTrigger key={i} value={String(i)}>
                  V{i + 1}
                </TabsTrigger>
              ))}
            </TabsList>
            {variants.map((_, i) => (
              <TabsContent key={i} value={String(i)} className="mt-3">
                <Textarea
                  rows={16}
                  value={variants[i] ?? ""}
                  onChange={(e) => {
                    const t = e.target.value;
                    setVariants((prev) => {
                      const next = [...prev];
                      next[i] = t;
                      return next;
                    });
                  }}
                  className="font-sans text-sm leading-relaxed"
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <Textarea
            rows={16}
            value={main}
            onChange={(e) => setMainText(e.target.value)}
            placeholder="Generated posts appear here. Edit freely."
            className="font-sans text-sm leading-relaxed"
          />
        )}

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            Paste on LinkedIn or schedule manually — no API posting in MVP
          </Badge>
        </div>
      </div>
    </div>
  );
}
