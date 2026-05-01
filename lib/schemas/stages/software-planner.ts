import { z } from "zod";

export const frontendScreenSchema = z.object({
  name: z.string().describe("The name of the frontend screen or page"),
  description: z.string().describe("A detailed description of the screen's layout, features, and purpose"),
  components: z.array(z.string()).describe("A list of components to be used in the frontend"),
});

export const architecturePlanSchema = z.object({
  requirements: z.array(z.string()).describe("A list of requirements for the project"),
  features: z.array(z.string()).describe("A list of features for the project"),
  frontendScreens: z.array(frontendScreenSchema).describe("A list of frontend screens to be built"),
  techStack: z.array(z.string()).describe("A list of technologies to be used in the project"),
});

export type FrontendScreen = z.infer<typeof frontendScreenSchema>;
export type ArchitecturePlan = z.infer<typeof architecturePlanSchema>;
