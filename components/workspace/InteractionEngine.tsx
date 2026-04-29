"use client";

import type { Project } from "@/lib/schemas/project";
import type { ProjectStage } from "@/lib/schemas/chat";
import { DiscoveryStage } from "@/components/stages/DiscoveryStage";
import { ArchitectureStage } from "@/components/stages/ArchitectureStage";
import { PrototypingStage } from "@/components/stages/PrototypingStage";
import { EvaluationStage } from "@/components/stages/EvaluationStage";
import { CompleteStage } from "@/components/stages/CompleteStage";

interface InteractionEngineProps {
  project: Project;
  currentStage: ProjectStage;
  onStageComplete?: () => void;
}

export function InteractionEngine({
  project,
  currentStage,
  onStageComplete,
}: InteractionEngineProps) {
  const renderStage = () => {
    switch (currentStage) {
      case "discovery":
        return (
          <DiscoveryStage
            projectId={project._id}
            defaultBrief={project.businessBrief?.content || ""}
            onStageComplete={onStageComplete}
          />
        );
      case "architectural_design":
        return <ArchitectureStage project={project} />;
      case "visual_prototyping":
        return <PrototypingStage />;
      case "evaluation":
        return <EvaluationStage project={project} />;
      case "complete":
        return <CompleteStage />;
      default:
        return (
          <div className="flex flex-1 items-center justify-center text-fg-muted">
            Unknown stage
          </div>
        );
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Stage header */}
      <div className="border-b border-border px-6 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
          Interaction Engine
        </h2>
      </div>

      {/* Stage content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {renderStage()}
      </div>
    </div>
  );
}
