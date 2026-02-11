import { v4 as uuid } from "uuid";
import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  TemplateId,
} from "@hersite/shared";
import { ProjectService } from "../services/ProjectService.js";
import { BuildService } from "../services/BuildService.js";
import { AgentService } from "../services/agent/AgentService.js";
import { DeployService } from "../services/DeployService.js";
import { GitService } from "../services/GitService.js";
import { DatabaseService } from "../services/DatabaseService.js";

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const INVITE_TOKEN = process.env.INVITE_TOKEN || "";

export function registerSocketHandlers(
  io: TypedServer,
  socket: TypedSocket,
): void {
  // Track authenticated userId for this socket connection
  let authenticatedUserId: string | null = null;

  // ─── Auth ─────────────────────────────────────────────────

  socket.on("auth:validate", (data, callback) => {
    try {
      const { token } = data;

      if (!INVITE_TOKEN) {
        // No invite token configured — reject all
        callback({ success: false, error: "Server not configured for auth" });
        return;
      }

      if (token !== INVITE_TOKEN) {
        callback({ success: false, error: "Invalid invite token" });
        return;
      }

      // Check if a user already exists for this token
      let user = DatabaseService.getUserByToken(token);
      if (!user) {
        // First time — create user
        const userId = uuid();
        DatabaseService.createUser(userId, token);
        user = { id: userId };
        console.log(`New user created: ${userId}`);
      }

      authenticatedUserId = user.id;

      // Join the user's room for targeted events
      socket.join(user.id);

      // Check if user has an existing project
      const existingProject = DatabaseService.getProjectByUserId(user.id);
      if (existingProject) {
        // Set preview URL based on userId
        existingProject.previewUrl = `/preview/${user.id}/`;
        callback({ success: true, userId: user.id });
        // Notify client about existing project
        socket.emit("project:restored", existingProject);
      } else {
        callback({ success: true, userId: user.id });
      }

      console.log(`User ${user.id} authenticated via socket ${socket.id}`);
    } catch (err) {
      console.error("Auth error:", err);
      callback({
        success: false,
        error: err instanceof Error ? err.message : "Auth failed",
      });
    }
  });

  // ─── Project Creation ─────────────────────────────────────

  socket.on("project:create", async (data) => {
    if (!authenticatedUserId) {
      socket.emit("agent:error", { error: "Not authenticated" });
      return;
    }

    const userId = authenticatedUserId;

    try {
      console.log(`Creating project for user ${userId}:`, data);

      const project = await ProjectService.scaffoldProject(
        userId,
        data.templateId as TemplateId,
        data.name,
        data.tagline,
      );

      // Initialize git repo
      await GitService.initRepo(userId);

      // Build static preview
      await BuildService.buildForPreview(userId, io);

      // Set preview URL
      const previewUrl = `/preview/${userId}/`;
      ProjectService.setPreviewUrl(userId, previewUrl);
      project.previewUrl = previewUrl;

      socket.emit("project:created", project);
      console.log(`Project created for user ${userId}: ${project.id}`);
    } catch (err) {
      console.error("Project creation error:", err);
      socket.emit("agent:error", {
        error: err instanceof Error ? err.message : "Failed to create project",
      });
    }
  });

  // ─── Chat Messages ────────────────────────────────────────

  socket.on("chat:message", async (data) => {
    if (!authenticatedUserId) {
      socket.emit("agent:error", { error: "Not authenticated" });
      return;
    }

    const userId = authenticatedUserId;

    try {
      socket.emit("agent:typing", true);

      const { response, changedFiles } = await AgentService.processMessage(
        userId,
        data.content,
        data.attachments,
        (chunk, messageId) => {
          socket.emit("agent:stream", { messageId, chunk });
        },
      );

      socket.emit("agent:typing", false);
      socket.emit("agent:message", response);

      // Persist chat messages
      DatabaseService.saveChatMessage(userId, {
        id: uuid(),
        role: "user",
        content: data.content,
        timestamp: Date.now(),
        status: "complete",
      });
      DatabaseService.saveChatMessage(userId, response);

      if (changedFiles.length > 0) {
        // Commit changes
        await GitService.commitAndPush(
          userId,
          `Update: ${changedFiles.join(", ")}`,
        );

        // Rebuild static preview
        await BuildService.buildForPreview(userId, io);

        socket.emit("preview:update", { changedFiles });
      }
    } catch (err) {
      console.error("Chat error:", err);
      socket.emit("agent:typing", false);
      socket.emit("agent:error", {
        error: err instanceof Error ? err.message : "Failed to process message",
      });
    }
  });

  // ─── Publish / Deploy ─────────────────────────────────────

  socket.on("publish:confirm", async () => {
    if (!authenticatedUserId) {
      socket.emit("agent:error", { error: "Not authenticated" });
      return;
    }

    const userId = authenticatedUserId;

    try {
      // Commit any pending changes
      await GitService.commitAndPush(userId, "Pre-deploy commit");

      // Deploy (builds for production internally)
      const distPath = await BuildService.buildForDeploy(userId);
      const url = await DeployService.deploy(distPath, io);
      ProjectService.setSiteUrl(userId, url);
    } catch (err) {
      console.error("Deploy error:", err);
      socket.emit("deploy:status", {
        status: "failed",
        error: err instanceof Error ? err.message : "Deploy failed",
      });
    }
  });
}
