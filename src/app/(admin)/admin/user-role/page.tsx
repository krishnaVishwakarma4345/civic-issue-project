"use client";

import React, { useMemo, useState } from "react";
import { Settings2, ShieldAlert } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { useAuthContext } from "@/context/AuthContext";
import { getIdToken } from "@/lib/firebase/auth";

const ROLE_OPTIONS = [
  { value: "citizen", label: "Citizen" },
  { value: "master-admin", label: "Master Admin" },
  { value: "department-admin", label: "Department Admin" },
];

const DEPARTMENT_OPTIONS = [
  { value: "road", label: "Road" },
  { value: "streetlight", label: "Streetlight" },
  { value: "garbage", label: "Garbage" },
  { value: "water", label: "Water" },
];

type UpdateResult = {
  uid: string;
  email: string | null;
  previousRole: string | null;
  previousAdminCategory: string | null;
  role: "citizen" | "master-admin" | "department-admin";
  adminCategory: "road" | "streetlight" | "garbage" | "water" | null;
};

export default function UserRoleManagementPage() {
  const { userData, loading } = useAuthContext();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"citizen" | "master-admin" | "department-admin">("citizen");
  const [adminCategory, setAdminCategory] = useState<"road" | "streetlight" | "garbage" | "water" | "">("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [result, setResult] = useState<UpdateResult | null>(null);

  const departmentDisabled = role !== "department-admin";

  const helperText = useMemo(() => {
    if (departmentDisabled) return "Department category is only required for Department Admin.";
    return "Choose which department this admin should manage.";
  }, [departmentDisabled]);

  const handleRoleChange = (value: string) => {
    const nextRole = value as "citizen" | "master-admin" | "department-admin";
    setRole(nextRole);
    if (nextRole !== "department-admin") {
      setAdminCategory("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setResult(null);

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (role === "department-admin" && !adminCategory) {
      setError("Please select department category for department-admin role.");
      return;
    }

    setSubmitting(true);
    try {
      const token = await getIdToken(true);
      if (!token) {
        setError("Unauthorized: Please log in again.");
        return;
      }

      const res = await fetch("/api/admin/users/role", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          role,
          adminCategory: role === "department-admin" ? adminCategory : null,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Failed to update user role.");
      }

      const data = json.data as UpdateResult;
      setResult(data);
      setSuccess("User role updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user role.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  if (userData?.role !== "master-admin") {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <PageHeader
          title="Change User Role"
          subtitle="Master-admin access is required for this section."
          breadcrumbs={[
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Change User Role" },
          ]}
          icon={<Settings2 size={20} />}
        />

        <Alert variant="error" title="Access Denied">
          Only master-admin users can change roles of registered users.
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <PageHeader
        title="Change User Role"
        subtitle="Modify role and department scope of registered users by email."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Change User Role" },
        ]}
        icon={<Settings2 size={20} />}
      />

      {error && (
        <Alert variant="error" title="Unable to update role" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" title="Success" onDismiss={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <div className="card space-y-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="User Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            required
          />

          <Select
            label="Role"
            value={role}
            onChange={(e) => handleRoleChange(e.target.value)}
            options={ROLE_OPTIONS}
            required
          />

          <Select
            label="Department Category"
            value={adminCategory}
            onChange={(e) => setAdminCategory(e.target.value as "road" | "streetlight" | "garbage" | "water" | "")}
            options={DEPARTMENT_OPTIONS}
            placeholder="Select category"
            disabled={departmentDisabled}
            hint={helperText}
          />

          <div className="pt-1">
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              leftIcon={<ShieldAlert size={16} />}
            >
              Modify User
            </Button>
          </div>
        </form>

        {result && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-1 text-sm">
            <p className="text-gray-700">
              <span className="font-semibold text-gray-900">Updated User:</span> {result.email ?? "Unknown"}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold text-gray-900">Previous Role:</span> {result.previousRole ?? "N/A"}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold text-gray-900">New Role:</span> {result.role}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold text-gray-900">Department Category:</span>{" "}
              {result.adminCategory ?? "Not Applicable"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
