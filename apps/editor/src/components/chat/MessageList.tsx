import { useEffect, useRef } from "react";
import { useChatStore } from "@/stores/chatStore";
import { MessageBubble } from "./MessageBubble";
import { Loader2 } from "lucide-react";

export function MessageList() {
  const messages = useChatStore((s) => s.messages);
  const isAgentTyping = useChatStore((s) => s.isAgentTyping);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const streamingMessageId = useChatStore((s) => s.streamingMessageId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent, isAgentTyping]);

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && !isAgentTyping && (
        <div className="text-center text-muted-foreground text-sm py-12">
          <p className="text-2xl mb-2">💗</p>
          <p>Your site is ready!</p>
          <p>Tell me what you'd like to change.</p>
        </div>
      )}

      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {streamingMessageId && streamingContent && (
        <MessageBubble
          message={{
            id: streamingMessageId,
            role: "agent",
            content: streamingContent,
            timestamp: Date.now(),
            status: "streaming",
          }}
        />
      )}

      {isAgentTyping && !streamingContent && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Thinking...</span>
        </div>
      )}
    </div>
  );
}
