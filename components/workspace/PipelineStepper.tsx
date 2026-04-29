"use client";

import { cn } from "@/lib/utils";
import type { ProjectStage } from "@/lib/schemas/chat";
import {
  Search,
  Blocks,
  Monitor,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from "lucide-react";

const stages: {
  key: ProjectStage;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: "discovery", label: "Discovery", icon: Search },
  { key: "architectural_design", label: "Architecture", icon: Blocks },
  { key: "visual_prototyping", label: "Prototyping", icon: Monitor },
  { key: "evaluation", label: "Evaluation", icon: ShieldCheck },
  { key: "complete", label: "Complete", icon: CheckCircle2 },
];

const stageOrder: ProjectStage[] = [
  "discovery",
  "architectural_design",
  "visual_prototyping",
  "evaluation",
  "complete",
];

interface PipelineStepperProps {
  currentStage: ProjectStage;
}

export function PipelineStepper({ currentStage }: PipelineStepperProps) {
  const currentIndex = stageOrder.indexOf(currentStage);

  return (
    <div className="flex flex-col gap-1 py-4 px-3">
      <h2 className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-fg-muted">
        Pipeline
      </h2>

      {stages.map((stage, index) => {
        const isActive = stage.key === currentStage;
        const isCompleted = index < currentIndex;
        const isLocked = index > currentIndex;
        const Icon = stage.icon;

        return (
          <div key={stage.key} className="relative">
            {/* Connector line */}
            {index < stages.length - 1 && (
              <div
                className={cn(
                  "absolute left-[19px] top-[40px] h-[calc(100%-8px)] w-0.5",
                  isCompleted ? "bg-success/40" : "bg-border"
                )}
              />
            )}

            <div
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-2 py-3 transition-all duration-300",
                isActive && "bg-accent/10",
                isLocked && "opacity-40"
              )}
            >
              {/* Icon circle */}
              <div
                className={cn(
                  "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                  isCompleted &&
                    "border-success bg-success/10 text-success",
                  isActive &&
                    "border-accent bg-accent/10 text-accent animate-pulse-glow",
                  isLocked && "border-border bg-bg-tertiary text-fg-muted"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isLocked ? (
                  <Lock className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-sm font-medium transition-colors",
                  isActive && "text-fg",
                  isCompleted && "text-success",
                  isLocked && "text-fg-muted"
                )}
              >
                {stage.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
