"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Blocks, Monitor, Cpu, Database, Layout } from "lucide-react";
import type { Project } from "@/lib/schemas/project";
import type { ArchitecturePlan } from "@/lib/schemas/stages/software-planner";

interface ArchitectureStageProps {
  project: Project;
}

export function ArchitectureStage({ project }: ArchitectureStageProps) {
  const blueprint = project.architectureBlueprint as ArchitecturePlan | undefined;

  if (!blueprint) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 rounded-full border-2 border-dashed border-border p-6">
          <Blocks className="h-10 w-10 text-stage-architecture/40" />
        </div>
        <h3 className="text-lg font-semibold text-fg mb-2">
          Architecture Design
        </h3>
        <p className="text-sm text-fg-muted max-w-md">
          The Software Planner agent will analyze your business brief and
          generate a structured architecture blueprint here.
        </p>

        {/* Skeleton preview */}
        <div className="mt-8 w-full max-w-lg space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="h-4 w-4 text-fg-muted/30" />
            <span className="text-xs font-medium text-fg-muted/30">
              Tech Stack
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {["", "", "", ""].map((_, i) => (
              <div
                key={i}
                className="h-6 w-20 animate-pulse rounded-md bg-bg-tertiary"
              />
            ))}
          </div>

          <div className="flex items-center gap-2 mt-6 mb-4">
            <Layout className="h-4 w-4 text-fg-muted/30" />
            <span className="text-xs font-medium text-fg-muted/30">
              Frontend Screens
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {["", "", ""].map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-lg border border-border bg-bg-tertiary"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Tech Stack */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="h-4 w-4 text-stage-architecture" />
          <h3 className="text-sm font-semibold text-fg">Tech Stack</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {blueprint.techStack.map((tech) => (
            <span
              key={tech}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stage-architecture/20 bg-stage-architecture/10 px-3 py-1.5 text-xs font-medium text-stage-architecture animate-fade-in"
            >
              <Database className="h-3 w-3" />
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* Frontend Screens */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Layout className="h-4 w-4 text-stage-architecture" />
          <h3 className="text-sm font-semibold text-fg">Frontend Screens</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {blueprint.frontendScreens.map((screen) => (
            <Card key={screen.name} className="animate-fade-in">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Monitor className="h-4 w-4 text-stage-architecture mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-fg">
                      {screen.name}
                    </h4>
                    <p className="mt-1 text-xs text-fg-muted leading-relaxed">
                      {screen.description}
                    </p>
                    {screen.components.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {screen.components.map((comp) => (
                          <span
                            key={comp}
                            className="rounded bg-bg-tertiary px-1.5 py-0.5 text-[10px] text-fg-muted"
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
