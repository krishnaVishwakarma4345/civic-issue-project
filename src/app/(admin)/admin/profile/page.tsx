"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  User, Mail, Phone, MapPin, Briefcase,
  GraduationCap, Calendar, Save, Edit3,
  CheckCircle2, Shield, FileText, Clock,
  ChevronRight, Activity,
} from "lucide-react";
import { useAuthContext }     from "@/context/AuthContext";
import { updateUserDocument } from "@/lib/firebase/firestore";
import { formatDateTime }     from "@/lib/utils/formatters";
import { cn }                 from "@/lib/utils/cn";
import type { User as UserType } from "@/types/user";

// ─── Constants ────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: "male",              label: "Male"               },
  { value: "female",            label: "Female"             },
  { value: "other",             label: "Other"              },
  { value: "prefer_not_to_say", label: "Prefer not to say"  },
];

const QUALIFICATION_OPTIONS = [
  "High School", "Diploma", "Bachelor's Degree",
  "Master's Degree", "Doctorate (PhD)", "Professional Degree", "Other",
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

type ProfileForm = {
  name: string; phone: string; age: string; gender: string;
  occupation: string; qualification: string; address: string;
  city: string; state: string; pincode: string; bio: string;
};

// ─── Sub-components ───────────────────────────────────────────

function AdminAvatar({ name }: { name: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700
                    flex items-center justify-center text-white font-bold text-2xl shadow-lg shrink-0">
      {initials}
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string | number; color: string;
}) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", color)}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

// Reusable styled field wrappers for the dark theme
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-300 mb-1.5">
      {children}
      {required && <span className="text-primary-400 ml-0.5">*</span>}
    </label>
  );
}

function ReadonlyField({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-700/50
                      border border-gray-600/50 text-gray-400 text-sm">
        {icon && <span className="text-gray-500 shrink-0">{icon}</span>}
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}

function AdminInput({ label, value, onChange, disabled, placeholder, icon, type = "text", maxLength, hint }: {
  label: string; value: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean; placeholder?: string; icon?: React.ReactNode;
  type?: string; maxLength?: number; hint?: string;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 shrink-0">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            "w-full rounded-lg border text-sm transition-all outline-none py-2.5",
            icon ? "pl-9 pr-3" : "px-3",
            disabled
              ? "bg-gray-700/50 border-gray-600/50 text-gray-400 cursor-default"
              : "bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          )}
        />
      </div>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

function AdminSelect({ label, value, onChange, disabled, options, placeholder }: {
  label: string; value: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean; options: { value: string; label: string }[]; placeholder?: string;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          "w-full rounded-lg border text-sm transition-all outline-none px-3 py-2.5",
          disabled
            ? "bg-gray-700/50 border-gray-600/50 text-gray-400 cursor-default"
            : "bg-gray-700 border-gray-600 text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function SectionCard({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-700">
        <span className="text-primary-400">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────

export default function AdminProfilePage() {
  const { userData } = useAuthContext();

  const [editing,   setEditing]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [saveOk,    setSaveOk]    = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [form, setForm] = useState<ProfileForm>({
    name: "", phone: "", age: "", gender: "",
    occupation: "", qualification: "",
    address: "", city: "", state: "", pincode: "", bio: "",
  });

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
      setSaveError(err instanceof Error ? err.message : "Failed to save.");
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

  // Profile completeness
  const profileFields: (keyof ProfileForm)[] =
    ["phone","age","gender","occupation","qualification","address","city","state","pincode","bio"];
  const filled      = profileFields.filter((f) => form[f]?.toString().trim()).length;
  const completePct = Math.round((filled / profileFields.length) * 100);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* ── Page Title ──────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Profile</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your administrator account details.</p>
      </div>

      {/* ── Alerts ──────────────────────────────────────────── */}
      {saveOk && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10
                        border border-green-500/20 text-green-400 text-sm">
          <CheckCircle2 size={16} className="shrink-0" />
          Profile saved successfully.
        </div>
      )}
      {saveError && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl
                        bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <span>{saveError}</span>
          <button onClick={() => setSaveError(null)} className="text-red-400 hover:text-red-300 ml-3">✕</button>
        </div>
      )}

      {/* ── Hero Card ──────────────────────────────────────── */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <AdminAvatar name={userData.name} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white">{userData.name}</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold
                               bg-primary-500/20 text-primary-400 border border-primary-500/30">
                Administrator
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
                               font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Online
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">{userData.email}</p>
            {form.occupation && (
              <p className="text-sm text-gray-300 mt-1 flex items-center gap-1.5">
                <Briefcase size={13} className="text-gray-500" />
                {form.occupation}
                {form.city && <> · {form.city}</>}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <Calendar size={11} />
              Member since {formatDateTime(userData.createdAt)}
            </p>
          </div>

          {/* Edit / Save buttons */}
          <div className="flex gap-2 shrink-0">
            {editing ? (
              <>
                <button type="button" onClick={handleCancel}
                  className="px-3 py-1.5 rounded-lg border border-gray-600 text-sm
                             text-gray-300 hover:bg-gray-700 transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary-600
                             hover:bg-primary-500 text-white text-sm font-medium transition-colors
                             disabled:opacity-60">
                  <Save size={14} />
                  {saving ? "Saving..." : "Save"}
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border
                           border-gray-600 text-gray-300 hover:bg-gray-700 text-sm
                           font-medium transition-colors">
                <Edit3 size={14} />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Completeness bar */}
        <div className="mt-5 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-400">Profile completeness</span>
            <span className="text-xs font-bold text-gray-300">{completePct}%</span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
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
            <p className="text-xs text-gray-500 mt-1.5">
              Complete your profile.{" "}
              <button onClick={() => setEditing(true)}
                className="text-primary-400 underline underline-offset-2 font-medium">
                Fill now
              </button>
            </p>
          )}
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          icon={<Activity size={18} className="text-primary-400" />}
          label="Account Status"
          value="Active"
          color="bg-primary-500/10"
        />
        <StatCard
          icon={<Shield size={18} className="text-green-400" />}
          label="Role"
          value="Admin"
          color="bg-green-500/10"
        />
        <StatCard
          icon={<CheckCircle2 size={18} className="text-amber-400" />}
          label="Email Verified"
          value="Yes"
          color="bg-amber-500/10"
        />
      </div>

      {/* ── Personal Information ───────────────────────────── */}
      <SectionCard title="Personal Information" icon={<User size={16} />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AdminInput
            label="Full Name" value={form.name} onChange={set("name")}
            disabled={!editing} icon={<User size={15} />} 
          />
          <AdminInput
            label="Phone Number" value={form.phone} onChange={set("phone")}
            disabled={!editing} placeholder="+91 98765 43210" icon={<Phone size={15} />}
          />
          <AdminInput
            label="Age" value={form.age} onChange={set("age")}
            disabled={!editing} placeholder="e.g. 35" type="number"
          />
          <AdminSelect
            label="Gender" value={form.gender} onChange={set("gender")}
            disabled={!editing} placeholder="Select gender"
            options={GENDER_OPTIONS}
          />
        </div>

        {/* Bio */}
        <div className="mt-4">
          <FieldLabel>Bio <span className="text-gray-500 font-normal">(optional)</span></FieldLabel>
          <textarea
            value={form.bio} onChange={set("bio")}
            disabled={!editing} rows={3} maxLength={300}
            placeholder="Brief description about your role..."
            className={cn(
              "w-full rounded-lg border text-sm resize-none transition-all outline-none px-3 py-2.5",
              !editing
                ? "bg-gray-700/50 border-gray-600/50 text-gray-400 cursor-default"
                : "bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            )}
          />
          {editing && (
            <p className="text-xs text-gray-500 text-right mt-1">{form.bio.length}/300</p>
          )}
        </div>
      </SectionCard>

      {/* ── Professional Details ────────────────────────────── */}
      <SectionCard title="Professional Details" icon={<Briefcase size={16} />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AdminInput
            label="Occupation / Designation" value={form.occupation} onChange={set("occupation")}
            disabled={!editing} placeholder="e.g. Municipal Commissioner"
            icon={<Briefcase size={15} />}
          />
          <AdminSelect
            label="Qualification" value={form.qualification} onChange={set("qualification")}
            disabled={!editing} placeholder="Select qualification"
            options={QUALIFICATION_OPTIONS.map((q) => ({ value: q, label: q }))}
          />
        </div>
      </SectionCard>

      {/* ── Address ───────────────────────────────────────────── */}
      <SectionCard title="Address" icon={<MapPin size={16} />}>
        <div className="space-y-4">
          <AdminInput
            label="Street Address" value={form.address} onChange={set("address")}
            disabled={!editing} placeholder="e.g. Office Block 3, Mantralaya"
            icon={<MapPin size={15} />}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <AdminInput
              label="City" value={form.city} onChange={set("city")}
              disabled={!editing} placeholder="e.g. Mumbai"
            />
            <AdminSelect
              label="State" value={form.state} onChange={set("state")}
              disabled={!editing} placeholder="Select state"
              options={INDIAN_STATES.map((s) => ({ value: s, label: s }))}
            />
            <AdminInput
              label="PIN Code" value={form.pincode} onChange={set("pincode")}
              disabled={!editing} placeholder="e.g. 400001" maxLength={6}
            />
          </div>
        </div>
      </SectionCard>

      {/* ── Account Information (read-only) ──────────────────── */}
      <SectionCard title="Account Information" icon={<Shield size={16} />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ReadonlyField label="Email Address"   value={userData.email}      icon={<Mail size={15} />} />
          <ReadonlyField label="Account Role"    value="Administrator"       icon={<Shield size={15} />} />
          <ReadonlyField label="Member Since"    value={formatDateTime(userData.createdAt)} icon={<Calendar size={15} />} />
          <ReadonlyField label="User ID"         value={userData.uid}        icon={<FileText size={15} />} />
        </div>
      </SectionCard>

      {/* Sticky save bar */}
      {editing && (
        <div className="sticky bottom-4 flex justify-end gap-3 bg-gray-800/90 backdrop-blur-sm
                        border border-gray-700 rounded-xl px-4 py-3 shadow-2xl">
          <button type="button" onClick={handleCancel}
            className="px-4 py-2 rounded-lg border border-gray-600 text-sm
                       text-gray-300 hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary-600
                       hover:bg-primary-500 text-white text-sm font-medium
                       transition-colors disabled:opacity-60">
            <Save size={15} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}