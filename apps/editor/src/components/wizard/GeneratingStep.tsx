import { useEffect, useState } from "react";
import { Loader2, Heart } from "lucide-react";
import { getSocket } from "@/lib/socket";
import type { TemplateId } from "@hersite/shared";

interface GeneratingStepProps {
  templateId: TemplateId;
  name: string;
  tagline: string;
}

const statusMessages = [
  "Setting up your site...",
  "Copying template files...",
  "Personalizing your content...",
  "Installing dependencies...",
  "Building your site...",
  "Almost there...",
];

export function GeneratingStep({
  templateId,
  name,
  tagline,
}: GeneratingStepProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    // Emit project creation event
    getSocket().emit("project:create", {
      templateId,
      name,
      tagline,
    });

    // Cycle through status messages
    const interval = setInterval(() => {
      setMessageIndex((i) => Math.min(i + 1, statusMessages.length - 1));
    }, 3000);

    return () => clearInterval(interval);
  }, [templateId, name, tagline]);

  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6 animate-pulse">
        <Heart className="w-10 h-10 text-primary fill-primary" />
      </div>

      <h2 className="text-2xl font-bold mb-6">Building Your Site</h2>

      <div className="flex items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <p className="text-sm">{statusMessages[messageIndex]}</p>
      </div>

      <div className="mt-8 flex justify-center gap-1.5">
        {statusMessages.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors duration-500 ${
              i <= messageIndex ? "bg-primary" : "bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
