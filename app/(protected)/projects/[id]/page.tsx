import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/db/mongodb";
import { projectSchema } from "@/lib/schemas/project";
import { requireSession } from "@/lib/session";
import { CommandCenter } from "@/components/workspace/CommandCenter";

const DB_NAME = process.env.DB_NAME || "alignr_data";

async function getProject(id: string) {
  if (!ObjectId.isValid(id)) return null;

  const client = await clientPromise;
  const db = client.db(DB_NAME);
  const doc = await db
    .collection("projects")
    .findOne({ _id: new ObjectId(id) });

  if (!doc) return null;

  const formatted = {
    ...doc,
    _id: doc._id.toString(),
    userId: doc.userId.toString(),
  };

  try {
    return projectSchema.parse(formatted);
  } catch {
    return null;
  }
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  return <CommandCenter project={project} />;
}
