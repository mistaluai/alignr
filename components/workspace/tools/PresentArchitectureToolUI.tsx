"use client";

import { Button } from "@/components/ui/button";
import { Layers, Check, Database, Eye, CheckCircle2 } from "lucide-react";
import type { ArchitecturePlan } from "@/lib/schemas/stages/software-planner";
import { ModificationForm } from "./ModificationForm";

export function PresentArchitectureToolUI({
  callId,
  state,
  toolInput,
  toolOutput,
  addToolOutput,
  sendMessage,
  errorText,
}: {
  callId: string;
  state: string;
  toolInput?: { plan: ArchitecturePlan; summaryOfChanges: string };
  toolOutput?: { approved: boolean };
  addToolOutput: (args: any) => void;
  sendMessage: (msg: { text: string }) => void;
  errorText?: string;
}) {
  switch (state) {
    case "input-streaming":
      return (
        <div key={callId} className="animate-pulse text-fg-muted text-xs">
          Architecting system…
        </div>
      );
    case "input-available":
      return (
        <div key={callId} className="mt-2 p-4 bg-bg border border-accent/30 rounded-lg space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-fg">
              <Layers className="h-4 w-4 text-accent" />
              Software Architecture Plan
            </div>
            <span className="px-2 py-0.5 rounded-full bg-accent/10 text-[10px] font-bold text-accent uppercase tracking-wider">
              {toolInput?.summaryOfChanges === 'Initial Draft' ? 'v1.0' : 'Draft Update'}
            </span>
          </div>

          <p className="text-xs text-fg-muted italic">
            {toolInput?.summaryOfChanges}
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase text-fg-muted tracking-widest">Core Features</h4>
                <ul className="space-y-1">
                  {toolInput?.plan.features.map((f, i) => (
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
                  {toolInput?.plan.requirements.map((r, i) => (
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
                {toolInput?.plan.techStack.map((tech, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-md bg-accent/5 border border-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent">
                    <Database className="h-3 w-3" />
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-[10px] font-bold uppercase text-fg-muted tracking-widest">Frontend Screens</h4>
              <div className="grid gap-2">
                {toolInput?.plan.frontendScreens.map((screen, i) => (
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
                      onClick={() => sendMessage({ text: `Please visualize the ${screen.name} screen.` })}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      Visualize
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border space-y-3">
            <label className="text-xs font-medium text-fg">Request Modifications</label>
            {toolInput?.plan && (
              <ModificationForm 
                plan={toolInput.plan} 
                onSendMessage={sendMessage} 
              />
            )}
            
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                className="w-full border-green-500/30 text-green-600 hover:bg-green-500/5 hover:text-green-700"
                onClick={() => {
                  if (toolInput?.plan) {
                    addToolOutput({
                      tool: "presentArchitecture",
                      toolCallId: callId,
                      output: { approved: true },
                    });
                    sendMessage({ text: "I approve this architecture. Please finalize it." });
                  }
                }}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve Architecture
              </Button>
            </div>
          </div>
        </div>
      );
    case "output-available":
      return (
        <div key={callId} className="mt-2 p-3 bg-green-500/5 border border-green-500/20 rounded-lg flex items-center gap-2 text-sm text-fg">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          Architecture reviewed and approved.
        </div>
      );
    case "output-error":
      return (
        <div key={callId} className="text-destructive text-xs">
          Error: {errorText}
        </div>
      );
    default:
      return null;
  }
}
