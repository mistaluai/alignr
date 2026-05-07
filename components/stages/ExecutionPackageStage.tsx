"use client";

import { useState, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, CheckCircle2, Check, Sparkles, TerminalSquare, Layers, FileText, ChevronDown, ChevronUp } from "lucide-react";

import type { Project } from "@/lib/schemas/project";
import type { ProjectStage } from "@/lib/schemas/chat";
import type { ExecutionPackage } from "@/lib/schemas/stages/execution-package";
import { MarkdownViewer } from "../ui/markdown-viewer";
import { StructuredDataViewer } from "../ui/structured-data-viewer";

interface ExecutionPackageStageProps {
  projectId: string;
  project: Project;
  onStageAdvance?: (nextStage: ProjectStage) => void;
}

export function ExecutionPackageStage({ projectId, project, onStageAdvance }: ExecutionPackageStageProps) {
  const [executionPackage, setExecutionPackage] = useState<ExecutionPackage | null>(project.executionPackage || null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Collapse states
  const [showArchitecture, setShowArchitecture] = useState(false);
  const [showBrief, setShowBrief] = useState(false);
  const [showPrompts, setShowPrompts] = useState(true); // Keep prompts open by default
  const [showRequirements, setShowRequirements] = useState(false);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { projectId },
    }),
    id: `${projectId}-execution_package`,
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    const checkMessages = () => {
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.role !== "assistant") continue;
        for (let j = msg.parts.length - 1; j >= 0; j--) {
          const part = msg.parts[j];

          // 1. Look for the single-shot finalize tool
          if (part.type === "tool-finalizeExecutionPackage" && (part.state === "input-available" || part.state === "output-available")) {
            // Note the parameter name here is 'finalPackage', not 'package' based on our backend schema
            const input = part.input as { finalPackage: ExecutionPackage };
            if (input?.finalPackage) {
              setExecutionPackage(input.finalPackage);
            }
          }

          // 2. Keep the old check just in case for backwards compatibility with old chat histories
          if (part.type === "tool-presentExecutionPackage" && (part.state === "input-available" || part.state === "output-available")) {
            const input = part.input as { package: ExecutionPackage };
            if (input?.package) {
              setExecutionPackage(input.package);
            }
          }
        }
      }
    };
    checkMessages();
  }, [messages]); // Removed onStageAdvance from dependencies to prevent auto-advancing

  const handleCopy = useCallback((text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  }, []);

  const handleDownload = useCallback(() => {
    if (!executionPackage) return;

    let content = `# Execution Package: ${project.title}\n\n`;

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
    if (onStageAdvance) {
      onStageAdvance("complete");
    }
  };

  const handleGenerate = () => {
    sendMessage({ text: "Please generate the execution package based on the project overview." });
  };

  // 1. Loading State View
  if (isLoading && !executionPackage) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 bg-bg">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 border border-accent/20">
            <div className="absolute inset-0 animate-ping rounded-full bg-accent/20" />
            <Sparkles className="h-8 w-8 text-accent animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold text-fg">Generating Execution Prompts</h3>
            <p className="text-base text-fg-muted max-w-md mx-auto">
              Analyzing your architecture and business brief to formulate highly detailed, step-by-step coding instructions...
              This may take a while depending on the complexity of your project.
              <br />Be Patient and trust the process!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Pre-generation Project Overview View
  if (!executionPackage) {
    return (
      <div className="flex h-full flex-col bg-bg">
        <div className="flex items-center justify-between border-b border-border bg-bg p-4 sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-semibold text-fg">Project Overview</h2>
            <p className="text-sm text-fg-muted">Review the specifications before generating prompts.</p>
          </div>
          <Button onClick={handleGenerate} size="sm" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generate Prompts
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-4xl space-y-8">

            <div className="flex flex-col items-center justify-center p-8 text-center bg-bg-secondary rounded-xl border border-border border-dashed">
              <TerminalSquare className="h-12 w-12 text-accent mb-4 opacity-80" />
              <h3 className="text-xl font-semibold text-fg mb-2">Ready for the Coding Agent?</h3>
              <p className="text-sm text-fg-muted mb-6 max-w-lg">
                Review your final business brief and architecture blueprint below. When you are ready, the AI will break these down into sequential, actionable prompts for your external coding agent.
              </p>
              <Button onClick={handleGenerate} size="lg" className="gap-2 px-8">
                <Sparkles className="h-4 w-4" />
                Generate Execution Package
              </Button>
            </div>

            <Card className="border-border shadow-sm overflow-hidden transition-all">
              <CardHeader
                className="bg-bg-secondary/50 p-4 cursor-pointer hover:bg-bg-secondary/80 transition-colors flex flex-row items-center justify-between border-b border-border/50"
                onClick={() => setShowArchitecture(!showArchitecture)}
              >
                <div className="flex items-center gap-3">
                  <Layers className="h-5 w-5 text-accent" />
                  <div>
                    <CardTitle className="text-base">Architecture Blueprint</CardTitle>
                    <CardDescription className="mt-1">The structured system design that will guide the code generation.</CardDescription>
                  </div>
                </div>
                {showArchitecture ? <ChevronUp className="h-5 w-5 text-fg-muted" /> : <ChevronDown className="h-5 w-5 text-fg-muted" />}
              </CardHeader>
              {showArchitecture && (
                <CardContent className="p-6 bg-bg">
                  <StructuredDataViewer data={project.architectureBlueprint} />
                </CardContent>
              )}
            </Card>

            <Card className="border-border shadow-sm overflow-hidden transition-all">
              <CardHeader
                className="bg-bg-secondary/50 p-4 cursor-pointer hover:bg-bg-secondary/80 transition-colors flex flex-row items-center justify-between border-b border-border/50"
                onClick={() => setShowBrief(!showBrief)}
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-accent" />
                  <div>
                    <CardTitle className="text-base">Business Brief</CardTitle>
                    <CardDescription className="mt-1">The core product requirements and features.</CardDescription>
                  </div>
                </div>
                {showBrief ? <ChevronUp className="h-5 w-5 text-fg-muted" /> : <ChevronDown className="h-5 w-5 text-fg-muted" />}
              </CardHeader>
              {showBrief && (
                <CardContent className="p-6 bg-bg">
                  <MarkdownViewer content={project.businessBrief?.content || 'No business brief found.'} />
                </CardContent>
              )}
            </Card>

          </div>
        </div>
      </div>
    );
  }

  // 3. Post-generation Execution Package View
  return (
    <div className="flex h-full flex-col bg-bg">
      <div className="flex items-center justify-between border-b border-border bg-bg p-4 sticky top-0 z-10">
        <div>
          <h2 className="text-lg font-semibold text-fg">Execution Package</h2>
          <p className="text-sm text-fg-muted">Ready to be fed to your coding agent.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download MD
          </Button>
          <Button size="sm" onClick={handleFinalize} disabled={isLoading} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Complete Project
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl space-y-8">

          <Card className="border-accent/20 shadow-md overflow-hidden transition-all">
            <CardHeader
              className="flex flex-row items-center justify-between border-b border-border/50 bg-accent/5 p-5 cursor-pointer hover:bg-accent/10 transition-colors"
              onClick={() => setShowPrompts(!showPrompts)}
            >
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TerminalSquare className="h-5 w-5 text-accent" />
                  Sequential Coding Prompts
                </CardTitle>
                <CardDescription>Copy these steps one by one into your coding AI.</CardDescription>
              </div>
              <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleCopy(executionPackage.sequentialPrompts.join('\n\n'), 'all_prompts')}
                >
                  {copiedSection === 'all_prompts' ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  Copy All
                </Button>
                {showPrompts ? <ChevronUp className="h-5 w-5 text-fg-muted ml-2" /> : <ChevronDown className="h-5 w-5 text-fg-muted ml-2" />}
              </div>
            </CardHeader>
            {showPrompts && (
              <CardContent className="space-y-6 pt-6 bg-bg">
                {executionPackage.sequentialPrompts.map((prompt, idx) => (
                  <div key={idx} className="group relative rounded-lg border border-border bg-bg-secondary p-5 shadow-sm transition-all hover:border-accent/40">
                    <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 bg-bg"
                        onClick={() => handleCopy(prompt, `prompt_${idx}`)}
                      >
                        {copiedSection === `prompt_${idx}` ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-semibold text-fg">Execution Step</h4>
                    </div>
                    <div className="rounded-md bg-bg p-4 border border-border/50">
                      <p className="whitespace-pre-wrap font-mono text-sm text-fg-muted leading-relaxed">{prompt}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>

          <Card className="border-border shadow-sm overflow-hidden transition-all">
            <CardHeader
              className="flex flex-row items-center justify-between bg-bg-secondary/50 p-4 cursor-pointer hover:bg-bg-secondary/80 transition-colors border-b border-border/50"
              onClick={() => setShowRequirements(!showRequirements)}
            >
              <CardTitle className="text-base">Extracted Requirements</CardTitle>
              <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(executionPackage.requirements.join('\n'), 'requirements')}
                >
                  {copiedSection === 'requirements' ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4 text-fg-muted" />}
                </Button>
                {showRequirements ? <ChevronUp className="h-5 w-5 text-fg-muted ml-2" /> : <ChevronDown className="h-5 w-5 text-fg-muted ml-2" />}
              </div>
            </CardHeader>
            {showRequirements && (
              <CardContent className="p-6 bg-bg">
                <ul className="list-inside list-disc space-y-2">
                  {executionPackage.requirements.map((req, idx) => (
                    <li key={idx} className="text-sm text-fg/80">{req}</li>
                  ))}
                </ul>
              </CardContent>
            )}
          </Card>

        </div>
      </div>
    </div>
  );
}