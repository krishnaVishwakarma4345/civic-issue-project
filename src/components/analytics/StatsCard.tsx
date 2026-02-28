import React from "react";
import { cn } from "@/lib/utils/cn";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatNumber } from "@/lib/utils/formatters";

interface StatsCardProps {
  title:       string;
  value:       number | string;
  icon:        React.ReactNode;
  iconBg?:     string;
  iconColor?:  string;
  trend?:      number;   // percentage change
  trendLabel?: string;
  suffix?:     string;
  className?:  string;
}

export default function StatsCard({
  title,
  value,
  icon,
  iconBg    = "bg-primary-50",
  iconColor = "text-primary-600",
  trend,
  trendLabel,
  suffix,
  className,
}: StatsCardProps) {
  const displayValue =
    typeof value === "number" ? formatNumber(value) : value;

  const TrendIcon =
    trend === undefined ? null :
    trend  > 0 ? TrendingUp :
    trend  < 0 ? TrendingDown : Minus;

  const trendColor =
    trend === undefined ? "" :
    trend  > 0 ? "text-green-600" :
    trend  < 0 ? "text-red-500"   : "text-gray-500";

  return (
    <div className={cn("card flex items-start gap-4", className)}>
      {/* Icon */}
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
          iconBg
        )}
      >
        <span className={cn("w-6 h-6", iconColor)}>{icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">
          {displayValue}
          {suffix && (
            <span className="text-sm font-normal text-gray-500 ml-1">
              {suffix}
            </span>
          )}
        </p>

        {TrendIcon && trend !== undefined && (
          <div className={cn("flex items-center gap-1 mt-1 text-xs font-medium", trendColor)}>
            <TrendIcon size={12} />
            <span>{Math.abs(trend)}%</span>
            {trendLabel && (
              <span className="text-gray-400 font-normal">{trendLabel}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}