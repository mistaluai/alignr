"use client";

import type { Project } from "@/lib/schemas/project";
import type { ProjectStage } from "@/lib/schemas/chat";
import { ChatInterface } from "@/components/workspace/ChatInterface";
import { CompleteStage } from "@/components/stages/CompleteStage";

interface InteractionEngineProps {
  project: Project;
  currentStage: ProjectStage;
  onBriefUpdate?: (brief: string) => void;
}

export function InteractionEngine({
  project,
  currentStage,
  onBriefUpdate,
}: InteractionEngineProps) {
  if (currentStage === "complete") {
    return <CompleteStage />;
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* key ensures chat resets when agent/stage changes */}
      <ChatInterface
        key={`${project._id}-${currentStage}`}
        projectId={project._id}
        currentStage={currentStage}
        onBriefUpdate={onBriefUpdate}
      />
    </div>
  );
}

