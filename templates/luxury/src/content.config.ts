import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const experience = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/experience" }),
  schema: z.object({
    company: z.string(),
    role: z.string(),
    desc: z.string(),
    order: z.number().optional(),
  }),
});

const writings = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/writings" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).optional(),
    heroImage: z.string().optional(),
  }),
});

export const collections = { experience, writings };
