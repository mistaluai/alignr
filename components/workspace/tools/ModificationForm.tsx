"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ArchitecturePlan } from "@/lib/schemas/stages/software-planner";

export function ModificationForm({
  plan,
  onSendMessage
}: {
  plan: ArchitecturePlan;
  onSendMessage: (msg: { text: string }) => void
}) {
  const [modType, setModType] = useState<"feature" | "requirement" | "screen" | "other">("other");
  const [selectedEntity, setSelectedEntity] = useState("");

  // Sync selectedEntity when modType changes
  useEffect(() => {
    if (modType === "feature") setSelectedEntity(plan.features[0] || "");
    else if (modType === "requirement") setSelectedEntity(plan.requirements[0] || "");
    else if (modType === "screen") setSelectedEntity(plan.frontendScreens[0]?.name || "");
    else setSelectedEntity("");
  }, [modType, plan]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const feedback = fd.get('feedback') as string;
        if (feedback.trim()) {
          const prefix = modType === "other" ? "" : `[MOD: ${modType.toUpperCase()} - ${selectedEntity}] `;
          onSendMessage({ text: `${prefix}${feedback}` });
          (e.target as HTMLFormElement).reset();
        }
      }}
      className="space-y-3"
    >
      <div className="flex gap-2">
        <select
          value={modType}
          onChange={(e) => setModType(e.target.value as any)}
          className="bg-bg-secondary border border-border rounded-md px-2 py-1 text-xs text-fg focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="feature">Feature</option>
          <option value="requirement">Requirement</option>
          <option value="screen">Screen</option>
          <option value="other">Other</option>
        </select>

        {modType !== "other" && (
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="flex-1 bg-bg-secondary border border-border rounded-md px-2 py-1 text-xs text-fg focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {modType === "feature" && plan.features.map(f => <option key={f} value={f}>{f}</option>)}
            {modType === "requirement" && plan.requirements.map(r => <option key={r} value={r}>{r}</option>)}
            {modType === "screen" && plan.frontendScreens.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
        )}
      </div>

      <div className="flex gap-2">
        <textarea
          name="feedback"
          placeholder={modType === "other" ? "General feedback..." : `What should change about this ${modType}?`}
          className="flex-1 min-h-[60px] bg-bg-secondary border border-border rounded-md p-2 text-xs text-fg focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <Button type="submit" size="sm" className="self-end">
          Update
        </Button>
      </div>
    </form>
  );
}
