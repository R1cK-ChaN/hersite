import { ProjectService } from "../ProjectService.js";

export async function buildSiteContext() {
  const state = await ProjectService.getProjectState();

  return {
    siteName: state.project?.name || "My Site",
    pages: state.pages,
    files: state.files,
    themeVariables: state.themeVariables,
  };
}
