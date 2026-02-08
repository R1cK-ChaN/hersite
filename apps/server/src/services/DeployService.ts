import { spawn } from "child_process";
import { BuildService } from "./BuildService.js";
import type { Server } from "socket.io";
import type { ServerToClientEvents, ClientToServerEvents } from "@hersite/shared";

export const DeployService = {
  async deploy(
    projectPath: string,
    io: Server<ClientToServerEvents, ServerToClientEvents>
  ): Promise<string> {
    // Step 1: Build the project
    io.emit("deploy:status", { status: "deploying" });

    let distPath: string;
    try {
      distPath = await BuildService.buildProject(projectPath);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      io.emit("deploy:status", { status: "failed", error });
      throw err;
    }

    // Step 2: Deploy with Vercel CLI
    return new Promise((resolve, reject) => {
      const proc = spawn(
        "npx",
        ["vercel", "deploy", "--prod", "--yes", distPath],
        {
          cwd: projectPath,
          stdio: ["pipe", "pipe", "pipe"],
          shell: true,
          env: {
            ...process.env,
            FORCE_COLOR: "0",
          },
        }
      );

      let output = "";

      proc.stdout?.on("data", (data: Buffer) => {
        const text = data.toString().trim();
        output += text;
        console.log(`[vercel] ${text}`);
      });

      proc.stderr?.on("data", (data: Buffer) => {
        const text = data.toString().trim();
        console.log(`[vercel:err] ${text}`);
      });

      proc.on("exit", (code) => {
        if (code === 0) {
          // Parse the deployment URL from vercel output
          const urlMatch = output.match(/(https:\/\/[^\s]+\.vercel\.app)/);
          const url = urlMatch ? urlMatch[1] : output.trim();

          io.emit("deploy:status", { status: "deployed", url });
          resolve(url);
        } else {
          const error = `Vercel deploy failed with code ${code}`;
          io.emit("deploy:status", { status: "failed", error });
          reject(new Error(error));
        }
      });

      proc.on("error", (err) => {
        io.emit("deploy:status", {
          status: "failed",
          error: err.message,
        });
        reject(err);
      });
    });
  },
};
