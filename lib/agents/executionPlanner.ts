import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { getProjectById, saveAgentStage } from '@/services/projectService';
import { executionPackageSchema } from '@/lib/schemas/stages/execution-package';

export async function executionPlanner(messages: UIMessage[], projectId: string) {
  const project = await getProjectById(projectId);

  if (!project || !project.businessBrief || !project.architectureBlueprint) {
    throw new Error("Project, business brief, or architecture blueprint not found. Cannot generate execution package.");
  }

  const briefContent = project.businessBrief.content;
  const architecture = JSON.stringify(project.architectureBlueprint, null, 2);

  const systemPrompt = `You are the Execution Planner agent for Alignr. Your final task is to parse the finalized Business Brief and the Architecture Blueprint into a highly actionable Execution Package for an external coding agent.

## Project Context
Business Brief:
"""
${briefContent}
"""

Architecture Blueprint:
"""
${architecture}
"""

## Your Process & Rules
1. **FIRST MESSAGE**: Immediately analyze the Business Brief and Architecture. Extract a clear list of core requirements. Then, formulate a sequential, step-by-step array of actionable coding prompts that an AI coder can follow to build this app from scratch. Call the \`presentExecutionPackage\` tool to output this structured data to the user interface.
2. **REFINEMENT**: If the user requests changes to the prompts or requirements, you can adjust them and call \`presentExecutionPackage\` again.
3. **APPROVAL**: Once the user is satisfied or if they explicitly approve, call the \`finalizeExecutionPackage\` tool to save the package to the database and complete the pipeline.

## CRITICAL RULES
- ALWAYS use the \`presentExecutionPackage\` tool to present or update the package. NEVER output the package as markdown text.
- After calling \`presentExecutionPackage\`, DO NOT produce any additional conversational text. The UI handles all rendering. Just call the tool and stop.
- Only produce conversational text when responding to a general question.`;

  const result = streamText({
    model: google('gemini-2.5-flash'),
    messages: await convertToModelMessages(messages),
    system: systemPrompt,
    tools: {
      presentExecutionPackage: {
        description: 'Present or update the execution package in the UI. Call this initially to generate the package, or whenever the user requests modifications.',
        inputSchema: z.object({
          package: executionPackageSchema,
          summaryOfChanges: z.string().optional().describe("A brief sentence explaining what changed, or 'Initial Draft' if it's the first time."),
        }),
        execute: async ({ package: execPackage, summaryOfChanges }: { package: any; summaryOfChanges?: string }) => {
          return { displayed: true, summaryOfChanges: summaryOfChanges || 'Execution package presented' };
        },
      },

      finalizeExecutionPackage: {
        description: 'Save the finalized execution package to the database and advance the project to the complete stage. Only call this AFTER the user has approved the package.',
        inputSchema: z.object({
          finalPackage: executionPackageSchema,
        }),
        execute: async ({ finalPackage }: { finalPackage: any }) => {
          try {
            await saveAgentStage({
              projectId,
              stage: 'execution_package',
              finalOutput: finalPackage,
            });
          } catch (error) {
            return { success: false, error: 'Project not found or update failed.' };
          }

          return {
            success: true,
            message: 'Execution package finalized. Project complete.',
            nextStage: 'complete',
          };
        },
      },
    },
  });

  return result.toUIMessageStreamResponse();
}
