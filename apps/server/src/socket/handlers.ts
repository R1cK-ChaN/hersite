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

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function registerSocketHandlers(
  io: TypedServer,
  socket: TypedSocket,
): void {
  // Handle project creation
  socket.on("project:create", async (data) => {
    try {
      console.log("Creating project:", data);

      const project = await ProjectService.scaffoldProject(
        data.templateId as TemplateId,
        data.name,
        data.tagline,
      );

      const projectPath = ProjectService.getProjectPath();
      if (!projectPath) throw new Error("Project path not found");

      // Initialize git repo (+ optional remote)
      await GitService.initRepo(projectPath);

      // Start preview (dev server or build+serve depending on NODE_ENV)
      const previewUrl = await BuildService.startPreview(projectPath);
      ProjectService.setPreviewUrl(previewUrl);

      // Update project info with preview URL
      project.previewUrl = previewUrl;

      socket.emit("project:created", project);
      console.log("Project created successfully:", project.id);
    } catch (err) {
      console.error("Project creation error:", err);
      socket.emit("agent:error", {
        error: err instanceof Error ? err.message : "Failed to create project",
      });
    }
  });

  // Handle chat messages
  socket.on("chat:message", async (data) => {
    try {
      socket.emit("agent:typing", true);

      const { response, changedFiles } = await AgentService.processMessage(
        data.content,
        data.attachments,
        (chunk, messageId) => {
          socket.emit("agent:stream", { messageId, chunk });
        },
      );

      socket.emit("agent:typing", false);
      socket.emit("agent:message", response);

      if (changedFiles.length > 0) {
        // Commit and push changes (push only if remote is configured)
        await GitService.commitAndPush(`Update: ${changedFiles.join(", ")}`);

        // In production mode, rebuild the static site
        if (BuildService.isProduction()) {
          const projectPath = ProjectService.getProjectPath();
          if (projectPath) {
            await BuildService.rebuild(projectPath);
          }
        }

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

  // Handle publish
  socket.on("publish:confirm", async () => {
    try {
      const projectPath = ProjectService.getProjectPath();
      if (!projectPath) {
        socket.emit("agent:error", { error: "No active project" });
        return;
      }

      // Commit and push any pending changes
      await GitService.commitAndPush("Pre-deploy commit");

      // Deploy (builds internally via Vercel API)
      const url = await DeployService.deploy(projectPath, io);
      ProjectService.setSiteUrl(url);
    } catch (err) {
      console.error("Deploy error:", err);
      socket.emit("deploy:status", {
        status: "failed",
        error: err instanceof Error ? err.message : "Deploy failed",
      });
    }
  });
}
