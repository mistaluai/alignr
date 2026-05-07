"use client";

import { useState } from "react";
import { ProjectCard } from "./ProjectCard";
import { FolderOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatStageName } from "@/lib/utils";
import type { Project } from "@/lib/schemas/project";

interface ProjectListProps {
    projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [stageFilter, setStageFilter] = useState("All");

    // Derive unique raw stages from the projects for the filter dropdown
    const stages = ["All", ...Array.from(new Set(projects.map((p) => p.currentStage)))];

    const filteredProjects = projects.filter((project) => {
        const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStage = stageFilter === "All" || project.currentStage === stageFilter;
        return matchesSearch && matchesStage;
    });

    if (projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 animate-fade-in">
                <FolderOpen className="h-12 w-12 text-fg-muted/40 mb-4" />
                <p className="text-fg-muted text-sm">No projects yet</p>
                <p className="text-fg-muted/60 text-xs mt-1">
                    Click "New Project" to begin your journey
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted" />
                    <Input
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <select
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    className="flex h-10 w-full sm:w-[180px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-fg"
                >
                    {stages.map((stage) => (
                        <option key={stage} value={stage}>
                            {formatStageName(stage)}
                        </option>
                    ))}
                </select>
            </div>

            {/* Grid */}
            {filteredProjects.length === 0 ? (
                <div className="py-12 text-center text-sm text-fg-muted">
                    No projects match your search criteria.
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProjects.map((project) => (
                        <ProjectCard key={project._id} project={project} />
                    ))}
                </div>
            )}
        </div>
    );
}