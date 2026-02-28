import React    from "react";
import Link     from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | CivicReport",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-50 via-white to-green-50">
      {/* Minimal Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">
            Civic<span className="text-primary-600">Report</span>
          </span>
        </Link>
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back to Home
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-gray-400">
        © {new Date().getFullYear()} CivicReport · Government of India Initiative
      </footer>
    </div>
  );
}