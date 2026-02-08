import type { ChatMessage, ProjectInfo, DeployStatus } from "./types.js";

export interface ClientToServerEvents {
  "chat:message": (data: {
    content: string;
    attachments?: string[];
  }) => void;
  "project:create": (data: {
    templateId: string;
    name: string;
    tagline?: string;
    profilePhotoId?: string;
  }) => void;
  "publish:confirm": () => void;
}

export interface ServerToClientEvents {
  "agent:message": (message: ChatMessage) => void;
  "agent:typing": (isTyping: boolean) => void;
  "agent:stream": (data: { messageId: string; chunk: string }) => void;
  "agent:error": (data: { error: string }) => void;
  "preview:update": (data: { changedFiles: string[] }) => void;
  "deploy:status": (data: {
    status: DeployStatus;
    url?: string;
    error?: string;
  }) => void;
  "project:created": (project: ProjectInfo) => void;
}
