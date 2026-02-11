import { useAuthStore } from "@/stores/authStore";

export async function uploadFile(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<Record<string, unknown>> {
  const formData = new FormData();
  formData.append("file", file);

  const userId = useAuthStore.getState().userId;
  const xhr = new XMLHttpRequest();

  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Upload failed")));

    const url = userId ? `/api/upload?userId=${userId}` : "/api/upload";
    xhr.open("POST", url);
    xhr.send(formData);
  });
}

export async function getProjectState() {
  const res = await fetch("/api/project");
  return res.json();
}
