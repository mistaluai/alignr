"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Layers, Eye, Check, Database, MessageCircle, RefreshCw } from "lucide-react";
import type { ArchitecturePlan } from "@/lib/schemas/stages/software-planner";
import { ModificationForm } from "./ModificationForm";

export function ArchitecturePlanReview({
  plan,
  summaryOfChanges,
  version,
  onModify,
  onApprove,
  onVisualize,
  isProcessing,
}: {
  plan: ArchitecturePlan;
  summaryOfChanges?: string;
  version: number;
  onModify: (text: string) => void;
  onApprove: () => void;
  onVisualize: (screenName: string) => void;
  isProcessing: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isProcessing && scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isProcessing]);

  return (
    <div 
      ref={scrollRef}
      className={`relative flex-1 ${isProcessing ? 'overflow-hidden' : 'overflow-y-auto'}`}
    >
      {/* Processing overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-bg/60 backdrop-blur-[2px] flex items-center justify-center z-10">
          <div className="flex items-center gap-3 text-sm text-fg-muted bg-bg-secondary border border-border rounded-xl px-5 py-3 shadow-lg">
            <RefreshCw className="h-4 w-4 animate-spin text-accent" />
            Updating architecture plan…
          </div>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-fg">
            <Layers className="h-4 w-4 text-accent" />
            Software Architecture Plan
          </div>
          <span className="px-2.5 py-1 rounded-full bg-accent/10 text-[10px] font-bold text-accent uppercase tracking-wider">
            v{version}.0
          </span>
        </div>

        {summaryOfChanges && (
          <p className="text-xs text-fg-muted italic border-l-2 border-accent/30 pl-3">
            {summaryOfChanges}
          </p>
        )}

        {/* Features & Requirements */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase text-fg-muted tracking-widest">Core Features</h4>
            <ul className="space-y-1">
              {plan.features.map((f, i) => (
                <li key={i} className="text-xs text-fg flex items-start gap-2">
                  <div className="h-1 w-1 rounded-full bg-accent mt-1.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase text-fg-muted tracking-widest">Requirements</h4>
            <ul className="space-y-1">
              {plan.requirements.map((r, i) => (
                <li key={i} className="text-xs text-fg flex items-start gap-2">
                  <Check className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="space-y-2 pt-2">
          <h4 className="text-[10px] font-bold uppercase text-fg-muted tracking-widest">Tech Stack</h4>
          <div className="flex flex-wrap gap-1.5">
            {plan.techStack.map((tech, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-md bg-accent/5 border border-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent">
                <Database className="h-3 w-3" />
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Frontend Screens */}
        <div className="space-y-3 pt-2">
          <h4 className="text-[10px] font-bold uppercase text-fg-muted tracking-widest">Frontend Screens</h4>
          <div className="grid gap-2">
            {plan.frontendScreens.map((screen, i) => (
              <div key={i} className="p-3 rounded-md bg-bg-secondary border border-border flex items-start justify-between group hover:border-accent/30 transition-colors">
                <div className="space-y-1.5 flex-1 pr-4">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium text-fg">{screen.name}</div>
                    <div className="text-[10px] text-fg-muted leading-relaxed">{screen.description}</div>
                  </div>
                  {screen.components && screen.components.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {screen.components.map((comp, ci) => (
                        <span key={ci} className="text-[9px] bg-bg border border-border px-1.5 py-0.5 rounded text-fg-muted/80">
                          {comp}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-accent hover:text-accent hover:bg-accent/10 shrink-0"
                  onClick={() => onVisualize(screen.name)}
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  Visualize
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Modification form & Approve */}
        <div className="pt-4 border-t border-border space-y-3">
          <label className="text-xs font-medium text-fg flex items-center gap-1.5">
            <MessageCircle className="h-3.5 w-3.5 text-fg-muted" />
            Request Modifications
          </label>
          <ModificationForm
            plan={plan}
            onSendMessage={({ text }) => onModify(text)}
          />

          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              className="w-full border-green-500/30 text-green-600 hover:bg-green-500/5 hover:text-green-700"
              onClick={onApprove}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve Architecture
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
