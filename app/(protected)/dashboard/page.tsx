import { Suspense } from "react";
import { requireSession } from "@/lib/session";
import { getUserProjects } from "@/services/userService";
import { NewProjectDialog } from "@/components/dashboard/NewProjectDialog";
import { ProjectGridSkeleton } from "@/components/dashboard/ProjectGridSkeleton";
import { ProjectList } from "@/components/dashboard/ProjectList";

// Separate the fetching logic into its own async component
async function ProjectDataFetcher() {
  const session = await requireSession();
  const projects = await getUserProjects(session.userId);

  return <ProjectList projects={projects} />;
}

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-fg">Your Projects</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Manage and track your ongoing work
          </p>
        </div>
        <NewProjectDialog />
      </div>

      {/* 
        Suspense catches the loading state of ProjectDataFetcher 
        and shows the skeleton loader
      */}
      <Suspense fallback={<ProjectGridSkeleton />}>
        <ProjectDataFetcher />
      </Suspense>
    </div>
  );
}
