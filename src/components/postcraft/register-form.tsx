import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STEP_MS = 30_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      reject(new Error(`${label} timed out — database or network may be unreachable.`));
    }, ms);
    promise
      .then((v) => {
        clearTimeout(id);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(id);
        reject(e);
      });
  });
}

export function RegisterForm() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [step, setStep] = useState<"idle" | "register" | "signin">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    setStep("register");

    try {
      const emailNorm = email.trim().toLowerCase();
      const { error: signUpErr } = await withTimeout(
        supabase.auth.signUp({
          email: emailNorm,
          password,
          options: { data: { full_name: name.trim() } },
        }),
        STEP_MS,
        "Creating account",
      );
      if (signUpErr) {
        setError(signUpErr.message.includes("already") ? "Email already registered" : signUpErr.message);
        return;
      }

      setStep("signin");
      const { error: signInErr } = await withTimeout(
        supabase.auth.signInWithPassword({ email: emailNorm, password }),
        STEP_MS,
        "Sign-in",
      );

      if (signInErr) {
        setError("Account created but sign-in failed. Confirm your email or try logging in.");
        return;
      }
      navigate("/onboarding", { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
    } finally {
      setPending(false);
      setStep("idle");
    }
  }

  const label =
    step === "register"
      ? "Creating account…"
      : step === "signin"
        ? "Signing you in…"
        : "Create account";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password (min 8 characters)</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? label : "Create account"}
      </Button>
    </form>
  );
}
