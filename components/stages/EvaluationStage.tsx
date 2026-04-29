"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Package,
} from "lucide-react";
import type { Project } from "@/lib/schemas/project";

interface EvaluationStageProps {
  project: Project;
}

export function EvaluationStage({ project }: EvaluationStageProps) {
  const execution = project.executionPackage;

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 rounded-full border-2 border-dashed border-border p-6">
        <ShieldCheck className="h-10 w-10 text-stage-evaluation/40" />
      </div>
      <h3 className="text-lg font-semibold text-fg mb-2">
        Critique & Evaluation
      </h3>
      <p className="text-sm text-fg-muted max-w-md mb-8">
        The Critique agent will review all artifacts for feasibility, cost, and
        deployment complexity before producing the final execution package.
      </p>

      {/* Critique checklist skeleton */}
      <div className="w-full max-w-lg space-y-3">
        {[
          {
            icon: CheckCircle2,
            label: "Technical Feasibility",
            color: "text-success",
          },
          {
            icon: AlertTriangle,
            label: "Cost Analysis",
            color: "text-stage-architecture",
          },
          {
            icon: HelpCircle,
            label: "Deployment Complexity",
            color: "text-fg-muted",
          },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <item.icon className={`h-5 w-5 shrink-0 ${item.color}`} />
              <span className="text-sm text-fg">{item.label}</span>
              <div className="ml-auto h-5 w-16 animate-pulse rounded-full bg-bg-tertiary" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Execution Steps preview */}
      {execution && (
        <div className="mt-8 w-full max-w-lg">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-stage-evaluation" />
            <h4 className="text-sm font-semibold text-fg">Execution Steps</h4>
          </div>
          <div className="space-y-2">
            {execution.executionSteps.map((step) => (
              <Card key={step.order}>
                <CardContent className="flex items-start gap-3 p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stage-evaluation/10 text-xs font-bold text-stage-evaluation">
                    {step.order}
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-medium text-fg">{step.title}</p>
                    <p className="mt-0.5 text-xs text-fg-muted line-clamp-2">
                      {step.prompt}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
