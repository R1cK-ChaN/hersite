import path from "path";
import fs from "fs/promises";
import { v4 as uuid } from "uuid";
import { fileURLToPath } from "url";
import type { ProjectInfo, TemplateId } from "@hersite/shared";
import { DatabaseService } from "./DatabaseService.js";
import {
  copyDir,
  ensureDir,
  listFilesRecursive,
  readFileContent,
  writeFileContent,
} from "../utils/fileUtils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITES_DIR =
  process.env.SITES_DIR || path.resolve(__dirname, "../../../sites");
const TEMPLATES_DIR =
  process.env.TEMPLATES_DIR || path.resolve(__dirname, "../../../templates");

export const ProjectService = {
  /** Get the base directory for a user's project files. */
  getProjectPath(userId: string): string {
    return path.join(SITES_DIR, userId);
  },

  /** Get the dist/preview directory for a user's built preview. */
  getPreviewDistPath(userId: string): string {
    return path.join(SITES_DIR, userId, "dist", "preview");
  },

  async scaffoldProject(
    userId: string,
    templateId: TemplateId,
    name: string,
    tagline?: string,
    profilePhotoPath?: string,
  ): Promise<ProjectInfo> {
    const projectId = uuid();
    const projectPath = this.getProjectPath(userId);
    const templatePath = path.join(TEMPLATES_DIR, templateId);

    // Copy template to user's project directory
    await copyDir(templatePath, projectPath);

    // Personalize the site
    await this.personalizeSite(projectPath, name, tagline || "");

    // Copy profile photo if provided
    if (profilePhotoPath) {
      const publicDir = path.join(projectPath, "public/images");
      await ensureDir(publicDir);
      await fs.copyFile(profilePhotoPath, path.join(publicDir, "profile.jpg"));
    }

    const project: ProjectInfo = {
      id: projectId,
      userId,
      name,
      tagline: tagline || "",
      templateId,
      hasUnpublishedChanges: false,
    };

    // Persist to DB
    DatabaseService.saveProject(project);

    return project;
  },

  async personalizeSite(
    projectPath: string,
    name: string,
    tagline: string,
  ): Promise<void> {
    // Update the index page with the user's name and tagline
    const indexPath = path.join(projectPath, "src/pages/index.astro");
    try {
      let content = await readFileContent(indexPath);
      content = content.replace(
        /My Personal Site|My Blog|My Portfolio|My Site/g,
        name,
      );
      content = content.replace(
        /Welcome to my.*?[.!]/s,
        tagline || `Welcome to ${name}'s website!`,
      );
      await writeFileContent(indexPath, content);
    } catch {
      // Index might not exist in all templates at this exact path
    }

    // Update astro config site name
    const configPath = path.join(projectPath, "astro.config.mjs");
    try {
      let config = await readFileContent(configPath);
      config = config.replace(
        "site: 'https://example.com'",
        `site: 'https://example.com'`,
      );
      await writeFileContent(configPath, config);
    } catch {
      // Config might vary
    }
  },

  async getProjectState(userId: string): Promise<{
    project: ProjectInfo | null;
    files: string[];
    pages: string[];
    themeVariables: Record<string, string>;
  }> {
    const project = DatabaseService.getProjectByUserId(userId);
    if (!project) {
      return { project: null, files: [], pages: [], themeVariables: {} };
    }

    const projectPath = this.getProjectPath(userId);

    let files: string[] = [];
    try {
      files = await listFilesRecursive(projectPath);
    } catch {
      // Project directory might not exist yet
    }

    const pages = files.filter(
      (f) => f.startsWith("src/pages/") && f.endsWith(".astro"),
    );

    let themeVariables: Record<string, string> = {};
    try {
      const themeContent = await readFileContent(
        path.join(projectPath, "src/styles/theme.css"),
      );
      const matches = themeContent.matchAll(/--([\w-]+):\s*([^;]+);/g);
      for (const match of matches) {
        themeVariables[`--${match[1]}`] = match[2].trim();
      }
    } catch {
      // No theme file
    }

    return {
      project,
      files,
      pages,
      themeVariables,
    };
  },

  async getFileContent(userId: string, relativePath: string): Promise<string> {
    const projectPath = this.getProjectPath(userId);
    const resolved = path.resolve(projectPath, relativePath);
    if (!resolved.startsWith(projectPath)) {
      throw new Error("Invalid file path");
    }
    return readFileContent(resolved);
  },

  async writeFile(
    userId: string,
    relativePath: string,
    content: string,
  ): Promise<void> {
    const projectPath = this.getProjectPath(userId);
    const resolved = path.resolve(projectPath, relativePath);
    if (!resolved.startsWith(projectPath)) {
      throw new Error("Invalid file path");
    }
    await writeFileContent(resolved, content);

    // Mark unpublished changes in DB
    const project = DatabaseService.getProjectByUserId(userId);
    if (project) {
      DatabaseService.updateProjectField(
        project.id,
        "has_unpublished_changes",
        1,
      );
    }
  },

  async deleteFile(userId: string, relativePath: string): Promise<void> {
    const projectPath = this.getProjectPath(userId);
    const resolved = path.resolve(projectPath, relativePath);
    if (!resolved.startsWith(projectPath)) {
      throw new Error("Invalid file path");
    }
    await fs.unlink(resolved);

    const project = DatabaseService.getProjectByUserId(userId);
    if (project) {
      DatabaseService.updateProjectField(
        project.id,
        "has_unpublished_changes",
        1,
      );
    }
  },

  setPreviewUrl(userId: string, url: string): void {
    const project = DatabaseService.getProjectByUserId(userId);
    if (project) {
      DatabaseService.updateProjectField(project.id, "preview_url", url);
    }
  },

  setSiteUrl(userId: string, url: string): void {
    const project = DatabaseService.getProjectByUserId(userId);
    if (project) {
      DatabaseService.updateProjectField(project.id, "site_url", url);
      DatabaseService.updateProjectField(
        project.id,
        "last_deployed_at",
        Date.now(),
      );
      DatabaseService.updateProjectField(
        project.id,
        "has_unpublished_changes",
        0,
      );
    }
  },
};
