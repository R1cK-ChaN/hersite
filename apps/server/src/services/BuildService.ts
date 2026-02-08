import { spawn, type ChildProcess } from "child_process";
import path from "path";
import { createProxyMiddleware } from "http-proxy-middleware";
import type { Express } from "express";

let devProcess: ChildProcess | null = null;
let devServerUrl: string | null = null;
let devServerPort: number | null = null;

export const BuildService = {
  async startDevServer(projectPath: string): Promise<string> {
    // Stop any existing dev server
    await this.stopDevServer();

    // Install project dependencies first
    await this.installDeps(projectPath);

    return new Promise((resolve, reject) => {
      const proc = spawn("npx", ["astro", "dev", "--port", "0"], {
        cwd: projectPath,
        stdio: ["pipe", "pipe", "pipe"],
        shell: true,
        env: { ...process.env, FORCE_COLOR: "0" },
      });

      devProcess = proc;

      let output = "";
      const timeout = setTimeout(() => {
        reject(new Error("Astro dev server failed to start within 30s"));
      }, 30000);

      proc.stdout?.on("data", (data: Buffer) => {
        const text = data.toString();
        output += text;
        console.log(`[astro] ${text.trim()}`);

        // Parse the port from Astro's output
        const match = text.match(/localhost:(\d+)/);
        if (match && !devServerUrl) {
          const port = parseInt(match[1], 10);
          devServerPort = port;
          devServerUrl = `http://localhost:${port}`;
          clearTimeout(timeout);
          console.log(`Astro dev server running at ${devServerUrl}`);
          resolve(devServerUrl);
        }
      });

      proc.stderr?.on("data", (data: Buffer) => {
        const text = data.toString();
        // Astro sometimes outputs info to stderr
        console.log(`[astro:err] ${text.trim()}`);

        const match = text.match(/localhost:(\d+)/);
        if (match && !devServerUrl) {
          const port = parseInt(match[1], 10);
          devServerPort = port;
          devServerUrl = `http://localhost:${port}`;
          clearTimeout(timeout);
          console.log(`Astro dev server running at ${devServerUrl}`);
          resolve(devServerUrl);
        }
      });

      proc.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      proc.on("exit", (code) => {
        if (code !== 0 && !devServerUrl) {
          clearTimeout(timeout);
          reject(
            new Error(`Astro dev server exited with code ${code}: ${output}`)
          );
        }
        devProcess = null;
        devServerUrl = null;
        devServerPort = null;
      });
    });
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

  async stopDevServer(): Promise<void> {
    if (devProcess) {
      devProcess.kill("SIGTERM");
      devProcess = null;
      devServerUrl = null;
      devServerPort = null;
      // Give it a moment to shut down
      await new Promise((r) => setTimeout(r, 500));
    }
  },

  getDevServerUrl(): string | null {
    return devServerUrl;
  },

  setupPreviewProxy(app: Express): void {
    app.use(
      "/preview",
      (req, res, next) => {
        if (!devServerUrl) {
          res.status(503).json({ error: "Preview server not running" });
          return;
        }
        next();
      },
      createProxyMiddleware({
        target: "http://localhost:4321", // default, will be updated
        changeOrigin: true,
        pathRewrite: { "^/preview": "" },
        router: () => {
          return devServerUrl || "http://localhost:4321";
        },
        ws: true,
      })
    );
  },

  async buildProject(projectPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn("npx", ["astro", "build"], {
        cwd: projectPath,
        stdio: ["pipe", "pipe", "pipe"],
        shell: true,
      });

      let output = "";
      proc.stdout?.on("data", (data: Buffer) => {
        output += data.toString();
      });
      proc.stderr?.on("data", (data: Buffer) => {
        output += data.toString();
      });

      proc.on("exit", (code) => {
        if (code === 0) {
          resolve(path.join(projectPath, "dist"));
        } else {
          reject(new Error(`Build failed: ${output}`));
        }
      });

      proc.on("error", reject);
    });
  },
};
