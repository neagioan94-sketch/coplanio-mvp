import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { createAdminClient } from "@/lib/db/supabase-admin";
import { getActivePortalAccessForUser } from "@/lib/portal/get-portal-access";
import LogoutButton from "@/components/layout/logout-button";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminClient = createAdminClient();
  if (!adminClient) redirect("/login");

  const grants = await getActivePortalAccessForUser(adminClient, user.id);
  if (grants.length === 0) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Coplanio Portal
          </span>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
    </div>
  );
}
