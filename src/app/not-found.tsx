import React from "react";
import Link  from "next/link";
import Button from "@/components/ui/Button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      {/* Illustration */}
      <div className="w-24 h-24 rounded-full bg-primary-50 flex items-center justify-center mb-6">
        <span className="text-5xl">🏙️</span>
      </div>

      {/* Text */}
      <h1 className="text-6xl font-extrabold text-primary-600 mb-2">404</h1>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
      <p className="text-gray-500 text-center max-w-sm mb-8">
        The page you're looking for doesn't exist or has been moved.
        Let's get you back on track.
      </p>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button
            variant="primary"
            leftIcon={<Home size={16} />}
          >
            Go Home
          </Button>
        </Link>
        <Button
          variant="secondary"
          leftIcon={<ArrowLeft size={16} />}
          onClick={() => window.history.back()}
        >
          Go Back
        </Button>
      </div>

      {/* Decorative */}
      <div className="mt-12 flex items-center gap-2 text-xs text-gray-300">
        <span>CivicReport</span>
        <span>·</span>
        <span>Error 404</span>
      </div>
    </div>
  );
}