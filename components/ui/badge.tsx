import * as React from "react";
import { cn } from "@/lib/utils";
import type { ProjectStage } from "@/lib/schemas/chat";

const stageColorMap: Record<ProjectStage, string> = {
  discovery: "bg-stage-discovery/15 text-stage-discovery border-stage-discovery/30",
  architectural_design:
    "bg-stage-architecture/15 text-stage-architecture border-stage-architecture/30",
  execution_package:
    "bg-stage-evaluation/15 text-stage-evaluation border-stage-evaluation/30",
  complete:
    "bg-stage-complete/15 text-stage-complete border-stage-complete/30",
};

const stageLabelMap: Record<ProjectStage, string> = {
  discovery: "Discovery",
  architectural_design: "Architecture",
  execution_package: "Execution Package",
  complete: "Complete",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  stage: ProjectStage;
}

function Badge({ stage, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        "transition-colors duration-200",
        stageColorMap[stage],
        className
      )}
      {...props}
    >
      {stageLabelMap[stage]}
    </span>
  );
}

export { Badge, stageLabelMap };
