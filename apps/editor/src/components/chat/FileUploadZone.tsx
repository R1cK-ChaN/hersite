import { useState, type ReactNode } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";
import { uploadFile } from "@/lib/api";

interface FileUploadZoneProps {
  children: ReactNode;
}

export function FileUploadZone({ children }: FileUploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const addPendingFile = useChatStore((s) => s.addPendingFile);
  const updatePendingFile = useChatStore((s) => s.updatePendingFile);

  const { getRootProps, getInputProps } = useDropzone({
    noClick: true,
    noKeyboard: true,
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
    },
    maxSize: 10 * 1024 * 1024,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDrop: async (acceptedFiles) => {
      setIsDragActive(false);

      for (const file of acceptedFiles) {
        const fileId = crypto.randomUUID();
        addPendingFile({
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          uploadProgress: 0,
          uploadStatus: "uploading",
        });

        try {
          const result = await uploadFile(file, (progress) => {
            updatePendingFile(fileId, { uploadProgress: progress });
          });
          updatePendingFile(fileId, {
            uploadStatus: "complete",
            uploadProgress: 100,
            serverFileId: (result as { id: string }).id,
          });
        } catch {
          updatePendingFile(fileId, { uploadStatus: "error" });
        }
      }
    },
  });

  return (
    <div {...getRootProps()} className="relative h-full">
      <input {...getInputProps()} />
      {children}

      {isDragActive && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-50">
          <div className="text-center">
            <Upload className="w-10 h-10 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium text-primary">
              Drop files here
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              .docx, images (max 10MB)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
