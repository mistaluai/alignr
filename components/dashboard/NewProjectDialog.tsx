"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { createProjectAction } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

export function NewProjectDialog() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        New Project
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="relative">
          <button
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-lg p-1 text-fg-muted hover:text-fg hover:bg-bg-tertiary transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
          <CardTitle>Create New Project</CardTitle>
        </CardHeader>
        <form action={createProjectAction}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-title">Project Title</Label>
              <Input
                id="project-title"
                name="title"
                placeholder="My awesome product…"
                required
                autoFocus
              />
            </div>
          </CardContent>
          <CardFooter className="gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
