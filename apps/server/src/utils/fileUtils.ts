import fs from "fs/promises";
import path from "path";

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function copyDir(src: string, dest: string): Promise<void> {
  await ensureDir(dest);
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

export async function listFilesRecursive(
  dir: string,
  base?: string
): Promise<string[]> {
  const root = base || dir;
  const files: string[] = [];

  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursive(fullPath, root)));
    } else {
      files.push(path.relative(root, fullPath));
    }
  }

  return files;
}

export async function readFileContent(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf-8");
}

export async function writeFileContent(
  filePath: string,
  content: string
): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf-8");
}

export async function deleteFileSafe(filePath: string): Promise<boolean> {
  try {
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}
