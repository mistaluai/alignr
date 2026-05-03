import { z } from "zod";

export const messageRoleSchema = z.enum(["user", "assistant", "system", "tool"]);
export const projectStageSchema = z.enum([
  "discovery",
  "architectural_design",
  "execution_package",
  "complete",
]);

export const chatMessageSchema = z.object({
  id: z.string(),
  projectId: z.string().describe("MongoDB ObjectId mapping to the Project"),
  stage: projectStageSchema,
  role: messageRoleSchema,
  content: z.string(),
  createdAt: z.date(),
});

export type MessageRole = z.infer<typeof messageRoleSchema>;
export type ProjectStage = z.infer<typeof projectStageSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
