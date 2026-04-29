"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Project } from "@/lib/schemas/project";
import type { ProjectStage } from "@/lib/schemas/chat";
import { Badge } from "@/components/ui/badge";
import { PipelineStepper } from "@/components/workspace/PipelineStepper";
import { InteractionEngine } from "@/components/workspace/InteractionEngine";
import { GlobalArtifacts } from "@/components/workspace/GlobalArtifacts";

interface CommandCenterProps {
  project: Project;
}

export function CommandCenter({ project }: CommandCenterProps) {
  const [currentStage, setCurrentStage] = useState<ProjectStage>(
    project.currentStage
  );
  const router = useRouter();

  const handleStageComplete = () => {
    // Advance to next stage — this would also need a server action to update the DB
    const stageOrder: ProjectStage[] = [
      "discovery",
      "architectural_design",
      "visual_prototyping",
      "evaluation",
      "complete",
    ];
    const currentIndex = stageOrder.indexOf(currentStage);
    if (currentIndex < stageOrder.length - 1) {
      setCurrentStage(stageOrder[currentIndex + 1]);
      router.refresh(); // Re-fetch server data
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden">
      {/* Project header */}
      <div className="flex items-center gap-4 border-b border-border bg-bg-secondary/50 px-6 py-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="h-4 w-px bg-border" />
        <h1 className="text-sm font-semibold text-fg truncate flex-1">
          {project.title}
        </h1>
        <Badge stage={currentStage} />
      </div>

      {/* Tri-pane layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane — Pipeline Stepper */}
        <aside className="w-52 shrink-0 border-r border-border bg-bg-secondary/30 overflow-y-auto">
          <PipelineStepper currentStage={currentStage} />
        </aside>

        {/* Center Pane — Interaction Engine */}
        <main className="flex-1 flex flex-col overflow-hidden border-r border-border">
          <InteractionEngine
            project={project}
            currentStage={currentStage}
            onStageComplete={handleStageComplete}
          />
        </main>

        {/* Right Pane — Global Artifacts */}
        <aside className="w-72 shrink-0 overflow-hidden bg-bg-secondary/30">
          <GlobalArtifacts project={project} />
        </aside>
      </div>
    </div>
  );
}
