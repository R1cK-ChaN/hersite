import type {
  ChatMessage,
  ProjectInfo,
  AuthResult,
  DeployStatus,
} from "./types.js";

export interface ClientToServerEvents {
  "auth:validate": (
    data: { token: string },
    callback: (result: AuthResult) => void,
  ) => void;
  "chat:message": (data: { content: string; attachments?: string[] }) => void;
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
  "preview:rebuilt": () => void;
  "deploy:status": (data: {
    status: DeployStatus;
    url?: string;
    error?: string;
  }) => void;
  "project:created": (project: ProjectInfo) => void;
  "project:restored": (project: ProjectInfo) => void;
}
