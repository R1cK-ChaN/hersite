import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { FileUploadZone } from "./FileUploadZone";

export function ChatSidebar() {
  return (
    <FileUploadZone>
      <div className="flex flex-col h-full bg-card">
        <div className="px-4 py-3 border-b">
          <h2 className="font-semibold text-sm">Chat</h2>
          <p className="text-xs text-muted-foreground">
            Tell me what you'd like to change
          </p>
        </div>
        <div className="flex-1 overflow-hidden">
          <MessageList />
        </div>
        <ChatInput />
      </div>
    </FileUploadZone>
  );
}
