"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { saveStageAction } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  Save,
  FileText,
  ArrowRight,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";

interface InterviewQuestion {
  question: string;
  type: "text" | "textarea" | "single-choice" | "multiple-choice";
  options?: string;
}

interface DiscoveryFormData {
  brief: string;
  questions: InterviewQuestion[];
}

interface DiscoveryStageProps {
  projectId: string;
  defaultBrief?: string;
  onStageComplete?: () => void;
  isGuest?: boolean;
  onGuestBriefUpdate?: (content: string) => void;
}

export function DiscoveryStage({
  projectId,
  defaultBrief = "",
  onStageComplete,
  isGuest = false,
  onGuestBriefUpdate,
}: DiscoveryStageProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTransition, setShowTransition] = useState(false);

  const { register, control, handleSubmit, watch } =
    useForm<DiscoveryFormData>({
      defaultValues: {
        brief: defaultBrief,
        questions: [],
      },
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  });

  const briefValue = watch("brief");

  const onSubmit = async (data: DiscoveryFormData) => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      if (isGuest) {
        // Guest mode: update local state only
        onGuestBriefUpdate?.(data.brief);
      } else {
        // Authenticated: persist to database
        await saveStageAction({
          projectId,
          stage: "discovery",
          finalOutput: {
            brief: { content: data.brief },
          },
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 overflow-y-auto flex-1">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* ─── Business Brief ─── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-fg">Business Brief</h3>
          </div>
          <Textarea
            {...register("brief", { required: true })}
            placeholder="Describe your product vision in Markdown…&#10;&#10;## Problem&#10;What problem are you solving?&#10;&#10;## Target Users&#10;Who is this for?&#10;&#10;## Core Features&#10;- Feature 1&#10;- Feature 2"
            className="min-h-[220px] font-mono text-xs leading-relaxed"
          />
        </section>

        {/* ─── Interview Questions Form Builder ─── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold text-fg">
                Interview Questions
              </h3>
              <span className="text-[11px] text-fg-muted/50 ml-1">
                (ephemeral — not saved)
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ question: "", type: "text", options: "" })
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Add Question
            </Button>
          </div>

          {fields.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-8 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-fg-muted/20 mb-2" />
              <p className="text-xs text-fg-muted/50">
                No questions yet. Add interview questions for discovery.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <Card
                  key={field.id}
                  className="relative animate-fade-in"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Question number */}
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent mt-1">
                        {index + 1}
                      </span>

                      <div className="flex-1 space-y-3">
                        {/* Question text */}
                        <div className="space-y-1">
                          <Label
                            htmlFor={`q-${index}`}
                            className="text-xs text-fg-muted"
                          >
                            Question
                          </Label>
                          <Input
                            id={`q-${index}`}
                            {...register(
                              `questions.${index}.question` as const
                            )}
                            placeholder="What is your target market?"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Input type */}
                          <div className="space-y-1">
                            <Label className="text-xs text-fg-muted">
                              Input Type
                            </Label>
                            <Select
                              {...register(
                                `questions.${index}.type` as const
                              )}
                            >
                              <option value="text">Text</option>
                              <option value="textarea">Textarea</option>
                              <option value="single-choice">
                                Single Choice
                              </option>
                              <option value="multiple-choice">
                                Multiple Choice
                              </option>
                            </Select>
                          </div>

                          {/* Options (for choice types) */}
                          <div className="space-y-1">
                            <Label className="text-xs text-fg-muted">
                              Options (comma-separated)
                            </Label>
                            <Input
                              {...register(
                                `questions.${index}.options` as const
                              )}
                              placeholder="Option A, Option B, …"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Delete button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-fg-muted hover:text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* ─── Actions ─── */}
        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving…
              </span>
            ) : saved ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Saved!
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Brief
              </span>
            )}
          </Button>

          {briefValue && briefValue.length > 20 && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowTransition(true)}
            >
              Preview Transition
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-fade-in">
            {error}
          </div>
        )}
      </form>

      {/* ─── Phase Transition Card ─── */}
      {showTransition && (
        <Card className="border-accent/30 bg-accent/5 animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5 text-accent" />
              Phase Complete — Discovery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Brief preview */}
            <div className="rounded-lg border border-border bg-bg p-4 text-xs font-mono text-fg-muted leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
              {briefValue || "No brief content."}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowTransition(false)}
              >
                Refine Further
              </Button>
              <Button onClick={onStageComplete}>
                Approve & Move to Planning
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
