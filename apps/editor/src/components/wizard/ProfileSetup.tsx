import { useState } from "react";
import { ArrowRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileSetupProps {
  onComplete: (name: string, tagline: string) => void;
}

export function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onComplete(name.trim(), tagline.trim());
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <User className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Tell Me About You</h2>
        <p className="text-muted-foreground">
          This will personalize your website.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium mb-1.5"
          >
            Your Name *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Sarah Chen"
            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
            required
          />
        </div>

        <div>
          <label
            htmlFor="tagline"
            className="block text-sm font-medium mb-1.5"
          >
            Tagline{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </label>
          <input
            id="tagline"
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="e.g., Writer, dreamer, coffee lover"
            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full gap-2 mt-6"
          disabled={!name.trim()}
        >
          Create My Site
          <ArrowRight className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
