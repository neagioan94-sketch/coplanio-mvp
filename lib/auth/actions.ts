"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { loginSchema, registerSchema } from "@/schemas/auth";

type ActionState = { error?: string } | undefined;

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) return { error: "Invalid email or password" };

  redirect("/dashboard");
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm_password: formData.get("confirm_password"),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable" };

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) return { error: "Could not create account. Try a different email." };

  const user = data.user;
  if (user) {
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        full_name: parsed.data.full_name,
        email: user.email,
        status: "active",
      },
      { onConflict: "id" },
    );

    if (profileError) {
      console.error("[registerAction] profile upsert failed:", profileError.message);
      return { error: "Account created but profile setup failed. Please contact support." };
    }
  }

  redirect("/setup/organization");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}
