import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { ProjectInfo, TemplateId, ChatMessage } from "@hersite/shared";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH =
  process.env.HERSITE_DB_PATH ||
  path.resolve(__dirname, "../../../data/hersite.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
  }
  return db;
}

function initSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      invite_token TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      tagline TEXT NOT NULL DEFAULT '',
      template_id TEXT NOT NULL,
      site_url TEXT,
      preview_url TEXT,
      last_deployed_at INTEGER,
      has_unpublished_changes INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'complete',
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_chat_user_id ON chat_messages(user_id);
  `);
}

export const DatabaseService = {
  init(): void {
    getDb();
    console.log(`Database initialized at ${DB_PATH}`);
  },

  // ─── Users ──────────────────────────────────────────────────

  createUser(id: string, inviteToken: string): void {
    getDb()
      .prepare("INSERT INTO users (id, invite_token) VALUES (?, ?)")
      .run(id, inviteToken);
  },

  getUserByToken(inviteToken: string): { id: string } | undefined {
    return getDb()
      .prepare("SELECT id FROM users WHERE invite_token = ?")
      .get(inviteToken) as { id: string } | undefined;
  },

  getUserById(id: string): { id: string; invite_token: string } | undefined {
    return getDb()
      .prepare("SELECT id, invite_token FROM users WHERE id = ?")
      .get(id) as { id: string; invite_token: string } | undefined;
  },

  // ─── Projects ──────────────────────────────────────────────

  saveProject(project: ProjectInfo): void {
    getDb()
      .prepare(
        `INSERT OR REPLACE INTO projects
         (id, user_id, name, tagline, template_id, site_url, preview_url, last_deployed_at, has_unpublished_changes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        project.id,
        project.userId,
        project.name,
        project.tagline,
        project.templateId,
        project.siteUrl || null,
        project.previewUrl || null,
        project.lastDeployedAt || null,
        project.hasUnpublishedChanges ? 1 : 0,
      );
  },

  getProjectByUserId(userId: string): ProjectInfo | null {
    const row = getDb()
      .prepare(
        "SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
      )
      .get(userId) as Record<string, unknown> | undefined;

    if (!row) return null;

    return {
      id: row.id as string,
      userId: row.user_id as string,
      name: row.name as string,
      tagline: row.tagline as string,
      templateId: row.template_id as TemplateId,
      siteUrl: (row.site_url as string) || undefined,
      previewUrl: (row.preview_url as string) || undefined,
      lastDeployedAt: (row.last_deployed_at as number) || undefined,
      hasUnpublishedChanges: !!(row.has_unpublished_changes as number),
    };
  },

  updateProjectField(projectId: string, field: string, value: unknown): void {
    const allowedFields = [
      "site_url",
      "preview_url",
      "last_deployed_at",
      "has_unpublished_changes",
    ];
    if (!allowedFields.includes(field)) {
      throw new Error(`Cannot update field: ${field}`);
    }
    getDb()
      .prepare(`UPDATE projects SET ${field} = ? WHERE id = ?`)
      .run(value, projectId);
  },

  // ─── Chat History ─────────────────────────────────────────

  saveChatMessage(userId: string, message: ChatMessage): void {
    getDb()
      .prepare(
        `INSERT OR REPLACE INTO chat_messages (id, user_id, role, content, timestamp, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        message.id,
        userId,
        message.role,
        message.content,
        message.timestamp,
        message.status,
      );
  },

  getChatHistory(userId: string, limit = 100): ChatMessage[] {
    const rows = getDb()
      .prepare(
        "SELECT * FROM chat_messages WHERE user_id = ? ORDER BY timestamp ASC LIMIT ?",
      )
      .all(userId, limit) as Array<Record<string, unknown>>;

    return rows.map((row) => ({
      id: row.id as string,
      role: row.role as "user" | "agent",
      content: row.content as string,
      timestamp: row.timestamp as number,
      status: row.status as ChatMessage["status"],
    }));
  },

  clearChatHistory(userId: string): void {
    getDb().prepare("DELETE FROM chat_messages WHERE user_id = ?").run(userId);
  },

  close(): void {
    if (db) {
      db.close();
      db = null;
    }
  },
};
