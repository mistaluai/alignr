"use client";

import { Monitor, Code2, Eye } from "lucide-react";

export function PrototypingStage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 rounded-full border-2 border-dashed border-border p-6">
        <Monitor className="h-10 w-10 text-stage-prototyping/40" />
      </div>
      <h3 className="text-lg font-semibold text-fg mb-2">
        Visual Prototyping
      </h3>
      <p className="text-sm text-fg-muted max-w-md mb-8">
        The UI Coder agent will take the architecture blueprint and render
        live, interactive components in a side-by-side preview.
      </p>

      {/* Preview layout skeleton */}
      <div className="w-full max-w-2xl rounded-xl border border-border bg-bg-secondary overflow-hidden">
        <div className="flex items-center border-b border-border">
          <button className="flex items-center gap-2 border-r border-border px-4 py-2.5 text-xs font-medium text-fg-muted bg-bg-tertiary">
            <Code2 className="h-3.5 w-3.5" />
            Code
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-accent">
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border min-h-[200px]">
          {/* Code panel */}
          <div className="p-4 space-y-2">
            {[80, 60, 90, 50, 70, 40].map((w, i) => (
              <div
                key={i}
                className="h-3 animate-pulse rounded bg-bg-tertiary"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
          {/* Preview panel */}
          <div className="flex items-center justify-center p-4">
            <div className="flex flex-col items-center gap-2">
              <Eye className="h-6 w-6 text-fg-muted/20" />
              <span className="text-[11px] text-fg-muted/30">
                Live preview
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
