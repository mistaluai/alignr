"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Loader2, CheckCircle2, FileText } from "lucide-react";
import type { ProjectStage } from "@/lib/schemas/chat";

interface ChatInterfaceProps {
  projectId: string;
  currentStage: ProjectStage;
  onBriefUpdate?: (brief: string) => void;
}

export function ChatInterface({ projectId, currentStage, onBriefUpdate }: ChatInterfaceProps) {
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

  const stageName = currentStage
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

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
    </div>
  );
}
