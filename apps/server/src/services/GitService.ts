import simpleGit, { type SimpleGit } from "simple-git";
import path from "path";
import { ProjectService } from "./ProjectService.js";
import { fileExists } from "../utils/fileUtils.js";

let git: SimpleGit | null = null;

// Remote repo URL for persistent storage (optional)
const REMOTE_REPO = process.env.HERSITE_GIT_REMOTE || "";

export const GitService = {
  async initRepo(projectPath: string): Promise<void> {
    git = simpleGit(projectPath);
    await git.init();
    await git.add(".");
    await git.commit("Initial commit from HerSite");

    if (REMOTE_REPO) {
      await git.addRemote("origin", REMOTE_REPO).catch(() => {
        // Remote may already exist
      });
      console.log(`Git remote configured: ${REMOTE_REPO}`);
    }
  },

  /**
   * Restore a project from a remote Git repo.
   * Clones into the target directory and returns true if successful.
   */
  async restoreFromRemote(targetPath: string): Promise<boolean> {
    if (!REMOTE_REPO) return false;

    try {
      const exists = await fileExists(path.join(targetPath, ".git"));
      if (exists) {
        // Already cloned — just pull
        git = simpleGit(targetPath);
        await git.pull("origin", "main").catch(() => {
          // May fail if no remote commits yet
        });
        console.log("Project restored from Git remote (pull)");
        return true;
      }

      // Fresh clone
      await simpleGit().clone(REMOTE_REPO, targetPath);
      git = simpleGit(targetPath);
      console.log("Project restored from Git remote (clone)");
      return true;
    } catch (err) {
      console.warn("Could not restore from Git remote:", err);
      return false;
    }
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

  /**
   * Commit and push to remote (if configured).
   */
  async commitAndPush(message: string): Promise<string> {
    const hash = await this.commitChanges(message);

    if (REMOTE_REPO && git) {
      try {
        await git.push("origin", "main", { "--force": null });
      } catch (err) {
        console.warn("Git push failed (non-fatal):", err);
      }
    }

    return hash;
  },

  async getHistory(
    count: number = 10,
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
