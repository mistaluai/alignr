"use client";

import type { Project } from "@/lib/schemas/project";
import type { ProjectStage } from "@/lib/schemas/chat";
import { ChatInterface } from "@/components/workspace/ChatInterface";
import { CompleteStage } from "@/components/stages/CompleteStage";
import { ExecutionPackageStage } from "@/components/stages/ExecutionPackageStage";

interface InteractionEngineProps {
  project: Project;
  currentStage: ProjectStage;
  onBriefUpdate?: (brief: string) => void;
  onStageAdvance?: (nextStage: ProjectStage) => void;
}

export function InteractionEngine({
  project,
  currentStage,
  onBriefUpdate,
  onStageAdvance,
}: InteractionEngineProps) {
  if (currentStage === "complete") {
    return <CompleteStage />;
  }

  if (currentStage === "execution_package") {
    return (
      <ExecutionPackageStage
        projectId={project._id}
        project={project}
        onStageAdvance={onStageAdvance}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* key ensures chat resets when agent/stage changes */}
      <ChatInterface
        key={`${project._id}-${currentStage}`}
        projectId={project._id}
        currentStage={currentStage}
        onBriefUpdate={onBriefUpdate}
        onStageAdvance={onStageAdvance}
      />
    </div>
  );
}

