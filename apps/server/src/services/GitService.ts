import simpleGit, { type SimpleGit } from "simple-git";
import path from "path";
import { ProjectService } from "./ProjectService.js";
import { fileExists } from "../utils/fileUtils.js";

/** Per-user git instances */
const gitInstances = new Map<string, SimpleGit>();

// Remote repo URL for persistent storage (optional)
const REMOTE_REPO = process.env.HERSITE_GIT_REMOTE || "";

function getGit(userId: string): SimpleGit {
  let git = gitInstances.get(userId);
  if (!git) {
    const projectPath = ProjectService.getProjectPath(userId);
    git = simpleGit(projectPath);
    gitInstances.set(userId, git);
  }
  return git;
}

export const GitService = {
  async initRepo(userId: string): Promise<void> {
    const projectPath = ProjectService.getProjectPath(userId);
    const git = simpleGit(projectPath);
    gitInstances.set(userId, git);

    await git.init();
    await git.add(".");
    await git.commit("Initial commit from HerSite");

    if (REMOTE_REPO) {
      await git.addRemote("origin", REMOTE_REPO).catch(() => {
        // Remote may already exist
      });
      console.log(`Git remote configured for user ${userId}: ${REMOTE_REPO}`);
    }
  },

  /**
   * Restore a project from a remote Git repo.
   */
  async restoreFromRemote(userId: string): Promise<boolean> {
    if (!REMOTE_REPO) return false;

    const projectPath = ProjectService.getProjectPath(userId);
    try {
      const exists = await fileExists(path.join(projectPath, ".git"));
      if (exists) {
        const git = simpleGit(projectPath);
        gitInstances.set(userId, git);
        await git.pull("origin", "main").catch(() => {
          // May fail if no remote commits yet
        });
        console.log(
          `Project restored from Git remote (pull) for user ${userId}`,
        );
        return true;
      }

      await simpleGit().clone(REMOTE_REPO, projectPath);
      const git = simpleGit(projectPath);
      gitInstances.set(userId, git);
      console.log(
        `Project restored from Git remote (clone) for user ${userId}`,
      );
      return true;
    } catch (err) {
      console.warn(
        `Could not restore from Git remote for user ${userId}:`,
        err,
      );
      return false;
    }
  },

  async commitChanges(userId: string, message: string): Promise<string> {
    const git = getGit(userId);
    await git.add(".");
    const result = await git.commit(message);
    return result.commit;
  },

  async commitAndPush(userId: string, message: string): Promise<string> {
    const hash = await this.commitChanges(userId, message);

    if (REMOTE_REPO) {
      const git = getGit(userId);
      try {
        await git.push("origin", "main", { "--force": null });
      } catch (err) {
        console.warn(`Git push failed for user ${userId} (non-fatal):`, err);
      }
    }

    return hash;
  },

  async getHistory(
    userId: string,
    count: number = 10,
  ): Promise<Array<{ hash: string; message: string; date: string }>> {
    const git = getGit(userId);
    const log = await git.log({ maxCount: count });
    return log.all.map((entry) => ({
      hash: entry.hash,
      message: entry.message,
      date: entry.date,
    }));
  },

  async revertLastCommit(userId: string): Promise<string> {
    const git = getGit(userId);
    await git.revert("HEAD", { "--no-edit": null });
    const log = await git.log({ maxCount: 1 });
    return log.latest?.hash || "";
  },
};
