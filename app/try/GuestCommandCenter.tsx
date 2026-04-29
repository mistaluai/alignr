"use client";

import { CommandCenter } from "@/components/workspace/CommandCenter";
import type { Project } from "@/lib/schemas/project";

// A synthetic in-memory project object for guest mode
const guestProject: Project = {
  _id: "guest",
  userId: "guest",
  title: "Untitled Project",
  currentStage: "discovery",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export function GuestCommandCenter() {
  return <CommandCenter project={guestProject} isGuest />;
}
