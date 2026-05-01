"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Loader2, CheckCircle2, FileText, Layers, Eye, Check, Sparkles, Database } from "lucide-react";
import type { ProjectStage } from "@/lib/schemas/chat";
import type { ArchitecturePlan, FrontendScreen } from "@/lib/schemas/stages/software-planner";
import type { UiPrototype } from "@/lib/schemas/stages/ui-coder";

interface ChatInterfaceProps {
  projectId: string;
  currentStage: ProjectStage;
  onBriefUpdate?: (brief: string) => void;
  onStageAdvance?: (nextStage: ProjectStage) => void;
}

function ModificationForm({ 
  plan, 
  onSendMessage 
}: { 
  plan: ArchitecturePlan; 
  onSendMessage: (msg: { text: string }) => void 
}) {
  const [modType, setModType] = useState<"feature" | "requirement" | "screen" | "other">("other");
  const [selectedEntity, setSelectedEntity] = useState("");

  // Sync selectedEntity when modType changes
  useEffect(() => {
    if (modType === "feature") setSelectedEntity(plan.features[0] || "");
    else if (modType === "requirement") setSelectedEntity(plan.requirements[0] || "");
    else if (modType === "screen") setSelectedEntity(plan.frontendScreens[0]?.name || "");
    else setSelectedEntity("");
  }, [modType, plan]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const feedback = fd.get('feedback') as string;
        if (feedback.trim()) {
          const prefix = modType === "other" ? "" : `[MOD: ${modType.toUpperCase()} - ${selectedEntity}] `;
          onSendMessage({ text: `${prefix}${feedback}` });
          (e.target as HTMLFormElement).reset();
        }
      }}
      className="space-y-3"
    >
      <div className="flex gap-2">
        <select
          value={modType}
          onChange={(e) => setModType(e.target.value as any)}
          className="bg-bg-secondary border border-border rounded-md px-2 py-1 text-xs text-fg focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="feature">Feature</option>
          <option value="requirement">Requirement</option>
          <option value="screen">Screen</option>
          <option value="other">Other</option>
        </select>

        {modType !== "other" && (
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="flex-1 bg-bg-secondary border border-border rounded-md px-2 py-1 text-xs text-fg focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {modType === "feature" && plan.features.map(f => <option key={f} value={f}>{f}</option>)}
            {modType === "requirement" && plan.requirements.map(r => <option key={r} value={r}>{r}</option>)}
            {modType === "screen" && plan.frontendScreens.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
        )}
      </div>

      <div className="flex gap-2">
        <textarea
          name="feedback"
          placeholder={modType === "other" ? "General feedback..." : `What should change about this ${modType}?`}
          className="flex-1 min-h-[60px] bg-bg-secondary border border-border rounded-md p-2 text-xs text-fg focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <Button type="submit" size="sm" className="self-end">
          Update
        </Button>
      </div>
    </form>
  );
}

export function ChatInterface({ projectId, currentStage, onBriefUpdate, onStageAdvance }: ChatInterfaceProps) {
  const { messages, sendMessage, addToolOutput, status, error, stop } =
    useChat({
      transport: new DefaultChatTransport({
        api: "/api/chat",
        body: {
          projectId,
        },
      }),
      id: `${projectId}-${currentStage}`,
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Sync the latest brief from presentBrief tool calls to the shared brain
  useEffect(() => {
    if (!onBriefUpdate) return;
    // Walk messages in reverse to find the latest presentBrief with input
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== "assistant") continue;
      for (let j = msg.parts.length - 1; j >= 0; j--) {
        const part = msg.parts[j];
        if (
          part.type === "tool-presentBrief" &&
          (part.state === "input-available" || part.state === "output-available")
        ) {
          const input = part.input as { briefContent: string } | undefined;
          if (input?.briefContent) {
            onBriefUpdate(input.briefContent);
            return;
          }
        }
      }
    }
  }, [messages, onBriefUpdate]);

  // Handle stage transition when finalizeBrief is successful
  const transitionHandledRef = useRef<Record<string, boolean>>({});
  
  useEffect(() => {
    if (!onStageAdvance) return;
    
    // Handle stage transition when finalizeBrief or finalizeArchitecture is successful
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== "assistant") continue;
      
      for (let j = msg.parts.length - 1; j >= 0; j--) {
        const part = msg.parts[j];
        
        const isFinalizeBrief = part.type === "tool-finalizeBrief";
        const isFinalizeArch = part.type === "tool-finalizeArchitecture";

        if ((isFinalizeBrief || isFinalizeArch) && part.state === "output-available") {
          const callId = part.toolCallId;
          const output = part.output as { success: boolean; nextStage?: ProjectStage } | undefined;
          
          if (output?.success && output.nextStage && !transitionHandledRef.current[callId]) {
            // Mark this specific tool call as handled
            transitionHandledRef.current[callId] = true;
            
            // Wait a few seconds for the user to read the success message, then transition
            setTimeout(() => {
              onStageAdvance(output.nextStage!);
            }, 3000);
            return;
          }
        }
      }
    }
  }, [messages, onStageAdvance]);

  const stageName = currentStage
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  // Determine whether to hide the chat input.
  // In the discovery stage, once the BA starts asking questions via tools, 
  // we hide the default text input to force the user to use the forms.
  const hasStartedInterview =
    (currentStage === "discovery" || currentStage === "architectural_design") &&
    messages.some(
      (m) =>
        m.role === "assistant" &&
        m.parts?.some(
          (p) =>
            p.type === "tool-askInterviewQuestions" ||
            p.type === "tool-presentBrief" ||
            p.type === "tool-presentArchitecture"
        )
    );
  
  const showChatInput = !hasStartedInterview;

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Header */}
      <div className="border-b border-border px-6 py-3 flex justify-between items-center bg-bg-secondary/30">
        <h2 className="text-sm font-semibold text-fg flex items-center gap-2">
          <Bot className="h-4 w-4 text-accent" />
          {stageName} Agent
        </h2>
        <div className="flex items-center gap-2">
          {status === "submitted" && (
            <span className="flex items-center gap-1.5 text-xs text-fg-muted">
              <Loader2 className="h-3 w-3 animate-spin" />
              Thinking…
            </span>
          )}
          {status === "streaming" && (
            <span className="text-xs text-accent animate-pulse">
              Streaming…
            </span>
          )}
          {(status === "submitted" || status === "streaming") && (
            <button
              type="button"
              onClick={() => stop()}
              className="text-xs text-fg-muted hover:text-destructive transition-colors"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-fg-muted space-y-4">
            <div className="h-12 w-12 rounded-full bg-bg-secondary border border-border flex items-center justify-center">
              <Bot className="h-6 w-6 text-accent/50" />
            </div>
            <p className="text-sm">
              Start chatting with the {stageName} agent…
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <div className="h-8 w-8 rounded-md bg-accent/10 flex items-center justify-center shrink-0 mt-1">
                <Bot className="h-4 w-4 text-accent" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 text-sm flex flex-col gap-2 ${
                message.role === "user"
                  ? "bg-accent text-accent-fg rounded-br-none"
                  : "bg-bg-secondary border border-border text-fg rounded-bl-none"
              }`}
            >
              {message.parts.map((part, index) => {
                switch (part.type) {
                  case "text":
                    return (
                      <div key={index} className="whitespace-pre-wrap">
                        {part.text}
                      </div>
                    );

                  // ── Batch Interview Questions tool ──
                  case "tool-askInterviewQuestions": {
                    const callId = part.toolCallId;
                    const toolInput = part.input as { questions: Array<{ id: string; question: string; type: string }> } | undefined;
                    const toolOutput = part.output as { answers: Record<string, string> } | undefined;

                    switch (part.state) {
                      case "input-streaming":
                        return (
                          <div key={callId} className="animate-pulse text-fg-muted text-xs">
                            Preparing questions…
                          </div>
                        );
                      case "input-available":
                        return (
                          <div key={callId} className="mt-2 space-y-4 p-4 bg-bg border border-border rounded-lg">
                            <div className="text-xs font-semibold uppercase tracking-wider text-accent">
                              Interview Questions
                            </div>
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                const fd = new FormData(e.currentTarget);
                                const answers: Record<string, string> = {};
                                toolInput?.questions.forEach((q) => {
                                  answers[q.id] = (fd.get(q.id) as string) || "";
                                });
                                addToolOutput({
                                  tool: "askInterviewQuestions",
                                  toolCallId: callId,
                                  output: { answers },
                                });
                              }}
                              className="space-y-4"
                            >
                              {toolInput?.questions.map((q, qi) => (
                                <div key={q.id} className="space-y-1.5">
                                  <label htmlFor={q.id} className="text-sm font-medium text-fg flex items-start gap-2">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                                      {qi + 1}
                                    </span>
                                    {q.question}
                                  </label>
                                  {q.type === "textarea" ? (
                                    <textarea
                                      id={q.id}
                                      name={q.id}
                                      placeholder="Your detailed answer…"
                                      className="w-full min-h-[80px] bg-bg-secondary border border-border rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                                      required
                                    />
                                  ) : (
                                    <input
                                      id={q.id}
                                      name={q.id}
                                      placeholder="Your answer…"
                                      className="w-full bg-bg-secondary border border-border rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                                      required
                                    />
                                  )}
                                </div>
                              ))}
                              <Button type="submit" size="sm" className="w-full">
                                Submit All Answers
                              </Button>
                            </form>
                          </div>
                        );
                      case "output-available":
                        return (
                          <div key={callId} className="mt-2 p-4 bg-accent/5 border border-accent/20 rounded-lg space-y-3">
                            <div className="text-xs font-semibold uppercase tracking-wider text-accent">
                              Answers Submitted
                            </div>
                            {toolInput?.questions.map((q) => (
                              <div key={q.id} className="space-y-1">
                                <div className="text-xs font-medium text-fg-muted">{q.question}</div>
                                <div className="text-sm text-fg pl-3 border-l-2 border-accent/30">
                                  {toolOutput?.answers?.[q.id] || "—"}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      case "output-error":
                        return (
                          <div key={callId} className="text-destructive text-xs">
                            Error: {part.errorText}
                          </div>
                        );
                    }
                    break;
                  }

                  // ── Present Brief for Approval ──
                  case "tool-presentBrief": {
                    const callId = part.toolCallId;
                    const toolInput = part.input as { briefContent: string; summary: string } | undefined;
                    const toolOutput = part.output as { approved: boolean; feedback?: string } | undefined;

                    switch (part.state) {
                      case "input-streaming":
                        return (
                          <div key={callId} className="animate-pulse text-fg-muted text-xs">
                            Compiling brief…
                          </div>
                        );
                      case "input-available":
                        return (
                          <div key={callId} className="mt-2 p-4 bg-bg border border-accent/30 rounded-lg space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-fg">
                              <FileText className="h-4 w-4 text-accent" />
                              Business Brief — Review
                            </div>
                            <p className="text-xs text-fg-muted italic">{toolInput?.summary}</p>
                            <div className="rounded-md border border-border bg-bg-secondary p-4 text-xs font-mono text-fg-muted leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                              {toolInput?.briefContent}
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  addToolOutput({
                                    tool: "presentBrief",
                                    toolCallId: callId,
                                    output: { approved: false, feedback: "I'd like to refine some areas." },
                                  })
                                }
                              >
                                Refine Further
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  addToolOutput({
                                    tool: "presentBrief",
                                    toolCallId: callId,
                                    output: { approved: true },
                                  })
                                }
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Approve Brief
                              </Button>
                            </div>
                          </div>
                        );
                      case "output-available":
                        return (
                          <div key={callId} className={`mt-2 p-4 rounded-lg border space-y-2 ${
                            toolOutput?.approved
                              ? "bg-green-500/5 border-green-500/30"
                              : "bg-stage-architecture/5 border-stage-architecture/30"
                          }`}>
                            <div className="flex items-center gap-2 text-sm font-medium text-fg">
                              {toolOutput?.approved ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  Brief Approved
                                </>
                              ) : (
                                <>
                                  <FileText className="h-4 w-4 text-stage-architecture" />
                                  Refinement Requested
                                </>
                              )}
                            </div>
                            {toolOutput?.feedback && (
                              <p className="text-xs text-fg-muted">{toolOutput.feedback}</p>
                            )}
                          </div>
                        );
                      case "output-error":
                        return (
                          <div key={callId} className="text-destructive text-xs">
                            Error: {part.errorText}
                          </div>
                        );
                    }
                    break;
                  }

                  // ── Present Architecture Plan ──
                  case "tool-presentArchitecture": {
                    const callId = part.toolCallId;
                    const toolInput = part.input as { plan: ArchitecturePlan; summaryOfChanges: string } | undefined;

                    switch (part.state) {
                      case "input-streaming":
                        return (
                          <div key={callId} className="animate-pulse text-fg-muted text-xs">
                            Architecting system…
                          </div>
                        );
                      case "input-available":
                        return (
                          <div key={callId} className="mt-2 p-4 bg-bg border border-accent/30 rounded-lg space-y-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm font-semibold text-fg">
                                <Layers className="h-4 w-4 text-accent" />
                                Software Architecture Plan
                              </div>
                              <span className="px-2 py-0.5 rounded-full bg-accent/10 text-[10px] font-bold text-accent uppercase tracking-wider">
                                {toolInput?.summaryOfChanges === 'Initial Draft' ? 'v1.0' : 'Draft Update'}
                              </span>
                            </div>

                            <p className="text-xs text-fg-muted italic">
                              {toolInput?.summaryOfChanges}
                            </p>

                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <h4 className="text-[10px] font-bold uppercase text-fg-muted tracking-widest">Core Features</h4>
                                  <ul className="space-y-1">
                                    {toolInput?.plan.features.map((f, i) => (
                                      <li key={i} className="text-xs text-fg flex items-start gap-2">
                                        <div className="h-1 w-1 rounded-full bg-accent mt-1.5 shrink-0" />
                                        {f}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="text-[10px] font-bold uppercase text-fg-muted tracking-widest">Requirements</h4>
                                  <ul className="space-y-1">
                                    {toolInput?.plan.requirements.map((r, i) => (
                                      <li key={i} className="text-xs text-fg flex items-start gap-2">
                                        <Check className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                                        {r}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>

                              {/* Tech Stack */}
                              <div className="space-y-2 pt-2">
                                <h4 className="text-[10px] font-bold uppercase text-fg-muted tracking-widest">Tech Stack</h4>
                                <div className="flex flex-wrap gap-1.5">
                                  {toolInput?.plan.techStack.map((tech, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 rounded-md bg-accent/5 border border-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent">
                                      <Database className="h-3 w-3" />
                                      {tech}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-3 pt-2">
                                <h4 className="text-[10px] font-bold uppercase text-fg-muted tracking-widest">Frontend Screens</h4>
                                <div className="grid gap-2">
                                  {toolInput?.plan.frontendScreens.map((screen, i) => (
                                    <div key={i} className="p-3 rounded-md bg-bg-secondary border border-border flex items-start justify-between group hover:border-accent/30 transition-colors">
                                      <div className="space-y-1.5 flex-1 pr-4">
                                        <div className="space-y-0.5">
                                          <div className="text-sm font-medium text-fg">{screen.name}</div>
                                          <div className="text-[10px] text-fg-muted leading-relaxed">{screen.description}</div>
                                        </div>
                                        
                                        {screen.components && screen.components.length > 0 && (
                                          <div className="flex flex-wrap gap-1">
                                            {screen.components.map((comp, ci) => (
                                              <span key={ci} className="text-[9px] bg-bg border border-border px-1.5 py-0.5 rounded text-fg-muted/80">
                                                {comp}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 px-2 text-accent hover:text-accent hover:bg-accent/10 shrink-0"
                                        onClick={() => sendMessage({ text: `Please visualize the ${screen.name} screen.` })}
                                      >
                                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                                        Visualize
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-border space-y-3">
                              <label className="text-xs font-medium text-fg">Request Modifications</label>
                              {toolInput?.plan && (
                                <ModificationForm 
                                  plan={toolInput.plan} 
                                  onSendMessage={sendMessage} 
                                />
                              )}
                              
                              <div className="flex justify-center pt-2">
                                <Button
                                  variant="outline"
                                  className="w-full border-green-500/30 text-green-600 hover:bg-green-500/5 hover:text-green-700"
                                  onClick={() => {
                                    if (toolInput?.plan) {
                                      addToolOutput({
                                        tool: "presentArchitecture",
                                        toolCallId: callId,
                                        output: { approved: true },
                                      });
                                      sendMessage({ text: "I approve this architecture. Please finalize it." });
                                    }
                                  }}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Approve Architecture
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      case "output-available":
                        return (
                          <div key={callId} className="mt-2 p-3 bg-green-500/5 border border-green-500/20 rounded-lg flex items-center gap-2 text-sm text-fg">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Architecture reviewed and approved.
                          </div>
                        );
                      case "output-error":
                        return (
                          <div key={callId} className="text-destructive text-xs">
                            Error: {part.errorText}
                          </div>
                        );
                    }
                    break;
                  }

                  // ── Trigger UI Visualizer ──
                  case "tool-triggerUIVisualizer": {
                    const callId = part.toolCallId;
                    const toolInput = part.input as { screenName: string; associatedFeature: string } | undefined;
                    const toolOutput = part.output as UiPrototype | undefined;

                    switch (part.state) {
                      case "input-streaming":
                      case "input-available":
                        return (
                          <div key={callId} className="mt-2 p-4 bg-bg border border-accent/30 rounded-lg flex flex-col items-center justify-center space-y-3 py-8">
                            <Sparkles className="h-6 w-6 text-accent animate-pulse" />
                            <div className="text-sm font-medium text-fg">Generating UI Prototype for {toolInput?.screenName}…</div>
                          </div>
                        );
                      case "output-available":
                        return (
                          <div key={callId} className="mt-2 space-y-3">
                            <div className="p-4 bg-bg border border-accent/30 rounded-lg space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-semibold text-fg flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-accent" />
                                  UI Prototype: {toolOutput?.screenName}
                                </div>
                                <span className="text-[10px] text-fg-muted font-mono px-1.5 py-0.5 bg-bg-secondary rounded border border-border">
                                  {toolOutput?.associatedFeature}
                                </span>
                              </div>
                              
                              <div className="rounded-md border border-border bg-white p-6 shadow-inner min-h-[200px] flex flex-col items-center justify-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                                  <Bot className="h-8 w-8 text-accent" />
                                </div>
                                <div className="space-y-1">
                                  <h3 className="text-lg font-bold text-gray-900">{toolOutput?.screenName}</h3>
                                  <p className="text-xs text-gray-500 max-w-[200px]">
                                    This is a mock visualization of the screen code generated by the agent.
                                  </p>
                                </div>
                                <Button size="sm" variant="outline" className="text-gray-900 border-gray-300">
                                  Mock Interactive Element
                                </Button>
                              </div>

                              <div className="text-[10px] font-mono bg-bg-secondary p-3 rounded border border-border text-fg-muted overflow-x-auto max-h-40">
                                <pre>{toolOutput?.mockCode}</pre>
                              </div>
                            </div>
                          </div>
                        );
                      case "output-error":
                        return (
                          <div key={callId} className="text-destructive text-xs">
                            Error: {part.errorText}
                          </div>
                        );
                    }
                    break;
                  }

                  // ── Finalize Architecture ──
                  case "tool-finalizeArchitecture": {
                    const callId = part.toolCallId;
                    const toolOutput = part.output as { success: boolean; message?: string; error?: string } | undefined;

                    switch (part.state) {
                      case "input-streaming":
                      case "input-available":
                        return (
                          <div key={callId} className="flex items-center gap-2 text-xs text-fg-muted animate-pulse">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Finalizing architecture and moving to prototyping…
                          </div>
                        );
                      case "output-available":
                        return (
                          <div key={callId} className={`mt-2 p-4 rounded-lg border ${
                            toolOutput?.success
                              ? "bg-green-500/5 border-green-500/30"
                              : "bg-destructive/5 border-destructive/30"
                          }`}>
                            <div className="flex items-center gap-2 text-sm font-medium text-fg">
                              {toolOutput?.success ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  {toolOutput.message}
                                </>
                              ) : (
                                <>
                                  <span className="text-destructive">Failed:</span> {toolOutput?.error}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      case "output-error":
                        return (
                          <div key={callId} className="text-destructive text-xs">
                            Error: {part.errorText}
                          </div>
                        );
                    }
                    break;
                  }

                  // ── Finalize Brief (server-side, auto-executed) ──
                  case "tool-finalizeBrief": {
                    const callId = part.toolCallId;
                    const toolOutput = part.output as { success: boolean; message?: string; error?: string } | undefined;

                    switch (part.state) {
                      case "input-streaming":
                      case "input-available":
                        return (
                          <div key={callId} className="flex items-center gap-2 text-xs text-fg-muted animate-pulse">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Saving brief and advancing project…
                          </div>
                        );
                      case "output-available":
                        return (
                          <div key={callId} className={`mt-2 p-4 rounded-lg border ${
                            toolOutput?.success
                              ? "bg-green-500/5 border-green-500/30"
                              : "bg-destructive/5 border-destructive/30"
                          }`}>
                            <div className="flex items-center gap-2 text-sm font-medium text-fg">
                              {toolOutput?.success ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  {toolOutput.message}
                                </>
                              ) : (
                                <>
                                  <span className="text-destructive">Failed:</span> {toolOutput?.error}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      case "output-error":
                        return (
                          <div key={callId} className="text-destructive text-xs">
                            Error: {part.errorText}
                          </div>
                        );
                    }
                    break;
                  }

                  // Fallback for any other tool types
                  case "step-start":
                    return index > 0 ? (
                      <hr
                        key={index}
                        className="my-2 border-border"
                      />
                    ) : null;

                  default:
                    return null;
                }
              })}
            </div>

            {message.role === "user" && (
              <div className="h-8 w-8 rounded-md bg-bg-secondary border border-border flex items-center justify-center shrink-0 mt-1">
                <User className="h-4 w-4 text-fg-muted" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-6 mb-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-xs text-destructive animate-fade-in">
          Something went wrong. Please try again.
        </div>
      )}

      {/* Input */}
      {showChatInput && (
        <div className="p-4 bg-bg border-t border-border">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) {
                sendMessage({ text: input });
                setInput("");
              }
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${stageName} agent…`}
              disabled={status !== "ready" && status !== "error"}
              className="flex-1 rounded-md border border-border bg-bg-secondary px-3 py-2 text-sm text-fg placeholder:text-fg-muted/50 focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || (status !== "ready" && status !== "error")}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
