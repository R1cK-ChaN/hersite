import simpleGit, { type SimpleGit } from "simple-git";
import { ProjectService } from "./ProjectService.js";

let git: SimpleGit | null = null;

export const GitService = {
  async initRepo(projectPath: string): Promise<void> {
    git = simpleGit(projectPath);
    await git.init();
    await git.add(".");
    await git.commit("Initial commit from HerSite");
  },

  async commitChanges(message: string): Promise<string> {
    if (!git) {
      const projectPath = ProjectService.getProjectPath();
      if (!projectPath) throw new Error("No active project");
      git = simpleGit(projectPath);
    }

    await git.add(".");
    const result = await git.commit(message);
    return result.commit;
  },

  async getHistory(
    count: number = 10
  ): Promise<Array<{ hash: string; message: string; date: string }>> {
    if (!git) throw new Error("Git not initialized");

    const log = await git.log({ maxCount: count });
    return log.all.map((entry) => ({
      hash: entry.hash,
      message: entry.message,
      date: entry.date,
    }));
  },

  async revertLastCommit(): Promise<string> {
    if (!git) throw new Error("Git not initialized");

    await git.revert("HEAD", { "--no-edit": null });
    const log = await git.log({ maxCount: 1 });
    return log.latest?.hash || "";
  },
};
