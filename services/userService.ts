import { ObjectId } from "mongodb";
import clientPromise from "../lib/db/mongodb";
import { User, userSchema } from "../lib/schemas/user";
import { Project, projectSchema } from "../lib/schemas/project";

import bcrypt from "bcrypt";

const DB_NAME = process.env.DB_NAME || "alignr_data";

export async function createUser(email: string, passwordPlain: string): Promise<User> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const existingUser = await db.collection("users").findOne({ email });
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(passwordPlain, saltRounds);

  const result = await db.collection("users").insertOne({
    email,
    passwordHash,
    createdAt: new Date(),
  });

  const userDoc = await db.collection("users").findOne({ _id: result.insertedId });
  if (!userDoc) throw new Error("Failed to create user");

  const user = {
    ...userDoc,
    _id: userDoc._id.toString(),
  };

  return userSchema.parse(user);
}

export async function loginUser(email: string, passwordPlain: string): Promise<User> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  const userDoc = await db.collection("users").findOne({ email });
  if (!userDoc) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(passwordPlain, userDoc.passwordHash);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  const user = {
    ...userDoc,
    _id: userDoc._id.toString(),
  };

  return userSchema.parse(user);
}

export async function getUserProjects(userId: string): Promise<Project[]> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  if (!ObjectId.isValid(userId)) {
    throw new Error("Invalid User ID");
  }

  const projects = await db.collection("projects").find({ userId: new ObjectId(userId) }).toArray();

  return projects.map((p) => {
    const formattedProject = {
      ...p,
      userId: p.userId.toString(),
      _id: p._id.toString(),
    };
    return projectSchema.parse(formattedProject);
  });
}

export async function createProject(userId: string, title: string): Promise<Project> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);

  if (!ObjectId.isValid(userId)) {
    throw new Error("Invalid User ID");
  }

  const newProject = {
    userId: new ObjectId(userId),
    title,
    currentStage: "discovery",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("projects").insertOne(newProject);

  const projectDoc = await db.collection("projects").findOne({ _id: result.insertedId });
  if (!projectDoc) throw new Error("Failed to create project");

  const formattedProject = {
    ...projectDoc,
    userId: projectDoc.userId.toString(),
    _id: projectDoc._id.toString(),
  };

  return projectSchema.parse(formattedProject);
}
