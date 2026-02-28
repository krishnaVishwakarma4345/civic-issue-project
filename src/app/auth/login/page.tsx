import type { Metadata } from "next";
import LoginForm         from "@/components/auth/LoginForm";
import Link              from "next/link";

export const metadata: Metadata = {
  title:       "Sign In | CivicReport",
  description: "Sign in to your CivicReport account",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-white font-extrabold text-xl">C</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="text-gray-500 text-sm mt-1">
          Sign in to continue to CivicReport
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <LoginForm />

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-xs text-gray-400">
              Don't have an account?
            </span>
          </div>
        </div>

        {/* Register Link */}
        <Link
          href="/register"
          className="flex items-center justify-center w-full py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
        >
          Create a free account
        </Link>
      </div>

      {/* Admin hint */}
      <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
        <p className="text-xs text-amber-700 text-center font-medium">
          🔐 Admin? Use your admin credentials to access the management panel.
        </p>
      </div>
    </div>
  );
}