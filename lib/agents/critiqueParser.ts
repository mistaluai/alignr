import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { google } from '@ai-sdk/google';

export async function critiqueParser(messages: UIMessage[], projectId: string) {
  // Placeholder for agent-specific system prompt and injected context
  const systemPrompt = `You are the Critique & Parser (Evaluation Stage).
  Your role is to evaluate the outputs and parse structured feedback or critique.
  Project ID Context: ${projectId}`;

  const result = streamText({
    model: google('gemini-2.0-flash-lite'),
    messages: await convertToModelMessages(messages),
    system: systemPrompt,
    // No tool implementations or complex schemas yet
  });

  return result.toUIMessageStreamResponse();
}
