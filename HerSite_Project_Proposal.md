# 💌 HerSite — An AI-Powered Personal Branding Platform for Non-Coders

## Comprehensive Project Proposal

---

## 1. Project Vision

**HerSite** is an open-source, AI-agent-powered personal website builder designed for people who are comfortable with everyday office tools (Word, Excel, PowerPoint, Google Docs) but have zero coding experience. It enables users to build and maintain a professional personal brand — including blogs, photo portfolios, and content pages — through a conversational chat interface paired with a live website preview.

### Origin Story

This project started as a Valentine's Day gift — a developer building something meaningful for his girlfriend. She uses Office and Google Suite every day for work, but has no way to publish her ideas, photos, and creative work to the world without learning to code. **HerSite** bridges that gap: turning familiar workflows (writing in Word, designing in PowerPoint, organizing in Excel) into a published, beautiful personal website.

### Core Philosophy

> "Your website should feel like editing a Google Doc, not learning to program."

- **Office-native workflow**: Upload a `.docx` and it becomes a blog post. Upload a `.pptx` and it becomes a visual page. The tools she already knows *are* the content creation tools.
- **Chat-first interaction**: No dashboards, no settings panels, no config files. Just tell the agent what you want in the sidebar, and watch it happen on the main screen.
- **Real code, full ownership**: Under the hood, it's a real codebase (Astro/Next.js). If she ever outgrows the tool, or wants a developer to take over, the code is clean, standard, and portable.

---

## 2. Target User Persona

| Attribute | Description |
|-----------|-------------|
| **Name** | "Everyday Creator" |
| **Tech comfort** | Uses Word, Excel, PowerPoint, Google Docs daily. Can manage files, folders, and basic cloud storage. |
| **Coding experience** | None. Has never opened a terminal or written HTML. |
| **Goals** | Build a personal brand, publish blog posts, showcase photo portfolios, share creative work. |
| **Frustrations** | Wix/Squarespace feel overwhelming with too many panels. WordPress requires plugins and hosting knowledge. AI code generators produce code she can't use. |
| **Mental model** | "I write something → I press publish → it's on my website." |

---

## 3. Product Architecture

### 3.1 Interface Layout

```
┌──────────────────────────────────────────────────────────┐
│  [Logo]  HerSite          [Preview] [Publish] [Settings] │
├──────────────────────┬───────────────────────────────────┤
│                      │                                   │
│   💬 Chat Sidebar    │     🌐 Live Website Preview       │
│                      │                                   │
│  ┌────────────────┐  │  ┌───────────────────────────┐   │
│  │ "Change the    │  │  │                           │   │
│  │  header color  │  │  │   [Her actual website     │   │
│  │  to soft pink" │  │  │    rendering in real-time] │   │
│  └────────────────┘  │  │                           │   │
│                      │  │                           │   │
│  Agent: "Done! I've  │  │                           │   │
│  updated the header  │  │                           │   │
│  to #FFB6C1. Here's  │  │                           │   │
│  what changed..."    │  │                           │   │
│                      │  │                           │   │
│  ┌────────────────┐  │  └───────────────────────────┘   │
│  │ 📎 Upload file │  │                                   │
│  │ 📷 Add photo   │  │                                   │
│  └────────────────┘  │                                   │
│  ┌────────────────┐  │                                   │
│  │ Type message...│  │                                   │
│  └────────────────┘  │                                   │
├──────────────────────┴───────────────────────────────────┤
│  Status: ✅ Last deployed 2 min ago │ yourname.hersite.io│
└──────────────────────────────────────────────────────────┘
```

**Key UI Principles:**

- The **live preview** takes up ~70% of the screen. It's the hero. She's always looking at *her website*, not an admin panel.
- The **chat sidebar** (~30%) is where all interaction happens. She can see the current state of her site and describe what she wants changed in context.
- The **file upload area** in the chat accepts `.docx`, `.pptx`, `.xlsx`, images, and PDFs. Drag-and-drop supported.
- A floating **"Publish"** button makes deployment a single click after she approves changes.

### 3.2 System Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Frontend    │────▶│  Backend     │────▶│  AI Agent        │
│  (React)     │◀────│  (Node.js)   │◀────│  (Claude API)    │
│              │     │              │     │                  │
│ - Chat UI    │     │ - WebSocket  │     │ - Intent parsing │
│ - Live       │     │   server     │     │ - Code generation│
│   preview    │     │ - File       │     │ - File conversion│
│ - File       │     │   processing │     │ - Diff & explain │
│   upload     │     │ - Git ops    │     │                  │
└─────────────┘     │ - Build      │     └──────────────────┘
                    │   pipeline   │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  Git     │ │  Build   │ │  Deploy  │
        │  Repo    │ │  (Astro/ │ │  (Vercel/│
        │  (GitHub)│ │  Next.js)│ │  Netlify)│
        └──────────┘ └──────────┘ └──────────┘
```

---

## 4. Core Features

### 4.1 Conversational Website Building

The chat sidebar is the primary interface. The user describes what she wants in natural language, and the AI agent executes it.

**Example Conversations:**

| User Says | Agent Does |
|-----------|-----------|
| "I want a minimalist photography portfolio" | Scaffolds a new Astro site with a gallery template, deploys preview |
| "Make the font bigger on the blog page" | Modifies the CSS, hot-reloads the preview |
| "Add an About Me page with my bio" | Creates a new page, adds it to navigation, asks for bio content |
| "I don't like this layout, can you try something more modern?" | Generates 2–3 alternative layouts as screenshots, lets her pick |
| "Change the color scheme to match this photo" | Extracts dominant colors from the uploaded photo, applies as theme |

**Context-Aware Chat:**
The agent always knows the current state of the website. When the user says "make this section bigger," the agent can reference what's currently on screen. The preview and chat share context.

### 4.2 Office File → Web Content Pipeline

This is the killer feature for users who already work in Office tools daily.

#### Word Documents (.docx) → Blog Posts

```
┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│  Upload      │────▶│  Agent parses │────▶│  Blog post   │
│  report.docx │     │  - Headings   │     │  published   │
│              │     │  - Images     │     │  on website   │
│              │     │  - Tables     │     │              │
│              │     │  - Formatting │     │              │
└──────────────┘     └───────────────┘     └──────────────┘
```

**How it works:**
1. She uploads a `.docx` file to the chat sidebar.
2. The agent extracts content using pandoc — headings become `<h1>`–`<h6>`, images are extracted and optimized, tables are converted, formatting is preserved.
3. The agent shows a preview: "Here's how your document would look as a blog post."
4. She can say: "Looks good, publish it" or "Can you change the title?" or "Split this into two posts."
5. On approval, the agent commits the MDX file to the repo and triggers deployment.

**Smart Extraction Features:**
- Auto-generates SEO metadata (title, description, tags) from document content.
- Extracts and optimizes embedded images.
- Converts Word styles to web typography.
- Preserves table formatting into responsive web tables.
- Handles footnotes → tooltips or endnotes.

#### PowerPoint (.pptx) → Visual Pages / Landing Pages

```
┌──────────────┐     ┌───────────────┐     ┌──────────────────┐
│  Upload      │────▶│  Agent parses │────▶│  Visual page     │
│  deck.pptx   │     │  - Slides     │     │  or landing page │
│              │     │  - Layouts    │     │  on website       │
│              │     │  - Images     │     │                  │
│              │     │  - Text       │     │                  │
└──────────────┘     └───────────────┘     └──────────────────┘
```

**How it works:**
1. She uploads a `.pptx` — maybe a self-introduction deck or a project showcase.
2. The agent parses slides: extracts text, images, layout intent, speaker notes.
3. Proposes a conversion strategy:
   - **Full page**: Each slide becomes a section of a scrollable page.
   - **Gallery**: Slides become cards in a visual grid.
   - **Carousel**: Slides become a swipeable presentation embedded on the site.
4. She picks the style, tweaks via chat, approves, publishes.

**Use Cases:**
- A self-introduction PPT → "About Me" page.
- A project showcase deck → portfolio entry.
- A photo slideshow → visual gallery page.

#### Excel (.xlsx) → Data Pages / Structured Content

- Upload a spreadsheet of "Books I've Read" → generates a filterable book list page.
- Upload a travel itinerary → generates a travel blog framework.
- Upload a product list → generates a catalog or directory page.

### 4.3 Live Preview with Contextual Interaction

The main panel renders her actual website in an iframe, with hot-reload capabilities.

**Interaction Model:**
- She looks at her website in the preview.
- She sees something she wants to change.
- She describes it in the chat: "The photo on the right is too small" or "Can you add a border around the portfolio grid?"
- The agent modifies the code, the preview updates in real-time.
- She can also **click elements** in the preview to highlight them, and the agent understands what she's pointing at (element-aware context).

**Preview Modes:**
- 🖥️ Desktop view
- 📱 Mobile view
- 📋 Before/After comparison (split view showing changes)

### 4.4 One-Click Publishing with Approval Flow

```
User makes changes via chat
        │
        ▼
Agent generates code changes
        │
        ▼
Preview updates (auto hot-reload)
        │
        ▼
User reviews in preview
        │
        ├── "Looks good, publish it!" ──▶ Agent commits to Git ──▶ CI/CD auto-deploys
        │
        └── "Actually, change X..." ──▶ Agent iterates
```

**Key Principle: Nothing goes live without her explicit approval.**

- Every change is previewed first.
- She says "publish" or clicks the Publish button.
- The agent commits to Git, CI/CD runs, and the site is live in ~30 seconds.
- She gets a confirmation: "Your site is live at yourname.hersite.io ✨"

### 4.5 Photo Portfolio Management

Since personal branding often involves visual content:

- **Bulk upload**: Drag multiple photos into the chat.
- **Auto-organization**: Agent can sort by EXIF date, suggest album groupings.
- **Gallery generation**: "Create a gallery from these photos" → agent generates a responsive, lazy-loaded gallery page.
- **Image optimization**: Automatic WebP conversion, responsive srcset, lazy loading.
- **Captioning**: "Add captions to these photos" → agent uses AI to suggest captions, she edits in chat.

### 4.6 Template & Theme System

**First-time Setup:**
1. "Hi! Let's build your website. What kind of site do you want?"
2. Agent shows 4–6 curated templates as screenshots:
   - Minimal Blog
   - Photo Portfolio
   - Creative Personal Brand
   - Professional / Resume
   - Blog + Portfolio Combo
   - Lifestyle / Journal
3. She picks one. Agent scaffolds the site.
4. "What's your name and a short tagline?" → populates the site.
5. "Upload a profile photo?" → places it in the header.
6. Site is live in under 5 minutes.

**Ongoing Theming:**
- "Can you make it more colorful?" → agent adjusts the color palette.
- "I want it to feel like autumn" → agent applies warm tones, serif fonts, leaf-inspired accents.
- "Match the vibe of this website: [URL]" → agent analyzes the reference site and adapts the theme.

---

## 5. Technical Design

### 5.1 Recommended Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend (Editor)** | React + TypeScript | Mature ecosystem, good for complex UI |
| **Chat Interface** | WebSocket + React | Real-time bidirectional communication |
| **Live Preview** | iframe with HMR | Isolated rendering, hot module replacement |
| **AI Agent** | Claude API (Anthropic) | Strong code generation, file understanding, multi-modal (can read images/docs) |
| **Site Framework** | Astro | Static-first, fast, MDX support, perfect for blogs and portfolios |
| **Content Format** | MDX (Markdown + JSX) | Human-readable, Git-friendly, flexible |
| **File Conversion** | Pandoc + python-pptx + SheetJS | Robust Office file parsing |
| **Image Processing** | Sharp | Fast image optimization and format conversion |
| **Version Control** | Git (GitHub API) | Every change is tracked, reversible, portable |
| **CI/CD** | GitHub Actions | Free for public repos, automated deployment |
| **Hosting** | Vercel / Netlify / Cloudflare Pages | Free tier, automatic SSL, CDN, custom domains |
| **Database (optional)** | SQLite or none | File-based content; DB only if needed for comments/analytics |

### 5.2 Agent Architecture

```
User Message
     │
     ▼
┌─────────────────────┐
│  Intent Classifier   │  ← Determines what the user wants
│  (Claude API)        │
└─────────┬───────────┘
          │
    ┌─────┴──────┬──────────────┬────────────────┐
    ▼            ▼              ▼                ▼
┌────────┐  ┌────────┐  ┌───────────┐  ┌─────────────┐
│ Content │  │ Design │  │  File     │  │  Site       │
│ Change  │  │ Change │  │  Convert  │  │  Management │
│         │  │        │  │           │  │             │
│ Add/edit│  │ CSS,   │  │ .docx →   │  │ Deploy,     │
│ pages,  │  │ layout,│  │ blog post │  │ domain,     │
│ blog    │  │ theme, │  │ .pptx →   │  │ settings,   │
│ posts   │  │ colors │  │ page      │  │ rollback    │
└────────┘  └────────┘  └───────────┘  └─────────────┘
    │            │              │                │
    └────────────┴──────────────┴────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  Code Generator     │  ← Generates/modifies Astro files
              │  (Claude API)       │
              └─────────┬───────────┘
                        │
                        ▼
              ┌─────────────────────┐
              │  Diff & Explain     │  ← Shows user what changed in plain English
              └─────────┬───────────┘
                        │
                        ▼
              ┌─────────────────────┐
              │  Preview Refresh    │  ← Hot-reloads the iframe
              └─────────────────────┘
```

**Agent Capabilities:**

1. **Intent Parsing**: Understands natural language requests, even vague ones like "make it prettier."
2. **Context Awareness**: Knows the full state of the site — all pages, styles, content, navigation.
3. **Code Generation**: Writes clean Astro/MDX/CSS code.
4. **File Conversion**: Converts Office files to web content.
5. **Diff Explanation**: After every change, explains in plain English what was modified: "I added a new blog post page and updated the navigation to include it."
6. **Undo/Rollback**: "Undo the last change" → agent reverts the Git commit.
7. **Multi-modal**: Can see uploaded images and screenshots to understand visual intent.

### 5.3 Office File Processing Pipeline

```
┌──────────────────────────────────────────────────────────┐
│                 File Upload Handler                       │
├──────────┬──────────┬──────────┬──────────┬──────────────┤
│  .docx   │  .pptx   │  .xlsx   │  images  │  .pdf        │
│          │          │          │          │              │
│ pandoc   │ python-  │ SheetJS  │ Sharp    │ pdf-parse    │
│ → MDX    │ pptx     │ → JSON   │ → WebP   │ → MDX        │
│          │ → MDX +  │ → MDX    │ → srcset │              │
│          │   assets │ table    │          │              │
├──────────┴──────────┴──────────┴──────────┴──────────────┤
│                                                          │
│  Agent Review Layer                                      │
│  - Cleans up formatting                                  │
│  - Generates metadata (title, tags, description)         │
│  - Optimizes images                                      │
│  - Proposes page structure                               │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Preview → User Approval → Git Commit → Deploy           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 5.4 Deployment Pipeline

```
Git Push (by agent)
     │
     ▼
GitHub Actions Triggered
     │
     ├── Install dependencies
     ├── Build Astro site
     ├── Optimize assets
     ├── Run lighthouse check (optional)
     │
     ▼
Deploy to Vercel/Netlify
     │
     ▼
CDN Propagation (~10-30 seconds)
     │
     ▼
Site Live ✅
     │
     ▼
Agent notifies user in chat:
"Your changes are live! 🎉"
```

---

## 6. User Flows

### 6.1 First-Time Setup (~5 minutes)

```
1. Sign up / login
2. "Hi! I'm your website assistant. Let's build your site!"
3. Choose template (visual cards)
4. Enter name + tagline
5. Upload profile photo (optional)
6. Site is live at yourname.hersite.io
7. "Here's your site! What would you like to change?"
```

### 6.2 Publishing a Blog Post from Word

```
1. She writes an article in Word (her normal workflow)
2. Opens HerSite, drags the .docx into the chat
3. Agent: "I've converted your document into a blog post. Here's the preview →"
4. Preview panel shows the blog post as it would appear on her site
5. She says: "Looks great! But can you change the title to 'My Weekend in Kyoto'?"
6. Agent updates the title, preview refreshes
7. She says: "Perfect, publish it"
8. Agent commits, deploys. "Your new post is live! 🎉"
```

### 6.3 Creating a Portfolio from PowerPoint

```
1. She has a PPT with project photos and descriptions
2. Uploads the .pptx to chat
3. Agent: "I found 12 slides with images and text. How would you like to display them?"
   - As a scrollable portfolio page
   - As a photo grid with lightbox
   - As individual project pages
4. She picks "photo grid with lightbox"
5. Agent generates the page, preview shows result
6. She tweaks: "Make the grid 3 columns instead of 4"
7. Approves and publishes
```

### 6.4 Ongoing Maintenance

```
"Add a new section to my About page called 'Hobbies'"
"Update my profile photo" [uploads new image]
"My friend said the site loads slowly on mobile — can you fix it?"
"Change the blog to show newest posts first"
"I want to add a 'Contact Me' page with my email"
"Undo the last change, I liked it better before"
```

---

## 7. Differentiation from Existing Tools

| Feature | Wix/Squarespace | WordPress | v0/Bolt/Lovable | **HerSite** |
|---------|----------------|-----------|----------------|-------------|
| No-code setup | ✅ | ❌ | ⚠️ (generates code you must use) | ✅ |
| Office file import | ❌ | Plugin needed | ❌ | ✅ Native |
| Chat-based editing | ❌ | ❌ | ✅ (one-shot) | ✅ Ongoing |
| Live preview | ✅ | ✅ | ⚠️ | ✅ |
| Real code ownership | ❌ Locked in | ⚠️ PHP spaghetti | ✅ | ✅ Clean Astro/MDX |
| Developer ejectability | ❌ | ⚠️ | ✅ | ✅ |
| Free hosting | ❌ (paid plans) | ❌ (needs hosting) | ❌ | ✅ (Vercel free tier) |
| Open source | ❌ | ✅ | ❌ | ✅ |
| Contextual editing | ❌ | ❌ | ❌ | ✅ (sees the site while chatting) |

**The unique value proposition:**

> HerSite is the only tool where you can write a blog post in Word, upload it in a chat, see it on your live website in seconds, and publish with a single message — all without ever seeing a line of code. And if you ever want a developer to take over, they get a clean, standard codebase.

---

## 8. Open Source Strategy

### Repository Structure

```
hersite/
├── apps/
│   ├── editor/          # React frontend (chat + preview)
│   ├── server/          # Node.js backend (WebSocket, Git ops, build)
│   └── agent/           # AI agent logic (intent parsing, code gen)
├── packages/
│   ├── file-converters/ # docx/pptx/xlsx → MDX converters
│   ├── theme-engine/    # Template and theming system
│   └── deploy/          # Vercel/Netlify deployment adapters
├── templates/           # Curated Astro starter templates
├── docs/                # Documentation
├── docker-compose.yml   # One-command local dev setup
└── README.md
```

### Contribution-Friendly Design

- **Templates are plugins**: Anyone can contribute a new template by adding an Astro starter to `/templates`.
- **Converters are modular**: New file format support (e.g., Notion export, Google Docs) = new converter module.
- **Deploy adapters are pluggable**: Add support for new hosting platforms easily.
- **Agent prompts are configurable**: The system prompts for the AI agent are in editable config files, so the community can improve them.

### License Recommendation

**MIT License** — maximum adoption, allows commercial use, keeps the community open.

---

## 9. MVP Roadmap

### Phase 1: Foundation (Weeks 1–4) — Valentine's Day Release 💝

- [ ] Chat sidebar + live preview layout
- [ ] Basic Astro site generation from 3 templates (Blog, Portfolio, Blog+Portfolio)
- [ ] Natural language → code generation via Claude API
- [ ] `.docx` → blog post conversion
- [ ] One-click deploy to Vercel
- [ ] Custom subdomain (yourname.hersite.io)

### Phase 2: Office Power (Weeks 5–8)

- [ ] `.pptx` → visual page / gallery conversion
- [ ] `.xlsx` → structured content page
- [ ] Image upload + auto-optimization
- [ ] Photo gallery generation
- [ ] Theme customization via chat ("make it warmer", "change to dark mode")

### Phase 3: Polish (Weeks 9–12)

- [ ] Click-to-select elements in preview (point at what you want to change)
- [ ] Mobile responsive preview mode
- [ ] Undo/rollback via chat
- [ ] Before/after comparison view
- [ ] SEO auto-optimization
- [ ] Custom domain connection

### Phase 4: Community (Weeks 13+)

- [ ] Template marketplace (community-contributed)
- [ ] Plugin system for integrations (analytics, contact forms, comments)
- [ ] Multi-language support
- [ ] Collaborative editing (multiple users)
- [ ] Self-hosted option (Docker one-click)

---

## 10. Why This Matters

This isn't just another website builder. It's a statement:

**"The tools you already use every day are enough. You don't need to learn to code to have a voice on the internet."**

For someone who spends her days in Word and PowerPoint, the idea of a personal website feels like it belongs to a different world — a world of developers and designers. HerSite says: *bring your Word docs, bring your PowerPoints, bring your photos, and I'll handle the rest.*

It's open source because everyone deserves this. And it started as a Valentine's Day gift because the best technology comes from love.

---

*Built with ❤️ — Happy Valentine's Day.*
