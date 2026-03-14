// src/components/layout/AdminSidebar.tsx
"use client";

import React, { useState }  from "react";
import Link                  from "next/link";
import { useRouter }         from "next/navigation";
import { usePathname }       from "next/navigation";
import {
  LayoutDashboard, ListFilter, BarChart3,
  LogOut, ChevronRight, ChevronLeft, Shield, UserCircle, Users,
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useAuthStore }   from "@/store/authStore";
import { useIssueStore }  from "@/store/issueStore";
import { logoutUser }     from "@/lib/firebase/auth";
import Avatar             from "@/components/ui/Avatar";
import { cn }             from "@/lib/utils/cn";
import toast              from "react-hot-toast";

interface AdminNavLink {
  href: string; label: string; icon: React.ReactNode; exact?: boolean; section?: string;
}

const ADMIN_LINKS: AdminNavLink[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} />, exact: true,  section: "Main"    },
  { href: "/admin/issues",    label: "All Issues", icon: <ListFilter size={18} />,                    section: "Issues"  },
  { href: "/admin/analytics", label: "Analytics",  icon: <BarChart3 size={18} />,                     section: "Reports" },
  { href: "/admin/profile",   label: "My Profile", icon: <UserCircle size={18} />,                    section: "Account" },
];

export default function AdminSidebar() {
  const pathname          = usePathname();
  const router            = useRouter();
  const { userData }      = useAuthContext();
  const { clearAuth }     = useAuthStore();
  const { clearIssues }   = useIssueStore();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const handleLogout = async () => {
    try {
      clearIssues();
      await logoutUser();
      clearAuth();
      toast.success("Logged out successfully.");
      router.replace("/login");
    } catch { toast.error("Logout failed. Please try again."); }
  };

  const adminLinks: AdminNavLink[] = [
    ...ADMIN_LINKS,
    ...(userData?.role === "master-admin"
      ? [
          {
            href: "/admin/user-role",
            label: "Change User Role",
            icon: <Users size={18} />,
            section: "Account",
          },
        ]
      : []),
  ];

  const sections = adminLinks.reduce<Record<string, AdminNavLink[]>>((acc, link) => {
    const key = link.section ?? "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(link);
    return acc;
  }, {});

  const displayName = userData?.name ?? "Admin";
  const adminRoleLabel =
    userData?.role === "master-admin"
      ? "Master Admin"
      : userData?.adminCategory
        ? `${userData.adminCategory} Admin`
        : "Department Admin";

  return (
    <aside className={cn(
      "flex flex-col h-full bg-gradient-to-b from-blue-950 to-blue-900 text-blue-50 transition-all duration-300 relative",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className={cn(
        "flex items-center h-16 border-b border-blue-800/60 shrink-0",
        collapsed ? "justify-center" : "px-5 gap-3"
      )}>
        <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center shrink-0">
          <Shield size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-white text-sm leading-tight">CivicReport</p>
            <p className="text-xs text-blue-200 font-medium">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-blue-700 border
                   border-blue-600 text-blue-100 flex items-center justify-center
                   hover:bg-blue-600 transition-colors z-10 shadow-md"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
        {Object.entries(sections).map(([section, links]) => (
          <div key={section}>
            {!collapsed && (
              <p className="text-xs font-semibold text-blue-300/60 uppercase tracking-wider px-3 mb-2">
                {section}
              </p>
            )}
            <div className="space-y-0.5">
              {links.map((link) => {
                const active = isActive(link.href, link.exact);
                return (
                  <Link key={link.href} href={link.href}
                    title={collapsed ? link.label : undefined}
                    className={cn(
                      "flex items-center rounded-lg transition-all duration-150 font-medium text-sm group",
                      collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5",
                      active
                        ? "bg-white/15 text-white border border-white/20"
                        : "text-blue-100/80 hover:text-white hover:bg-white/10"
                    )}>
                    <span className={cn("shrink-0 transition-colors",
                      active ? "text-blue-100" : "text-blue-300/70 group-hover:text-white")}>
                      {link.icon}
                    </span>
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{link.label}</span>
                        {active && <ChevronRight size={14} className="text-blue-200 shrink-0" />}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile + Logout */}
      <div className="border-t border-blue-800/60 shrink-0">
        <Link href="/admin/profile"
          className={cn("flex items-center px-3 py-3 hover:bg-white/10 transition-colors",
            collapsed ? "justify-center" : "gap-3")}
          title={collapsed ? displayName : undefined}>
          <div className="relative shrink-0">
            <Avatar name={displayName} size="sm" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-blue-900" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{displayName}</p>
              <p className="text-xs text-blue-200 font-medium capitalize">{adminRoleLabel}</p>
            </div>
          )}
        </Link>
        <div className="px-3 pb-3">
          <button onClick={handleLogout} title={collapsed ? "Sign Out" : undefined}
            className={cn(
              "flex items-center w-full rounded-lg text-sm font-medium px-3 py-2",
              "text-blue-100/80 hover:text-red-100 hover:bg-red-500/20 transition-colors",
              collapsed ? "justify-center" : "gap-3"
            )}>
            <LogOut size={16} className="shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}