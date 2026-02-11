import { useEffect } from "react";
import { getSocket } from "@/lib/socket";
import { useChatStore } from "@/stores/chatStore";
import { useProjectStore } from "@/stores/projectStore";
import { usePreviewStore } from "@/stores/previewStore";
import { useUIStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";

export function useSocket() {
  useEffect(() => {
    const socket = getSocket();

    const setConnected = useUIStore.getState().setConnected;

    socket.on("connect", () => {
      setConnected(true);

      // Auto-validate persisted token on reconnect
      const authState = useAuthStore.getState();
      if (authState.token && !authState.isAuthenticated) {
        authState.setAuthenticating(true);
        socket.emit("auth:validate", { token: authState.token }, (result) => {
          if (result.success && result.userId) {
            authState.setAuthenticated(result.userId, authState.token!);
          } else {
            authState.setAuthError(
              result.error || "Session expired. Please log in again.",
            );
          }
        });
      }
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("agent:message", (message) => {
      const store = useChatStore.getState();
      store.finishStreaming();
      store.addMessage(message);
    });

    socket.on("agent:typing", (isTyping) => {
      useChatStore.getState().setAgentTyping(isTyping);
    });

    socket.on("agent:stream", ({ messageId, chunk }) => {
      const store = useChatStore.getState();
      if (store.streamingMessageId !== messageId) {
        store.startStreaming(messageId);
      }
      store.appendStreamChunk(chunk);
    });

    socket.on("agent:error", ({ error }) => {
      const store = useChatStore.getState();
      store.setAgentTyping(false);
      store.finishStreaming();
      store.addMessage({
        id: crypto.randomUUID(),
        role: "agent",
        content: `Something went wrong: ${error}`,
        timestamp: Date.now(),
        status: "error",
      });
    });

    socket.on("preview:update", () => {
      usePreviewStore.getState().triggerRefresh();
      useProjectStore.getState().setHasUnpublishedChanges(true);
    });

    socket.on("preview:rebuilt", () => {
      usePreviewStore.getState().triggerRefresh();
    });

    socket.on("deploy:status", ({ status, url, error }) => {
      useProjectStore.getState().setDeployStatus(status, url, error);
    });

    socket.on("project:created", (project) => {
      useProjectStore.getState().setProject(project);
      if (project.previewUrl) {
        usePreviewStore.getState().setPreviewUrl(project.previewUrl);
      }
    });

    socket.on("project:restored", (project) => {
      useProjectStore.getState().setProject(project);
      if (project.previewUrl) {
        usePreviewStore.getState().setPreviewUrl(project.previewUrl);
      }
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("agent:message");
      socket.off("agent:typing");
      socket.off("agent:stream");
      socket.off("agent:error");
      socket.off("preview:update");
      socket.off("preview:rebuilt");
      socket.off("deploy:status");
      socket.off("project:created");
      socket.off("project:restored");
    };
  }, []);
}
