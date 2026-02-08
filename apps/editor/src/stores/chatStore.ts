import { create } from "zustand";
import type { ChatMessage, FileAttachment } from "@hersite/shared";

interface ChatStore {
  messages: ChatMessage[];
  pendingFiles: FileAttachment[];
  isAgentTyping: boolean;
  inputValue: string;
  streamingMessageId: string | null;
  streamingContent: string;

  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, update: Partial<ChatMessage>) => void;
  setAgentTyping: (typing: boolean) => void;
  setInputValue: (value: string) => void;
  addPendingFile: (file: FileAttachment) => void;
  removePendingFile: (id: string) => void;
  updatePendingFile: (id: string, update: Partial<FileAttachment>) => void;
  clearPendingFiles: () => void;
  startStreaming: (messageId: string) => void;
  appendStreamChunk: (chunk: string) => void;
  finishStreaming: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  pendingFiles: [],
  isAgentTyping: false,
  inputValue: "",
  streamingMessageId: null,
  streamingContent: "",

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateMessage: (id, update) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...update } : m
      ),
    })),

  setAgentTyping: (typing) => set({ isAgentTyping: typing }),

  setInputValue: (value) => set({ inputValue: value }),

  addPendingFile: (file) =>
    set((state) => ({ pendingFiles: [...state.pendingFiles, file] })),

  removePendingFile: (id) =>
    set((state) => ({
      pendingFiles: state.pendingFiles.filter((f) => f.id !== id),
    })),

  updatePendingFile: (id, update) =>
    set((state) => ({
      pendingFiles: state.pendingFiles.map((f) =>
        f.id === id ? { ...f, ...update } : f
      ),
    })),

  clearPendingFiles: () => set({ pendingFiles: [] }),

  startStreaming: (messageId) =>
    set({ streamingMessageId: messageId, streamingContent: "" }),

  appendStreamChunk: (chunk) =>
    set((state) => ({
      streamingContent: state.streamingContent + chunk,
    })),

  finishStreaming: () =>
    set({ streamingMessageId: null, streamingContent: "" }),
}));
