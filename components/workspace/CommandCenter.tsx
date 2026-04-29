"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldAlert, UserPlus, X } from "lucide-react";
import Link from "next/link";
import type { Project } from "@/lib/schemas/project";
import type { ProjectStage } from "@/lib/schemas/chat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { InteractionEngine } from "@/components/workspace/InteractionEngine";
import { GlobalArtifacts } from "@/components/workspace/GlobalArtifacts";

interface CommandCenterProps {
  project: Project;
  isGuest?: boolean;
}

export function CommandCenter({ project: initialProject, isGuest = false }: CommandCenterProps) {
  const [currentStage, setCurrentStage] = useState<ProjectStage>(
    initialProject.currentStage
  );
  const [guestProject, setGuestProject] = useState<Project>(initialProject);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [liveBrief, setLiveBrief] = useState<string | null>(
    initialProject.businessBrief?.content || null
  );
  const router = useRouter();

  // Use local guest state or the server-provided project
  const project = isGuest ? guestProject : initialProject;

  const handleGuestBriefUpdate = (briefContent: string) => {
    setGuestProject((prev) => ({
      ...prev,
      businessBrief: { content: briefContent },
    }));
  };

  const handleStageComplete = () => {
    const stageOrder: ProjectStage[] = [
      "discovery",
      "architectural_design",
      "visual_prototyping",
      "evaluation",
      "complete",
    ];
    const currentIndex = stageOrder.indexOf(currentStage);
    if (currentIndex < stageOrder.length - 1) {
      const nextStage = stageOrder[currentIndex + 1];
      setCurrentStage(nextStage);
      if (isGuest) {
        setGuestProject((prev) => ({ ...prev, currentStage: nextStage }));
      } else {
        router.refresh();
      }
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden">
      {/* Guest mode sign-up prompt banner */}
      {isGuest && !bannerDismissed && (
        <div className="flex items-center gap-3 border-b border-stage-architecture/30 bg-stage-architecture/5 px-6 py-2.5 animate-fade-in">
          <ShieldAlert className="h-4 w-4 shrink-0 text-stage-architecture" />
          <p className="flex-1 text-xs text-fg-muted">
            <span className="font-medium text-fg">Guest mode</span> — Your
            work is not saved and will be lost if you close this tab.{" "}
            <Link
              href="/signup"
              className="inline-flex items-center gap-1 font-medium text-accent hover:text-accent/80 transition-colors"
            >
              <UserPlus className="h-3 w-3" />
              Sign up to save your projects
            </Link>
          </p>
          <button
            onClick={() => setBannerDismissed(true)}
            className="rounded-md p-1 text-fg-muted hover:text-fg hover:bg-bg-tertiary transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Project header */}
      <div className="flex items-center gap-4 border-b border-border bg-bg-secondary/50 px-6 py-3">
        {isGuest ? (
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit
          </Link>
        ) : (
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        )}
        <div className="h-4 w-px bg-border" />
        <h1 className="text-sm font-semibold text-fg truncate flex-1">
          {project.title}
        </h1>
        <Badge stage={currentStage} />
      </div>

      {/* Dual-pane layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* Center Pane — Interaction Engine */}
        <main className="flex-1 flex flex-col overflow-hidden border-r border-border">
          <InteractionEngine
            project={project}
            currentStage={currentStage}
            onBriefUpdate={setLiveBrief}
          />
        </main>

        {/* Right Pane — Global Artifacts */}
        <aside className="w-72 shrink-0 overflow-hidden bg-bg-secondary/30">
          <GlobalArtifacts project={project} liveBrief={liveBrief} />
        </aside>
      </div>
    </div>
  );
}
