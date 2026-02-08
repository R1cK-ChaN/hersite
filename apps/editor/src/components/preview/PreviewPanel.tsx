import { usePreviewStore } from "@/stores/previewStore";
import { PreviewFrame } from "./PreviewFrame";
import { Loader2, Monitor } from "lucide-react";

export function PreviewPanel() {
  const previewUrl = usePreviewStore((s) => s.previewUrl);
  const isLoading = usePreviewStore((s) => s.isLoading);

  if (!previewUrl) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/30">
        <div className="text-center text-muted-foreground">
          <Monitor className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Preview will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative bg-muted/30">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
      <PreviewFrame />
    </div>
  );
}
