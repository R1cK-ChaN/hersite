import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage } from "@hersite/shared";
import { v4 as uuid } from "uuid";
import { ProjectService } from "../ProjectService.js";
import { CredentialService } from "../CredentialService.js";
import { agentTools } from "./tools.js";
import { buildSystemPrompt } from "./systemPrompt.js";
import { buildSiteContext } from "./context.js";
import { listFilesRecursive } from "../../utils/fileUtils.js";

let cachedClient: Anthropic | null = null;
let cachedApiKey: string | null = null;

async function getClient(): Promise<Anthropic> {
  const apiKey = await CredentialService.getApiKey();

  if (!cachedClient || cachedApiKey !== apiKey) {
    const options: ConstructorParameters<typeof Anthropic>[0] = { apiKey };
    if (process.env.ANTHROPIC_BASE_URL) {
      options.baseURL = process.env.ANTHROPIC_BASE_URL;
    }
    cachedClient = new Anthropic(options);
    cachedApiKey = apiKey;
    const source = await CredentialService.getCredentialSource();
    console.log(`Anthropic client initialized (source: ${source})`);
  }

  return cachedClient;
}

type MessageContent =
  | string
  | Anthropic.ContentBlock[]
  | Anthropic.ToolResultBlockParam[];

interface ConversationMessage {
  role: "user" | "assistant";
  content: MessageContent;
}

/** Per-user conversation histories */
const conversationHistories = new Map<string, ConversationMessage[]>();

function getHistory(userId: string): ConversationMessage[] {
  let history = conversationHistories.get(userId);
  if (!history) {
    history = [];
    conversationHistories.set(userId, history);
  }
  return history;
}

async function executeTool(
  userId: string,
  name: string,
  input: Record<string, unknown>,
): Promise<string> {
  try {
    switch (name) {
      case "readFile": {
        const content = await ProjectService.getFileContent(
          userId,
          input.path as string,
        );
        return content;
      }

      case "writeFile": {
        await ProjectService.writeFile(
          userId,
          input.path as string,
          input.content as string,
        );
        return `File written successfully: ${input.path}`;
      }

      case "modifyFile": {
        const content = await ProjectService.getFileContent(
          userId,
          input.path as string,
        );
        const search = input.search as string;
        const replace = input.replace as string;
        if (!content.includes(search)) {
          return `Error: Could not find the search text in ${input.path}. Try reading the file first to see its exact contents.`;
        }
        const updated = content.replace(search, replace);
        await ProjectService.writeFile(userId, input.path as string, updated);
        return `File modified successfully: ${input.path}`;
      }

      case "listFiles": {
        const projectPath = ProjectService.getProjectPath(userId);
        try {
          const files = await listFilesRecursive(projectPath);
          return JSON.stringify(files);
        } catch {
          return JSON.stringify([]);
        }
      }

      case "createBlogPost": {
        const slug = (input.title as string)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        const date = new Date().toISOString().split("T")[0];
        const tags = (input.tags as string[]) || [];
        const frontmatter = [
          "---",
          `title: "${input.title}"`,
          `description: "${input.description}"`,
          `pubDate: ${date}`,
          tags.length > 0
            ? `tags: [${tags.map((t) => `"${t}"`).join(", ")}]`
            : "",
          "---",
        ]
          .filter(Boolean)
          .join("\n");

        const content = `${frontmatter}\n\n${input.content}`;
        await ProjectService.writeFile(
          userId,
          `src/content/blog/${slug}.mdx`,
          content,
        );
        return `Blog post created: src/content/blog/${slug}.mdx`;
      }

      case "createPage": {
        const pageContent = `---
import Layout from '../layouts/Layout.astro';
---

<Layout title="${input.title}">
  <article>
    <h1>${input.title}</h1>
    ${input.content}
  </article>
</Layout>
`;
        await ProjectService.writeFile(
          userId,
          `src/pages/${input.slug}.astro`,
          pageContent,
        );

        // Add to navigation in Layout.astro
        try {
          const layoutContent = await ProjectService.getFileContent(
            userId,
            "src/layouts/Layout.astro",
          );
          const navLinkHtml = `<a href="/${input.slug}">${input.title}</a>`;
          const updatedLayout = layoutContent.replace(
            "</nav>",
            `  ${navLinkHtml}\n      </nav>`,
          );
          await ProjectService.writeFile(
            userId,
            "src/layouts/Layout.astro",
            updatedLayout,
          );
        } catch {
          // Layout might not have nav in expected format
        }

        return `Page created: src/pages/${input.slug}.astro (and added to navigation)`;
      }

      case "updateTheme": {
        const variables = input.variables as Record<string, string>;
        let themeContent = await ProjectService.getFileContent(
          userId,
          "src/styles/theme.css",
        );

        for (const [varName, value] of Object.entries(variables)) {
          const regex = new RegExp(
            `(${varName.replace("--", "\\-\\-")}):\\s*[^;]+;`,
          );
          if (regex.test(themeContent)) {
            themeContent = themeContent.replace(regex, `$1: ${value};`);
          }
        }

        await ProjectService.writeFile(
          userId,
          "src/styles/theme.css",
          themeContent,
        );
        return `Theme updated: ${Object.keys(variables).join(", ")}`;
      }

      case "deleteFile": {
        await ProjectService.deleteFile(userId, input.path as string);
        return `File deleted: ${input.path}`;
      }

      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

export const AgentService = {
  async processMessage(
    userId: string,
    userMessage: string,
    attachments?: string[],
    onStream?: (chunk: string, messageId: string) => void,
  ): Promise<{ response: ChatMessage; changedFiles: string[] }> {
    const messageId = uuid();
    const changedFiles: string[] = [];
    const conversationHistory = getHistory(userId);

    // Build system prompt with current context
    const context = await buildSiteContext(userId);
    const systemPrompt = buildSystemPrompt(context);

    // Add user message to history
    let userContent = userMessage;
    if (attachments && attachments.length > 0) {
      userContent += `\n\n[Attached files: ${attachments.join(", ")}]`;
    }
    conversationHistory.push({ role: "user", content: userContent });

    let fullResponse = "";

    // Agentic loop — keep calling Claude until it stops using tools
    let messages: Anthropic.MessageParam[] = conversationHistory.map((m) => ({
      role: m.role,
      content: m.content as Anthropic.MessageParam["content"],
    }));

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const anthropic = await getClient();
      const response = await anthropic.messages.create({
        model: process.env.AI_MODEL || "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        system: systemPrompt,
        tools: agentTools,
        messages,
      });

      // Process the response content blocks
      const toolUseBlocks: Anthropic.ToolUseBlock[] = [];
      let textContent = "";

      for (const block of response.content) {
        if (block.type === "text") {
          textContent += block.text;
          if (onStream) {
            onStream(block.text, messageId);
          }
        } else if (block.type === "tool_use") {
          toolUseBlocks.push(block);
        }
      }

      if (textContent) {
        fullResponse += textContent;
      }

      // If no tool calls, we're done
      if (toolUseBlocks.length === 0 || response.stop_reason === "end_turn") {
        conversationHistory.push({
          role: "assistant",
          content: response.content,
        });
        break;
      }

      // Execute tool calls and build tool results
      conversationHistory.push({
        role: "assistant",
        content: response.content,
      });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUseBlocks) {
        const result = await executeTool(
          userId,
          toolUse.name,
          toolUse.input as Record<string, unknown>,
        );

        // Track changed files
        if (
          [
            "writeFile",
            "modifyFile",
            "createBlogPost",
            "createPage",
            "updateTheme",
            "deleteFile",
          ].includes(toolUse.name)
        ) {
          const input = toolUse.input as Record<string, unknown>;
          if (input.path) changedFiles.push(input.path as string);
          if (toolUse.name === "createBlogPost") {
            const slug = (input.title as string)
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "");
            changedFiles.push(`src/content/blog/${slug}.mdx`);
          }
          if (toolUse.name === "updateTheme") {
            changedFiles.push("src/styles/theme.css");
          }
        }

        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: result,
        });
      }

      // Add tool results to messages for next iteration
      conversationHistory.push({
        role: "user",
        content: toolResults,
      });
      messages = conversationHistory.map((m) => ({
        role: m.role,
        content: m.content as Anthropic.MessageParam["content"],
      }));
    }

    const chatMessage: ChatMessage = {
      id: messageId,
      role: "agent",
      content: fullResponse,
      timestamp: Date.now(),
      status: "complete",
    };

    return { response: chatMessage, changedFiles };
  },

  clearHistory(userId: string): void {
    conversationHistories.delete(userId);
  },
};
