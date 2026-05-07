"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Calendar, Clock, ArrowRight, MoreVertical, Pencil, Trash2, Loader2 } from "lucide-react";
import type { Project } from "@/lib/schemas/project";
import { getStageConfig } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { deleteProjectAction, renameProjectAction } from "@/app/actions/projects";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Modal States
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newName, setNewName] = useState(project.title);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    e.preventDefault();
    setIsMenuOpen(!isMenuOpen);
  };

  const openRenameModal = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMenuOpen(false);
    setNewName(project.title); // Reset input to current title
    setIsRenameModalOpen(true);
  };

  const openDeleteModal = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMenuOpen(false);
    setDeleteConfirmText(""); // Reset safety text
    setIsDeleteModalOpen(true);
  };

  const handleRenameSubmit = async () => {
    if (!newName.trim() || newName === project.title) {
      setIsRenameModalOpen(false);
      return;
    }

    setIsLoading(true);
    await renameProjectAction(project._id, newName.trim());
    setIsLoading(false);
    setIsRenameModalOpen(false);
  };

  const handleDeleteSubmit = async () => {
    if (deleteConfirmText !== "DELETE") return;

    setIsLoading(true);
    await deleteProjectAction(project._id);
    setIsLoading(false);
    setIsDeleteModalOpen(false);
  };

  const { label, classes } = getStageConfig(project.currentStage);

  return (
    <>
      <Link href={`/projects/${project._id}`} className="group block">
        <div className="relative overflow-hidden rounded-xl border border-border bg-background p-5 transition-all duration-300 hover:border-border-hover hover:shadow-lg hover:shadow-accent/5 group-hover:-translate-y-0.5">

          {/* Accent bar */}
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
                    <div className="absolute right-0 top-full mt-1 w-32 z-50 rounded-md border border-border bg-white dark:bg-zinc-950 py-1 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                      <button
                        onClick={openRenameModal}
                        className="flex w-full items-center px-3 py-2 text-sm text-fg hover:bg-muted transition-colors"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Rename
                      </button>
                      <button
                        onClick={openDeleteModal}
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

      {/* Rename Modal */}
      {isRenameModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-semibold text-fg mb-4">Rename Project</h3>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter project name..."
              className="mb-6"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsRenameModalOpen(false)}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-fg-muted hover:text-fg disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameSubmit}
                disabled={isLoading}
                className="flex items-center rounded-md bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 px-4 py-2 text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-semibold text-fg mb-2">Delete Project?</h3>
            <p className="text-sm text-fg-muted mb-4">
              Are you sure you want to delete <span className="font-semibold text-fg">"{project.title}"</span>? This action cannot be undone.
            </p>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-fg">
                Type <strong className="text-destructive font-bold">DELETE</strong> to confirm:
              </label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="border-destructive/50 focus-visible:ring-destructive"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && deleteConfirmText === "DELETE" && handleDeleteSubmit()}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-fg-muted hover:text-fg disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={isLoading || deleteConfirmText !== "DELETE"}
                className="flex items-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}