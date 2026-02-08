import type Anthropic from "@anthropic-ai/sdk";

export const agentTools: Anthropic.Tool[] = [
  {
    name: "readFile",
    description:
      "Read the contents of a file from the project. Use this to understand the current state of a file before modifying it.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description:
            "Relative path from the project root (e.g., 'src/pages/index.astro')",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "writeFile",
    description:
      "Create a new file or completely replace the contents of an existing file.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "Relative path from the project root",
        },
        content: {
          type: "string",
          description: "The full content to write to the file",
        },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "modifyFile",
    description:
      "Find and replace text in an existing file. Useful for making targeted changes without rewriting the entire file.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "Relative path from the project root",
        },
        search: {
          type: "string",
          description: "The exact text to find in the file",
        },
        replace: {
          type: "string",
          description: "The text to replace it with",
        },
      },
      required: ["path", "search", "replace"],
    },
  },
  {
    name: "listFiles",
    description: "List all files in the project directory.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "createBlogPost",
    description:
      "Create a new blog post as an MDX file with proper frontmatter.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "The title of the blog post",
        },
        content: {
          type: "string",
          description:
            "The markdown content of the blog post (without frontmatter)",
        },
        description: {
          type: "string",
          description: "A short description/summary of the post",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Optional tags for the post",
        },
      },
      required: ["title", "content", "description"],
    },
  },
  {
    name: "createPage",
    description:
      "Create a new Astro page and add it to the site navigation.",
    input_schema: {
      type: "object" as const,
      properties: {
        slug: {
          type: "string",
          description:
            "The URL slug for the page (e.g., 'about' creates /about)",
        },
        title: {
          type: "string",
          description: "The page title",
        },
        content: {
          type: "string",
          description: "The HTML/Astro content for the page body",
        },
      },
      required: ["slug", "title", "content"],
    },
  },
  {
    name: "updateTheme",
    description:
      "Update CSS custom properties in the theme file. Use this to change colors, fonts, spacing, etc.",
    input_schema: {
      type: "object" as const,
      properties: {
        variables: {
          type: "object",
          description:
            'An object mapping CSS variable names to values (e.g., {"--color-primary": "#ff6b9d"})',
          additionalProperties: { type: "string" },
        },
      },
      required: ["variables"],
    },
  },
  {
    name: "deleteFile",
    description: "Delete a file from the project.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description: "Relative path from the project root",
        },
      },
      required: ["path"],
    },
  },
];
