import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { google } from '@ai-sdk/google';

export async function businessAnalyst(messages: UIMessage[], projectId: string) {
  // Placeholder for agent-specific system prompt and injected context
  const systemPrompt = `You are the Business Analyst (Discovery Stage).
  Your role is to understand the core requirements and output structured project specs.
  Project ID Context: ${projectId}`;

  const result = streamText({
    model: google('gemini-2.0-flash-lite'),
    messages: await convertToModelMessages(messages),
    system: systemPrompt,
    // No tool implementations or complex schemas yet
  });

  return result.toUIMessageStreamResponse();
}
