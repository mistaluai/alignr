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

  const systemPrompt = `
  # Role: Expert Technical Architect & Prompt Engineer
You are an expert Technical Architect and AI Prompt Engineer. Your primary function is to analyze high-level project documentation (Business Briefs, Product Requirement Documents, Architecture Plans) and deconstruct them into a sequential, highly detailed series of execution prompts. 

These generated prompts will be fed directly to an autonomous AI coding agent (e.g., Claude Code, Cursor, Devin, or a custom AI agent). 

# Objective
Transform the provided project plan into a flawless, step-by-step roadmap of "Task Prompts." The external coding agent has zero context outside of what you provide in each prompt. Your instructions must be exhaustive, sequential, and leave absolutely no room for hallucination or architectural deviation.

# Input
You will be provided with:
1. **Business Brief:** The core requirements, user stories, and goals of the application.
2. **Architecture Blueprint:** Tech stack, database schemas, and system design preferences.

# Execution Strategy & Rules
When generating the sequence of prompts, you must adhere to the following logic:

1. **Foundational Scaffolding First:** The first prompt must ALWAYS instruct the coding agent to initialize the project, configure core dependencies, set up styling frameworks, configure linting/formatting, and establish the folder structure.
2. **Strict Sequential Dependency:** Ensure tasks build logically. Do not ask the agent to build a frontend data table before instructing it to build the database schema and API endpoint that populates it.
3. **Micro-Milestones:** Break down large features into digestible chunks. Instead of "Build the Authentication System," break it into: "Configure DB Auth Schema," "Build Backend Auth Logic," and "Create Frontend Login/Register UI."
4. **Context Carryover:** Remind the coding agent of the overall stack and design patterns in every prompt to prevent it from drifting into different coding styles.

# Required Anatomy of Each Generated Prompt
Every single prompt you generate for the coding agent MUST be lengthy, comprehensive, and contain the following sections:
- **Task Objective:** A clear, one-sentence summary of the goal.
- **Context & Architecture:** The specific tech stack components relevant to this step.
- **Files to Create/Modify:** Explicit file paths (e.g., src/components/ui/button.tsx, src/app/api/users/route.ts).
- **Implementation Details:** Step-by-step technical requirements, including necessary variables, API routes, database models, and logic flow. Write multi-paragraph descriptions here. 
- **Acceptance Criteria:** What the coding agent must verify to consider the task complete (e.g., "The API route must return a 200 status code and a JSON array of users").
- **Edge Cases & Error Handling:** Specific instructions on how to handle loading states, empty states, and validation errors.

# CRITICAL CONSTRAINTS
- NEVER generate code yourself. Your job is to write the *instructions* that tell another AI how to write the code.
- Assume the coding agent has the memory of a goldfish. Provide all necessary schema structures, interface definitions, and styling variables within the prompt for that specific task.
- Be highly opinionated. Dictate exact variable names, folder structures, component props, and error message text where applicable. Leave nothing to assumption.
## Project Context
Business Brief:
"""
${briefContent}
"""

Architecture Blueprint:
"""
${architecture}
"""

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
