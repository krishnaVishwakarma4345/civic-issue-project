"use client";

import React    from "react";
import { useAuthContext } from "@/context/AuthContext";
import { PageLoader }     from "@/components/ui/Spinner";
import { redirect }       from "next/navigation";
import type { UserRole }  from "@/types/user";

interface ProtectedRouteProps {
  children:       React.ReactNode;
  requiredRole?:  UserRole;
  redirectTo?:    string;
}

/**
 * Client-side guard — wraps individual pages when layout-level
 * protection isn't sufficient (e.g. role-specific sub-pages).
 */
export default function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { isLoggedIn, userData, loading } = useAuthContext();

  if (loading) return <PageLoader />;

  if (!isLoggedIn) {
    redirect(redirectTo);
  }

  if (requiredRole && userData?.role !== requiredRole) {
    redirect(userData?.role === "admin" ? "/admin/dashboard" : "/dashboard");
  }

  return <>{children}</>;
}