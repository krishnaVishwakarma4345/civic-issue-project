"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Calendar,
  Save,
  Edit3,
  CheckCircle2,
  Shield,
  FileText,
  Clock,
  ChevronRight,
} from "lucide-react";
import { useAuthContext }      from "@/context/AuthContext";
import { useIssueStore }       from "@/store/issueStore";
import { updateUserDocument }  from "@/lib/firebase/firestore";
import PageHeader              from "@/components/layout/PageHeader";
import { Card }                from "@/components/ui/Card";
import Input                   from "@/components/ui/Input";
import Button                  from "@/components/ui/Button";
import Alert                   from "@/components/ui/Alert";
import { cn }                  from "@/lib/utils/cn";
import { formatDateTime }      from "@/lib/utils/formatters";
import type { User as UserType } from "@/types/user";

// ─── Field config ─────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: "male",              label: "Male"              },
  { value: "female",            label: "Female"            },
  { value: "other",             label: "Other"             },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const QUALIFICATION_OPTIONS = [
  "High School",
  "Diploma",
  "Bachelor's Degree",
  "Master's Degree",
  "Doctorate (PhD)",
  "Professional Degree",
  "Other",
];

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli",
  "Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
];

// ─── Types ────────────────────────────────────────────────────

type ProfileForm = {
  name:          string;
  phone:         string;
  age:           string;
  gender:        string;
  occupation:    string;
  qualification: string;
  address:       string;
  city:          string;
  state:         string;
  pincode:       string;
  bio:           string;
};

// ─── Avatar ───────────────────────────────────────────────────

function ProfileAvatar({ name, size = "lg" }: { name: string; size?: "lg" | "xl" }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    "bg-primary-500", "bg-violet-500", "bg-emerald-500",
    "bg-amber-500",   "bg-rose-500",   "bg-cyan-500",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];

  return (
    <div className={cn(
      "rounded-full flex items-center justify-center font-bold text-white shrink-0",
      color,
      size === "xl" ? "w-20 h-20 text-2xl" : "w-14 h-14 text-lg"
    )}>
      {initials}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────

function StatCard({ icon, label, value, color }: {
  icon:  React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", color)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────

function Section({ title, icon, children }: {
  title:    string;
  icon:     React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-50">
        <span className="text-gray-400">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      {children}
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function ProfilePage() {
  const { userData }  = useAuthContext();
  const { myIssues }  = useIssueStore();

  const [editing,   setEditing]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saveOk,    setSaveOk]    = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [form, setForm] = useState<ProfileForm>({
    name:          "",
    phone:         "",
    age:           "",
    gender:        "",
    occupation:    "",
    qualification: "",
    address:       "",
    city:          "",
    state:         "",
    pincode:       "",
    bio:           "",
  });

  // Hydrate form from Firestore userData
  useEffect(() => {
    if (!userData) return;
    setForm({
      name:          userData.name          ?? "",
      phone:         userData.phone         ?? "",
      age:           userData.age?.toString() ?? "",
      gender:        userData.gender        ?? "",
      occupation:    userData.occupation    ?? "",
      qualification: userData.qualification ?? "",
      address:       userData.address       ?? "",
      city:          userData.city          ?? "",
      state:         userData.state         ?? "",
      pincode:       userData.pincode       ?? "",
      bio:           userData.bio           ?? "",
    });
  }, [userData]);

  const set = useCallback(
    (field: keyof ProfileForm) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value })),
    []
  );

  // ─── Save ──────────────────────────────────────────────────
  const handleSave = async () => {
    if (!userData?.uid) return;
    setSaving(true);
    setSaveError(null);

    try {
      const updates: Partial<UserType> = {
        name:          form.name.trim()          || userData.name,
        phone:         form.phone.trim()         || undefined,
        age:           form.age ? parseInt(form.age) : undefined,
        gender:        (form.gender as UserType["gender"]) || undefined,
        occupation:    form.occupation.trim()    || undefined,
        qualification: form.qualification.trim() || undefined,
        address:       form.address.trim()       || undefined,
        city:          form.city.trim()          || undefined,
        state:         form.state.trim()         || undefined,
        pincode:       form.pincode.trim()       || undefined,
        bio:           form.bio.trim()           || undefined,
      };

      await updateUserDocument(userData.uid, updates);
      setSaveOk(true);
      setEditing(false);
      setTimeout(() => setSaveOk(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!userData) return;
    setForm({
      name:          userData.name          ?? "",
      phone:         userData.phone         ?? "",
      age:           userData.age?.toString() ?? "",
      gender:        userData.gender        ?? "",
      occupation:    userData.occupation    ?? "",
      qualification: userData.qualification ?? "",
      address:       userData.address       ?? "",
      city:          userData.city          ?? "",
      state:         userData.state         ?? "",
      pincode:       userData.pincode       ?? "",
      bio:           userData.bio           ?? "",
    });
    setEditing(false);
    setSaveError(null);
  };

  if (!userData) return null;

  // Issue stats
  const total      = myIssues.length;
  const resolved   = myIssues.filter((i) => i.status === "resolved").length;
  const pending    = myIssues.filter((i) => i.status === "reported").length;
  const inProgress = myIssues.filter((i) => i.status === "in-progress" || i.status === "assigned").length;

  // Profile completeness
  const profileFields: (keyof ProfileForm)[] = [
    "phone","age","gender","occupation","qualification","address","city","state","pincode","bio"
  ];
  const filled      = profileFields.filter((f) => form[f]?.toString().trim()).length;
  const completePct = Math.round((filled / profileFields.length) * 100);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal information and account details."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Profile" },
        ]}
      />

      {/* ── Alerts ──────────────────────────────────────────── */}
      {saveOk && (
        <Alert variant="success" title="Profile saved">
          Your information has been updated successfully.
        </Alert>
      )}
      {saveError && (
        <Alert variant="error" title="Save failed" onDismiss={() => setSaveError(null)}>
          {saveError}
        </Alert>
      )}

      {/* ── Hero Card ──────────────────────────────────────── */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <ProfileAvatar name={userData.name} size="xl" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900">{userData.name}</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 capitalize">
                {userData.role}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{userData.email}</p>
            {form.occupation && (
              <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
                <Briefcase size={13} className="text-gray-400" />
                {form.occupation}
                {form.city && <> · {form.city}</>}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <Calendar size={11} />
              Member since {formatDateTime(userData.createdAt)}
            </p>
          </div>

          {/* Edit / Save buttons */}
          <div className="flex gap-2 shrink-0">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600
                             hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={saving}
                  leftIcon={<Save size={14} />}
                  onClick={handleSave}
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Edit3 size={14} />}
                onClick={() => setEditing(true)}
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Profile completeness bar */}
        <div className="mt-5 pt-4 border-t border-gray-50">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-500">Profile completeness</span>
            <span className="text-xs font-bold text-gray-700">{completePct}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                completePct >= 80 ? "bg-green-500"
                : completePct >= 50 ? "bg-primary-500"
                : "bg-amber-400"
              )}
              style={{ width: `${completePct}%` }}
            />
          </div>
          {completePct < 100 && !editing && (
            <p className="text-xs text-gray-400 mt-1.5">
              Complete your profile to help authorities reach you faster.{" "}
              <button
                onClick={() => setEditing(true)}
                className="text-primary-600 underline underline-offset-2 font-medium"
              >
                Fill now
              </button>
            </p>
          )}
        </div>
      </Card>

      {/* ── Stats ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<FileText size={18} className="text-primary-600" />}
          label="Total Issues"
          value={total}
          color="bg-primary-50"
        />
        <StatCard
          icon={<Clock size={18} className="text-amber-600" />}
          label="Pending"
          value={pending}
          color="bg-amber-50"
        />
        <StatCard
          icon={<ChevronRight size={18} className="text-blue-600" />}
          label="In Progress"
          value={inProgress}
          color="bg-blue-50"
        />
        <StatCard
          icon={<CheckCircle2 size={18} className="text-green-600" />}
          label="Resolved"
          value={resolved}
          color="bg-green-50"
        />
      </div>

      {/* ── Personal Info ─────────────────────────────────────── */}
      <Section title="Personal Information" icon={<User size={16} />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            value={form.name}
            onChange={set("name")}
            disabled={!editing}
            leftIcon={<User size={15} />}
            required
          />
          <Input
            label="Phone Number"
            value={form.phone}
            onChange={set("phone")}
            disabled={!editing}
            placeholder="+91 98765 43210"
            leftIcon={<Phone size={15} />}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Age</label>
            <input
              type="number"
              min={10}
              max={110}
              value={form.age}
              onChange={set("age")}
              disabled={!editing}
              placeholder="e.g. 28"
              className={cn(
                "w-full px-3 py-2 rounded-lg border text-sm transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary-400",
                editing
                  ? "border-gray-300 bg-white"
                  : "border-gray-100 bg-gray-50 text-gray-600 cursor-default"
              )}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Gender</label>
            <select
              value={form.gender}
              onChange={set("gender")}
              disabled={!editing}
              className={cn(
                "w-full px-3 py-2 rounded-lg border text-sm transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary-400",
                editing
                  ? "border-gray-300 bg-white"
                  : "border-gray-100 bg-gray-50 text-gray-600 cursor-default"
              )}
            >
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-4 flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Bio <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={form.bio}
            onChange={set("bio")}
            disabled={!editing}
            rows={3}
            maxLength={300}
            placeholder="Tell us a little about yourself..."
            className={cn(
              "w-full px-3 py-2 rounded-lg border text-sm resize-none transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary-400",
              editing
                ? "border-gray-300 bg-white"
                : "border-gray-100 bg-gray-50 text-gray-600 cursor-default"
            )}
          />
          {editing && (
            <p className="text-xs text-gray-400 text-right">{form.bio.length}/300</p>
          )}
        </div>
      </Section>

      {/* ── Professional Info ─────────────────────────────────── */}
      <Section title="Professional Details" icon={<Briefcase size={16} />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Occupation"
            value={form.occupation}
            onChange={set("occupation")}
            disabled={!editing}
            placeholder="e.g. Software Engineer"
            leftIcon={<Briefcase size={15} />}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Qualification</label>
            <select
              value={form.qualification}
              onChange={set("qualification")}
              disabled={!editing}
              className={cn(
                "w-full px-3 py-2 rounded-lg border text-sm transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary-400",
                editing
                  ? "border-gray-300 bg-white"
                  : "border-gray-100 bg-gray-50 text-gray-600 cursor-default"
              )}
            >
              <option value="">Select qualification</option>
              {QUALIFICATION_OPTIONS.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      {/* ── Address ───────────────────────────────────────────── */}
      <Section title="Address" icon={<MapPin size={16} />}>
        <div className="space-y-4">
          <Input
            label="Street Address"
            value={form.address}
            onChange={set("address")}
            disabled={!editing}
            placeholder="e.g. 12, Gandhi Nagar, Near Bus Stand"
            leftIcon={<MapPin size={15} />}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="City"
              value={form.city}
              onChange={set("city")}
              disabled={!editing}
              placeholder="e.g. Mumbai"
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">State</label>
              <select
                value={form.state}
                onChange={set("state")}
                disabled={!editing}
                className={cn(
                  "w-full px-3 py-2 rounded-lg border text-sm transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-primary-400",
                  editing
                    ? "border-gray-300 bg-white"
                    : "border-gray-100 bg-gray-50 text-gray-600 cursor-default"
                )}
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <Input
              label="PIN Code"
              value={form.pincode}
              onChange={set("pincode")}
              disabled={!editing}
              placeholder="e.g. 400001"
              maxLength={6}
            />
          </div>
        </div>
      </Section>

      {/* ── Account Info (read-only) ──────────────────────────── */}
      <Section title="Account Information" icon={<Shield size={16} />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email Address"
            value={userData.email}
            disabled
            leftIcon={<Mail size={15} />}
            hint="Email cannot be changed"
          />
          <Input
            label="Account Role"
            value={userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
            disabled
            leftIcon={<Shield size={15} />}
          />
          <Input
            label="Member Since"
            value={formatDateTime(userData.createdAt)}
            disabled
            leftIcon={<Calendar size={15} />}
          />
          <Input
            label="User ID"
            value={userData.uid}
            disabled
            hint="Unique identifier for your account"
          />
        </div>
      </Section>

      {/* Bottom Save bar (visible only while editing) */}
      {editing && (
        <div className="sticky bottom-4 flex justify-end gap-3 bg-white/80 backdrop-blur-sm
                        border border-gray-100 rounded-xl px-4 py-3 shadow-lg">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600
                       hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <Button
            variant="primary"
            loading={saving}
            leftIcon={<Save size={15} />}
            onClick={handleSave}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}