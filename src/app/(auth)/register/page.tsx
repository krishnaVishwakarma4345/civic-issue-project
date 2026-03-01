import type { Metadata } from "next";
import RegisterForm      from "@/components/auth/RegisterForm";
import Link              from "next/link";
import { CheckCircle2 }  from "lucide-react";

export const metadata: Metadata = {
  title:       "Create Account | CivicReport",
  description: "Create your free CivicReport citizen account",
};

const BENEFITS = [
  "Report any civic issue in under 2 minutes",
  "Track your issue status in real-time",
  "Get notified when issues are resolved",
  "Access interactive issue map for your area",
];

export default function RegisterPage() {
  return (
    <div className="w-full max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

        {/* ─── Left Panel (Benefits) ─────────────────────── */}
        <div className="hidden lg:flex flex-col justify-center lg:col-span-2 pr-8">
          <div className="mb-8">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="font-bold text-gray-900 text-lg">
                Civic<span className="text-primary-600">Report</span>
              </span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Be the change your city needs.
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Join thousands of active citizens who are making their
              communities cleaner, safer, and better — one report at a time.
            </p>
          </div>

          <ul className="space-y-3">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <CheckCircle2
                  size={18}
                  className="text-primary-600 mt-0.5 shrink-0"
                />
                <span className="text-sm text-gray-600">{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 p-4 rounded-xl bg-primary-50 border border-primary-100">
            <p className="text-xs font-semibold text-primary-700 mb-1">
              🔒 Your data is secure
            </p>
            <p className="text-xs text-primary-600 leading-relaxed">
              All data is encrypted and stored securely. We never share your
              personal information with third parties.
            </p>
          </div>
        </div>

        {/* ─── Right Panel (Form) ────────────────────────── */}
        <div className="lg:col-span-3">
          <div className="text-center mb-6 lg:text-left">
            <h1 className="text-2xl font-bold text-gray-900">
              Create your account
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Free forever · No credit card required
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <RegisterForm />

            {/* Sign In Link */}
            <div className="relative mt-6 mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-gray-400">
                  Already have an account?
                </span>
              </div>
            </div>

            <Link
              href="/login"
              className="flex items-center justify-center w-full py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            >
              Sign in instead
            </Link>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            By creating an account, you agree to our{" "}
            <Link href="#" className="underline hover:text-gray-600">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="underline hover:text-gray-600">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}