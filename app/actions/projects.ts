"use server";

import { redirect } from "next/navigation";
import { createProject } from "@/services/userService";
import { saveAgentStage } from "@/services/projectService";
import { requireSession } from "@/lib/session";
import type { SaveStagePayload } from "@/lib/schemas/stages/save-stage";

export async function createProjectAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const title = formData.get("title") as string;

  if (!title || title.trim().length === 0) {
    throw new Error("Project title is required.");
  }

  const project = await createProject(session.userId, title.trim());
  redirect(`/projects/${project._id}`);
}

export async function saveStageAction(payload: SaveStagePayload) {
  await requireSession();
  return saveAgentStage(payload);
}
