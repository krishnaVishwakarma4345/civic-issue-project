import { format, formatDistanceToNow, parseISO, isValid } from "date-fns";

/**
 * Format ISO date string to human-readable date
 */
export const formatDate = (dateStr: string): string => {
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return "Invalid date";
    return format(date, "dd MMM yyyy");
  } catch {
    return "Invalid date";
  }
};

/**
 * Format ISO date string to full date + time
 */
export const formatDateTime = (dateStr: string): string => {
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return "Invalid date";
    return format(date, "dd MMM yyyy, hh:mm a");
  } catch {
    return "Invalid date";
  }
};

/**
 * Format ISO date string to relative time (e.g. "2 days ago")
 */
export const formatRelativeTime = (dateStr: string): string => {
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return "Unknown";
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "Unknown";
  }
};

/**
 * Truncate a string to a max length with ellipsis
 */
export const truncate = (str: string, maxLength: number = 100): string => {
  if (!str) return "";
  return str.length > maxLength ? `${str.slice(0, maxLength)}...` : str;
};

/**
 * Capitalize first letter of each word
 */
export const toTitleCase = (str: string): string => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Format a number with commas (e.g. 1000 → 1,000)
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-IN").format(num);
};

/**
 * Format percentage
 */
export const formatPercent = (value: number, total: number): string => {
  if (total === 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
};

/**
 * Generate initials from a full name
 */
export const getInitials = (name: string): string => {
  if (!name) return "?";
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
};