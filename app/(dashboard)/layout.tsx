import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { hasAnyActiveMembership } from "@/lib/auth/membership";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const hasMembership = await hasAnyActiveMembership(supabase, user.id);
  if (!hasMembership) redirect("/setup/organization");

  return <>{children}</>;
}
