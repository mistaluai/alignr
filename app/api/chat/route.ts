import { NextResponse } from 'next/server';
import { UIMessage } from 'ai';
import { businessAnalyst } from '@/lib/agents/businessAnalyst';
import { softwarePlanner } from '@/lib/agents/softwarePlanner';
import { uiCoder } from '@/lib/agents/uiCoder';
import { critiqueParser } from '@/lib/agents/critiqueParser';

// Placeholder for your database retrieval logic
// import { getProjectById } from '@/lib/db/projectService';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, projectId }: { messages: UIMessage[]; projectId: string } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Placeholder: Read the project's currentStage from MongoDB
    // const project = await getProjectById(projectId);
    // const currentStage = project.currentStage;
    
    // Hardcoded for placeholder structure
    const currentStage: string = 'discovery'; // Valid stages: 'discovery', 'architectural_design', 'visual_prototyping', 'evaluation'

    // Route the payload to the corresponding isolated agent function
    switch (currentStage) {
      case 'discovery':
        return await businessAnalyst(messages, projectId);
        
      case 'architectural_design':
        return await softwarePlanner(messages, projectId);
        
      case 'visual_prototyping':
        return await uiCoder(messages, projectId);
        
      case 'evaluation':
        return await critiqueParser(messages, projectId);
        
      default:
        return NextResponse.json({ error: 'Invalid or unknown project stage' }, { status: 400 });
    }
  } catch (error) {
    console.error('Chat endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
