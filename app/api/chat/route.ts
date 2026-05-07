import { NextResponse } from 'next/server';
import { UIMessage } from 'ai';
import { getProjectById } from '@/services/projectService';
import { businessAnalyst } from '@/lib/agents/businessAnalyst';
import { softwarePlanner } from '@/lib/agents/softwarePlanner';
import { executionPlanner } from '@/lib/agents/executionPlanner';


// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, projectId, apiKey, model }: { 
      messages: UIMessage[]; 
      projectId: string; 
      apiKey?: string; 
      model?: string 
    } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const project = await getProjectById(projectId);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const currentStage: string = project.currentStage;

    // Route the payload to the corresponding isolated agent function
    switch (currentStage) {
      case 'discovery':
        return await businessAnalyst(messages, projectId, apiKey, model);

      case 'architectural_design':
        return await softwarePlanner(messages, projectId, apiKey, model);

      case 'execution_package':
        return await executionPlanner(messages, projectId, apiKey, model);

      default:
        return NextResponse.json({ error: 'Invalid or unknown project stage' }, { status: 400 });
    }
  } catch (error) {
    console.error('Chat endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
