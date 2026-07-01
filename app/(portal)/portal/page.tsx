import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/supabase-server";
import { createAdminClient } from "@/lib/db/supabase-admin";
import { getActivePortalAccessForUser } from "@/lib/portal/get-portal-access";
import { getPortalPlayerSummary } from "@/lib/portal/get-portal-data";

export default async function PortalHomePage() {
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

  if (grants.length === 1) {
    redirect(`/portal/player/${grants[0].playerId}`);
  }

  const players = (
    await Promise.all(
      grants.map((g) => getPortalPlayerSummary(adminClient, g.playerId)),
    )
  ).filter((p): p is NonNullable<typeof p> => p !== null);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Your players</h1>
      <ul className="flex flex-col gap-2">
        {players.map((p) => (
          <li key={p.id}>
            <Link
              href={`/portal/player/${p.id}`}
              className="block rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <p className="font-medium text-zinc-900 dark:text-zinc-50">{p.fullName}</p>
              {p.teamName && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{p.teamName}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
