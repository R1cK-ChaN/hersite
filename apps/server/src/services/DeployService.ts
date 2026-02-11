import fs from "fs/promises";
import path from "path";
import { listFilesRecursive } from "../utils/fileUtils.js";
import type { Server } from "socket.io";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "@hersite/shared";

interface VercelFile {
  file: string;
  data: string; // base64
}

export const DeployService = {
  /**
   * Deploy pre-built static files to Vercel.
   * @param distPath - Path to the built dist directory (already built)
   * @param io - Socket.IO server for status updates
   */
  async deploy(
    distPath: string,
    io: Server<ClientToServerEvents, ServerToClientEvents>,
  ): Promise<string> {
    const token = process.env.VERCEL_TOKEN;
    if (!token) {
      const error =
        "VERCEL_TOKEN not set. Add it to .env to enable deployment.";
      io.emit("deploy:status", { status: "failed", error });
      throw new Error(error);
    }

    io.emit("deploy:status", { status: "deploying" });

    try {
      const files = await listFilesRecursive(distPath);
      const vercelFiles: VercelFile[] = [];

      for (const relativePath of files) {
        const fullPath = path.join(distPath, relativePath);
        const content = await fs.readFile(fullPath);
        vercelFiles.push({
          file: relativePath,
          data: content.toString("base64"),
        });
      }

      const projectName = process.env.VERCEL_PROJECT_NAME || "hersite";

      const response = await fetch("https://api.vercel.com/v13/deployments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: projectName,
          files: vercelFiles.map((f) => ({
            file: f.file,
            data: f.data,
            encoding: "base64",
          })),
          target: "production",
          projectSettings: {
            framework: null, // pre-built static files
          },
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        const error = `Vercel API error ${response.status}: ${body}`;
        io.emit("deploy:status", { status: "failed", error });
        throw new Error(error);
      }

      const result = (await response.json()) as {
        url?: string;
        alias?: string[];
        readyState?: string;
      };
      const url = result.alias?.[0]
        ? `https://${result.alias[0]}`
        : result.url
          ? `https://${result.url}`
          : "";

      io.emit("deploy:status", { status: "deployed", url });
      console.log(`Deployed to: ${url}`);
      return url;
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("Vercel API error")) {
        throw err;
      }
      const error = err instanceof Error ? err.message : String(err);
      io.emit("deploy:status", { status: "failed", error });
      throw err;
    }
  },
};
