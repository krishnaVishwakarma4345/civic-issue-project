import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes safely with clsx + tailwind-merge
 * Prevents class conflicts (e.g. bg-red-500 + bg-green-500)
 */
export const cn = (...inputs: ClassValue[]): string => {
  return twMerge(clsx(inputs));
};