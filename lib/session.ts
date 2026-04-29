"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET || "alignr-dev-secret-change-in-production";
const COOKIE_NAME = "alignr-session";
const ALGORITHM = "aes-256-cbc";

function getKey(): Buffer {
  // Derive a 32-byte key from the secret
  return crypto.scryptSync(SECRET, "salt", 32);
}

export async function encrypt(userId: string): Promise<string> {
  const iv = crypto.randomBytes(16);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(
    JSON.stringify({ userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }),
    "utf8",
    "hex"
  );
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

export async function decrypt(
  token: string
): Promise<{ userId: string } | null> {
  try {
    const [ivHex, encrypted] = token.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    const data = JSON.parse(decrypted);
    if (data.exp < Date.now()) return null;
    return { userId: data.userId };
  } catch {
    return null;
  }
}

export async function createSession(userId: string): Promise<void> {
  const token = await encrypt(userId);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function getSession(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decrypt(token);
}

export async function requireSession(): Promise<{ userId: string }> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
