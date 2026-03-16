"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { CategoryCount } from "@/types/analytics";
import { getCategoryMeta } from "@/lib/constants/categories";
import { IssueCategory } from "@/types/issue";

interface CategoryBarChartProps {
  data:       CategoryCount[];
  className?: string;
}

const CHART_COLORS = [
  "#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0",
];

const CustomTooltip = ({
  active,
  payload,
}: {
  active?:  boolean;
  payload?: Array<{ payload: CategoryCount & { label: string }; value: number }>;
}) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  const meta = getCategoryMeta(item.category as IssueCategory);
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-900">
        {meta.icon} {meta.label}
      </p>
      <p className="text-primary-600 font-medium">{payload[0].value} issues</p>
    </div>
  );
};

export default function CategoryBarChart({
  data,
  className,
}: CategoryBarChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: getCategoryMeta(d.category as IssueCategory).label,
  }));

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
          barCategoryGap="30%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}