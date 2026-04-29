import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, ServerApiVersion } from "mongodb";

// Global variable strictly for Jest tests to mock client resolution
declare global {
  var __MONGO_RESOLVE__: (client: MongoClient) => void;
}

let mongoServer: MongoMemoryServer;
let mongoClient: MongoClient;

// Mock the mongodb module before importing the services
jest.mock("../lib/db/mongodb", () => {
  return {
    __esModule: true,
    default: new Promise((resolve) => {
      global.__MONGO_RESOLVE__ = resolve;
    }),
  };
});

import { createUser, loginUser, getUserProjects, createProject } from "../services/userService";
import { saveAgentStage } from "../services/projectService";
import { SaveStagePayload } from "../lib/schemas/stages/save-stage";

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  mongoClient = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  await mongoClient.connect();
  global.__MONGO_RESOLVE__(mongoClient);
}, 60000);

afterAll(async () => {
  await mongoClient.close();
  await mongoServer.stop();
});

afterEach(async () => {
  const db = mongoClient.db("alignr");
  await db.collection("users").deleteMany({});
  await db.collection("projects").deleteMany({});
});

describe("UserService", () => {
  describe("createUser", () => {
    it("should create a user successfully", async () => {
      const user = await createUser("test@example.com", "mySecretPass");
      expect(user).toHaveProperty("_id");
      expect(user.email).toBe("test@example.com");
      expect(user).toHaveProperty("passwordHash");
      expect(user.passwordHash).not.toBe("mySecretPass");
    });

    it("should throw error if email already exists", async () => {
      await createUser("duplicate@example.com", "mySecretPass");
      await expect(
        createUser("duplicate@example.com", "anotherPass")
      ).rejects.toThrow("User with this email already exists");
    });
  });

  describe("loginUser", () => {
    it("should login user with correct credentials", async () => {
      await createUser("login@example.com", "mySecretPass");
      const user = await loginUser("login@example.com", "mySecretPass");
      expect(user.email).toBe("login@example.com");
    });

    it("should throw error with incorrect password", async () => {
      await createUser("wrongpass@example.com", "mySecretPass");
      await expect(
        loginUser("wrongpass@example.com", "wrong")
      ).rejects.toThrow("Invalid password");
    });

    it("should throw error if user not found", async () => {
      await expect(loginUser("notfound@example.com", "mySecretPass")).rejects.toThrow("User not found");
    });
  });

  describe("Projects", () => {
    it("should create a project successfully", async () => {
      const user = await createUser("project@example.com", "mySecretPass");
      const project = await createProject(user._id, "My AI App");
      expect(project).toHaveProperty("_id");
      expect(project.userId).toBe(user._id);
      expect(project.title).toBe("My AI App");
      expect(project.currentStage).toBe("discovery");
    });

    it("should get user projects", async () => {
      const user = await createUser("multi@example.com", "mySecretPass");
      await createProject(user._id, "Project 1");
      await createProject(user._id, "Project 2");

      const projects = await getUserProjects(user._id);
      expect(projects).toHaveLength(2);
      expect(projects[0].title).toBe("Project 1");
      expect(projects[1].title).toBe("Project 2");
    });

    it("should return empty array if no projects found", async () => {
      const projects = await getUserProjects("nonexistent_id");
      expect(projects).toHaveLength(0);
    });
  });
});

describe("ProjectService", () => {
  describe("saveAgentStage", () => {
    it("should save the business analyst discovery stage output", async () => {
      const user = await createUser("save@example.com", "mySecretPass");
      const project = await createProject(user._id, "Test Save Project");

      const payload: SaveStagePayload = {
        projectId: project._id,
        stage: "discovery",
        finalOutput: {
          brief: { content: "This is a flexible markdown brief." },
          questions: {
            questions: [
              {
                question: "What is your target audience?",
                type: "textarea",
              },
            ],
          },
        },
      };

      const updatedProject = await saveAgentStage(payload);
      expect(updatedProject.businessBrief?.content).toBe("This is a flexible markdown brief.");
      expect((updatedProject as any).interviewQuestions).toBeUndefined(); // Verify it was removed from schema
    });

    it("should throw validation error if payload is invalid", async () => {
      const user = await createUser("invalid@example.com", "mySecretPass");
      const project = await createProject(user._id, "Invalid Project");

      const invalidPayload = {
        projectId: project._id,
        stage: "discovery",
        finalOutput: {
          brief: { wrongKey: "test" }, // Invalid according to Zod
        },
      } as any;

      await expect(saveAgentStage(invalidPayload)).rejects.toThrow();
    });

    it("should throw error if project not found", async () => {
      const payload: SaveStagePayload = {
        projectId: "000000000000000000000000",
        stage: "discovery",
        finalOutput: {
          brief: { content: "test" },
        },
      };

      await expect(saveAgentStage(payload)).rejects.toThrow("Project not found");
    });
  });
});
