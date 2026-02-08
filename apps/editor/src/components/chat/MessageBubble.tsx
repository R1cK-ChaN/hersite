import type { ChatMessage } from "@hersite/shared";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md",
          message.status === "error" && "bg-destructive/10 text-destructive"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-code:bg-background/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.attachments.map((att) => (
              <span
                key={att.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/30 text-xs"
              >
                📎 {att.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
