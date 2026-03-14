// src/components/layout/Sidebar.tsx
"use client";

import React           from "react";
import Link            from "next/link";
import { useRouter }   from "next/navigation";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, PlusCircle, FileText,
  Map, LogOut, ChevronRight, UserCircle,
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useAuthStore }   from "@/store/authStore";
import { logoutUser }     from "@/lib/firebase/auth";
import { useIssueStore }  from "@/store/issueStore";
import Avatar             from "@/components/ui/Avatar";
import { cn }             from "@/lib/utils/cn";
import toast              from "react-hot-toast";

interface SidebarLink { href: string; label: string; icon: React.ReactNode; exact?: boolean; }

const CITIZEN_LINKS: SidebarLink[] = [
  { href: "/dashboard",    label: "Dashboard",    icon: <LayoutDashboard size={18} />, exact: true },
  { href: "/report-issue", label: "Report Issue", icon: <PlusCircle size={18} /> },
  { href: "/my-issues",    label: "My Issues",    icon: <FileText size={18} /> },
  { href: "/map",          label: "Map View",     icon: <Map size={18} /> },
  { href: "/profile",      label: "My Profile",   icon: <UserCircle size={18} /> },
];

export default function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  const pathname        = usePathname();
  const router          = useRouter();
  const { userData }    = useAuthContext();
  const { clearAuth }   = useAuthStore();
  const { clearIssues } = useIssueStore();

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

  const displayName = userData?.name ?? "User";

  return (
    <aside className={cn(
      "flex flex-col h-full bg-gradient-to-b from-blue-900 to-blue-800 border-r border-blue-700/50 transition-all duration-300",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className={cn(
        "flex items-center h-16 border-b border-blue-700/50 shrink-0",
        collapsed ? "justify-center" : "px-5 gap-3"
      )}>
        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">C</span>
        </div>
        {!collapsed && (
          <span className="font-bold text-white text-lg">
            Civic<span className="text-blue-200">Report</span>
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {CITIZEN_LINKS.map((link) => {
          const active = isActive(link.href, link.exact);
          return (
            <Link key={link.href} href={link.href} title={collapsed ? link.label : undefined}
              className={cn(
                "flex items-center rounded-lg transition-all duration-150 font-medium text-sm group",
                collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5",
                active ? "bg-white/15 text-white" : "text-blue-100/90 hover:text-white hover:bg-white/10"
              )}>
              <span className={cn("shrink-0 transition-colors",
                active ? "text-blue-100" : "text-blue-200/80 group-hover:text-white")}>
                {link.icon}
              </span>
              {!collapsed && <span className="flex-1 truncate">{link.label}</span>}
              {!collapsed && active && <ChevronRight size={14} className="text-blue-200 shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Profile + Logout */}
      <div className="border-t border-blue-700/50 shrink-0">
        <Link href="/profile"
          className={cn("flex items-center px-3 py-3 hover:bg-white/10 transition-colors",
            collapsed ? "justify-center" : "gap-3")}
          title={collapsed ? displayName : undefined}>
          <Avatar name={displayName} size="sm" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{displayName}</p>
              <p className="text-xs text-blue-200 truncate capitalize">{userData?.role ?? "citizen"}</p>
            </div>
          )}
        </Link>
        <div className="px-3 pb-3">
          <button onClick={handleLogout} title={collapsed ? "Sign Out" : undefined}
            className={cn(
              "flex items-center w-full rounded-lg text-sm font-medium px-3 py-2",
              "text-red-100 hover:text-white hover:bg-red-500/25 transition-colors",
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