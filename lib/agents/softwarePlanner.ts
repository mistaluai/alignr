import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/db/mongodb';
import { architecturePlanSchema } from '@/lib/schemas/stages/software-planner';

const DB_NAME = process.env.DB_NAME || 'alignr_data';

export async function softwarePlanner(messages: UIMessage[], projectId: string) {
  // 1. Fetch the project and the finalized business brief
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const project = await db.collection('projects').findOne({ _id: new ObjectId(projectId) });

  if (!project || !project.businessBrief) {
    throw new Error("Project or business brief not found. Cannot start planning.");
  }

  const briefContent = project.businessBrief.content;

  // 2. Define the highly detailed System Prompt
  const systemPrompt = `You are the Software Planner agent for Alignr. Your goal is to translate a business brief into a concrete software architecture plan.

## Project Context
Business Brief:
"""
${briefContent}
"""

## Your Process & Rules
1. **FIRST MESSAGE**: Immediately analyze the Business Brief above. Generate an initial architecture plan consisting of Features, associated Requirements, Frontend Screens, and a Tech Stack. For each Frontend Screen, you MUST list at least 3-5 specific UI components (e.g., "Feature Grid", "Search Bar", "User Profile Dropdown") in the \`components\` array. Call the \`presentArchitecture\` tool to output this structured data to the user interface. 
2. **REFINEMENT**: The user will review the architecture in the UI. They will use a structured form to request modifications. These requests will come in the format: \`[MOD: TYPE - ENTITY] Comment\`.
3. **PARSING COMMENTS**: When you receive a modification request:
    - **TYPE**: Can be FEATURE, REQUIREMENT, or SCREEN.
    - **ENTITY**: The specific name of the feature, requirement, or screen to modify.
    - If the format is not present, it's a general ("OTHER") comment.
    Update the existing plan by adding, modifying, or removing features/screens/tech based on these specific requests, and call \`presentArchitecture\` again with the updated data. Always maintain the overall consistency of the architecture.
4. **VISUALIZATION**: The user has the option to click "Visualize" on any frontend screen in the UI. When they do, they will send a message indicating which screen they want to see. You must respond by calling the \`triggerUIVisualizer\` tool, passing the screen details to generate a mock UI.
5. **APPROVAL**: Once the user is satisfied, they will explicitly approve the architecture. When they do, call the \`finalizeArchitecture\` tool to save the plan to the database and advance the project.

Do not output standard markdown lists for the architecture. ALWAYS use the \`presentArchitecture\` tool so the Alignr UI can render it interactively. Keep your conversational responses very brief, letting the UI components do the heavy lifting.`;

  // 3. Execute streamText with Vercel AI SDK
  const result = streamText({
    model: google('gemini-2.5-flash'), // Using a fast model for responsive tool calling
    messages: await convertToModelMessages(messages),
    system: systemPrompt,
    tools: {
      // Tool 1: Present the Architecture Plan
      presentArchitecture: {
        description: 'Present or update the software architecture plan in the UI. Call this initially, and whenever the user requests modifications to features or screens.',
        inputSchema: z.object({
          plan: architecturePlanSchema,
          summaryOfChanges: z.string().describe("A brief sentence explaining what changed in this version, or 'Initial Draft' if it's the first time."),
        }),
      },

      // Tool 2: Trigger the UI Visualizer
      triggerUIVisualizer: {
        description: 'Call this when the user clicks "Visualize" or asks to see the UI code for a specific frontend screen. This hands off the specific screen context to the UI Coding agent mock.',
        inputSchema: z.object({
          screenName: z.string().describe("The name of the screen to visualize"),
          associatedFeature: z.string().describe("The feature this screen is tied to"),
          context: z.string().describe("Any specific layout instructions or user comments about how this screen should look"),
        }),
        execute: async ({ screenName, associatedFeature, context }: { screenName: string; associatedFeature: string; context: string }) => {
          // In the future, this is where you will invoke the actual UI Coder agent.
          // For now, we return a mock response that the UI can render.
          const mockCode = `
// Mock UI for ${screenName}
export default function ${screenName.replace(/\s+/g, '')}() {
  return (
    <div className="p-4 border rounded">
      <h1 className="text-xl font-bold">${screenName}</h1>
      <p className="text-sm text-gray-500">Feature: ${associatedFeature}</p>
      {/* Context applied: ${context} */}
      <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
        Mock Button
      </button>
    </div>
  )
}`;
          return {
            screenName,
            associatedFeature,
            mockCode,
            status: "complete" as const,
          };
        },
      },

      // Tool 3: Finalize the Architecture
      finalizeArchitecture: {
        description: 'Save the finalized architecture plan to the database and advance the project to visual prototyping. Only call this AFTER the user has approved the plan.',
        inputSchema: z.object({
          finalPlan: architecturePlanSchema,
        }),
        execute: async ({ finalPlan }: { finalPlan: any }) => {
          const updateResult = await db.collection('projects').updateOne(
            { _id: new ObjectId(projectId) },
            {
              $set: {
                architectureBlueprint: finalPlan,
                currentStage: 'visual_prototyping',
                updatedAt: new Date(),
              },
            }
          );

          if (updateResult.matchedCount === 0) {
            return { success: false, error: 'Project not found.' };
          }

          return {
            success: true,
            message: 'Architecture plan finalized. Moving to Visual Prototyping stage.',
            nextStage: 'visual_prototyping',
          };
        },
      },
    },
  });

  return result.toUIMessageStreamResponse();
}
