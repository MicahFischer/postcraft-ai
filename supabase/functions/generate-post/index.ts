import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Body = {
  topic: string;
  mode: "create" | "rewrite" | "viral";
  toneStrength: number;
  length: "short" | "medium" | "long";
  hookType: "contrarian" | "story" | "educational" | "question";
  variantCount: number;
};

const lengthHints: Record<Body["length"], string> = {
  short: "Under 900 characters. Very tight.",
  medium: "Roughly 1200–2000 characters.",
  long: "Up to ~3000 characters with room for nuance.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("voice_profile_json")
      .eq("id", user.id)
      .maybeSingle();

    if (profErr || !profile?.voice_profile_json) {
      return new Response(
        JSON.stringify({ error: "Complete voice profile first" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as Body;
    if (!body.topic?.trim()) {
      return new Response(JSON.stringify({ error: "Topic required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const modeInstruction =
      body.mode === "rewrite"
        ? "Rewrite and sharpen the user's idea into a high-performing post."
        : body.mode === "viral"
          ? "Push for bold hooks and strong curiosity—still professional, no clickbait clichés."
          : "Create an original post from the topic.";

    const system = `You are a LinkedIn content strategist. Write posts that match the user's voice profile exactly.
Output must be valid JSON with shape: { "variants": string[] } where each string is a complete LinkedIn post (hook, body, optional CTA, line breaks). No markdown code fences.`;

    const userPrompt = `Voice profile (JSON):
${JSON.stringify(profile.voice_profile_json, null, 2)}

Topic / idea:
${body.topic}

Mode: ${modeInstruction}
Tone intensity (0–100): ${body.toneStrength}
Target length: ${lengthHints[body.length]}
Hook style: ${body.hookType}
Number of distinct variants: ${body.variantCount}

Constraints:
- Strong hook in the first line
- Short paragraphs, line breaks for readability
- No fluff, no "In today's world" filler
- Optional clear CTA on last line when natural
- No hashtags unless they fit the voice profile`;

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured on server" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.85,
      }),
    });

    if (!completion.ok) {
      const errText = await completion.text();
      console.error("[generate-post]", completion.status, errText);
      return new Response(JSON.stringify({ error: "OpenAI request failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = (await completion.json()) as {
      choices?: { message?: { content?: string | null } }[];
    };
    const raw = json.choices?.[0]?.message?.content;
    if (!raw) {
      return new Response(JSON.stringify({ error: "No response from model" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(raw) as { variants?: string[] };
    const variants = Array.isArray(parsed.variants)
      ? parsed.variants.filter((v) => typeof v === "string" && v.trim().length > 0)
      : [];

    return new Response(JSON.stringify({ variants }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
