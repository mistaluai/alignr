"use client";

import { useState, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, CheckCircle2, ChevronRight, Check } from "lucide-react";

import type { Project } from "@/lib/schemas/project";
import type { ProjectStage } from "@/lib/schemas/chat";
import type { ExecutionPackage } from "@/lib/schemas/stages/execution-package";

interface ExecutionPackageStageProps {
  projectId: string;
  project: Project;
  onStageAdvance?: (nextStage: ProjectStage) => void;
}

export function ExecutionPackageStage({ projectId, project, onStageAdvance }: ExecutionPackageStageProps) {
  const [executionPackage, setExecutionPackage] = useState<ExecutionPackage | null>(project.executionPackage || null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const { messages, sendMessage, status, addToolOutput } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { projectId },
    }),
    id: `${projectId}-execution_package`,
  });

  const isLoading = status === "submitted" || status === "streaming";

  // Watch messages for the tool calls
  useEffect(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== "assistant") continue;
      for (let j = msg.parts.length - 1; j >= 0; j--) {
        const part = msg.parts[j];
        if (part.type === "tool-presentExecutionPackage" && (part.state === "input-available" || part.state === "output-available")) {
          const input = part.input as { package: ExecutionPackage };
          if (input?.package) {
            setExecutionPackage(input.package);
          }
        }
        if (part.type === "tool-finalizeExecutionPackage" && part.state === "output-available") {
          onStageAdvance?.("complete");
        }
      }
    }
  }, [messages, onStageAdvance]);

  // Automatically trigger agent if no package exists
  useEffect(() => {
    if (!executionPackage && !isLoading && messages.length === 0) {
      sendMessage({ text: "Please generate the execution package." });
    }
  }, [executionPackage, isLoading, messages.length, sendMessage]);

  const handleCopy = useCallback((text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  }, []);

  const handleDownload = useCallback(() => {
    if (!executionPackage) return;
    
    let content = `# Execution Package: ${project.title}\n\n`;
    
    content += `## Business Brief\n${executionPackage.businessBrief || project.businessBrief?.content || 'No brief found.'}\n\n`;
    
    content += `## Requirements\n`;
    executionPackage.requirements.forEach(req => {
      content += `- ${req}\n`;
    });
    content += `\n`;
    
    content += `## Sequential Coding Prompts\n`;
    executionPackage.sequentialPrompts.forEach((prompt, idx) => {
      content += `### Step ${idx + 1}\n${prompt}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-package-${projectId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [executionPackage, project, projectId]);

  const handleFinalize = () => {
    if (executionPackage) {
      sendMessage({ text: "I approve the execution package. Please finalize it." });
    }
  };

  if (!executionPackage) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <div className="absolute inset-0 animate-ping rounded-full bg-accent/20" />
            <span className="text-2xl animate-pulse">📦</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-medium text-fg">Generating Execution Package</h3>
            <p className="text-sm text-fg-muted max-w-sm">
              Analyzing the architecture and business brief to formulate step-by-step coding prompts...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="flex items-center justify-between border-b border-border bg-bg p-4">
        <div>
          <h2 className="text-lg font-semibold text-fg">Execution Package</h2>
          <p className="text-sm text-fg-muted">Ready for the coding agent.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download MD
          </Button>
          <Button onClick={handleFinalize} disabled={isLoading}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Approve & Complete
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl space-y-8">
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sequential Coding Prompts</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleCopy(executionPackage.sequentialPrompts.join('\n\n'), 'all_prompts')}
              >
                {copiedSection === 'all_prompts' ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-fg-muted" />}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {executionPackage.sequentialPrompts.map((prompt, idx) => (
                <div key={idx} className="group relative rounded-md border border-border bg-bg-secondary p-4">
                  <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => handleCopy(prompt, `prompt_${idx}`)}
                    >
                      {copiedSection === `prompt_${idx}` ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-fg-muted" />}
                    </Button>
                  </div>
                  <h4 className="mb-2 text-sm font-semibold text-accent">Step {idx + 1}</h4>
                  <p className="whitespace-pre-wrap text-sm text-fg">{prompt}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Extracted Requirements</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleCopy(executionPackage.requirements.join('\n'), 'requirements')}
              >
                {copiedSection === 'requirements' ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-fg-muted" />}
              </Button>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-2">
                {executionPackage.requirements.map((req, idx) => (
                  <li key={idx} className="text-sm text-fg">{req}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Original Business Brief</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleCopy(executionPackage.businessBrief || project.businessBrief?.content || '', 'brief')}
              >
                {copiedSection === 'brief' ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-fg-muted" />}
              </Button>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-fg-muted">
                {executionPackage.businessBrief || project.businessBrief?.content || 'No brief available.'}
              </p>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
