import { notFound } from "next/navigation";
import { projectSchema } from "@/lib/schemas/project";
import { getProjectById } from "@/services/projectService";
import { requireSession } from "@/lib/session";
import { CommandCenter } from "@/components/workspace/CommandCenter";


export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) {
    notFound();
  }

  return <CommandCenter project={project} />;
}
