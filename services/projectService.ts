import { ObjectId } from "mongodb";
import clientPromise from "../lib/db/mongodb";
import { saveStagePayloadSchema, SaveStagePayload } from "../lib/schemas/stages/save-stage";
import { Project, projectSchema } from "../lib/schemas/project";

const DB_NAME = process.env.DB_NAME || "alignr_data";

export async function saveAgentStage(payload: SaveStagePayload): Promise<Project> {
  // Validate incoming payload
  const validatedPayload = saveStagePayloadSchema.parse(payload);
  const { projectId, stage, finalOutput } = validatedPayload;

  const client = await clientPromise;
  const db = client.db(DB_NAME);

  // Prepare the update object based on the stage
  const updateData: Record<string, any> = {
    updatedAt: new Date(),
  };

  switch (stage) {
    case "discovery":
      updateData.businessBrief = finalOutput.brief;
      break;
    case "architectural_design":
      updateData.architectureBlueprint = finalOutput;
      break;
    case "visual_prototyping":
      updateData.uiPrototypes = finalOutput;
      break;
    case "evaluation":
      updateData.executionPackage = finalOutput;
      break;
    case "complete":
      // Add custom finalization logic if needed
      break;
  }

  const result = await db.collection("projects").updateOne(
    { _id: new ObjectId(projectId) },
    { $set: updateData }
  );

  if (result.matchedCount === 0) {
    throw new Error("Project not found");
  }

  const projectDoc = await db.collection("projects").findOne({ _id: new ObjectId(projectId) });
  if (!projectDoc) throw new Error("Failed to retrieve updated project");

  const formattedProject = {
    ...projectDoc,
    userId: projectDoc.userId.toString(),
    _id: projectDoc._id.toString(),
  };

  return projectSchema.parse(formattedProject);
}
