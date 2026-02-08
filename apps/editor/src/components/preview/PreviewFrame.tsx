import { usePreviewStore } from "@/stores/previewStore";
import { cn } from "@/lib/utils";

export function PreviewFrame() {
  const previewUrl = usePreviewStore((s) => s.previewUrl);
  const deviceMode = usePreviewStore((s) => s.deviceMode);
  const refreshKey = usePreviewStore((s) => s.refreshKey);
  const setLoading = usePreviewStore((s) => s.setLoading);

  if (!previewUrl) return null;

  const isMobile = deviceMode === "mobile";

  return (
    <div
      className={cn(
        "h-full flex items-start justify-center",
        isMobile && "py-6"
      )}
    >
      <div
        className={cn(
          "h-full",
          isMobile &&
            "w-[375px] h-[812px] max-h-[calc(100%-48px)] rounded-[2rem] border-4 border-foreground/20 overflow-hidden shadow-xl"
        )}
        style={isMobile ? {} : { width: "100%" }}
      >
        <iframe
          key={refreshKey}
          src={previewUrl}
          className="w-full h-full border-0 bg-white"
          title="Site Preview"
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  );
}
