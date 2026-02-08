import { X, FileText, Image, Loader2 } from "lucide-react";
import type { FileAttachment } from "@hersite/shared";
import { useChatStore } from "@/stores/chatStore";

interface FilePreviewChipProps {
  file: FileAttachment;
}

export function FilePreviewChip({ file }: FilePreviewChipProps) {
  const removePendingFile = useChatStore((s) => s.removePendingFile);

  const isImage = file.type.startsWith("image/");
  const Icon = isImage ? Image : FileText;

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-xs border">
      {file.uploadStatus === "uploading" ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Icon className="w-3 h-3" />
      )}
      <span className="max-w-[120px] truncate">{file.name}</span>
      {file.uploadStatus !== "uploading" && (
        <button
          onClick={() => removePendingFile(file.id)}
          className="ml-0.5 hover:text-destructive"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
