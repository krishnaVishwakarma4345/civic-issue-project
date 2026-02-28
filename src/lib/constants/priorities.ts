import { IssuePriority } from "@/types/issue";

export interface PriorityMeta {
  value: IssuePriority;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
  weight: number;
}

export const PRIORITIES: PriorityMeta[] = [
  {
    value: "low",
    label: "Low",
    color: "text-green-700",
    bgColor: "bg-green-100",
    borderColor: "border-green-300",
    dotColor: "bg-green-500",
    weight: 1,
  },
  {
    value: "medium",
    label: "Medium",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
    borderColor: "border-yellow-300",
    dotColor: "bg-yellow-500",
    weight: 2,
  },
  {
    value: "high",
    label: "High",
    color: "text-red-700",
    bgColor: "bg-red-100",
    borderColor: "border-red-300",
    dotColor: "bg-red-500",
    weight: 3,
  },
];

export const PRIORITY_MAP = PRIORITIES.reduce(
  (acc, p) => {
    acc[p.value] = p;
    return acc;
  },
  {} as Record<IssuePriority, PriorityMeta>
);

export const getPriorityMeta = (value: IssuePriority): PriorityMeta => {
  return PRIORITY_MAP[value] ?? PRIORITIES[0];
};