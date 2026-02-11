export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  attachments?: FileAttachment[];
  timestamp: number;
  status: "sending" | "streaming" | "complete" | "error";
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadProgress: number;
  uploadStatus: "pending" | "uploading" | "complete" | "error";
  serverFileId?: string;
}

export interface ProjectInfo {
  id: string;
  name: string;
  tagline: string;
  templateId: TemplateId;
  siteUrl?: string;
  previewUrl?: string;
  lastDeployedAt?: number;
  hasUnpublishedChanges: boolean;
}

export type TemplateId = "blog" | "portfolio" | "blog-portfolio" | "luxury";

export type DeployStatus = "idle" | "deploying" | "deployed" | "failed";

export interface TemplateInfo {
  id: TemplateId;
  name: string;
  description: string;
  features: string[];
}

export const TEMPLATES: TemplateInfo[] = [
  {
    id: "blog",
    name: "Blog",
    description: "A clean, minimal blog with beautiful typography",
    features: ["Blog posts with MDX", "RSS feed", "Tag pages"],
  },
  {
    id: "portfolio",
    name: "Portfolio",
    description: "Showcase your work with a stunning photo grid",
    features: ["Photo grid layout", "Project pages", "Lightbox viewer"],
  },
  {
    id: "blog-portfolio",
    name: "Blog + Portfolio",
    description: "The best of both — blog posts and a portfolio",
    features: [
      "Blog + Portfolio sections",
      "Featured content",
      "Full navigation",
    ],
  },
  {
    id: "luxury",
    name: "Luxury Brand",
    description: "Editorial luxury minimal — a high-end personal brand site",
    features: [
      "Magazine-style typography",
      "Elegant animations",
      "Cream & navy palette",
    ],
  },
];
