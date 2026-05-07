"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Loader2, AlertCircle } from "lucide-react";
import type { ProjectStage } from "@/lib/schemas/chat";
import type { ArchitecturePlan } from "@/lib/schemas/stages/software-planner";
import { ArchitecturePlanReview } from "./tools/ArchitecturePlanReview";
import { ChatMessage } from "./ChatMessage";
import { useGeminiSettings } from "@/hooks/useGeminiSettings";
import { GeminiSettingsDialog } from "./GeminiSettingsDialog";

interface ChatInterfaceProps {
  projectId: string;
  currentStage: ProjectStage;
  onBriefUpdate?: (brief: string) => void;
  onStageAdvance?: (nextStage: ProjectStage) => void;
}

export function ChatInterface({ projectId, currentStage, onBriefUpdate, onStageAdvance }: ChatInterfaceProps) {
  const { apiKey, model } = useGeminiSettings();

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: {
          projectId,
          apiKey,
          model,
        },
      }),
    [projectId, apiKey, model]
  );

  const { messages, sendMessage, addToolOutput, status, error, stop } =
    useChat({
      transport,
      id: `${projectId}-${currentStage}`,
    });

  const autoTriggeredRef = useRef<string | null>(null);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const errorInfo = useMemo(() => {
    if (!error) return null;

    const msg = error.message;

    let isShared = msg.includes('rate_limit_exceeded_shared');
    let isBYOK = msg.includes('rate_limit_exceeded_byok');

    const isGenericQuota = msg.includes('429') || msg.toLowerCase().includes('quota');

    if (isGenericQuota && !isShared && !isBYOK) {
      if (apiKey && apiKey.trim() !== "") {
        isBYOK = true;
      } else {
        isShared = true;
      }
    }

    return {
      isRateLimit: isShared || isBYOK || isGenericQuota,
      isSharedLimit: isShared,
      isBYOKLimit: isBYOK,
      message: msg
    };
  }, [error, apiKey]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
      const timer = setTimeout(() => {
        onStageAdvance(stageAdvanceTrigger);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [stageAdvanceTrigger, onStageAdvance]);

  useEffect(() => {
    if (
      currentStage === "architectural_design" &&
      messages.length === 0 &&
      status === "ready" &&
      autoTriggeredRef.current !== currentStage
    ) {
      const timer = setTimeout(() => {
        if (status === "ready") {
          autoTriggeredRef.current = currentStage;
          sendMessage({
            text: "Please generate the software architecture plan based on the business brief.",
          });
        }
      }, 50);
      return () => clearTimeout(timer);
    }

    if (currentStage !== "architectural_design") {
      autoTriggeredRef.current = null;
    }
  }, [currentStage, messages.length, status, sendMessage]);

  const stageName = currentStage
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

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

  const showPlanReview = currentStage === 'architectural_design' && latestArchitecturePlan !== null;

  return (
    <div className="flex flex-col h-full bg-bg">
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
          <div className="w-px h-4 bg-border mx-1" />
          <GeminiSettingsDialog />
        </div>
      </div>

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
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-fg-muted space-y-4">
              <div className="h-12 w-12 rounded-full bg-bg-secondary border border-border flex items-center justify-center">
                <Bot className="h-6 w-6 text-accent/50" />
              </div>
              <p className="text-sm">Start chatting with the {stageName} agent…</p>
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

      {errorInfo && (
        <div className="mx-6 mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive animate-fade-in flex gap-3 items-start">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <p className="font-semibold">
              {errorInfo.isRateLimit ? errorInfo.isBYOKLimit ? 'API Rate Limit Reached' : 'Service Temporarily Unavailable' : 'Service Connection Error'}
            </p>
            <p className="opacity-90 leading-relaxed">
              {errorInfo.isSharedLimit
                ? 'Our servers are currently experiencing high demand. To continue without interruption, please add your own API key in the settings menu at the top right.'
                : errorInfo.isBYOKLimit
                  ? 'Your provided API key has exhausted its quota. Please check your billing/usage in Google AI Studio or provide a different key.'
                  : 'We encountered an issue connecting to the AI agent. Please wait a moment and try sending your message again. If this persists, try refreshing the page.'}
            </p>
            {errorInfo.isRateLimit && (
              <div className="mt-1 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive"
                  onClick={() => window.location.reload()}
                >
                  Retry Connection
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

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