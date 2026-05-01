"use client";

import { cn } from "@/lib/utils";
import type { Project } from "@/lib/schemas/project";
import type { ArchitecturePlan } from "@/lib/schemas/stages/software-planner";
import {
  FileText,
  Blocks,
  Package,
  ChevronDown,
  ChevronRight,
  Clock,
} from "lucide-react";
import { useState } from "react";

interface GlobalArtifactsProps {
  project: Project;
  liveBrief?: string | null;
}

interface ArtifactSectionProps {
  title: string;
  icon: React.ElementType;
  available: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function ArtifactSection({
  title,
  icon: Icon,
  available,
  defaultOpen = false,
  children,
}: ArtifactSectionProps) {
  const [open, setOpen] = useState(available && defaultOpen);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => available && setOpen(!open)}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer",
          available
            ? "hover:bg-bg-tertiary text-fg"
            : "text-fg-muted/50 cursor-default"
        )}
        disabled={!available}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            available ? "text-accent" : "text-fg-muted/30"
          )}
        />
        <span className="flex-1 text-sm font-medium">{title}</span>
        {available ? (
          open ? (
            <ChevronDown className="h-4 w-4 text-fg-muted" />
          ) : (
            <ChevronRight className="h-4 w-4 text-fg-muted" />
          )
        ) : (
          <Clock className="h-3.5 w-3.5 text-fg-muted/30" />
        )}
      </button>

      {open && available && (
        <div className="px-4 pb-4 animate-fade-in">{children}</div>
      )}
    </div>
  );
}

export function GlobalArtifacts({ project, liveBrief }: GlobalArtifactsProps) {
  // Prioritize live brief from the chat over the static project brief
  const briefContent = liveBrief || project.businessBrief?.content;
  const hasBrief = !!briefContent;
  const hasArchitecture = !!project.architectureBlueprint;
  const hasExecution = !!project.executionPackage;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
          Shared Brain
        </h2>
        <p className="mt-0.5 text-[11px] text-fg-muted/60">
          Global artifacts
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Business Brief */}
        <ArtifactSection
          title="Business Brief"
          icon={FileText}
          available={hasBrief}
          defaultOpen
        >
          <div className="rounded-lg border border-border bg-bg p-3 text-xs text-fg-muted leading-relaxed font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
            {briefContent}
          </div>
        </ArtifactSection>

        {/* Architecture Blueprint */}
        <ArtifactSection
          title="Architecture Blueprint"
          icon={Blocks}
          available={hasArchitecture}
        >
          {project.architectureBlueprint && (
            <div className="space-y-3">
              {/* Tech Stack chips */}
              <div>
                <p className="text-[11px] font-medium text-fg-muted mb-2">
                  Tech Stack
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(project.architectureBlueprint as ArchitecturePlan).techStack.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center rounded-md bg-stage-architecture/10 px-2 py-0.5 text-[11px] font-medium text-stage-architecture border border-stage-architecture/20"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Screens */}
              <div>
                <p className="text-[11px] font-medium text-fg-muted mb-2">
                  Screens
                </p>
                <div className="space-y-1.5">
                  {project.architectureBlueprint.frontendScreens.map(
                    (screen) => (
                      <div
                        key={screen.name}
                        className="rounded-md border border-border bg-bg p-2"
                      >
                        <p className="text-xs font-medium text-fg">
                          {screen.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-fg-muted line-clamp-2">
                          {screen.description}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </ArtifactSection>

        {/* Execution Package */}
        <ArtifactSection
          title="Execution Package"
          icon={Package}
          available={hasExecution}
        >
          {project.executionPackage && (
            <div className="space-y-1.5">
              {project.executionPackage.executionSteps.map((step) => (
                <div
                  key={step.order}
                  className="flex items-start gap-2 rounded-md border border-border bg-bg p-2"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
                    {step.order}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-fg">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-fg-muted line-clamp-2">
                      {step.prompt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ArtifactSection>

        {/* Placeholder when nothing is available */}
        {!hasBrief && !hasArchitecture && !hasExecution && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="mb-3 rounded-full border-2 border-dashed border-border p-4">
              <FileText className="h-6 w-6 text-fg-muted/30" />
            </div>
            <p className="text-sm text-fg-muted/50">No artifacts yet</p>
            <p className="mt-1 text-[11px] text-fg-muted/30">
              Artifacts will appear here as agents complete their work
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
