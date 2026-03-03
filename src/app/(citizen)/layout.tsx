"use client";

import React, { useState, useEffect } from "react";
import { useRouter }      from "next/navigation";
import Navbar             from "@/components/layout/Navbar";
import Sidebar            from "@/components/layout/Sidebar";
import Footer             from "@/components/layout/Footer";
import { useAuthContext } from "@/context/AuthContext";
import { PageLoader }     from "@/components/ui/Spinner";

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router                           = useRouter();
  const { isLoggedIn, isAdmin, loading } = useAuthContext();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // FIX: redirect() is Server Component only. In a "use client" component
  // it throws during render, causing the "Application error" crash on logout.
  // Use useRouter inside useEffect instead — runs after render, never throws.
  useEffect(() => {
    if (loading) return;                          // wait for auth to resolve
    if (!isLoggedIn) router.replace("/login");    // not logged in → login
    if (isAdmin)     router.replace("/admin/dashboard"); // wrong role → admin
  }, [loading, isLoggedIn, isAdmin, router]);

  // Show loader while auth is resolving OR while redirect is in progress
  if (loading || !isLoggedIn || isAdmin) {
    return <PageLoader message="Loading your workspace..." />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top Navbar (mobile) */}
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (desktop) */}
        <div className="hidden lg:flex shrink-0">
          <Sidebar collapsed={sidebarCollapsed} />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}