import { Router, type Router as RouterType } from "express";
import { ProjectService } from "../services/ProjectService.js";

export const projectRouter: RouterType = Router();

projectRouter.get("/", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).json({ error: "userId query parameter required" });
      return;
    }
    const state = await ProjectService.getProjectState(userId);
    res.json(state);
  } catch (err) {
    console.error("Project state error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to get project state",
    });
  }
});

projectRouter.get("/file", async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const filePath = req.query.path as string;
    if (!userId) {
      res.status(400).json({ error: "userId query parameter required" });
      return;
    }
    if (!filePath) {
      res.status(400).json({ error: "path query parameter required" });
      return;
    }
    const content = await ProjectService.getFileContent(userId, filePath);
    res.json({ path: filePath, content });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to read file",
    });
  }
});
