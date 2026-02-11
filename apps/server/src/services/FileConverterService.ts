import mammoth from "mammoth";
import TurndownService from "turndown";
import sharp from "sharp";
import path from "path";
import { v4 as uuid } from "uuid";
import { ensureDir, writeFileContent } from "../utils/fileUtils.js";
import { ProjectService } from "./ProjectService.js";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

export const FileConverterService = {
  async convertDocx(
    userId: string,
    buffer: Buffer,
    fileName: string,
  ): Promise<{ mdxContent: string; title: string; slug: string }> {
    const projectPath = ProjectService.getProjectPath(userId);

    // Convert docx to HTML with embedded images
    const result = await mammoth.convertToHtml(
      { buffer },
      {
        convertImage: mammoth.images.imgElement((image) => {
          return image.read("base64").then((imageBuffer) => {
            return { src: `data:${image.contentType};base64,${imageBuffer}` };
          });
        }),
      },
    );

    const html = result.value;

    // Extract and save images
    const imageRegex = /src="data:(image\/[^;]+);base64,([^"]+)"/g;
    let processedHtml = html;
    let match;
    const savedImages: string[] = [];

    while ((match = imageRegex.exec(html)) !== null) {
      const contentType = match[1];
      const base64Data = match[2];
      const imageId = uuid().slice(0, 8);
      const imageName = `blog-${imageId}.webp`;
      const imagePath = path.join(projectPath, "public/images", imageName);

      await ensureDir(path.dirname(imagePath));

      // Convert to WebP and resize
      const imageBuffer = Buffer.from(base64Data, "base64");
      await sharp(imageBuffer)
        .resize(1200, null, { withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(imagePath);

      processedHtml = processedHtml.replace(
        match[0],
        `src="/images/${imageName}"`,
      );
      savedImages.push(imageName);
    }

    // Convert HTML to Markdown
    const markdown = turndown.turndown(processedHtml);

    // Extract title from first heading
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : fileName.replace(/\.docx$/i, "");

    // Generate slug
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Build MDX content with frontmatter
    const date = new Date().toISOString().split("T")[0];
    const description = markdown
      .replace(/^#.+$/m, "")
      .trim()
      .slice(0, 160)
      .replace(/\n/g, " ");

    // Remove the first heading from content since it's in frontmatter
    const contentWithoutTitle = titleMatch
      ? markdown.replace(/^#\s+.+$/m, "").trim()
      : markdown;

    const mdxContent = `---
title: "${title}"
description: "${description}"
pubDate: ${date}
tags: ["imported"]
---

${contentWithoutTitle}
`;

    return { mdxContent, title, slug };
  },

  async saveAsBlogPost(
    userId: string,
    mdxContent: string,
    slug: string,
  ): Promise<string> {
    const filePath = `src/content/blog/${slug}.mdx`;
    await ProjectService.writeFile(userId, filePath, mdxContent);
    return filePath;
  },
};
