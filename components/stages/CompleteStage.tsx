"use client";

import { CheckCircle2, PartyPopper, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function CompleteStage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      {/* Success icon with subtle animation */}
      <div className="relative mb-6">
        <div className="absolute inset-0 animate-ping rounded-full bg-success/20" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-success/10 border-2 border-success/30">
          <CheckCircle2 className="h-10 w-10 text-success" />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-fg mb-2">Project Complete!</h3>
      <p className="text-sm text-fg-muted max-w-md mb-8">
        All phases have been completed. Your product development artifacts are
        ready for execution.
      </p>

      {/* Summary cards */}
      <div className="w-full max-w-md space-y-3 mb-8">
        {[
          { label: "Business Brief", emoji: "📄", stage: "Discovery" },
          {
            label: "Architecture Blueprint",
            emoji: "🏗️",
            stage: "Planning",
          },
          {
            label: "Execution Package",
            emoji: "📦",
            stage: "Execution",
          },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <span className="text-lg">{item.emoji}</span>
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-fg">{item.label}</p>
                <p className="text-[11px] text-fg-muted">
                  from {item.stage}
                </p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline">
        <Download className="h-4 w-4" />
        Export Artifacts
      </Button>
    </div>
  );
}
