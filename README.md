# HerSite

An AI-powered personal website builder for non-coders. Users interact through a chat sidebar to build and customize their Astro-based personal website, with a live preview alongside the chat. Built as a single-user local app — no auth required.

## Live Deployment

| Service            | URL                   | Purpose                        |
| ------------------ | --------------------- | ------------------------------ |
| **Editor**         | `edit.yourdomain.com` | AI-powered editor + chat agent |
| **Published Site** | `yourdomain.com`      | Live Astro website             |

- **Editor** is hosted on Railway (Docker container with persistent volume)
- **Published site** is hosted on Vercel (static Astro build, auto-deployed via REST API)
- **AI agent** uses OpenRouter API (configurable model via `AI_MODEL` env var)

## Current Status

**Phase 1 MVP — deployed to production.**

All source code is written, TypeScript compiles cleanly, and the app is deployed and running. The editor serves the React frontend and Express API on a single Railway service. The published website deploys to Vercel via the REST API when the user clicks "Publish".

### What's Built

| Area                             | Status | Details                                                                                                                              |
| -------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Monorepo scaffolding             | Done   | pnpm workspaces + Turborepo, shared TS config, pre-commit hooks (husky + lint-staged + prettier)                                     |
| Shared types (`packages/shared`) | Done   | `ChatMessage`, `FileAttachment`, `ProjectInfo`, `DeployStatus`, typed Socket.IO events                                               |
| Astro templates (3)              | Done   | Blog, Portfolio, Blog+Portfolio — all with Valentine's pink theme, CSS custom properties, MDX content collections, responsive design |
| Backend server (`apps/server`)   | Done   | Express + Socket.IO, 7 service modules, Claude API agent with tool-use loop, file upload, docx conversion, deploy, git               |
| Frontend editor (`apps/editor`)  | Done   | React 19 + Vite 6, Zustand stores, 30+ components (wizard, chat, preview, publish), Tailwind CSS v4 + shadcn-style UI primitives     |
| Wiring & integration             | Done   | Vite proxy config, Turborepo pipeline, Socket.IO event binding                                                                       |
| Docker + cloud deploy            | Done   | Dockerfile, Railway deployment with persistent volume, Vercel for published site                                                     |
| Custom domains                   | Done   | Custom domains for editor and published site                                                                                         |

## Architecture

```
hersite/
├── apps/
│   ├── editor/          # React + Vite frontend (port 5173)
│   └── server/          # Express + Socket.IO backend (port 3001)
├── packages/
│   └── shared/          # Shared TypeScript types & event definitions
└── templates/
    ├── blog/            # Astro blog template
    ├── portfolio/       # Astro portfolio template
    └── blog-portfolio/  # Combined blog + portfolio template
```

### Frontend (`apps/editor`)

- **React 19** with **Vite 6** and **Tailwind CSS v4**
- **Zustand** for state management (4 stores: chat, project, preview, UI)
- **Socket.IO client** for real-time communication with the server
- **shadcn-style UI primitives** built on Radix UI (Button, Dialog, Progress, ScrollArea, etc.)
- **Framer Motion** for wizard step animations
- **react-markdown** + remark-gfm for rendering agent responses
- **react-dropzone** for drag-and-drop file uploads
- **sonner** for toast notifications

Key UI flows:

- **Setup Wizard** — Welcome > Template Selection (3 templates) > Profile Setup (name/tagline) > Site Generation
- **Chat Sidebar** — Message list with streaming support, file attachment chips, markdown rendering
- **Preview Panel** — iframe showing the Astro dev server output, desktop/mobile device toggle
- **Publish Flow** — Publish button > confirmation dialog > deploy status badge in status bar

### Backend (`apps/server`)

- **Express** HTTP server with **Socket.IO** for real-time events
- **Multer** for multipart file upload handling
- **http-proxy-middleware** to proxy preview iframe requests to the Astro dev server

#### Services

| Service                  | File                               | Purpose                                                                                                                                                                             |
| ------------------------ | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ProjectService**       | `services/ProjectService.ts`       | Scaffolds new projects by copying Astro templates, personalizes site content, manages project file read/write with path traversal protection                                        |
| **BuildService**         | `services/BuildService.ts`         | Two-mode preview: spawns Astro dev server locally, or builds and serves static files in production. Proxies preview requests via `/preview` route                                   |
| **AgentService**         | `services/agent/AgentService.ts`   | Orchestrates Claude API calls with an agentic tool-use loop — sends user messages, executes tool calls (file operations, theme updates, blog post creation), streams responses back |
| **FileConverterService** | `services/FileConverterService.ts` | Converts `.docx` files to MDX blog posts using mammoth (docx > HTML), turndown (HTML > Markdown), and sharp (image optimization to WebP)                                            |
| **DeployService**        | `services/DeployService.ts`        | Deploys via Vercel REST API v13 — builds the project, uploads files as base64, returns the deployment URL                                                                           |
| **GitService**           | `services/GitService.ts`           | Git operations via simple-git — init, commit, history, revert. Optional remote repo for persistent storage (`HERSITE_GIT_REMOTE`)                                                   |
| **CredentialService**    | `services/CredentialService.ts`    | Resolves API credentials: env var first, then Claude Code OAuth token from `~/.claude/.credentials.json`                                                                            |

#### Agent Tools

The Claude agent has access to 8 tools for modifying the user's Astro site:

| Tool                                                 | Description                                      |
| ---------------------------------------------------- | ------------------------------------------------ |
| `readFile(path)`                                     | Read a project file's contents                   |
| `writeFile(path, content)`                           | Create or overwrite a file                       |
| `modifyFile(path, search, replace)`                  | Find-and-replace within a file                   |
| `listFiles()`                                        | List all project files                           |
| `createBlogPost(title, content, description, tags?)` | Create an MDX blog post with frontmatter         |
| `createPage(slug, title, content)`                   | Create a new Astro page and add it to navigation |
| `updateTheme(variables)`                             | Update CSS custom properties in theme.css        |
| `deleteFile(path)`                                   | Remove a file from the project                   |

#### Socket Events

| Direction       | Event             | Purpose                                                 |
| --------------- | ----------------- | ------------------------------------------------------- |
| Client > Server | `chat:message`    | Send a user message (with optional file attachment IDs) |
| Client > Server | `project:create`  | Create a new project from a template                    |
| Client > Server | `publish:confirm` | Trigger build + deploy to Vercel                        |
| Server > Client | `agent:message`   | Complete agent response                                 |
| Server > Client | `agent:typing`    | Agent thinking indicator                                |
| Server > Client | `agent:stream`    | Streamed response chunks                                |
| Server > Client | `agent:error`     | Error message                                           |
| Server > Client | `preview:update`  | Files changed, refresh preview                          |
| Server > Client | `deploy:status`   | Deploy progress (idle/deploying/deployed/failed)        |
| Server > Client | `project:created` | Project scaffolding complete                            |

### Templates

All three templates share:

- **CSS custom properties** for theming (`--color-primary`, `--color-bg`, `--font-body`, etc.)
- **Astro v5 content layer API** with glob loader for MDX content collections
- **Layout.astro** with responsive nav, footer ("Built with HerSite")
- **Valentine's pink theme** (`#e91e8c` primary)
- **Google Fonts** (Inter)
- **Mobile-responsive** design
- **No Tailwind** — pure CSS with custom properties so the agent can easily modify styles

#### Blog Template

- Home page with recent posts list
- Blog listing page with date/tag display
- Individual post page with rendered MDX
- 2 sample blog posts

#### Portfolio Template

- Home page with responsive CSS grid (3/2/1 columns)
- Portfolio listing with project cards (hover effects, image zoom)
- Individual project page with CSS-only lightbox
- 3 sample projects with placeholder SVG images

#### Blog + Portfolio Template

- Combined home page with "Recent Posts" and "Featured Work" sections
- Full blog section (listing + individual posts)
- Full portfolio section (grid + individual projects)
- "View all" links between sections

## Getting Started

### Prerequisites

- **Node.js** >= 22
- **pnpm** >= 9

### Setup

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev
```

This starts:

- **Editor** at `http://localhost:5173` (Vite dev server)
- **Server** at `http://localhost:3001` (Express + Socket.IO)

The Vite dev server proxies `/api`, `/socket.io`, and `/preview` requests to the backend server.

### API Credentials

The agent needs access to the Anthropic API. Credentials are resolved in this order:

| Priority | Source                      | How to set up                                                                     |
| -------- | --------------------------- | --------------------------------------------------------------------------------- |
| 1        | `ANTHROPIC_API_KEY` env var | Add to `.env` file: `ANTHROPIC_API_KEY=sk-ant-...`                                |
| 2        | Claude Code OAuth token     | Run `claude login` — the server reads `~/.claude/.credentials.json` automatically |

If you have Claude Code installed and authenticated, **no extra setup is needed** — the server will use your existing Claude Code session token. The token is read from `~/.claude/.credentials.json`, validated for expiry and the `user:inference` scope, and cached with automatic re-reads every 30 seconds.

The server logs which credential source it's using on startup:

```
HerSite server running on http://localhost:3001
Using Claude Code OAuth token for AI agent
```

To check credential status at runtime: `GET /api/health` returns `{ "status": "ok", "credentialSource": "claude-code" | "env" | "none" }`.

### Usage Flow

1. Open `http://localhost:5173` in your browser
2. The **Setup Wizard** appears — choose a template, enter your name and tagline
3. The server scaffolds your site from the template and starts an Astro dev server
4. The **Editor** loads with a chat sidebar and live preview
5. Type natural language instructions in the chat (e.g., "Change the primary color to blue", "Add a new blog post about my trip to Paris")
6. The AI agent modifies your site files and the preview updates via Astro HMR
7. Click **Publish** to build and deploy to Vercel

## Tech Stack

| Layer              | Technology                                                          |
| ------------------ | ------------------------------------------------------------------- |
| Frontend framework | React 19                                                            |
| Frontend build     | Vite 6                                                              |
| Styling            | Tailwind CSS v4, shadcn-style components, Radix UI                  |
| State management   | Zustand 5                                                           |
| Real-time          | Socket.IO 4                                                         |
| Backend            | Express 4, Node.js 22                                               |
| AI                 | Claude API (@anthropic-ai/sdk) with tool-use, OpenRouter compatible |
| Site framework     | Astro 5 with MDX                                                    |
| File conversion    | mammoth (docx), turndown (HTML>MD), sharp (images)                  |
| Version control    | simple-git                                                          |
| Deployment         | Vercel REST API v13                                                 |
| Monorepo           | pnpm workspaces, Turborepo                                          |
| Code quality       | TypeScript 5 (strict), husky, lint-staged, prettier                 |

## Deployment

HerSite supports two modes of operation controlled by `NODE_ENV`:

| Mode            | `NODE_ENV`             | Preview strategy                                                   | Use case                              |
| --------------- | ---------------------- | ------------------------------------------------------------------ | ------------------------------------- |
| **Development** | unset or `development` | Spawns `astro dev` child process, proxies via `/preview`           | Local development                     |
| **Production**  | `production`           | Runs `astro build`, serves static files from `dist/` at `/preview` | Cloud hosting (Render, Railway, etc.) |

In production mode, Express also serves the built React editor as a SPA with fallback routing.

### Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

| Variable                | Required    | Default                      | Description                                                                                 |
| ----------------------- | ----------- | ---------------------------- | ------------------------------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`     | No\*        | —                            | API key. Supports Anthropic keys or OpenRouter keys. \*Not needed if using Claude Code CLI  |
| `ANTHROPIC_BASE_URL`    | No          | `https://api.anthropic.com`  | API base URL. Set to `https://openrouter.ai/api/v1` for OpenRouter                          |
| `AI_MODEL`              | No          | `claude-sonnet-4-5-20250929` | Model ID. For OpenRouter, use `anthropic/claude-sonnet-4-5-20250929`                        |
| `VERCEL_TOKEN`          | For publish | —                            | Vercel personal access token for deployment                                                 |
| `VERCEL_PROJECT_NAME`   | No          | `hersite`                    | Vercel project name used in REST API deployments                                            |
| `VERCEL_PROJECT_ID`     | No          | —                            | Vercel project ID (from `.vercel/project.json`)                                             |
| `VERCEL_ORG_ID`         | No          | —                            | Vercel org/team ID (from `.vercel/project.json`)                                            |
| `PROJECTS_DIR`          | No          | `./projects`                 | Directory for user project files. Set to `/data/projects` on Railway with a volume          |
| `UPLOADS_DIR`           | No          | `./uploads`                  | Directory for uploaded files. Set to `/data/uploads` on Railway with a volume               |
| `TEMPLATES_DIR`         | No          | `./templates`                | Directory containing Astro templates                                                        |
| `HERSITE_GIT_REMOTE`    | No          | —                            | Git remote URL for persistent project storage (e.g. a private GitHub repo)                  |
| `HERSITE_AUTH_PASSWORD` | No          | —                            | When set, all routes require HTTP Basic auth with this password                             |
| `EDITOR_ORIGIN`         | No          | `http://localhost:5173`      | Allowed CORS origin for the frontend (auto-permissive in production)                        |
| `VITE_SERVER_URL`       | No          | `/`                          | Socket.IO server URL for the frontend (set when server and editor are on different origins) |
| `PORT`                  | No          | `3001`                       | Server port                                                                                 |
| `NODE_ENV`              | No          | `development`                | Set to `production` for build-and-serve mode                                                |

### Deploying to Railway (Current Setup)

The editor + agent server is deployed to Railway using a Dockerfile.

1. **Deploy from the Linux filesystem** (WSL2 note: deploy from `~/` not `/mnt/c/` to avoid file encoding issues):

   ```bash
   railway login
   railway init
   railway link
   railway service <service-name>
   ```

2. **Set environment variables:**

   ```bash
   railway variables --set "NODE_ENV=production"
   railway variables --set "PORT=3001"
   railway variables --set "ANTHROPIC_API_KEY=sk-or-v1-..."
   railway variables --set "ANTHROPIC_BASE_URL=https://openrouter.ai/api/v1"
   railway variables --set "AI_MODEL=anthropic/claude-sonnet-4-5-20250929"
   railway variables --set "PROJECTS_DIR=/data/projects"
   railway variables --set "UPLOADS_DIR=/data/uploads"
   railway variables --set "TEMPLATES_DIR=/app/templates"
   railway variables --set "HERSITE_AUTH_PASSWORD=..."
   railway variables --set "VERCEL_TOKEN=..."
   railway variables --set "VERCEL_PROJECT_ID=..."
   railway variables --set "VERCEL_ORG_ID=..."
   railway variables --set "VERCEL_PROJECT_NAME=her-website"
   ```

3. **Add a persistent volume** (so project files survive redeployments):

   ```bash
   railway volume add --mount-path /data
   ```

4. **Deploy:**

   ```bash
   railway up
   railway domain   # generate a public URL or add a custom domain
   ```

### Deploying Published Site to Vercel

The published Astro website is a separate Vercel project.

1. Copy a template and deploy:

   ```bash
   mkdir ~/her-website && cp -r templates/blog-portfolio/* ~/her-website/
   cd ~/her-website && vercel --yes && vercel --prod
   ```

2. Add a custom domain:

   ```bash
   vercel domains add yourdomain.com
   # Then add an A record pointing to 76.76.21.21 at your DNS registrar
   ```

3. The Vercel project/org IDs (needed by Railway) are in `~/her-website/.vercel/project.json`.

### Production Preview Behavior

- After a project is created, the server runs `astro build` and serves the static output at `/preview`
- When the AI agent modifies files, the server automatically rebuilds and the preview refreshes
- No child process management needed — all rendering is done via static file serving

### Persistent Storage with Git

By default, project files only exist on the server's filesystem. If the server restarts (common on free-tier cloud platforms), the project is lost.

Setting `HERSITE_GIT_REMOTE` enables Git-based persistence:

- On project creation, the repo is initialized and the remote is added
- Every file change is committed **and pushed** to the remote
- On server restart, the project can be restored by cloning from the remote

Example: create a private GitHub repo and set `HERSITE_GIT_REMOTE=https://<token>@github.com/you/hersite-data.git`.

### Publishing to Vercel

The publish flow uses the **Vercel REST API v13** (no CLI required):

1. User clicks **Publish** in the editor
2. Server builds the Astro project (`astro build`)
3. All files in `dist/` are base64-encoded and uploaded via `POST /v13/deployments`
4. The deployment URL is returned and shown in the status bar

Requirements:

- `VERCEL_TOKEN` — generate at [vercel.com/account/tokens](https://vercel.com/account/tokens)
- `VERCEL_PROJECT_NAME` (optional) — defaults to `hersite`

### Basic Authentication

Set `HERSITE_AUTH_PASSWORD` to enable HTTP Basic auth on all routes (except `/api/health`). The username can be anything — only the password is checked.

This is recommended for any public deployment to prevent unauthorized access.

### Cross-Origin Setup

When the editor and server run on different origins (e.g. editor on a CDN, server on a different host):

1. Set `EDITOR_ORIGIN` on the server to the editor's URL (for CORS)
2. Set `VITE_SERVER_URL` at editor build time to the server's full URL (for Socket.IO)

For same-origin deployments (single port), no configuration is needed.

## Known Limitations (MVP)

- **Single-user only** — one project at a time
- **Agent model** — configurable via `AI_MODEL` env var (defaults to `claude-sonnet-4-5-20250929`)
- **No tests** — test suite not yet implemented
- **Preview proxy** — in dev mode, the Astro dev server port is detected from stdout parsing, which could be fragile
- **Upload limits** — max 10MB per file, max 5 files per request
- **WSL2 deploy** — must deploy from the native Linux filesystem (`~/`), not from `/mnt/c/`, due to file encoding issues with the Railway CLI
