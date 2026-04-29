import { z } from "zod";

export const critiquePointSchema = z.object({
  title: z.string().describe("Title of the critique point"),
  description: z.string().describe("Detailed explanation of the critique point"),
  status: z.enum(["pending", "accepted", "discussable"]).default("pending").describe("User's decision on the critique point"),
});

export const critiqueEvaluationSchema = z.object({
  points: z.array(critiquePointSchema).describe("List of critique points for the user to review"),
});

export const executionStepSchema = z.object({
  order: z.number().describe("The execution order of this step"),
  title: z.string().describe("A short title for the execution step"),
  prompt: z.string().describe("The actionable prompt to be fed into the external coding execution agent"),
});

export const executionPackageSchema = z.object({
  executionSteps: z.array(executionStepSchema).describe("An ordered array of actionable prompts to build the project"),
});

export type CritiquePoint = z.infer<typeof critiquePointSchema>;
export type CritiqueEvaluation = z.infer<typeof critiqueEvaluationSchema>;
export type ExecutionStep = z.infer<typeof executionStepSchema>;
export type ExecutionPackage = z.infer<typeof executionPackageSchema>;
