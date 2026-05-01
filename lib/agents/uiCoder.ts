import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { google } from '@ai-sdk/google';

export async function uiCoder(messages: UIMessage[], projectId: string) {
  // Placeholder for agent-specific system prompt and injected context
  const systemPrompt = `You are the UI Coder (Visual Prototyping Stage).
  Your role is to implement the components and visual prototypes based on the architecture.
  Project ID Context: ${projectId}`;

  const result = streamText({
    model: google('gemini-2.5-flash'),
    messages: await convertToModelMessages(messages),
    system: systemPrompt,
    // No tool implementations or complex schemas yet
  });

  return result.toUIMessageStreamResponse();
}
