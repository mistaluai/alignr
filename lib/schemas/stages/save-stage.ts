import { z } from "zod";
import { ObjectId } from "mongodb";
import { projectStageSchema } from "../chat";
import { businessBriefSchema } from "./business-analyst";
import { architecturePlanSchema } from "./software-planner";
import { executionPackageSchema } from "./execution-package";

const objectIdSchema = z.string().refine((val) => ObjectId.isValid(val), {
  message: "Invalid MongoDB ObjectId",
});

export const saveStagePayloadSchema = z.discriminatedUnion("stage", [
  z.object({
    projectId: objectIdSchema,
    stage: z.literal("discovery"),
    finalOutput: z.object({
      brief: businessBriefSchema,
    }).describe("Flexible markdown brief alongside structured user form questions"),
  }),
  z.object({
    projectId: objectIdSchema,
    stage: z.literal("architectural_design"),
    finalOutput: architecturePlanSchema,
  }),
  z.object({
    projectId: objectIdSchema,
    stage: z.literal("execution_package"),
    finalOutput: executionPackageSchema,
  }),
  z.object({
    projectId: objectIdSchema,
    stage: z.literal("complete"),
    finalOutput: z.any(),
  })
]);

export type SaveStagePayload = z.infer<typeof saveStagePayloadSchema>;
