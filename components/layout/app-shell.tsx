import AppSidebar from "@/components/layout/app-sidebar";

interface OrgOption {
  organizationId: string;
  organizationName: string;
}

interface AppShellProps {
  orgName: string;
  role: string;
  userEmail: string;
  isAdmin: boolean;
  organizations: OrgOption[];
  activeOrganizationId: string;
  children: React.ReactNode;
}

export default function AppShell({
  orgName,
  role,
  userEmail,
  isAdmin,
  organizations,
  activeOrganizationId,
  children,
}: AppShellProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950 md:flex-row">
      <AppSidebar
        orgName={orgName}
        role={role}
        userEmail={userEmail}
        isAdmin={isAdmin}
        organizations={organizations}
        activeOrganizationId={activeOrganizationId}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
