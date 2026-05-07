"use server";

import { redirect } from "next/navigation";
import { createProject } from "@/services/userService";
import { deleteProject, renameProject, saveAgentStage } from "@/services/projectService";
import { requireSession } from "@/lib/session";
import type { SaveStagePayload } from "@/lib/schemas/stages/save-stage";
import { revalidatePath } from "next/cache";

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


export async function deleteProjectAction(projectId: string) {
  try {
    await deleteProject(projectId);
    revalidatePath("/dashboard"); // Refreshes the dashboard data automatically
    return { success: true };
  } catch (error) {
    console.error("Failed to delete project:", error);
    return { success: false, error: "Failed to delete project" };
  }
}

export async function renameProjectAction(projectId: string, newTitle: string) {
  try {
    await renameProject(projectId, newTitle);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to rename project:", error);
    return { success: false, error: "Failed to rename project" };
  }
}