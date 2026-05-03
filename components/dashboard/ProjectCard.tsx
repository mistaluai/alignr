import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Calendar, ArrowRight } from "lucide-react";
import type { Project } from "@/lib/schemas/project";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project._id}`} className="group block">
      <Card className="relative overflow-hidden p-5 transition-all duration-300 hover:border-border-hover hover:shadow-lg hover:shadow-accent/5 group-hover:-translate-y-0.5">
        {/* Accent bar */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-accent/60 via-accent to-accent/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-fg group-hover:text-accent transition-colors duration-200">
              {project.title}
            </h3>
            <div className="mt-2 flex items-center gap-2 text-xs text-fg-muted">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {new Date(project.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          <Badge stage={project.currentStage} />
        </div>

        <div className="mt-4 flex items-center justify-end text-xs text-fg-muted group-hover:text-accent transition-colors">
          <span className="flex items-center gap-1">
            Open
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Card>
    </Link>
  );
}
