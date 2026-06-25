import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { hasAnyActiveMembership } from "@/lib/auth/membership";
import RegisterForm from "@/components/auth/register-form";

export const metadata = { title: "Create account — Coplanio" };

export default async function RegisterPage() {
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const hasMembership = await hasAnyActiveMembership(supabase, user.id);
      redirect(hasMembership ? "/dashboard" : "/setup/organization");
    }
  }

  return (
    <>
      <h1 className="mb-6 text-center text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Create your account
      </h1>
      <RegisterForm />
    </>
  );
}
