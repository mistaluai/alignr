import { requireSession } from "@/lib/session";
import { getUserProjects } from "@/services/userService";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { NewProjectDialog } from "@/components/dashboard/NewProjectDialog";
import { FolderOpen } from "lucide-react";

export default async function DashboardPage() {
  const session = await requireSession();
  const projects = await getUserProjects(session.userId);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-fg">Your Projects</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {projects.length === 0
              ? "Create your first project to get started"
              : `${projects.length} project${projects.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <NewProjectDialog />
      </div>

      {/* Project Grid */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 animate-fade-in">
          <FolderOpen className="h-12 w-12 text-fg-muted/40 mb-4" />
          <p className="text-fg-muted text-sm">No projects yet</p>
          <p className="text-fg-muted/60 text-xs mt-1">
            Click "New Project" to begin your journey
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
