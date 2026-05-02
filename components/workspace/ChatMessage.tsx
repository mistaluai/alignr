"use client";

import { InterviewToolUI } from "./tools/InterviewToolUI";
import { PresentBriefToolUI } from "./tools/PresentBriefToolUI";
import { PresentArchitectureToolUI } from "./tools/PresentArchitectureToolUI";
import { TriggerUIVisualizerToolUI } from "./tools/TriggerUIVisualizerToolUI";
import { FinalizeToolUI } from "./tools/FinalizeToolUI";

export function ChatMessage({
  part,
  addToolOutput,
  sendMessage,
  isFirstPart,
}: {
  part: any;
  addToolOutput: (args: any) => void;
  sendMessage: (msg: { text: string }) => void;
  isFirstPart: boolean;
}) {
  switch (part.type) {
    case "text":
      return <div className="whitespace-pre-wrap">{part.text}</div>;

    case "tool-askInterviewQuestions":
      return (
        <InterviewToolUI
          callId={part.toolCallId}
          state={part.state}
          toolInput={part.input}
          toolOutput={part.output}
          addToolOutput={addToolOutput}
          sendMessage={sendMessage}
          errorText={part.errorText}
        />
      );

    case "tool-presentBrief":
      return (
        <PresentBriefToolUI
          callId={part.toolCallId}
          state={part.state}
          toolInput={part.input}
          toolOutput={part.output}
          addToolOutput={addToolOutput}
          sendMessage={sendMessage}
          errorText={part.errorText}
        />
      );

    case "tool-presentArchitecture":
      return (
        <PresentArchitectureToolUI
          callId={part.toolCallId}
          state={part.state}
          toolInput={part.input}
          toolOutput={part.output}
          addToolOutput={addToolOutput}
          sendMessage={sendMessage}
          errorText={part.errorText}
        />
      );

    case "tool-triggerUIVisualizer":
      return (
        <TriggerUIVisualizerToolUI
          callId={part.toolCallId}
          state={part.state}
          toolInput={part.input}
          toolOutput={part.output}
          errorText={part.errorText}
        />
      );

    case "tool-finalizeArchitecture":
      return (
        <FinalizeToolUI
          callId={part.toolCallId}
          state={part.state}
          toolOutput={part.output}
          errorText={part.errorText}
          loadingMessage="Finalizing architecture and moving to prototyping…"
        />
      );

    case "tool-finalizeBrief":
      return (
        <FinalizeToolUI
          callId={part.toolCallId}
          state={part.state}
          toolOutput={part.output}
          errorText={part.errorText}
          loadingMessage="Saving brief and advancing project…"
        />
      );

    case "step-start":
      return !isFirstPart ? <hr className="my-2 border-border" /> : null;

    default:
      return null;
  }
}
