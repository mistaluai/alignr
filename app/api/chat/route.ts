import { NextResponse } from 'next/server';
import { UIMessage } from 'ai';
import { getProjectById } from '@/services/projectService';
import { businessAnalyst } from '@/lib/agents/businessAnalyst';
import { softwarePlanner } from '@/lib/agents/softwarePlanner';
import { executionPlanner } from '@/lib/agents/executionPlanner';

export const maxDuration = 30;

// Helper to detect Gemini-specific rate limits
function isQuotaError(error: any): boolean {
  const errorString = JSON.stringify(error).toLowerCase();
  const msg = error?.message?.toLowerCase() || "";

  return (
    error?.status === 429 ||
    error?.response?.status === 429 ||
    error?.status === 503 ||
    error?.response?.status === 503 ||
    error?.status === 403 ||
    error?.response?.status === 403 ||
    msg.includes('quota') ||
    errorString.includes('resource_exhausted') ||
    errorString.includes('rate_limit') ||
    errorString.includes('PERMISSION_DENIED')
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, projectId, apiKey, model } = body;

    if (!projectId) {
      console.log("Project ID is required");
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const project = await getProjectById(projectId);
    if (!project) {
      console.log("Project not found");
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const currentStage = project.currentStage;

    try {
      // Logic: Execute the agent and return its response (usually a stream)
      let result;
      switch (project.currentStage) {
        case 'discovery':
          result = await businessAnalyst(messages, projectId, apiKey, model);
          break;
        case 'architectural_design':
          result = await softwarePlanner(messages, projectId, apiKey, model);
          break;
        case 'execution_package':
          result = await executionPlanner(messages, projectId, apiKey, model);
          break;
        default:
          console.log("Invalid stage");
          return NextResponse.json({ error: 'Invalid stage' }, { status: 400 });
      }

      return result.toUIMessageStreamResponse();
    } catch (agentError: any) {

      if (isQuotaError(agentError)) {
        const isBYOK = !!apiKey;

        return NextResponse.json({
          error: isBYOK
            ? 'Your Gemini API key has reached its limit.'
            : 'The shared Gemini service is currently at capacity.',
          code: isBYOK ? 'rate_limit_exceeded_byok' : 'rate_limit_exceeded_shared'
        }, { status: 429 });
      }

      throw agentError; // Re-throw for the outer catch-all
    }
  } catch (error: any) {
    console.error('Fatal Chat Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}