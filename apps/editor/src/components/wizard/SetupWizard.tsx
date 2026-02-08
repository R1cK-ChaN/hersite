import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WelcomeStep } from "./WelcomeStep";
import { TemplateSelector } from "./TemplateSelector";
import { ProfileSetup } from "./ProfileSetup";
import { GeneratingStep } from "./GeneratingStep";
import type { TemplateId } from "@hersite/shared";

export function SetupWizard() {
  const [step, setStep] = useState(0);
  const [templateId, setTemplateId] = useState<TemplateId | null>(null);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");

  const handleTemplateSelect = (id: TemplateId) => {
    setTemplateId(id);
    setStep(2);
  };

  const handleProfileComplete = (n: string, t: string) => {
    setName(n);
    setTagline(t);
    setStep(3);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <WizardMotion key="welcome">
              <WelcomeStep onStart={() => setStep(1)} />
            </WizardMotion>
          )}
          {step === 1 && (
            <WizardMotion key="template">
              <TemplateSelector onSelect={handleTemplateSelect} />
            </WizardMotion>
          )}
          {step === 2 && (
            <WizardMotion key="profile">
              <ProfileSetup onComplete={handleProfileComplete} />
            </WizardMotion>
          )}
          {step === 3 && templateId && (
            <WizardMotion key="generating">
              <GeneratingStep
                templateId={templateId}
                name={name}
                tagline={tagline}
              />
            </WizardMotion>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function WizardMotion({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
