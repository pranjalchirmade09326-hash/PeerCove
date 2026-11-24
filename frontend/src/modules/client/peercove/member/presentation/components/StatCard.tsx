/**
 * StatCard Component - Presentation Layer
 *
 * Reusable card component for displaying dashboard statistics.
 *
 * Layer: Presentation
 */

"use client";

import React from "react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number;
  unit?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: number;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit = "",
  trend = "neutral",
  trendValue = 0,
  icon,
  description,
  className,
  onClick,
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      role="article"
      aria-label={`${title}: ${value}${unit}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-bold text-gray-900">
              {value}
              {unit && <span className="text-sm text-gray-500">{unit}</span>}
            </p>
            {trendValue !== 0 && (
              <div className={cn("flex items-center gap-1", getTrendColor())}>
                {getTrendIcon()}
                <span className="text-xs font-medium">{Math.abs(trendValue)}%</span>
              </div>
            )}
          </div>
          {description && (
            <p className="mt-2 text-xs text-gray-500">{description}</p>
          )}
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
    </div>
  );
};

export default StatCard;
