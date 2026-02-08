import { Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeStepProps {
  onStart: () => void;
}

export function WelcomeStep({ onStart }: WelcomeStepProps) {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
        <Heart className="w-10 h-10 text-primary fill-primary" />
      </div>

      <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
        Welcome to HerSite
      </h1>

      <p className="text-lg text-muted-foreground mb-2">
        Your personal website, built with love.
      </p>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        No coding required — just tell me what you want, and I'll build it for
        you. Let's create something beautiful together.
      </p>

      <Button onClick={onStart} size="lg" className="gap-2 text-base px-8">
        Let's Get Started
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
