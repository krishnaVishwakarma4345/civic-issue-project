"use client";

import React       from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { useAuthContext } from "@/context/AuthContext";
import { PageLoader }     from "@/components/ui/Spinner";
import { redirect }       from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn, isAdmin, loading } = useAuthContext();

  if (loading)    return <PageLoader message="Loading admin panel..." />;
  if (!isLoggedIn) redirect("/login");
  if (!isAdmin)    redirect("/dashboard");

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Admin Sidebar */}
      <div className="shrink-0 h-screen sticky top-0">
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Admin Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-gray-900">Admin Control Panel</p>
            <p className="text-xs text-gray-500">CivicReport Management System</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-gray-500 font-medium">System Online</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}