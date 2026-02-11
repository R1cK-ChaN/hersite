import { ProjectService } from "../ProjectService.js";

export async function buildSiteContext(userId: string) {
  const state = await ProjectService.getProjectState(userId);

  return {
    siteName: state.project?.name || "My Site",
    pages: state.pages,
    files: state.files,
    themeVariables: state.themeVariables,
  };
}
