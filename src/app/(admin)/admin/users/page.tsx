"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Users, RefreshCw } from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import PageHeader from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import Alert from "@/components/ui/Alert";
import { useAuthContext } from "@/context/AuthContext";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/firestore";
import { formatDateTime } from "@/lib/utils/formatters";

type UserRow = {
  uid: string;
  name: string;
  email: string;
  role: "citizen" | "department-admin" | "master-admin";
  adminCategory?: string;
  createdAt: string;
};

const toIsoString = (value: unknown): string => {
  if (!value) return new Date(0).toISOString();
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    const d = (value as { toDate: () => Date }).toDate();
    return d.toISOString();
  }

  return new Date(0).toISOString();
};

const roleLabel = (role: UserRow["role"], adminCategory?: string): string => {
  if (role === "department-admin") {
    return `Department Admin (${adminCategory ?? "unassigned"})`;
  }
  if (role === "master-admin") return "Master Admin";
  return "Citizen";
};

export default function AdminUsersPage() {
  const { userData, loading: authLoading } = useAuthContext();

  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (userData?.role !== "master-admin") {
      setLoading(false);
      return;
    }

    const usersRef = collection(db, COLLECTIONS.USERS);

    const unsubscribe = onSnapshot(
      usersRef,
      (snap) => {
        const parsed: UserRow[] = snap.docs.map((doc) => {
          const data = doc.data() as {
            name?: string;
            email?: string;
            role?: "citizen" | "department-admin" | "master-admin";
            adminCategory?: string;
            createdAt?: unknown;
          };

          return {
            uid: doc.id,
            name: data.name ?? "Unknown",
            email: data.email ?? "Unknown",
            role: data.role ?? "citizen",
            adminCategory: data.adminCategory,
            createdAt: toIsoString(data.createdAt),
          };
        });

        parsed.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setRows(parsed);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("[AdminUsersPage] Realtime users listener failed:", err);
        setError("Failed to load registered users.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authLoading, userData?.role]);

  const countLabel = useMemo(() => `${rows.length} registered user${rows.length === 1 ? "" : "s"}`, [rows.length]);

  if (authLoading) return null;

  if (userData?.role !== "master-admin") {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Registered Users"
          subtitle="Master-admin access is required for this section."
          breadcrumbs={[
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Registered Users" },
          ]}
          icon={<Users size={20} />}
        />
        <Alert variant="error" title="Access Denied">
          Only master-admin can view all registered users.
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Registered Users"
        subtitle="Live list of all users in the system."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Registered Users" },
        ]}
        icon={<Users size={20} />}
        actions={
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 border border-primary-100 px-3 py-1.5 text-xs text-primary-700 font-medium">
            <RefreshCw size={12} className="animate-spin" />
            Auto-sync enabled
          </div>
        }
      />

      {error && (
        <Alert variant="error" title="Could not load users" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <p className="section-title">All Registered Users</p>
          <p className="text-sm text-gray-500">{countLabel}</p>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-gray-500">Loading users...</div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Role</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Registered On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {rows.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 text-gray-900 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-gray-700">{user.email}</td>
                    <td className="px-4 py-3 text-gray-700">{roleLabel(user.role, user.adminCategory)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDateTime(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
