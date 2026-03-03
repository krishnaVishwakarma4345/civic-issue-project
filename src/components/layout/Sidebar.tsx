// src/components/layout/Sidebar.tsx
"use client";

import React           from "react";
import Link            from "next/link";
import { useRouter }   from "next/navigation";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Map,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useAuthStore }   from "@/store/authStore";
import { logoutUser }     from "@/lib/firebase/auth";
import { useIssueStore }  from "@/store/issueStore";
import Avatar             from "@/components/ui/Avatar";
import { cn }             from "@/lib/utils/cn";
import toast              from "react-hot-toast";

// ─── Nav Config ───────────────────────────────────────────────

interface SidebarLink {
  href:   string;
  label:  string;
  icon:   React.ReactNode;
  exact?: boolean;
}

const CITIZEN_LINKS: SidebarLink[] = [
  { href: "/dashboard",    label: "Dashboard",     icon: <LayoutDashboard size={18} />, exact: true },
  { href: "/report-issue", label: "Report Issue",  icon: <PlusCircle size={18} /> },
  { href: "/my-issues",    label: "My Issues",     icon: <FileText size={18} /> },
  { href: "/map",          label: "Map View",      icon: <Map size={18} /> },
];

// ─── Component ────────────────────────────────────────────────

interface SidebarProps {
  collapsed?: boolean;
}

export default function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname           = usePathname();
  const router             = useRouter();
  const { userData }       = useAuthContext();
  const { clearAuth }      = useAuthStore();
  const { clearIssues }    = useIssueStore();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  // ─── Logout ────────────────────────────────────────────────
  // FIX: do NOT use useAuth() here — that hook calls useRouter() internally
  // and has caused double-navigation issues. Call logoutUser directly,
  // clear all stores, then navigate. This also avoids the authLoading state
  // that was hiding the button.
  const handleLogout = async () => {
    try {
      // 1. Unsubscribe Firestore listeners first by clearing issue store
      clearIssues();
      // 2. Sign out from Firebase
      await logoutUser();
      // 3. Clear auth store (sets userData → null)
      clearAuth();
      // 4. Navigate to login
      toast.success("Logged out successfully.");
      router.push("/login");
    } catch {
      toast.error("Logout failed. Please try again.");
    }
  };

  // Fallback display name / initial for avatar
  const displayName = userData?.name ?? "User";
  const displayRole = userData?.role ?? "citizen";

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-white border-r border-gray-100",
        "transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* ─── Logo ─────────────────────────────────────────── */}
      <div className={cn(
        "flex items-center h-16 border-b border-gray-100 shrink-0",
        collapsed ? "justify-center px-0" : "px-5 gap-3"
      )}>
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">C</span>
        </div>
        {!collapsed && (
          <span className="font-bold text-gray-900 text-lg">
            Civic<span className="text-primary-600">Report</span>
          </span>
        )}
      </div>

      {/* ─── Navigation ───────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {CITIZEN_LINKS.map((link) => {
          const active = isActive(link.href, link.exact);
          return (
            <Link
              key={link.href}
              href={link.href}
              title={collapsed ? link.label : undefined}
              className={cn(
                "flex items-center rounded-lg transition-all duration-150",
                "font-medium text-sm group",
                collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5",
                active
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <span className={cn(
                "shrink-0 transition-colors",
                active ? "text-primary-600" : "text-gray-400 group-hover:text-gray-600"
              )}>
                {link.icon}
              </span>
              {!collapsed && <span className="flex-1 truncate">{link.label}</span>}
              {!collapsed && active && (
                <ChevronRight size={14} className="text-primary-400 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ─── User Profile + Logout ────────────────────────── */}
      {/* FIX: this section is ALWAYS rendered regardless of userData
          so the logout button is always visible. Avatar falls back to
          the first letter of "User" if userData is still loading.   */}
      <div className="border-t border-gray-100 shrink-0">
        {/* Profile row */}
        <div className={cn(
          "flex items-center px-3 py-3",
          collapsed ? "justify-center" : "gap-3"
        )}>
          <Avatar name={displayName} size="sm" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {displayName}
              </p>
              <p className="text-xs text-gray-500 truncate capitalize">
                {displayRole}
              </p>
            </div>
          )}
        </div>

        {/* Logout button */}
        <div className="px-3 pb-3">
          <button
            onClick={handleLogout}
            title={collapsed ? "Sign Out" : undefined}
            className={cn(
              "flex items-center w-full rounded-lg text-sm font-medium",
              "text-red-500 hover:text-red-700 hover:bg-red-50",
              "transition-colors px-3 py-2",
              collapsed ? "justify-center" : "gap-3"
            )}
          >
            <LogOut size={16} className="shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}