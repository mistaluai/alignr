import { z } from "zod";
import { projectStageSchema } from "../chat";
import { businessBriefSchema, interviewQuestionsSchema } from "./business-analyst";
import { architecturePlanSchema } from "./software-planner";
import { uiPrototypeSchema } from "./ui-coder";
import { executionPackageSchema } from "./critique";

export const saveStagePayloadSchema = z.discriminatedUnion("stage", [
  z.object({
    projectId: z.string().min(1, "Project ID is required"),
    stage: z.literal("discovery"),
    finalOutput: z.object({
      brief: businessBriefSchema,
      questions: interviewQuestionsSchema.optional(),
    }).describe("Flexible markdown brief alongside structured user form questions"),
  }),
  z.object({
    projectId: z.string().min(1, "Project ID is required"),
    stage: z.literal("architectural_design"),
    finalOutput: architecturePlanSchema,
  }),
  z.object({
    projectId: z.string().min(1, "Project ID is required"),
    stage: z.literal("visual_prototyping"),
    finalOutput: uiPrototypeSchema,
  }),
  z.object({
    projectId: z.string().min(1, "Project ID is required"),
    stage: z.literal("evaluation"),
    finalOutput: executionPackageSchema,
  }),
  z.object({
    projectId: z.string().min(1, "Project ID is required"),
    stage: z.literal("complete"),
    finalOutput: z.any(),
  })
]);

export type SaveStagePayload = z.infer<typeof saveStagePayloadSchema>;
