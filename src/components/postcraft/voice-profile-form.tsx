"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { VoiceProfile } from "@/lib/voice-profile";
import { saveVoiceProfile, saveProfileUrl } from "@/actions/voice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const defaultProfile: VoiceProfile = {
  tone: "direct, conversational",
  sentence_structure: "short-medium",
  content_pillars: [],
  hook_style: "educational",
  reading_level: "professional",
  format_preferences: ["short paragraphs", "line breaks"],
  audience: "founders and product designers",
  writing_length: "medium",
};

export function VoiceProfileForm({
  initial,
  linkedInUrl,
  submitLabel = "Save voice profile",
  redirectTo = "/dashboard",
}: {
  initial?: VoiceProfile | null;
  linkedInUrl?: string | null;
  submitLabel?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [profile, setProfile] = useState<VoiceProfile>(
    initial ?? defaultProfile,
  );
  const [url, setUrl] = useState(linkedInUrl ?? "");
  const [pillars, setPillars] = useState(
    (initial?.content_pillars ?? []).join(", "),
  );
  const [formats, setFormats] = useState(
    (initial?.format_preferences ?? []).join(", "),
  );
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof VoiceProfile>(key: K, value: VoiceProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const next: VoiceProfile = {
      ...profile,
      content_pillars: pillars
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      format_preferences: formats
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    startTransition(async () => {
      const r = await saveVoiceProfile(next);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      await saveProfileUrl(url.trim() || null);
      router.push(redirectTo);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-6">
      <div className="space-y-2">
        <Label htmlFor="li">LinkedIn profile URL (optional)</Label>
        <Input
          id="li"
          type="url"
          placeholder="https://www.linkedin.com/in/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Tone</Label>
        <p className="text-xs text-muted-foreground">
          How should your writing feel on a spectrum from casual to formal?
        </p>
        <Slider
          value={[profile.tone.includes("formal") ? 75 : 35]}
          max={100}
          step={1}
          onValueChange={(v) => {
            const val = Array.isArray(v) ? v[0] : v;
            if (typeof val !== "number") return;
            update(
              "tone",
              val > 60
                ? "polished, precise, slightly formal"
                : "warm, direct, conversational",
            );
          }}
        />
        <Input
          value={profile.tone}
          onChange={(e) => update("tone", e.target.value)}
          placeholder="e.g. concise, analytical"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pillars">Content pillars (comma-separated)</Label>
        <Input
          id="pillars"
          value={pillars}
          onChange={(e) => setPillars(e.target.value)}
          placeholder="UX, AI, career growth"
        />
      </div>

      <div className="space-y-2">
        <Label>Audience</Label>
        <Textarea
          value={profile.audience ?? ""}
          onChange={(e) => update("audience", e.target.value)}
          rows={2}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Default hook style</Label>
          <Select
            value={profile.hook_style}
            onValueChange={(v) =>
              update("hook_style", v as VoiceProfile["hook_style"])
            }
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
        <div className="space-y-2">
          <Label>Writing length</Label>
          <Select
            value={profile.writing_length}
            onValueChange={(v) =>
              update("writing_length", v as VoiceProfile["writing_length"])
            }
          >
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="formats">Format preferences (comma-separated)</Label>
        <Input
          id="formats"
          value={formats}
          onChange={(e) => setFormats(e.target.value)}
          placeholder="bullets, short paragraphs"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
