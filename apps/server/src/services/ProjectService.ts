import path from "path";
import fs from "fs/promises";
import { v4 as uuid } from "uuid";
import { fileURLToPath } from "url";
import type { ProjectInfo, TemplateId } from "@hersite/shared";
import {
  copyDir,
  ensureDir,
  listFilesRecursive,
  readFileContent,
  writeFileContent,
} from "../utils/fileUtils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECTS_DIR =
  process.env.PROJECTS_DIR || path.resolve(__dirname, "../../../projects");
const TEMPLATES_DIR =
  process.env.TEMPLATES_DIR || path.resolve(__dirname, "../../../templates");

let currentProject: ProjectInfo | null = null;
let currentProjectPath: string | null = null;

export const ProjectService = {
  async scaffoldProject(
    templateId: TemplateId,
    name: string,
    tagline?: string,
    profilePhotoPath?: string,
  ): Promise<ProjectInfo> {
    const projectId = uuid();
    const projectPath = path.join(PROJECTS_DIR, projectId);
    const templatePath = path.join(TEMPLATES_DIR, templateId);

    // Copy template to project directory
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
      name,
      tagline: tagline || "",
      templateId,
      hasUnpublishedChanges: false,
    };

    currentProject = project;
    currentProjectPath = projectPath;

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

  async getProjectState(): Promise<{
    project: ProjectInfo | null;
    files: string[];
    pages: string[];
    themeVariables: Record<string, string>;
  }> {
    if (!currentProject || !currentProjectPath) {
      return { project: null, files: [], pages: [], themeVariables: {} };
    }

    const files = await listFilesRecursive(currentProjectPath);
    const pages = files.filter(
      (f) => f.startsWith("src/pages/") && f.endsWith(".astro"),
    );

    let themeVariables: Record<string, string> = {};
    try {
      const themeContent = await readFileContent(
        path.join(currentProjectPath, "src/styles/theme.css"),
      );
      const matches = themeContent.matchAll(/--([\w-]+):\s*([^;]+);/g);
      for (const match of matches) {
        themeVariables[`--${match[1]}`] = match[2].trim();
      }
    } catch {
      // No theme file
    }

    return {
      project: currentProject,
      files,
      pages,
      themeVariables,
    };
  },

  async getFileContent(relativePath: string): Promise<string> {
    if (!currentProjectPath) throw new Error("No active project");
    // Prevent path traversal
    const resolved = path.resolve(currentProjectPath, relativePath);
    if (!resolved.startsWith(currentProjectPath)) {
      throw new Error("Invalid file path");
    }
    return readFileContent(resolved);
  },

  async writeFile(relativePath: string, content: string): Promise<void> {
    if (!currentProjectPath) throw new Error("No active project");
    const resolved = path.resolve(currentProjectPath, relativePath);
    if (!resolved.startsWith(currentProjectPath)) {
      throw new Error("Invalid file path");
    }
    await writeFileContent(resolved, content);
    if (currentProject) {
      currentProject.hasUnpublishedChanges = true;
    }
  },

  async deleteFile(relativePath: string): Promise<void> {
    if (!currentProjectPath) throw new Error("No active project");
    const resolved = path.resolve(currentProjectPath, relativePath);
    if (!resolved.startsWith(currentProjectPath)) {
      throw new Error("Invalid file path");
    }
    await fs.unlink(resolved);
    if (currentProject) {
      currentProject.hasUnpublishedChanges = true;
    }
  },

  getProjectPath(): string | null {
    return currentProjectPath;
  },

  getCurrentProject(): ProjectInfo | null {
    return currentProject;
  },

  setPreviewUrl(url: string): void {
    if (currentProject) {
      currentProject.previewUrl = url;
    }
  },

  setSiteUrl(url: string): void {
    if (currentProject) {
      currentProject.siteUrl = url;
      currentProject.lastDeployedAt = Date.now();
      currentProject.hasUnpublishedChanges = false;
    }
  },
};
