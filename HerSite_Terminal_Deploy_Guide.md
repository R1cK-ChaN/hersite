# HerSite — Terminal-Only Deployment Guide

Deploy the editor+agent to Railway and her published website to Vercel,
entirely from your terminal. No browser dashboards needed.

---

## Prerequisites

You need these installed on your machine:

```bash
# Node.js 22+ (you already have this)
node --version

# pnpm (you already have this)
pnpm --version

# Git (you already have this)
git --version
```

---

## Step 1: Install CLIs

```bash
# Install Railway CLI
# macOS
brew install railway

# Linux / WSL
bash <(curl -fsSL cli.new)

# Or via npm (any OS)
npm install -g @railway/cli

# Install Vercel CLI
npm install -g vercel

# Verify both
railway --version
vercel --version
```

---

## Step 2: Login to Both Services

```bash
# Login to Railway (opens browser for OAuth)
railway login

# If you're in a headless env (SSH/codespace):
railway login --browserless

# Login to Vercel
vercel login
# Choose your login method (GitHub recommended since your code is there)
```

---

## Step 3: Prepare Your Repo for Cloud Deployment

Before deploying, you need a few changes to your codebase.

### 3a. Add a Dockerfile

```bash
cd /path/to/hersite

cat > Dockerfile << 'EOF'
FROM node:22-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install system deps for sharp (image processing) and git
RUN apk add --no-cache git python3 make g++

WORKDIR /app

# Copy package files first (better Docker layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/editor/package.json ./apps/editor/
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy all source code
COPY . .

# Build everything (shared → editor → server via Turborepo)
RUN pnpm build

# Copy templates into the image
RUN cp -r templates /app/templates

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "apps/server/dist/index.js"]
EOF
```

### 3b. Add .dockerignore

```bash
cat > .dockerignore << 'EOF'
node_modules
.git
dist
*.md
.env
.env.*
!.env.example
.claude
.husky
EOF
```

### 3c. Make Express serve the built React editor in production

Add this to the END of your `apps/server/src/index.ts` (before `app.listen`):

```typescript
// --- Production: serve built React editor ---
if (process.env.NODE_ENV === "production") {
  const editorDist = path.join(__dirname, "../../editor/dist");
  app.use(express.static(editorDist));

  // SPA fallback: non-API routes serve index.html
  app.get("*", (req, res, next) => {
    if (
      req.path.startsWith("/api") ||
      req.path.startsWith("/socket.io") ||
      req.path.startsWith("/preview")
    ) {
      return next();
    }
    res.sendFile(path.join(editorDist, "index.html"));
  });
}
```

### 3d. Fix Socket.IO client to connect to same origin in production

In `apps/editor/src/` wherever you initialize Socket.IO, change to:

```typescript
import { io } from "socket.io-client";

const socket = io(import.meta.env.DEV ? "http://localhost:3001" : undefined, {
  transports: ["websocket", "polling"],
});

export default socket;
```

When `undefined`, Socket.IO auto-connects to the same origin — which is what we want in production since Express serves both the frontend and WebSocket.

### 3e. Make project paths configurable via env vars

In your server config, ensure paths read from env:

```typescript
// apps/server/src/config.ts or wherever you define paths
import path from "path";

export const PROJECTS_DIR =
  process.env.PROJECTS_DIR || path.join(process.cwd(), "projects");
export const UPLOADS_DIR =
  process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
export const TEMPLATES_DIR =
  process.env.TEMPLATES_DIR || path.join(process.cwd(), "templates");
```

Then use `PROJECTS_DIR`, `UPLOADS_DIR`, `TEMPLATES_DIR` in your services instead of hardcoded paths.

### 3f. Commit everything

```bash
git add -A
git commit -m "feat: add Docker support and production config for cloud deploy"
git push origin main
```

---

## Step 4: Deploy the Editor + Agent Server to Railway

```bash
cd /path/to/hersite

# Create a new Railway project
railway init
# When prompted:
#   - Name: hersite
#   - Workspace: (select your workspace)

# Link your local directory to the project
railway link
# Select the project you just created

# --- Set environment variables ---
railway variables --set "NODE_ENV=production"
railway variables --set "PORT=3001"
railway variables --set "ANTHROPIC_API_KEY=sk-ant-your-key-here"
railway variables --set "PROJECTS_DIR=/data/projects"
railway variables --set "UPLOADS_DIR=/data/uploads"
railway variables --set "TEMPLATES_DIR=/app/templates"

# Optional: for Vercel deploy from the agent
railway variables --set "VERCEL_TOKEN=your-vercel-token-here"

# Optional: for Git push from the agent
railway variables --set "GITHUB_TOKEN=ghp_your-token-here"
railway variables --set "GITHUB_REPO=R1cK-ChaN/her-website"

# --- Add a persistent volume for project files ---
# This ensures her files survive restarts/redeployments
railway volume add --mount /data
# If prompted for a name, call it "hersite-data"

# --- Deploy! ---
# This uploads your local code, builds via Dockerfile, and deploys
railway up

# Watch the build logs
railway logs --build

# Once deployed, watch runtime logs
railway logs

# --- Generate a public URL ---
railway domain
# This generates something like: hersite-production-xxxx.up.railway.app
# Or you can add a custom domain:
# railway domain --set edit.hername.com
```

### Verify it's running

```bash
# Check status
railway status

# Check health endpoint (if you have one)
curl https://hersite-production-xxxx.up.railway.app/api/health

# Open in browser
railway open
```

---

## Step 5: Set Up Her Published Website on Vercel

This is a SEPARATE project — the Astro site that gets deployed when she clicks "Publish".

### 5a. Create a GitHub repo for her website

```bash
# Create a new directory for her website
mkdir ~/her-website && cd ~/her-website

# Initialize with one of your Astro templates
cp -r /path/to/hersite/templates/blog-portfolio/* .

# Init git
git init
git add -A
git commit -m "Initial site from HerSite template"

# Create the GitHub repo (using GitHub CLI, or manually)
# If you have GitHub CLI:
gh repo create her-website --public --source=. --push

# If you don't have gh CLI, create manually on github.com then:
git remote add origin https://github.com/R1cK-ChaN/her-website.git
git push -u origin main
```

### 5b. Deploy to Vercel via CLI

```bash
cd ~/her-website

# Deploy to Vercel (first time — interactive setup)
vercel

# When prompted:
#   Set up and deploy? → Y
#   Which scope? → (your account)
#   Link to existing project? → N
#   Project name? → her-website
#   Directory? → ./
#   Override settings? → N
#   (Vercel auto-detects Astro)

# Deploy to production
vercel --prod

# Your site is now live at: her-website.vercel.app
```

### 5c. Add a custom domain (optional)

```bash
# Add custom domain
vercel domains add hername.com

# Vercel will show you DNS records to add at your domain registrar:
#   Type: A     → 76.76.21.21
#   Type: CNAME → cname.vercel-dns.com

# Verify once DNS propagates:
vercel domains verify hername.com
```

### 5d. Get Vercel token for programmatic deploys

Your HerSite agent needs this to deploy on her behalf:

```bash
# Create a token (this opens browser, or use Vercel dashboard)
# Go to: https://vercel.com/account/tokens
# Create a token named "hersite-deploy"
# Copy the token

# Set it in Railway so your agent can use it
railway variables --set "VERCEL_TOKEN=your-new-token"

# Also get project + org IDs
cd ~/her-website
vercel project ls
# Note the project ID

vercel teams ls
# Note the org/team ID (or your username for personal)

# Set these in Railway too
railway variables --set "VERCEL_PROJECT_ID=prj_xxxxxxxxxxxx"
railway variables --set "VERCEL_ORG_ID=team_xxxxxxxxxxxx"
```

---

## Step 6: Connect Everything

Now your agent server on Railway needs to be able to:

1. Push code to `her-website` GitHub repo
2. Trigger Vercel deploy

### GitHub token for pushing

```bash
# Create a GitHub Personal Access Token:
# https://github.com/settings/tokens/new
# Scopes needed: repo (full control)
# Copy the token

# Set it in Railway
railway variables --set "GITHUB_TOKEN=ghp_xxxxxxxxxxxx"
railway variables --set "GITHUB_REPO=R1cK-ChaN/her-website"
```

### Verify all variables are set

```bash
cd /path/to/hersite
railway variables
# Should show:
#   ANTHROPIC_API_KEY = sk-ant-...
#   NODE_ENV = production
#   PORT = 3001
#   PROJECTS_DIR = /data/projects
#   UPLOADS_DIR = /data/uploads
#   TEMPLATES_DIR = /app/templates
#   VERCEL_TOKEN = ...
#   VERCEL_PROJECT_ID = ...
#   VERCEL_ORG_ID = ...
#   GITHUB_TOKEN = ghp_...
#   GITHUB_REPO = R1cK-ChaN/her-website
```

---

## Step 7: Redeploy After Changes

Whenever you update the code:

```bash
cd /path/to/hersite
git add -A
git commit -m "your changes"
git push origin main

# Deploy to Railway
railway up

# Or if you connected GitHub auto-deploy in Railway,
# it deploys automatically on push
```

---

## Complete Command Cheat Sheet

```bash
# ========== ONE-TIME SETUP ==========

# Install CLIs
npm install -g @railway/cli vercel

# Login
railway login
vercel login

# ========== DEPLOY EDITOR (Railway) ==========

cd /path/to/hersite
railway init                          # Create project
railway link                          # Link directory

# Set all env vars
railway variables \
  --set "NODE_ENV=production" \
  --set "PORT=3001" \
  --set "ANTHROPIC_API_KEY=sk-ant-xxx" \
  --set "PROJECTS_DIR=/data/projects" \
  --set "UPLOADS_DIR=/data/uploads" \
  --set "TEMPLATES_DIR=/app/templates" \
  --set "VERCEL_TOKEN=xxx" \
  --set "VERCEL_PROJECT_ID=xxx" \
  --set "VERCEL_ORG_ID=xxx" \
  --set "GITHUB_TOKEN=ghp_xxx" \
  --set "GITHUB_REPO=R1cK-ChaN/her-website"

railway volume add --mount /data      # Persistent storage
railway up                            # Deploy!
railway domain                        # Get public URL
railway logs                          # Watch logs

# ========== DEPLOY HER SITE (Vercel) ==========

cd ~/her-website
vercel                                # First-time setup
vercel --prod                         # Production deploy
vercel domains add hername.com        # Custom domain (optional)

# ========== ONGOING ==========

cd /path/to/hersite
railway up                            # Redeploy after code changes
railway logs                          # Check logs
railway status                        # Check status

# ========== DEBUGGING ==========

railway logs --build                  # Build-time logs
railway logs                          # Runtime logs
railway ssh                           # SSH into running container
curl https://your-url.up.railway.app/api/health  # Health check
```

---

## Architecture After Deployment

```
Your GF opens browser
        │
        ▼
┌──────────────────────────────────────┐
│  Railway (hersite-xxx.up.railway.app)│
│                                      │
│  Express serves React editor         │
│  Socket.IO handles chat              │
│  Claude API generates code           │
│  Files stored on persistent volume   │
│                                      │
│  On "Publish":                       │
│    1. astro build                    │
│    2. git push → her-website repo    │
│    3. Vercel auto-deploys            │
└──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────┐
│  Vercel (her-website.vercel.app)     │
│                                      │
│  Her published Astro website         │
│  Auto-deploys on git push            │
│  Custom domain: hername.com          │
└──────────────────────────────────────┘
```

---

## Estimated Costs

| Service           | Cost           | Notes                      |
| ----------------- | -------------- | -------------------------- |
| Railway (Hobby)   | ~$5/mo         | $5 credit included         |
| Claude API        | ~$5-15/mo      | Depends on chat usage      |
| Vercel (Hobby)    | $0             | Free for personal projects |
| Domain (optional) | ~$10/year      | From any registrar         |
| **Total**         | **~$10-20/mo** |                            |

---

## Troubleshooting

### "Cannot connect to WebSocket"

Make sure Railway generated a public domain and your Socket.IO client
uses relative URL (no hardcoded localhost) in production.

### "Build failed on Railway"

```bash
railway logs --build    # Check build logs
railway ssh             # SSH in and inspect
```

Common issues: missing system deps in Dockerfile, pnpm lockfile mismatch.

### "Vercel deploy fails from agent"

```bash
# Test locally first
cd ~/her-website
VERCEL_TOKEN=xxx vercel deploy --prod --token=$VERCEL_TOKEN --yes
```

Make sure VERCEL_TOKEN, VERCEL_PROJECT_ID, VERCEL_ORG_ID are all set.

### "Files lost after Railway redeploy"

Make sure the volume is mounted at `/data` and your app writes to
`PROJECTS_DIR=/data/projects`. Check:

```bash
railway volume list     # Verify volume exists
railway ssh             # SSH in, check ls /data/
```

### "Claude Code OAuth not working on Railway"

The Claude Code OAuth flow (`~/.claude/.credentials.json`) won't work
on Railway since it's a different machine. Use `ANTHROPIC_API_KEY`
env var instead — this is the most reliable method for cloud deployment.
