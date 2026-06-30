"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import LogoutButton from "@/components/layout/logout-button";
import OrganizationSwitcher from "@/components/organizations/organization-switcher";

const ROLE_LABELS: Record<string, string> = {
  organization_admin: "Admin",
  head_coach: "Head Coach",
  coach: "Coach",
  staff: "Staff",
};

interface NavItem {
  href: string;
  label: string;
}

interface OrgOption {
  organizationId: string;
  organizationName: string;
}

interface AppSidebarProps {
  orgName: string;
  role: string;
  userEmail: string;
  isAdmin: boolean;
  organizations: OrgOption[];
  activeOrganizationId: string;
}

function SidebarContent({
  orgName,
  role,
  userEmail,
  isAdmin,
  organizations,
  activeOrganizationId,
  onClose,
}: AppSidebarProps & { onClose?: () => void }) {
  const pathname = usePathname();

  const mainNavItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/teams", label: "Teams" },
    { href: "/players", label: "Players" },
    { href: "/exercises", label: "Exercises" },
    { href: "/training-sessions", label: "Training Sessions" },
    { href: "/matches", label: "Matches" },
    { href: "/assessments", label: "Assessments" },
    { href: "/reports", label: "Reports" },
  ];

  const settingsNavItems: NavItem[] = isAdmin
    ? [
        { href: "/settings/organization", label: "Organization" },
        { href: "/settings/members", label: "Members" },
        { href: "/settings/audit", label: "Audit Log" },
      ]
    : [];

  const navItems = [...mainNavItems, ...settingsNavItems];

  const isActive = (href: string) => {
    if (href === "/teams") return pathname === href || pathname.startsWith("/teams/");
    if (href === "/players") return pathname === href || pathname.startsWith("/players/");
    if (href === "/exercises") return pathname === href || pathname.startsWith("/exercises/");
    if (href === "/training-sessions") return pathname === href || pathname.startsWith("/training-sessions/");
    if (href === "/matches") return pathname === href || pathname.startsWith("/matches/");
    if (href === "/assessments") return pathname === href || pathname.startsWith("/assessments/");
    if (href === "/reports") return pathname === href || pathname.startsWith("/reports/");
    if (href === "/settings/organization") return pathname === href;
    if (href === "/settings/members") return pathname === href;
    if (href === "/settings/audit") return pathname === href;
    return pathname === href;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
        <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Coplanio
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Org context */}
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        {organizations.length > 1 ? (
          <OrganizationSwitcher
            organizations={organizations}
            activeOrganizationId={activeOrganizationId}
          />
        ) : (
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
            {orgName}
          </p>
        )}
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {ROLE_LABELS[role] ?? role}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4">
        <ul className="flex flex-col gap-1">
          {navItems.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(href)
                    ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
                )}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User + logout */}
      <div className="border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
        <p className="mb-2 truncate text-xs text-zinc-500 dark:text-zinc-400">
          {userEmail}
        </p>
        <LogoutButton />
      </div>
    </div>
  );
}

export default function AppSidebar({
  orgName,
  role,
  userEmail,
  isAdmin,
  organizations,
  activeOrganizationId,
}: AppSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900 md:hidden">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="rounded-md p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Coplanio
        </span>
      </div>

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar — always visible on desktop, overlay on mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-900 md:static md:block md:border-r md:border-zinc-200 md:dark:border-zinc-800",
          isMobileOpen ? "block" : "hidden md:block",
        )}
      >
        <SidebarContent
          orgName={orgName}
          role={role}
          userEmail={userEmail}
          isAdmin={isAdmin}
          organizations={organizations}
          activeOrganizationId={activeOrganizationId}
          onClose={() => setIsMobileOpen(false)}
        />
      </aside>
    </>
  );
}
