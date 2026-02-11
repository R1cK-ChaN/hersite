import { TEMPLATES, type TemplateId } from "@hersite/shared";
import { FileText, Image, LayoutGrid, Check, Diamond } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TemplateSelectorProps {
  onSelect: (id: TemplateId) => void;
}

const templateIcons: Record<TemplateId, React.ReactNode> = {
  blog: <FileText className="w-8 h-8" />,
  portfolio: <Image className="w-8 h-8" />,
  "blog-portfolio": <LayoutGrid className="w-8 h-8" />,
  luxury: <Diamond className="w-8 h-8" />,
};

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const [selected, setSelected] = useState<TemplateId | null>(null);

  const handleSelect = (id: TemplateId) => {
    setSelected(id);
    // Brief delay so user sees the selection
    setTimeout(() => onSelect(id), 300);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-2">
        Choose Your Template
      </h2>
      <p className="text-center text-muted-foreground mb-8">
        Pick a starting point — you can customize everything later.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => handleSelect(template.id)}
            className={cn(
              "relative p-6 rounded-xl border-2 text-left transition-all hover:border-primary/50 hover:shadow-md",
              selected === template.id
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border bg-card",
            )}
          >
            {selected === template.id && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}

            <div className="text-primary mb-4">
              {templateIcons[template.id]}
            </div>
            <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {template.description}
            </p>
            <ul className="space-y-1">
              {template.features.map((feature) => (
                <li
                  key={feature}
                  className="text-xs text-muted-foreground flex items-center gap-1.5"
                >
                  <span className="w-1 h-1 rounded-full bg-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </div>
  );
}
