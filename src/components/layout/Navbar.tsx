"use client";

import React, { useState, useRef, useEffect } from "react";
import Link                  from "next/link";
import { usePathname }       from "next/navigation";
import {
  Menu,
  X,
  Bell,
  LogOut,
  User,
  ChevronDown,
  Settings,
  LayoutDashboard,
  FileText,
} from "lucide-react";
import { useAuthContext }    from "@/context/AuthContext";
import { useAuth }           from "@/hooks/useAuth";
import { useNotifications }  from "@/context/NotificationContext";
import Avatar                from "@/components/ui/Avatar";
import Button                from "@/components/ui/Button";
import { cn }                from "@/lib/utils/cn";
import { formatRelativeTime, truncate } from "@/lib/utils/formatters";

// ─── Types ────────────────────────────────────────────────────

interface NavLink {
  href:    string;
  label:   string;
  icon:    React.ReactNode;
  exact?:  boolean;
}

// ─── Nav Links by Role ────────────────────────────────────────

const CITIZEN_NAV_LINKS: NavLink[] = [
  { href: "/dashboard",    label: "Dashboard",    icon: <LayoutDashboard size={16} />, exact: true },
  { href: "/report-issue", label: "Report Issue", icon: <FileText size={16} /> },
  { href: "/my-issues",    label: "My Issues",    icon: <FileText size={16} /> },
  { href: "/map",          label: "Map View",     icon: <FileText size={16} /> },
];

const ADMIN_NAV_LINKS: NavLink[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} />, exact: true },
  { href: "/admin/issues",    label: "Issues",    icon: <FileText size={16} /> },
  { href: "/admin/analytics", label: "Analytics", icon: <FileText size={16} /> },
];

// ─── Component ────────────────────────────────────────────────

export default function Navbar() {
  const pathname                              = usePathname();
  const { userData, isLoggedIn, isAdmin }     = useAuthContext();
  const { logout, authLoading }               = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

  const [mobileOpen,      setMobileOpen]      = useState(false);
  const [profileOpen,     setProfileOpen]     = useState(false);
  const [notifOpen,       setNotifOpen]       = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef   = useRef<HTMLDivElement>(null);

  const navLinks = isAdmin ? ADMIN_NAV_LINKS : CITIZEN_NAV_LINKS;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ─── Logo ─────────────────────────────────────── */}
          <Link
            href={isLoggedIn ? (isAdmin ? "/admin/dashboard" : "/dashboard") : "/"}
            className="flex items-center gap-2.5 shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-gray-900 text-lg hidden sm:block">
              Civic<span className="text-primary-600">Report</span>
            </span>
            {isAdmin && (
              <span className="hidden sm:block text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
                Admin
              </span>
            )}
          </Link>

          {/* ─── Desktop Nav Links ─────────────────────────── */}
          {isLoggedIn && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive(link.href, link.exact)
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {/* ─── Right Actions ─────────────────────────────── */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <>
                {/* Notifications */}
                <div ref={notifRef} className="relative">
                  <button
                    onClick={() => {
                      setNotifOpen((v) => !v);
                      setProfileOpen(false);
                    }}
                    className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {notifOpen && (
                    <NotificationDropdown
                      notifications={notifications}
                      onMarkRead={markAsRead}
                      onMarkAllRead={() => {
                        markAllAsRead();
                        setNotifOpen(false);
                      }}
                      onClose={() => setNotifOpen(false)}
                    />
                  )}
                </div>

                {/* Profile Dropdown */}
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => {
                      setProfileOpen((v) => !v);
                      setNotifOpen(false);
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                    aria-label="Profile menu"
                  >
                    <Avatar
                      name={userData?.name}
                      size="sm"
                    />
                    <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                      {userData?.name}
                    </span>
                    <ChevronDown
                      size={14}
                      className={cn(
                        "hidden sm:block text-gray-400 transition-transform duration-200",
                        profileOpen && "rotate-180"
                      )}
                    />
                  </button>

                  {/* Profile Dropdown */}
                  {profileOpen && (
                    <ProfileDropdown
                      name={userData?.name ?? ""}
                      email={userData?.email ?? ""}
                      role={userData?.role ?? "citizen"}
                      onLogout={async () => {
                        setProfileOpen(false);
                        await logout();
                      }}
                      loading={authLoading}
                    />
                  )}
                </div>

                {/* Mobile menu toggle */}
                <button
                  onClick={() => setMobileOpen((v) => !v)}
                  className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                  aria-label="Toggle menu"
                >
                  {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Mobile Menu ──────────────────────────────────── */}
      {isLoggedIn && mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive(link.href, link.exact)
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <span className={cn(
                isActive(link.href, link.exact)
                  ? "text-primary-600"
                  : "text-gray-400"
              )}>
                {link.icon}
              </span>
              {link.label}
            </Link>
          ))}

          <div className="pt-2 border-t border-gray-100 mt-2">
            <button
              onClick={logout}
              disabled={authLoading}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

// ─── Profile Dropdown ─────────────────────────────────────────

function ProfileDropdown({
  name,
  email,
  role,
  onLogout,
  loading,
}: {
  name:     string;
  email:    string;
  role:     string;
  onLogout: () => void;
  loading:  boolean;
}) {
  return (
    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
      {/* User Info */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
        <p className="text-xs text-gray-500 truncate mt-0.5">{email}</p>
        <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 capitalize">
          {role}
        </span>
      </div>

      {/* Menu Items */}
      <div className="py-1">
        <Link
          href={role === "admin" ? "/admin/dashboard" : "/dashboard"}
          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <LayoutDashboard size={15} className="text-gray-400" />
          Dashboard
        </Link>
        <Link
          href="/profile"
          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <User size={15} className="text-gray-400" />
          Profile
        </Link>
      </div>

      {/* Logout */}
      <div className="border-t border-gray-100 py-1">
        <button
          onClick={onLogout}
          disabled={loading}
          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors disabled:opacity-50"
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ─── Notification Dropdown ────────────────────────────────────

import type { AppNotification } from "@/context/NotificationContext";

function NotificationDropdown({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClose,
}: {
  notifications: AppNotification[];
  onMarkRead:    (id: string) => void;
  onMarkAllRead: () => void;
  onClose:       () => void;
}) {
  const unread = notifications.filter((n) => !n.read);

  const iconMap: Record<AppNotification["type"], string> = {
    success: "✅",
    error:   "❌",
    warning: "⚠️",
    info:    "ℹ️",
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900">Notifications</p>
          {unread.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-bold">
              {unread.length}
            </span>
          )}
        </div>
        {unread.length > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell size={24} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No notifications yet</p>
          </div>
        ) : (
          notifications.slice(0, 10).map((notif) => (
            <button
              key={notif.id}
              onClick={() => {
                onMarkRead(notif.id);
                onClose();
              }}
              className={cn(
                "w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors",
                !notif.read && "bg-primary-50/40"
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-base shrink-0 mt-0.5">
                  {iconMap[notif.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm truncate",
                    notif.read ? "text-gray-600" : "text-gray-900 font-medium"
                  )}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {truncate(notif.message, 80)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatRelativeTime(notif.createdAt)}
                  </p>
                </div>
                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1.5" />
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}