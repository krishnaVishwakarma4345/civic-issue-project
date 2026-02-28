"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { StatusDistribution } from "@/types/analytics";
import { getStatusMeta } from "@/lib/constants/statuses";
import { IssueStatus } from "@/types/issue";

interface StatusPieChartProps {
  data:       StatusDistribution[];
  className?: string;
}

const STATUS_COLORS: Record<string, string> = {
  reported:    "#ef4444",
  assigned:    "#f97316",
  "in-progress": "#eab308",
  resolved:    "#16a34a",
};

const CustomTooltip = ({
  active,
  payload,
}: {
  active?:  boolean;
  payload?: Array<{ payload: StatusDistribution & { fill: string } }>;
}) => {
  if (!active || !payload?.length) return null;
  const d    = payload[0].payload;
  const meta = getStatusMeta(d.status as IssueStatus);
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-900">{meta.label}</p>
      <p className="text-gray-600">{d.count} issues ({d.percentage}%)</p>
    </div>
  );
};

const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  outerRadius,
  percent,
}: {
  cx:          number;
  cy:          number;
  midAngle:    number;
  outerRadius: number;
  percent:     number;
}) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 25;
  const x      = cx + radius * Math.cos(-midAngle * RADIAN);
  const y      = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#374151"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={11}
      fontWeight={500}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function StatusPieChart({
  data,
  className,
}: StatusPieChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    name: getStatusMeta(d.status as IssueStatus).label,
    fill: STATUS_COLORS[d.status] ?? "#9ca3af",
  }));

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            outerRadius={90}
            innerRadius={50}
            dataKey="count"
            labelLine={false}
            label={renderCustomLabel}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
            formatter={(value) => (
              <span className="text-gray-700">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}