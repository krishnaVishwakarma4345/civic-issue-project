import { IssueCategory } from "@/types/issue";

export interface CategoryMeta {
  value: IssueCategory;
  label: string;
  icon: string;
  description: string;
  color: string;
  bgColor: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    value: "road",
    label: "Road & Infrastructure",
    icon: "🛣️",
    description: "Potholes, broken roads, damaged pavements",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
  },
  {
    value: "garbage",
    label: "Garbage & Waste",
    icon: "🗑️",
    description: "Uncollected garbage, illegal dumping",
    color: "text-red-700",
    bgColor: "bg-red-100",
  },
  {
    value: "water",
    label: "Water Supply",
    icon: "💧",
    description: "Water leaks, supply issues, contamination",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  {
    value: "streetlight",
    label: "Street Lighting",
    icon: "💡",
    description: "Broken street lights, dark areas",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
  },
  {
    value: "sanitation",
    label: "Sanitation",
    icon: "🧹",
    description: "Drainage, sewage, public toilet issues",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
  },
];

export const CATEGORY_MAP = CATEGORIES.reduce(
  (acc, cat) => {
    acc[cat.value] = cat;
    return acc;
  },
  {} as Record<IssueCategory, CategoryMeta>
);

export const getCategoryMeta = (value: IssueCategory): CategoryMeta => {
  return CATEGORY_MAP[value] ?? CATEGORIES[0];
};