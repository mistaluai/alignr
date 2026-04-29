import { z } from "zod";

// Placeholder schema for the UI Coder phase as per user request.
// This will be implemented in detail later when we integrate Generative UI
export const uiPrototypeSchema = z.record(z.string(), z.any()).describe("Placeholder for UI Prototype data");

export type UiPrototype = z.infer<typeof uiPrototypeSchema>;
