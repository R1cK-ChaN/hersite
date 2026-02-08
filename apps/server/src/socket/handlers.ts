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
  socket: TypedSocket
): void {
  // Handle project creation
  socket.on("project:create", async (data) => {
    try {
      console.log("Creating project:", data);

      const project = await ProjectService.scaffoldProject(
        data.templateId as TemplateId,
        data.name,
        data.tagline
      );

      const projectPath = ProjectService.getProjectPath();
      if (!projectPath) throw new Error("Project path not found");

      // Initialize git repo
      await GitService.initRepo(projectPath);

      // Start Astro dev server
      const previewUrl = await BuildService.startDevServer(projectPath);
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
        }
      );

      socket.emit("agent:typing", false);
      socket.emit("agent:message", response);

      if (changedFiles.length > 0) {
        // Commit changes
        await GitService.commitChanges(
          `Update: ${changedFiles.join(", ")}`
        );
        socket.emit("preview:update", { changedFiles });
      }
    } catch (err) {
      console.error("Chat error:", err);
      socket.emit("agent:typing", false);
      socket.emit("agent:error", {
        error:
          err instanceof Error ? err.message : "Failed to process message",
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

      // Commit any pending changes
      await GitService.commitChanges("Pre-deploy commit");

      // Stop dev server before build
      await BuildService.stopDevServer();

      // Deploy
      const url = await DeployService.deploy(projectPath, io);
      ProjectService.setSiteUrl(url);

      // Restart dev server
      const previewUrl = await BuildService.startDevServer(projectPath);
      ProjectService.setPreviewUrl(previewUrl);
    } catch (err) {
      console.error("Deploy error:", err);
      socket.emit("deploy:status", {
        status: "failed",
        error: err instanceof Error ? err.message : "Deploy failed",
      });
    }
  });
}
