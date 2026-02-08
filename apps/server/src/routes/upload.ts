import { Router, type Router as RouterType } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuid } from "uuid";
import { ensureDir } from "../utils/fileUtils.js";
import { FileConverterService } from "../services/FileConverterService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, "../../../uploads");

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await ensureDir(UPLOADS_DIR);
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      ".docx",
      ".doc",
      ".pptx",
      ".xlsx",
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".svg",
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported`));
    }
  },
});

export const uploadRouter: RouterType = Router();

uploadRouter.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const file = req.file;
    const ext = path.extname(file.originalname).toLowerCase();

    let result: Record<string, unknown> = {
      id: path.basename(file.filename, path.extname(file.filename)),
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
      path: file.path,
    };

    // Auto-convert .docx files
    if (ext === ".docx") {
      const fs = await import("fs/promises");
      const buffer = await fs.readFile(file.path);
      const converted = await FileConverterService.convertDocx(
        buffer,
        file.originalname
      );
      const savedPath = await FileConverterService.saveAsBlogPost(
        converted.mdxContent,
        converted.slug
      );

      result = {
        ...result,
        converted: true,
        blogPost: {
          title: converted.title,
          slug: converted.slug,
          path: savedPath,
        },
      };
    }

    res.json(result);
  } catch (err) {
    console.error("Upload error:", err);
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : "Upload failed" });
  }
});
