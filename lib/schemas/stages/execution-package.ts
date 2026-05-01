import { z } from "zod";

export const executionPackageSchema = z.object({
  requirements: z.array(z.string()).describe("List of core requirements extracted from the business brief and architecture"),
  sequentialPrompts: z.array(z.string()).describe("A step-by-step array of actionable coding prompts for the external agent"),
  businessBrief: z.string().describe("The original, finalized business brief from the discovery stage"),
});

export type ExecutionPackage = z.infer<typeof executionPackageSchema>;
