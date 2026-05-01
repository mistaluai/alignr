import { z } from "zod";

export const uiPrototypeSchema = z.object({
  screenName: z.string().describe("The name of the screen being rendered"),
  associatedFeature: z.string().describe("The feature this UI belongs to"),
  mockCode: z.string().describe("Placeholder React/Tailwind code for the UI"),
  status: z.enum(["draft", "rendering", "complete"]).default("draft"),
}).describe("Data structure for the UI visualizer output");

export type UiPrototype = z.infer<typeof uiPrototypeSchema>;
