import { create } from "zustand";
import type { ProjectInfo, DeployStatus } from "@hersite/shared";

interface ProjectStore {
  project: ProjectInfo | null;
  deployStatus: DeployStatus;
  deployUrl: string | null;
  deployError: string | null;

  setProject: (project: ProjectInfo) => void;
  setDeployStatus: (
    status: DeployStatus,
    url?: string,
    error?: string
  ) => void;
  setHasUnpublishedChanges: (value: boolean) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  project: null,
  deployStatus: "idle",
  deployUrl: null,
  deployError: null,

  setProject: (project) => set({ project }),

  setDeployStatus: (status, url, error) =>
    set((state) => ({
      deployStatus: status,
      deployUrl: url || state.deployUrl,
      deployError: error || null,
      project:
        status === "deployed" && state.project
          ? {
              ...state.project,
              siteUrl: url || state.project.siteUrl,
              lastDeployedAt: Date.now(),
              hasUnpublishedChanges: false,
            }
          : state.project,
    })),

  setHasUnpublishedChanges: (value) =>
    set((state) => ({
      project: state.project
        ? { ...state.project, hasUnpublishedChanges: value }
        : null,
    })),
}));
