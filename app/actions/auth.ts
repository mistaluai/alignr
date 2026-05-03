"use server";

import { redirect } from "next/navigation";
import { createUser, loginUser } from "@/services/userService";
import { createSession, destroySession } from "@/lib/session";

export type AuthState = {
  error: string | null;
};

export async function loginAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    const user = await loginUser(email, password);
    await createSession(user._id);
  } catch (e: any) {
    console.error("[loginAction] Error:", e);
    return { error: e.message || "Invalid email or password." };
  }

  redirect("/dashboard");
}

export async function signupAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !password || !confirmPassword) {
    return { error: "All fields are required." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  try {
    const user = await createUser(email, password);
    await createSession(user._id);
  } catch (e: any) {
    console.error("[signupAction] Error:", e);
    return { error: e.message || "Failed to create account." };
  }

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
