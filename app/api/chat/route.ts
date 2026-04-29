import { NextResponse } from 'next/server';
import { UIMessage } from 'ai';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/db/mongodb';
import { businessAnalyst } from '@/lib/agents/businessAnalyst';
import { softwarePlanner } from '@/lib/agents/softwarePlanner';
import { uiCoder } from '@/lib/agents/uiCoder';
import { critiqueParser } from '@/lib/agents/critiqueParser';

const DB_NAME = process.env.DB_NAME || 'alignr_data';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, projectId }: { messages: UIMessage[]; projectId: string } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Read the project's currentStage from MongoDB
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const project = await db.collection('projects').findOne({ _id: new ObjectId(projectId) });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const currentStage: string = project.currentStage;

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
