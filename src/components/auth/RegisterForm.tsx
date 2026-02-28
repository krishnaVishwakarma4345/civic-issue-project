"use client";

import React, { useState } from "react";
import { useForm }         from "react-hook-form";
import { zodResolver }     from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useAuth }      from "@/hooks/useAuth";
import {
  registerSchema,
  type RegisterFormData,
} from "@/lib/utils/validators";
import Input  from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert  from "@/components/ui/Alert";
import { cn } from "@/lib/utils/cn";

// ─── Password Strength ────────────────────────────────────────

interface PasswordRule {
  label:  string;
  test:   (v: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter",  test: (v) => /[A-Z]/.test(v) },
  { label: "One number",            test: (v) => /[0-9]/.test(v) },
];

function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null;

  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  const strengthLabel = ["Weak", "Fair", "Good", "Strong"][passed] ?? "Weak";
  const strengthColor = [
    "bg-red-400",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-primary-500",
  ][passed] ?? "bg-red-400";

  return (
    <div className="mt-2 space-y-2">
      {/* Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              strengthColor
            )}
            style={{ width: `${(passed / 3) * 100}%` }}
          />
        </div>
        <span className={cn(
          "text-xs font-medium",
          passed === 0 ? "text-red-500" :
          passed === 1 ? "text-orange-500" :
          passed === 2 ? "text-yellow-600" :
          "text-primary-600"
        )}>
          {strengthLabel}
        </span>
      </div>

      {/* Rules */}
      <ul className="space-y-1">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <li key={rule.label} className="flex items-center gap-1.5">
              {ok
                ? <CheckCircle2 size={12} className="text-primary-500 shrink-0" />
                : <XCircle     size={12} className="text-gray-300 shrink-0" />
              }
              <span className={cn(
                "text-xs",
                ok ? "text-gray-600" : "text-gray-400"
              )}>
                {rule.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────

export default function RegisterForm() {
  const { register: registerUser, authLoading, authError } = useAuth();
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver:      zodResolver(registerSchema),
    defaultValues: {
      name:            "",
      email:           "",
      password:        "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const passwordValue = watch("password", "");

  const onSubmit = async (data: RegisterFormData) => {
    await registerUser({
      name:     data.name,
      email:    data.email,
      password: data.password,
      role:     "citizen",
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Global Error */}
      {authError && (
        <Alert variant="error">{authError}</Alert>
      )}

      {/* Full Name */}
      <Input
        label="Full name"
        type="text"
        placeholder="Rajesh Kumar"
        autoComplete="name"
        leftIcon={<User size={16} />}
        error={errors.name?.message}
        hint="Use your real name as it will appear on reports"
        required
        {...register("name")}
      />

      {/* Email */}
      <Input
        label="Email address"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        leftIcon={<Mail size={16} />}
        error={errors.email?.message}
        required
        {...register("email")}
      />

      {/* Password */}
      <div>
        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Create a strong password"
          autoComplete="new-password"
          leftIcon={<Lock size={16} />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-gray-400 hover:text-gray-600 transition-colors pointer-events-auto"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
          error={errors.password?.message}
          required
          {...register("password")}
        />
        <PasswordStrengthIndicator password={passwordValue} />
      </div>

      {/* Confirm Password */}
      <Input
        label="Confirm password"
        type={showConfirm ? "text" : "password"}
        placeholder="Re-enter your password"
        autoComplete="new-password"
        leftIcon={<Lock size={16} />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="text-gray-400 hover:text-gray-600 transition-colors pointer-events-auto"
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
        error={errors.confirmPassword?.message}
        required
        {...register("confirmPassword")}
      />

      {/* Role Info Badge */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-primary-50 border border-primary-100">
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
          <User size={14} className="text-primary-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-primary-700">
            Registering as Citizen
          </p>
          <p className="text-xs text-primary-600 mt-0.5">
            You'll be able to report and track civic issues.
          </p>
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={isSubmitting || authLoading}
        rightIcon={<ArrowRight size={18} />}
      >
        Create Account
      </Button>
    </form>
  );
}