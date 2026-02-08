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

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Socket.IO handlers
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);
  registerSocketHandlers(io, socket);

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`HerSite server running on http://localhost:${PORT}`);
});

export { io };
