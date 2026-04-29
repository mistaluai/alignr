import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/db/mongodb';

const DB_NAME = process.env.DB_NAME || 'alignr_data';

export async function businessAnalyst(messages: UIMessage[], projectId: string) {
  const systemPrompt = `You are the Business Analyst agent for Alignr — a multi-agent product development system.

## Your Goal
Conduct a thorough discovery interview with the user to produce a comprehensive, well-structured business brief in Markdown format.

## Your Process
1. **FIRST MESSAGE**: Greet the user briefly, then immediately call \`askInterviewQuestions\` with 3-5 foundational questions covering: problem statement, target users, core features, success metrics, and constraints.
2. **SUBSEQUENT ROUNDS**: After the user answers, analyze their responses. Identify gaps or areas needing clarification. Call \`askInterviewQuestions\` again with 2-4 follow-up questions targeting those gaps. Always accompany questions with a brief summary of what you've learned so far.
3. **BRIEF COMPILATION**: Once you feel you have enough context (typically after 2-4 rounds of Q&A), compile the full business brief and present it to the user by calling \`presentBrief\`. The brief should be in well-structured Markdown with sections like: ## Problem, ## Target Users, ## Core Features, ## Success Metrics, ## Constraints & Assumptions, ## Scope.
4. **APPROVAL GATE**: When the user approves the brief via \`presentBrief\`, call \`finalizeBrief\` with the final Markdown content. If they request changes, ask more targeted questions and re-present the updated brief.

## Rules
- ALWAYS use the tools. Never just type out questions as plain text — always use \`askInterviewQuestions\`.
- Each question should be specific, not generic. Tailor them based on what the user has already shared.
- Use \`textarea\` type for questions expecting long-form answers. Use \`text\` for short factual answers.
- Keep your conversational text brief and focused. The tools do the heavy lifting.
- Do NOT call \`finalizeBrief\` until the user has explicitly approved the brief via \`presentBrief\`.

Project ID Context: ${projectId}`;

  const result = streamText({
    model: google('gemini-2.5-flash'),
    messages: await convertToModelMessages(messages),
    system: systemPrompt,
    tools: {
      // Client-side tool: renders multiple interview question forms in the UI
      askInterviewQuestions: {
        description: 'Ask the user a batch of interview questions to gather context about the project. Call this with an array of questions. Each question renders as an interactive form in the UI.',
        inputSchema: z.object({
          questions: z.array(z.object({
            id: z.string().describe('A unique short identifier for this question, e.g. "q1_problem", "q2_users"'),
            question: z.string().describe('The interview question to ask.'),
            type: z.enum(['text', 'textarea']).describe('Input type. Use textarea for detailed answers, text for short factual ones.'),
          })).describe('Array of interview questions to present to the user.'),
        }),
      },

      // Client-side tool: presents the compiled brief for user approval/rejection
      presentBrief: {
        description: 'Present the compiled business brief to the user for review and approval. The user can approve it to finalize, or request more refinement.',
        inputSchema: z.object({
          briefContent: z.string().describe('The full business brief in Markdown format.'),
          summary: z.string().describe('A 1-2 sentence summary of the brief for the approval prompt.'),
        }),
      },

      // Server-side tool: persists the final brief to MongoDB and advances the project stage
      finalizeBrief: {
        description: 'Save the finalized business brief to the database and advance the project to the next stage. Only call this AFTER the user has approved the brief via presentBrief.',
        inputSchema: z.object({
          briefContent: z.string().describe('The final approved business brief in Markdown format.'),
        }),
        execute: async ({ briefContent }: { briefContent: string }) => {
          const client = await clientPromise;
          const db = client.db(DB_NAME);

          const result = await db.collection('projects').updateOne(
            { _id: new ObjectId(projectId) },
            {
              $set: {
                businessBrief: { content: briefContent },
                currentStage: 'architectural_design',
                updatedAt: new Date(),
              },
            }
          );

          if (result.matchedCount === 0) {
            return { success: false, error: 'Project not found.' };
          }

          return {
            success: true,
            message: 'Business brief saved. Project advanced to Architectural Design stage.',
            nextStage: 'architectural_design',
          };
        },
      },
    },
  });

  return result.toUIMessageStreamResponse();
}

