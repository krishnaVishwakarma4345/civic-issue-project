"use client";

import React, { useState } from "react";
import Navbar  from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import Footer  from "@/components/layout/Footer";
import { useAuthContext } from "@/context/AuthContext";
import { PageLoader }     from "@/components/ui/Spinner";
import { redirect }       from "next/navigation";
import { cn }             from "@/lib/utils/cn";

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn, isAdmin, loading } = useAuthContext();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Show loader while auth resolves
  if (loading) return <PageLoader message="Loading your workspace..." />;

  // Redirect if not logged in
  if (!isLoggedIn) {
    redirect("/login");
  }

  // Redirect admin to admin panel
  if (isAdmin) {
    redirect("/admin/dashboard");
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