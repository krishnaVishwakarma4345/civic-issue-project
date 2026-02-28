import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { getInitials } from "@/lib/utils/formatters";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  name?:      string;
  src?:       string | null;
  size?:      AvatarSize;
  className?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
  xs: "w-6  h-6  text-xs",
  sm: "w-8  h-8  text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

const imageSizes: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

export default function Avatar({
  name,
  src,
  size      = "md",
  className,
}: AvatarProps) {
  const initials = getInitials(name ?? "?");
  const px       = imageSizes[size];

  if (src) {
    return (
      <div
        className={cn(
          "rounded-full overflow-hidden shrink-0 bg-gray-200",
          sizeStyles[size],
          className
        )}
      >
        <Image
          src={src}
          alt={name ?? "User avatar"}
          width={px}
          height={px}
          className="object-cover w-full h-full"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-full shrink-0 flex items-center justify-center",
        "bg-primary-100 text-primary-700 font-semibold select-none",
        sizeStyles[size],
        className
      )}
      aria-label={name ?? "User"}
    >
      {initials}
    </div>
  );
}