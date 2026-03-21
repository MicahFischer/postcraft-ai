"use server";

import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function registerUser(input: z.infer<typeof registerSchema>) {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid input" };
  }
  const name = parsed.data.name.trim();
  const email = normalizeEmail(parsed.data.email);
  const { password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { ok: false as const, error: "Email already registered" };
    }

    // 10 rounds: fast enough on serverless; still fine for credentials auth
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
      },
    });

    return { ok: true as const };
  } catch (e) {
    console.error("[registerUser]", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false as const, error: "Email already registered" };
    }
    if (e instanceof Prisma.PrismaClientInitializationError) {
      return {
        ok: false as const,
        error:
          "Database is not reachable. For Supabase, add ?sslmode=require (or &sslmode=require) to DATABASE_URL and DIRECT_URL. On Vercel, set both env vars and use the pooler URL for DATABASE_URL if needed.",
      };
    }
    return {
      ok: false as const,
      error:
        "Could not create account. If this keeps happening, confirm your database is running and migrations are applied (npx prisma migrate deploy).",
    };
  }
}
