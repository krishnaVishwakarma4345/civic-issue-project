"use client";

import React from "react";
import Link        from "next/link";
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
import { useAuth }        from "@/hooks/useAuth";
import Avatar             from "@/components/ui/Avatar";
import { cn }             from "@/lib/utils/cn";

// ─── Types ────────────────────────────────────────────────────

interface SidebarLink {
  href:    string;
  label:   string;
  icon:    React.ReactNode;
  exact?:  boolean;
  badge?:  number;
}

// ─── Nav Config ───────────────────────────────────────────────

const CITIZEN_LINKS: SidebarLink[] = [
  {
    href:  "/dashboard",
    label: "Dashboard",
    icon:  <LayoutDashboard size={18} />,
    exact: true,
  },
  {
    href:  "/report-issue",
    label: "Report Issue",
    icon:  <PlusCircle size={18} />,
  },
  {
    href:  "/my-issues",
    label: "My Issues",
    icon:  <FileText size={18} />,
  },
  {
    href:  "/map",
    label: "Map View",
    icon:  <Map size={18} />,
  },
];

// ─── Component ────────────────────────────────────────────────

interface SidebarProps {
  collapsed?: boolean;
}

export default function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname              = usePathname();
  const { userData }          = useAuthContext();
  const { logout, authLoading } = useAuth();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

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
              {/* Icon */}
              <span
                className={cn(
                  "shrink-0 transition-colors",
                  active
                    ? "text-primary-600"
                    : "text-gray-400 group-hover:text-gray-600"
                )}
              >
                {link.icon}
              </span>

              {/* Label */}
              {!collapsed && (
                <span className="flex-1 truncate">{link.label}</span>
              )}

              {/* Badge */}
              {!collapsed && link.badge && link.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-100 text-primary-700">
                  {link.badge}
                </span>
              )}

              {/* Active indicator */}
              {!collapsed && active && (
                <ChevronRight size={14} className="text-primary-400 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ─── User Profile ─────────────────────────────────── */}
      <div className={cn(
        "border-t border-gray-100 p-3 shrink-0",
        collapsed ? "flex flex-col items-center gap-2" : ""
      )}>
        <div className={cn(
          "flex items-center rounded-lg",
          collapsed ? "justify-center p-2" : "gap-3 px-3 py-2"
        )}>
          <Avatar name={userData?.name} size="sm" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {userData?.name}
              </p>
              <p className="text-xs text-gray-500 truncate capitalize">
                {userData?.role}
              </p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          disabled={authLoading}
          title={collapsed ? "Sign Out" : undefined}
          className={cn(
            "flex items-center rounded-lg text-sm font-medium",
            "text-red-500 hover:text-red-700 hover:bg-red-50",
            "transition-colors disabled:opacity-50 w-full",
            collapsed
              ? "justify-center p-2"
              : "gap-3 px-3 py-2"
          )}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}