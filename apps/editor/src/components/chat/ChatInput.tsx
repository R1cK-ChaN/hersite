import { useRef, type KeyboardEvent } from "react";
import { Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/stores/chatStore";
import { getSocket } from "@/lib/socket";
import { uploadFile } from "@/lib/api";
import { FilePreviewChip } from "./FilePreviewChip";

export function ChatInput() {
  const inputValue = useChatStore((s) => s.inputValue);
  const setInputValue = useChatStore((s) => s.setInputValue);
  const isAgentTyping = useChatStore((s) => s.isAgentTyping);
  const pendingFiles = useChatStore((s) => s.pendingFiles);
  const addMessage = useChatStore((s) => s.addMessage);
  const clearPendingFiles = useChatStore((s) => s.clearPendingFiles);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const content = inputValue.trim();
    if (!content && pendingFiles.length === 0) return;
    if (isAgentTyping) return;

    const attachmentIds = pendingFiles
      .filter((f) => f.serverFileId)
      .map((f) => f.serverFileId!);

    // Add user message to local store
    addMessage({
      id: crypto.randomUUID(),
      role: "user",
      content,
      attachments: pendingFiles.length > 0 ? [...pendingFiles] : undefined,
      timestamp: Date.now(),
      status: "complete",
    });

    // Send via socket
    getSocket().emit("chat:message", {
      content,
      attachments: attachmentIds.length > 0 ? attachmentIds : undefined,
    });

    setInputValue("");
    clearPendingFiles();

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const fileId = crypto.randomUUID();
      useChatStore.getState().addPendingFile({
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadProgress: 0,
        uploadStatus: "uploading",
      });

      try {
        const result = await uploadFile(file, (progress) => {
          useChatStore.getState().updatePendingFile(fileId, {
            uploadProgress: progress,
          });
        });
        useChatStore.getState().updatePendingFile(fileId, {
          uploadStatus: "complete",
          uploadProgress: 100,
          serverFileId: (result as { id: string }).id,
        });
      } catch {
        useChatStore.getState().updatePendingFile(fileId, {
          uploadStatus: "error",
        });
      }
    }

    e.target.value = "";
  };

  return (
    <div className="border-t p-3">
      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {pendingFiles.map((file) => (
            <FilePreviewChip key={file.id} file={file} />
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 flex-shrink-0"
          onClick={handleFileClick}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".docx,.doc,.pptx,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.svg"
          multiple
          onChange={handleFileChange}
        />

        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Type a message..."
          disabled={isAgentTyping}
          rows={1}
          className="flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />

        <Button
          size="icon"
          className="h-9 w-9 flex-shrink-0"
          onClick={handleSend}
          disabled={
            isAgentTyping ||
            (!inputValue.trim() && pendingFiles.length === 0)
          }
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
