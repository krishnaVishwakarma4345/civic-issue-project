"use client";

import React, { useState } from "react";
import { useForm }         from "react-hook-form";
import { zodResolver }     from "@hookform/resolvers/zod";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth }         from "@/hooks/useAuth";
import {
  loginSchema,
  type LoginFormData,
} from "@/lib/utils/validators";
import Input   from "@/components/ui/Input";
import Button  from "@/components/ui/Button";
import Alert   from "@/components/ui/Alert";
import Link    from "next/link";

export default function LoginForm() {
  const { login, authLoading, authError, forgotPassword } = useAuth();
  const [showPassword,    setShowPassword]    = useState(false);
  const [forgotMode,      setForgotMode]      = useState(false);
  const [forgotEmail,     setForgotEmail]     = useState("");
  const [forgotSuccess,   setForgotSuccess]   = useState(false);
  const [forgotLoading,   setForgotLoading]   = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<LoginFormData>({
    resolver:      zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // ─── Submit ──────────────────────────────────────────────

  const onSubmit = async (data: LoginFormData) => {
    await login(data);
  };

  // ─── Forgot Password ─────────────────────────────────────

  const handleForgotPassword = async () => {
    const email = forgotEmail || getValues("email");
    if (!email) {
      setForgotMode(true);
      return;
    }
    setForgotLoading(true);
    const success = await forgotPassword(email);
    if (success) setForgotSuccess(true);
    setForgotLoading(false);
  };

  // ─── Forgot Mode UI ──────────────────────────────────────

  if (forgotMode) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-2">
          <h3 className="font-semibold text-gray-900">Reset Password</h3>
          <p className="text-sm text-gray-500 mt-1">
            Enter your email to receive a reset link
          </p>
        </div>

        {forgotSuccess ? (
          <Alert variant="success" title="Email sent!">
            Check your inbox for the password reset link.
            <button
              onClick={() => {
                setForgotMode(false);
                setForgotSuccess(false);
              }}
              className="block mt-2 text-xs font-semibold underline"
            >
              Back to sign in
            </button>
          </Alert>
        ) : (
          <>
            <Input
              label="Email address"
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="you@example.com"
              leftIcon={<Mail size={16} />}
            />
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setForgotMode(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                loading={forgotLoading}
                onClick={handleForgotPassword}
              >
                Send Reset Link
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ─── Main Login Form ─────────────────────────────────────

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Global Error */}
      {authError && (
        <Alert variant="error">{authError}</Alert>
      )}

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
          placeholder="Enter your password"
          autoComplete="current-password"
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

        {/* Forgot Password */}
        <div className="flex justify-end mt-1.5">
          <button
            type="button"
            onClick={() => setForgotMode(true)}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            Forgot password?
          </button>
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
        Sign In
      </Button>

      {/* Demo accounts hint */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
        <p className="text-xs font-semibold text-gray-600 mb-2">
          🧪 Demo Credentials
        </p>
        <div className="space-y-1 text-xs text-gray-500">
          <p>
            <span className="font-medium">Citizen:</span>{" "}
            citizen@demo.com / Demo@1234
          </p>
          <p>
            <span className="font-medium">Admin:</span>{" "}
            admin@demo.com / Admin@1234
          </p>
        </div>
      </div>
    </form>
  );
}