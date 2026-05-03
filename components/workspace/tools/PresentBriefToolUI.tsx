"use client";

import { Button } from "@/components/ui/button";
import { FileText, CheckCircle2 } from "lucide-react";

export function PresentBriefToolUI({
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
  toolInput?: { briefContent: string; summary: string };
  toolOutput?: { approved: boolean; feedback?: string };
  addToolOutput: (args: any) => void;
  sendMessage: (msg: { text: string }) => void;
  errorText?: string;
}) {
  switch (state) {
    case "input-streaming":
      return (
        <div key={callId} className="animate-pulse text-fg-muted text-xs">
          Compiling brief…
        </div>
      );
    case "input-available":
      return (
        <div key={callId} className="mt-2 p-4 bg-bg border border-accent/30 rounded-lg space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-fg">
            <FileText className="h-4 w-4 text-accent" />
            Business Brief — Review
          </div>
          <p className="text-xs text-fg-muted italic">{toolInput?.summary}</p>
          <div className="rounded-md border border-border bg-bg-secondary p-4 text-xs font-mono text-fg-muted leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
            {toolInput?.briefContent}
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                addToolOutput({
                  tool: "presentBrief",
                  toolCallId: callId,
                  output: { approved: false, feedback: "I'd like to refine some areas." },
                });
                sendMessage({ text: "I'd like to refine some areas of the brief." });
              }}
            >
              Refine Further
            </Button>
            <Button
              size="sm"
              onClick={() => {
                addToolOutput({
                  tool: "presentBrief",
                  toolCallId: callId,
                  output: { approved: true },
                });
                sendMessage({ text: "I approve this brief. Please finalize it." });
              }}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Approve Brief
            </Button>
          </div>
        </div>
      );
    case "output-available":
      return (
        <div key={callId} className={`mt-2 p-4 rounded-lg border space-y-2 ${toolOutput?.approved
            ? "bg-green-500/5 border-green-500/30"
            : "bg-stage-architecture/5 border-stage-architecture/30"
          }`}>
          <div className="flex items-center gap-2 text-sm font-medium text-fg">
            {toolOutput?.approved ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Brief Approved
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 text-stage-architecture" />
                Refinement Requested
              </>
            )}
          </div>
          {toolOutput?.feedback && (
            <p className="text-xs text-fg-muted">{toolOutput.feedback}</p>
          )}
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
