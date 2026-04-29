import { z } from "zod";

export const userSchema = z.object({
  _id: z.string().describe("MongoDB ObjectId as a string"),
  email: z.email("Invalid email address"),
  passwordHash: z.string(),
  createdAt: z.date(),
});

export type User = z.infer<typeof userSchema>;
