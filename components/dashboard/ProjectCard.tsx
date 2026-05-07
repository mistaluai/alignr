"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Calendar, Clock, ArrowRight, MoreVertical, Pencil, Trash2 } from "lucide-react";
import type { Project } from "@/lib/schemas/project";
import { getStageConfig } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the dropdown if the user clicks anywhere outside of it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevents navigating to the project page
    setIsMenuOpen(!isMenuOpen);
  };

  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMenuOpen(false);
    // Future implementation will go here (e.g., rename, delete)
  };

  // Get both the formatted label and the color classes
  const { label, classes } = getStageConfig(project.currentStage);

  return (
    <Link href={`/projects/${project._id}`} className="group block">
      <div className="relative overflow-hidden rounded-xl border border-border bg-background p-5 transition-all duration-300 hover:border-border-hover hover:shadow-lg hover:shadow-accent/5 group-hover:-translate-y-0.5">

        {/* Accent bar remains */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-accent/60 via-accent to-accent/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="truncate text-base font-semibold text-fg group-hover:text-accent transition-colors duration-200">
                {project.title}
              </h3>

              {/* Custom Quick Actions Menu */}
              <div className="relative z-10" ref={menuRef}>
                <button
                  onClick={toggleMenu}
                  className="rounded-md p-1 text-fg-muted hover:bg-muted hover:text-fg transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
                  aria-label="Open menu"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-1 w-32 rounded-md border border-border bg-background py-1 shadow-lg animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={handleAction}
                      className="flex w-full items-center px-3 py-2 text-sm text-fg hover:bg-muted transition-colors"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Rename
                    </button>
                    <button
                      onClick={handleAction}
                      className="flex w-full items-center px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Timestamps Section */}
            <div className="mt-3 flex flex-col gap-1.5 text-xs text-fg-muted">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  Created:{" "}
                  {new Date(project.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  Edited:{" "}
                  {new Date(project.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs">
          {/* Formatted label and dynamically injected colors */}
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-medium ${classes}`}>
            {label}
          </span>

          <span className="flex items-center gap-1 text-fg-muted group-hover:text-accent transition-colors">
            Open
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}