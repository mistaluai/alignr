"use client";

import { Loader2, CheckCircle2 } from "lucide-react";

export function FinalizeToolUI({
  callId,
  state,
  toolOutput,
  errorText,
  loadingMessage,
}: {
  callId: string;
  state: string;
  toolOutput?: { success: boolean; message?: string; error?: string };
  errorText?: string;
  loadingMessage: string;
}) {
  switch (state) {
    case "input-streaming":
    case "input-available":
      return (
        <div key={callId} className="flex items-center gap-2 text-xs text-fg-muted animate-pulse">
          <Loader2 className="h-3 w-3 animate-spin" />
          {loadingMessage}
        </div>
      );
    case "output-available":
      return (
        <div key={callId} className={`mt-2 p-4 rounded-lg border ${
          toolOutput?.success
            ? "bg-green-500/5 border-green-500/30"
            : "bg-destructive/5 border-destructive/30"
        }`}>
          <div className="flex items-center gap-2 text-sm font-medium text-fg">
            {toolOutput?.success ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {toolOutput.message}
              </>
            ) : (
              <>
                <span className="text-destructive">Failed:</span> {toolOutput?.error}
              </>
            )}
          </div>
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
