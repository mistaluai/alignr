import React from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils"

interface MarkdownViewerProps {
    content: string;
    className?: string;
}

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
    if (!content) {
        return <p className="text-sm text-fg-muted">No content provided.</p>;
    }

    return (
        <div
            className={cn(
                "prose prose-sm dark:prose-invert max-w-none text-fg/90 whitespace-pre-wrap",
                className
            )}
        >
            <ReactMarkdown>{content}</ReactMarkdown>
        </div>
    );
}