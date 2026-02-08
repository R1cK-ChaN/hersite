import { spawn, type ChildProcess } from "child_process";
import path from "path";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import type { Express } from "express";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

let devProcess: ChildProcess | null = null;
let devServerUrl: string | null = null;
let staticServePath: string | null = null;

export const BuildService = {
  /**
   * Start the preview — either spawns astro dev (local) or builds and
   * serves static files (production / cloud).
   */
  async startPreview(projectPath: string): Promise<string> {
    if (IS_PRODUCTION) {
      return this.buildAndServe(projectPath);
    }
    return this.startDevServer(projectPath);
  },

  // ─── Dev mode: spawn astro dev ──────────────────────────────────
  async startDevServer(projectPath: string): Promise<string> {
    await this.stopDevServer();
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

      const handleOutput = (data: Buffer) => {
        const text = data.toString();
        output += text;
        console.log(`[astro] ${text.trim()}`);

        const match = text.match(/localhost:(\d+)/);
        if (match && !devServerUrl) {
          devServerUrl = `http://localhost:${match[1]}`;
          clearTimeout(timeout);
          console.log(`Astro dev server running at ${devServerUrl}`);
          resolve(devServerUrl);
        }
      };

      proc.stdout?.on("data", handleOutput);
      proc.stderr?.on("data", handleOutput);

      proc.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      proc.on("exit", (code) => {
        if (code !== 0 && !devServerUrl) {
          clearTimeout(timeout);
          reject(
            new Error(`Astro dev server exited with code ${code}: ${output}`),
          );
        }
        devProcess = null;
        devServerUrl = null;
      });
    });
  },

  // ─── Production mode: build then serve static ───────────────────
  async buildAndServe(projectPath: string): Promise<string> {
    await this.installDeps(projectPath);
    await this.buildProject(projectPath);
    staticServePath = path.join(projectPath, "dist");
    console.log(`Serving static build from ${staticServePath}`);
    // The URL is relative — the proxy will serve it at /preview
    return "/preview";
  },

  /**
   * Rebuild after a file change (production mode).
   * Returns the dist path for the preview refresh.
   */
  async rebuild(projectPath: string): Promise<void> {
    console.log("[build] Rebuilding site...");
    const start = Date.now();
    await this.buildProject(projectPath);
    staticServePath = path.join(projectPath, "dist");
    console.log(`[build] Rebuild done in ${Date.now() - start}ms`);
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
      await new Promise((r) => setTimeout(r, 500));
    }
  },

  getDevServerUrl(): string | null {
    return devServerUrl;
  },

  /**
   * Set up the /preview route on the Express app.
   * In dev mode  → proxy to the Astro dev server.
   * In prod mode → serve static files from the dist/ folder.
   */
  setupPreviewProxy(app: Express): void {
    if (IS_PRODUCTION) {
      // Serve static build output
      app.use("/preview", (req, res, next) => {
        if (!staticServePath) {
          res.status(503).json({ error: "Site not built yet" });
          return;
        }
        express.static(staticServePath)(req, res, next);
      });
    } else {
      // Proxy to the Astro dev server
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
          target: "http://localhost:4321",
          changeOrigin: true,
          pathRewrite: { "^/preview": "" },
          router: () => devServerUrl || "http://localhost:4321",
          ws: true,
        }),
      );
    }
  },

  async buildProject(projectPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn("npx", ["astro", "build"], {
        cwd: projectPath,
        stdio: ["pipe", "pipe", "pipe"],
        shell: true,
      });

      let output = "";
      proc.stdout?.on("data", (d: Buffer) => {
        output += d.toString();
      });
      proc.stderr?.on("data", (d: Buffer) => {
        output += d.toString();
      });

      proc.on("exit", (code) => {
        if (code === 0) resolve(path.join(projectPath, "dist"));
        else reject(new Error(`Build failed: ${output}`));
      });

      proc.on("error", reject);
    });
  },

  isProduction(): boolean {
    return IS_PRODUCTION;
  },
};
