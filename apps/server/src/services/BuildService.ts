import { spawn } from "child_process";
import path from "path";
import express from "express";
import type { Express } from "express";
import type { Server } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@hersite/shared";
import { ProjectService } from "./ProjectService.js";

const SITES_DIR =
  process.env.SITES_DIR ||
  path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    "../../../sites",
  );

export const BuildService = {
  /**
   * Build a user's site for preview.
   * Runs `astro build` outputting to dist/preview/.
   * Emits `preview:rebuilt` to the user's Socket.IO room when done.
   */
  async buildForPreview(
    userId: string,
    io?: Server<ClientToServerEvents, ServerToClientEvents>,
  ): Promise<void> {
    const projectPath = ProjectService.getProjectPath(userId);
    console.log(`[build] Building preview for user ${userId}...`);
    const start = Date.now();

    await this.installDeps(projectPath);
    await this.runAstroBuild(projectPath, "dist/preview");

    console.log(`[build] Preview built in ${Date.now() - start}ms`);

    if (io) {
      io.to(userId).emit("preview:rebuilt");
    }
  },

  /**
   * Build a user's site for production deployment.
   * Runs `astro build` outputting to dist/prod/.
   * Returns the path to the dist directory.
   */
  async buildForDeploy(userId: string): Promise<string> {
    const projectPath = ProjectService.getProjectPath(userId);
    console.log(`[build] Building for deploy, user ${userId}...`);
    const start = Date.now();

    await this.installDeps(projectPath);
    const distPath = await this.runAstroBuild(projectPath, "dist/prod");

    console.log(`[build] Deploy build done in ${Date.now() - start}ms`);
    return distPath;
  },

  async installDeps(projectPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn("npm", ["install"], {
        cwd: projectPath,
        stdio: ["pipe", "pipe", "pipe"],
        shell: true,
      });
      proc.on("exit", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`npm install failed with code ${code}`));
      });
      proc.on("error", reject);
    });
  },

  /**
   * Run `astro build` with a custom output directory.
   */
  async runAstroBuild(projectPath: string, outDir: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn("npx", ["astro", "build", "--outDir", outDir], {
        cwd: projectPath,
        stdio: ["pipe", "pipe", "pipe"],
        shell: true,
        env: { ...process.env, FORCE_COLOR: "0" },
      });

      let output = "";
      proc.stdout?.on("data", (d: Buffer) => {
        output += d.toString();
      });
      proc.stderr?.on("data", (d: Buffer) => {
        output += d.toString();
      });

      proc.on("exit", (code) => {
        if (code === 0) resolve(path.join(projectPath, outDir));
        else reject(new Error(`Build failed: ${output}`));
      });

      proc.on("error", reject);
    });
  },

  /**
   * Set up the /preview/:userId/* route on the Express app.
   * Serves static files from each user's dist/preview/ directory.
   */
  setupPreviewRoutes(app: Express): void {
    app.use("/preview/:userId", (req, res, next) => {
      const { userId } = req.params;
      const previewDir = path.join(SITES_DIR, userId, "dist", "preview");
      express.static(previewDir)(req, res, next);
    });
  },
};
