import React from "react";
import { STATUSES } from "@/lib/constants/statuses";
import { IssueStatus } from "@/types/issue";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface IssueTimelineProps {
  currentStatus: IssueStatus;
  className?:    string;
}

export default function IssueTimeline({
  currentStatus,
  className,
}: IssueTimelineProps) {
  const currentStep = STATUSES.find((s) => s.value === currentStatus)?.step ?? 1;

  return (
    <div className={cn("w-full", className)}>
      <div className="relative flex items-start justify-between">
        {/* Connecting line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute top-4 left-0 h-0.5 bg-primary-500 z-0 transition-all duration-500"
          style={{
            width: `${((currentStep - 1) / (STATUSES.length - 1)) * 100}%`,
          }}
        />

        {STATUSES.map((status) => {
          const isCompleted = status.step <  currentStep;
          const isCurrent   = status.step === currentStep;
          const isPending   = status.step >  currentStep;

          return (
            <div
              key={status.value}
              className="relative z-10 flex flex-col items-center gap-2 flex-1"
            >
              {/* Circle */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center",
                  "transition-all duration-300",
                  isCompleted &&
                    "bg-primary-600 border-primary-600 text-white",
                  isCurrent &&
                    "bg-white border-primary-600 text-primary-600 ring-4 ring-primary-100",
                  isPending &&
                    "bg-white border-gray-300 text-gray-300"
                )}
              >
                {isCompleted ? (
                  <Check size={14} strokeWidth={3} />
                ) : (
                  <span className="text-xs font-bold">{status.step}</span>
                )}
              </div>

              {/* Label */}
              <div className="text-center px-1">
                <p
                  className={cn(
                    "text-xs font-semibold",
                    isCurrent   && "text-primary-600",
                    isCompleted && "text-gray-700",
                    isPending   && "text-gray-400"
                  )}
                >
                  {status.label}
                </p>
                <p className="text-xs text-gray-400 hidden sm:block leading-tight mt-0.5">
                  {status.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}