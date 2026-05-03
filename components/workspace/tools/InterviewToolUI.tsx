"use client";

import { Button } from "@/components/ui/button";

export function InterviewToolUI({
  callId,
  state,
  toolInput,
  toolOutput,
  addToolOutput,
  sendMessage,
  errorText,
}: {
  callId: string;
  state: string;
  toolInput?: { questions: Array<{ id: string; question: string; type: string }> };
  toolOutput?: { answers: Record<string, string> };
  addToolOutput: (args: any) => void;
  sendMessage: (msg: { text: string }) => void;
  errorText?: string;
}) {
  switch (state) {
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
              sendMessage({ text: "I have provided answers to the questions. Please proceed." });
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
          Error: {errorText}
        </div>
      );
    default:
      return null;
  }
}
