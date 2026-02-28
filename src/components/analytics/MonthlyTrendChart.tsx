"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { MonthlyTrend } from "@/types/analytics";

interface MonthlyTrendChartProps {
  data:       MonthlyTrend[];
  className?: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?:  boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?:   string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-800 mb-2">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

export default function MonthlyTrendChart({
  data,
  className,
}: MonthlyTrendChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="reportedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="resolvedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="month"
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
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }}
          />

          <Area
            type="monotone"
            dataKey="reported"
            name="Reported"
            stroke="#16a34a"
            strokeWidth={2.5}
            fill="url(#reportedGradient)"
            dot={{ r: 4, fill: "#16a34a", strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
          <Area
            type="monotone"
            dataKey="resolved"
            name="Resolved"
            stroke="#3b82f6"
            strokeWidth={2.5}
            fill="url(#resolvedGradient)"
            dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}