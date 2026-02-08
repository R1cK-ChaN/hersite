import fs from "fs/promises";
import path from "path";
import os from "os";

interface ClaudeCodeCredentials {
  claudeAiOauth: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    scopes: string[];
    subscriptionType: string;
    rateLimitTier: string;
  };
}

const CREDENTIALS_PATH = path.join(os.homedir(), ".claude", ".credentials.json");

let cachedCredentials: ClaudeCodeCredentials | null = null;
let lastReadTime = 0;
const CACHE_TTL = 30_000; // Re-read file every 30s

async function readCredentialsFile(): Promise<ClaudeCodeCredentials | null> {
  try {
    const raw = await fs.readFile(CREDENTIALS_PATH, "utf-8");
    return JSON.parse(raw) as ClaudeCodeCredentials;
  } catch {
    return null;
  }
}

export const CredentialService = {
  /**
   * Resolve the API key for Anthropic client.
   * Priority:
   *   1. ANTHROPIC_API_KEY env var (explicit user key)
   *   2. Claude Code OAuth token from ~/.claude/.credentials.json
   */
  async getApiKey(): Promise<string> {
    // Explicit env var always wins
    if (process.env.ANTHROPIC_API_KEY) {
      return process.env.ANTHROPIC_API_KEY;
    }

    // Try Claude Code credentials
    const token = await this.getClaudeCodeToken();
    if (token) {
      return token;
    }

    throw new Error(
      "No API key found. Set ANTHROPIC_API_KEY in .env or authenticate with Claude Code (claude login)."
    );
  },

  /**
   * Get the OAuth access token from Claude Code's credentials file.
   * Returns null if not available or expired.
   */
  async getClaudeCodeToken(): Promise<string | null> {
    const now = Date.now();

    // Use cached credentials if fresh
    if (cachedCredentials && now - lastReadTime < CACHE_TTL) {
      if (cachedCredentials.claudeAiOauth.expiresAt > now) {
        return cachedCredentials.claudeAiOauth.accessToken;
      }
    }

    // Read from disk
    const credentials = await readCredentialsFile();
    if (!credentials?.claudeAiOauth) {
      return null;
    }

    cachedCredentials = credentials;
    lastReadTime = now;

    // Check if token is expired
    if (credentials.claudeAiOauth.expiresAt <= now) {
      console.warn(
        "Claude Code OAuth token is expired. Run 'claude login' to refresh."
      );
      return null;
    }

    // Verify it has the inference scope
    if (!credentials.claudeAiOauth.scopes.includes("user:inference")) {
      console.warn(
        "Claude Code OAuth token lacks user:inference scope."
      );
      return null;
    }

    return credentials.claudeAiOauth.accessToken;
  },

  /**
   * Check which credential source is being used.
   */
  async getCredentialSource(): Promise<string> {
    if (process.env.ANTHROPIC_API_KEY) {
      return "env";
    }
    const token = await this.getClaudeCodeToken();
    if (token) {
      return "claude-code";
    }
    return "none";
  },

  /**
   * Force re-read credentials from disk on next call.
   */
  invalidateCache(): void {
    cachedCredentials = null;
    lastReadTime = 0;
  },
};
