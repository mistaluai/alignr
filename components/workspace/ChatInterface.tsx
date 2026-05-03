"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Loader2 } from "lucide-react";
import type { ProjectStage } from "@/lib/schemas/chat";
import type { ArchitecturePlan } from "@/lib/schemas/stages/software-planner";
import { ArchitecturePlanReview } from "./tools/ArchitecturePlanReview";
import { ChatMessage } from "./ChatMessage";

interface ChatInterfaceProps {
  projectId: string;
  currentStage: ProjectStage;
  onBriefUpdate?: (brief: string) => void;
  onStageAdvance?: (nextStage: ProjectStage) => void;
}

export function ChatInterface({ projectId, currentStage, onBriefUpdate, onStageAdvance }: ChatInterfaceProps) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: {
          projectId,
        },
      }),
    [projectId]
  );

  const { messages, sendMessage, addToolOutput, status, error, stop } =
    useChat({
      transport,
      id: `${projectId}-${currentStage}`,
    });

  const autoTriggeredRef = useRef<string | null>(null);

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Sync the latest brief using useMemo instead of a loop inside useEffect
  const latestBriefContent = useMemo(() => {
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
          if (input?.briefContent) return input.briefContent;
        }
      }
    }
    return null;
  }, [messages]);

  useEffect(() => {
    if (onBriefUpdate && latestBriefContent) {
      onBriefUpdate(latestBriefContent);
    }
  }, [latestBriefContent, onBriefUpdate]);

  // Sync stage transition via useMemo instead of a loop in useEffect
  const transitionHandledRef = useRef<Record<string, boolean>>({});

  const stageAdvanceTrigger = useMemo(() => {
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
            transitionHandledRef.current[callId] = true;
            return output.nextStage;
          }
        }
      }
    }
    return null;
  }, [messages]);

  useEffect(() => {
    if (onStageAdvance && stageAdvanceTrigger) {
      // Wait a few seconds for the user to read the success message, then transition
      const timer = setTimeout(() => {
        onStageAdvance(stageAdvanceTrigger);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [stageAdvanceTrigger, onStageAdvance]);

  // Auto-trigger architecture plan generation when entering the architecture stage
  useEffect(() => {
    if (
      currentStage === "architectural_design" &&
      messages.length === 0 &&
      status === "ready" &&
      autoTriggeredRef.current !== currentStage
    ) {
      // Small timeout to ensure useChat is fully initialized and to prevent race conditions
      const timer = setTimeout(() => {
        // Double check status still ready before sending
        if (status === "ready") {
          autoTriggeredRef.current = currentStage;
          sendMessage({
            text: "Please generate the software architecture plan based on the business brief.",
          });
        }
      }, 50);
      return () => clearTimeout(timer);
    }

    // Reset ref if we leave the stage or if messages are cleared/changed
    if (currentStage !== "architectural_design") {
      autoTriggeredRef.current = null;
    }
  }, [currentStage, messages.length, status, sendMessage]);

  const stageName = currentStage
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  // Determine whether to hide the chat input.
  const hasStartedInterview = useMemo(() => {
    return (currentStage === "discovery" || currentStage === "architectural_design") &&
      messages.some((m) =>
        m.role === "assistant" &&
        m.parts?.some((p) =>
          p.type === "tool-askInterviewQuestions" ||
          p.type === "tool-presentBrief" ||
          p.type === "tool-presentArchitecture"
        )
      );
  }, [messages, currentStage]);

  const showChatInput = !hasStartedInterview && currentStage !== "architectural_design";

  // Extract latest architecture plan
  const latestArchitecturePlan = useMemo(() => {
    if (currentStage !== 'architectural_design') return null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== 'assistant') continue;
      for (let j = msg.parts.length - 1; j >= 0; j--) {
        const part = msg.parts[j];
        if (
          part.type === 'tool-presentArchitecture' &&
          (part.state === 'input-available' || part.state === 'output-available')
        ) {
          const input = part.input as { plan: ArchitecturePlan; summaryOfChanges?: string } | undefined;
          if (input?.plan) return input;
        }
      }
    }
    return null;
  }, [messages, currentStage]);

  // Count architecture plan versions
  const architectureVersion = useMemo(() => {
    if (currentStage !== 'architectural_design') return 0;
    let count = 0;
    for (const msg of messages) {
      if (msg.role !== 'assistant') continue;
      for (const part of msg.parts) {
        if (
          part.type === 'tool-presentArchitecture' &&
          (part.state === 'input-available' || part.state === 'output-available')
        ) {
          count++;
        }
      }
    }
    return count;
  }, [messages, currentStage]);

  // Whether to show the dedicated plan review panel
  const showPlanReview = currentStage === 'architectural_design' && latestArchitecturePlan !== null;

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

      {/* Architecture Plan Review (replaces chat when plan is available) */}
      {showPlanReview ? (
        <ArchitecturePlanReview
          plan={latestArchitecturePlan.plan}
          summaryOfChanges={latestArchitecturePlan.summaryOfChanges}
          version={architectureVersion}
          onModify={(text) => sendMessage({ text })}
          onApprove={() => sendMessage({ text: 'I approve this architecture. Please finalize it.' })}
          onVisualize={(screenName) => sendMessage({ text: `Please visualize the ${screenName} screen.` })}
          isProcessing={status === 'submitted' || status === 'streaming'}
        />
      ) : (
        /* Messages */
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
                className={`max-w-[80%] rounded-xl px-4 py-3 text-sm flex flex-col gap-2 ${message.role === "user"
                    ? "bg-accent text-accent-fg rounded-br-none"
                    : "bg-bg-secondary border border-border text-fg rounded-bl-none"
                  }`}
              >
                {message.parts.map((part, index) => (
                  <ChatMessage
                    key={index}
                    part={part}
                    addToolOutput={addToolOutput}
                    sendMessage={sendMessage}
                    isFirstPart={index === 0}
                  />
                ))}
              </div>

              {message.role === "user" && (
                <div className="h-8 w-8 rounded-md bg-bg-secondary border border-border flex items-center justify-center shrink-0 mt-1">
                  <User className="h-4 w-4 text-fg-muted" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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
