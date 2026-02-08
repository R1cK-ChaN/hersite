import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { uploadRouter } from "./routes/upload.js";
import { projectRouter } from "./routes/project.js";
import { registerSocketHandlers } from "./socket/handlers.js";
import { CredentialService } from "./services/CredentialService.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@hersite/shared";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || "3001", 10);
const EDITOR_ORIGIN = process.env.EDITOR_ORIGIN || "http://localhost:5173";

const app = express();
const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: EDITOR_ORIGIN,
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 10 * 1024 * 1024, // 10MB
});

// Middleware
app.use(cors({ origin: EDITOR_ORIGIN }));
app.use(express.json());

// Static files for uploads
const uploadsDir = path.resolve(__dirname, "../../uploads");
app.use("/uploads", express.static(uploadsDir));

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
      "No API credentials found. Set ANTHROPIC_API_KEY or run 'claude login'."
    );
  }
});

export { io };
