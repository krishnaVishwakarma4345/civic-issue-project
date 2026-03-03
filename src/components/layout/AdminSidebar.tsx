"use client";

import React, { useState }  from "react";
import Link                  from "next/link";
import { useRouter }         from "next/navigation";
import { usePathname }       from "next/navigation";
import {
  LayoutDashboard,
  ListFilter,
  BarChart3,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Shield,
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useAuthStore }   from "@/store/authStore";
import { useIssueStore }  from "@/store/issueStore";
import { logoutUser }     from "@/lib/firebase/auth";
import Avatar             from "@/components/ui/Avatar";
import { cn }             from "@/lib/utils/cn";
import toast              from "react-hot-toast";

// ─── Nav Config ───────────────────────────────────────────────

interface AdminNavLink {
  href:     string;
  label:    string;
  icon:     React.ReactNode;
  exact?:   boolean;
  section?: string;
}

const ADMIN_LINKS: AdminNavLink[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} />, exact: true,  section: "Main"    },
  { href: "/admin/issues",    label: "All Issues", icon: <ListFilter size={18} />,                    section: "Issues"  },
  { href: "/admin/analytics", label: "Analytics",  icon: <BarChart3 size={18} />,                     section: "Reports" },
];

// ─── Component ────────────────────────────────────────────────

export default function AdminSidebar() {
  const pathname              = usePathname();
  const router                = useRouter();
  const { userData }          = useAuthContext();
  const { clearAuth }         = useAuthStore();
  const { clearIssues }       = useIssueStore();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  // ─── Logout ────────────────────────────────────────────────
  // FIX: call logoutUser directly instead of useAuth().logout
  // useAuth() tracks authLoading which was disabling the button
  // and causing the logout button to disappear mid-click.
  const handleLogout = async () => {
    try {
      clearIssues();           // kill Firestore subscriptions first
      await logoutUser();      // Firebase sign out
      clearAuth();             // clear Zustand auth store
      toast.success("Logged out successfully.");
      router.replace("/login");
    } catch {
      toast.error("Logout failed. Please try again.");
    }
  };

  // Group links by section
  const sections = ADMIN_LINKS.reduce<Record<string, AdminNavLink[]>>(
    (acc, link) => {
      const key = link.section ?? "Other";
      if (!acc[key]) acc[key] = [];
      acc[key].push(link);
      return acc;
    },
    {}
  );

  const displayName = userData?.name ?? "Admin";

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-gray-900 text-gray-100",
        "transition-all duration-300 relative",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* ─── Logo ─────────────────────────────────────────── */}
      <div className={cn(
        "flex items-center h-16 border-b border-gray-700/50 shrink-0",
        collapsed ? "justify-center" : "px-5 gap-3"
      )}>
        <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center shrink-0">
          <Shield size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-white text-sm leading-tight">CivicReport</p>
            <p className="text-xs text-primary-400 font-medium">Admin Panel</p>
          </div>
        )}
      </div>

      {/* ─── Collapse Toggle ──────────────────────────────── */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className={cn(
          "absolute -right-3 top-20 w-6 h-6 rounded-full",
          "bg-gray-700 border border-gray-600 text-gray-300",
          "flex items-center justify-center hover:bg-gray-600",
          "transition-colors z-10 shadow-md"
        )}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* ─── Navigation ───────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
        {Object.entries(sections).map(([section, links]) => (
          <div key={section}>
            {!collapsed && (
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                {section}
              </p>
            )}
            <div className="space-y-0.5">
              {links.map((link) => {
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
                        ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                        : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                    )}
                  >
                    <span className={cn(
                      "shrink-0 transition-colors",
                      active ? "text-primary-400" : "text-gray-500 group-hover:text-gray-300"
                    )}>
                      {link.icon}
                    </span>
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{link.label}</span>
                        {active && <ChevronRight size={14} className="text-primary-500 shrink-0" />}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ─── Admin Profile + Logout ───────────────────────── */}
      {/* FIX: always rendered, no disabled state, no authLoading dependency */}
      <div className="border-t border-gray-700/50 shrink-0">
        {/* Profile row */}
        <div className={cn(
          "flex items-center px-3 py-3",
          collapsed ? "justify-center" : "gap-3"
        )}>
          <div className="relative shrink-0">
            <Avatar name={displayName} size="sm" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-gray-900" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{displayName}</p>
              <p className="text-xs text-primary-400 font-medium">Administrator</p>
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
              "text-gray-400 hover:text-red-400 hover:bg-red-500/10",
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