import "dotenv/config";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { uploadRouter } from "./routes/upload.js";
import { projectRouter } from "./routes/project.js";
import { registerSocketHandlers } from "./socket/handlers.js";
import { CredentialService } from "./services/CredentialService.js";
import { BuildService } from "./services/BuildService.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@hersite/shared";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || "3001", 10);
const EDITOR_ORIGIN = process.env.EDITOR_ORIGIN || "http://localhost:5173";
const AUTH_PASSWORD = process.env.HERSITE_AUTH_PASSWORD || "";

const app = express();
const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: EDITOR_ORIGIN,
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 10 * 1024 * 1024, // 10MB
});

// Basic auth middleware (only active when HERSITE_AUTH_PASSWORD is set)
if (AUTH_PASSWORD) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Allow health check without auth
    if (req.path === "/api/health") return next();

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Basic ")) {
      res.set("WWW-Authenticate", 'Basic realm="HerSite"');
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const decoded = Buffer.from(authHeader.slice(6), "base64").toString();
    const [, password] = decoded.split(":");
    if (password !== AUTH_PASSWORD) {
      res.status(403).json({ error: "Invalid credentials" });
      return;
    }

    next();
  });
  console.log("Basic auth enabled (HERSITE_AUTH_PASSWORD is set)");
}

// Middleware
app.use(cors({ origin: EDITOR_ORIGIN }));
app.use(express.json());

// Static files for uploads
const uploadsDir = path.resolve(__dirname, "../../uploads");
app.use("/uploads", express.static(uploadsDir));

// Preview proxy setup (dev mode proxy or production static serve)
BuildService.setupPreviewProxy(app);

// API routes
app.use("/api/upload", uploadRouter);
app.use("/api/project", projectRouter);

// Health check + credential status
app.get("/api/health", async (_req, res) => {
  const credentialSource = await CredentialService.getCredentialSource();
  res.json({ status: "ok", credentialSource });
});

// Socket.IO handlers
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);
  registerSocketHandlers(io, socket);

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, async () => {
  console.log(`HerSite server running on http://localhost:${PORT}`);

  const source = await CredentialService.getCredentialSource();
  if (source === "claude-code") {
    console.log("Using Claude Code OAuth token for AI agent");
  } else if (source === "env") {
    console.log("Using ANTHROPIC_API_KEY from environment");
  } else {
    console.warn(
      "No API credentials found. Set ANTHROPIC_API_KEY or run 'claude login'.",
    );
  }
});

export { io };
