# Luxury Template — Architecture Contract v1

## Overview

This document defines the structural contracts for the luxury template (`templates/luxury/`). Any agent or tool interacting with this template must respect these contracts.

---

## Required File Paths

| Path                           | Consumer                      | Purpose                                              |
| ------------------------------ | ----------------------------- | ---------------------------------------------------- |
| `src/styles/theme.css`         | AgentService `updateTheme`    | CSS custom properties for colors, typography, layout |
| `src/layouts/Layout.astro`     | AgentService `createPage`     | Shared HTML shell with `<nav>` tag and `<slot />`    |
| `src/content.config.ts`        | Astro content layer           | Defines `experience` and `writings` collections      |
| `src/content/experience/*.mdx` | `getCollection('experience')` | Experience card data                                 |
| `src/content/writings/*.mdx`   | `getCollection('writings')`   | Blog/insights post data                              |
| `tailwind.config.mjs`          | Astro Tailwind integration    | Tailwind config wired to CSS custom properties       |

---

## CSS Custom Property Contract

All colors in `theme.css` follow this naming convention:

```
--color-{name}: #HEX;         /* Direct hex value */
--color-{name}-rgb: R G B;    /* Space-separated RGB for Tailwind opacity */
```

### Required Variables

| Variable                                  | Default                   | Description         |
| ----------------------------------------- | ------------------------- | ------------------- |
| `--color-cream` / `--color-cream-rgb`     | `#F5F2EC` / `245 242 236` | Page background     |
| `--color-ink` / `--color-ink-rgb`         | `#1A1A1A` / `26 26 26`    | Primary text        |
| `--color-navy` / `--color-navy-rgb`       | `#1C3A5E` / `28 58 94`    | Primary brand / CTA |
| `--color-oldGold` / `--color-oldGold-rgb` | `#8B7355` / `139 115 85`  | Accent / highlight  |
| `--color-stone` / `--color-stone-rgb`     | `#D4CFC7` / `212 207 199` | Border / muted      |

### Semantic Aliases

| Variable          | Maps to   | Description             |
| ----------------- | --------- | ----------------------- |
| `--color-bg`      | cream     | Background color        |
| `--color-text`    | ink       | Body text color         |
| `--color-primary` | navy      | Primary actions         |
| `--color-accent`  | oldGold   | Accent elements         |
| `--color-border`  | stone     | Borders and dividers    |
| `--color-surface` | `#FFFFFF` | Card/surface background |

### Typography Variables

| Variable         | Default                       | Description            |
| ---------------- | ----------------------------- | ---------------------- |
| `--font-serif`   | `'Cormorant Garamond', serif` | Display / heading font |
| `--font-sans`    | `'DM Sans', sans-serif`       | Body / UI font         |
| `--font-body`    | `'DM Sans', sans-serif`       | Alias for body font    |
| `--font-heading` | `'Cormorant Garamond', serif` | Alias for heading font |

### Layout Variables

| Variable      | Default  | Description                            |
| ------------- | -------- | -------------------------------------- |
| `--max-width` | `1280px` | Maximum content width                  |
| `--radius`    | `0px`    | Border radius (luxury = sharp corners) |

---

## Layout Contract

`Layout.astro` must:

1. Import `../styles/theme.css` in frontmatter
2. Accept props: `title: string`, `description?: string`, `ogImage?: string`
3. Contain a `<nav>` element (agent `createPage` tool searches for `</nav>` to inject links)
4. Use bare `<slot />` with **no wrapping container** (sections are full-bleed)
5. Include `<footer>` after the slot
6. Include OG/Twitter meta tags in `<head>`
7. Include Google Fonts preconnect and stylesheet links

---

## Tailwind Integration

`tailwind.config.mjs` must wire colors to CSS variables using the rgb/alpha pattern:

```js
colors: {
  cream: 'rgb(var(--color-cream-rgb) / <alpha-value>)',
  // ...
}
```

This enables Tailwind opacity modifiers (e.g., `bg-cream/30`, `text-ink/80`) while keeping colors themeable via CSS custom properties.

---

## Content Collection Schemas

### `experience`

```typescript
{
  company: z.string(),
  role: z.string(),
  desc: z.string(),
  order: z.number().optional(),
}
```

Loader: `glob({ pattern: '**/*.{md,mdx}', base: './src/content/experience' })`

### `writings`

```typescript
{
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  tags: z.array(z.string()).optional(),
  heroImage: z.string().optional(),
}
```

Loader: `glob({ pattern: '**/*.{md,mdx}', base: './src/content/writings' })`

---

## Component Props Reference

| Component              | Required Props                                                        | Optional Props                                             |
| ---------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| `Hero.astro`           | `tagline`, `firstName`, `lastName`, `subtitle`, `ctaLabel`, `ctaHref` | `secondaryCtaLabel`, `secondaryCtaHref`, `profileImageSrc` |
| `About.astro`          | (uses `<slot />`)                                                     | `label`                                                    |
| `ExperienceGrid.astro` | `items[]`                                                             | `title`                                                    |
| `Insights.astro`       | `items[]`                                                             | `title`                                                    |
| `Connect.astro`        | —                                                                     | `quote`, `linkedinUrl`, `email`                            |

---

## Known Limitations

1. **AgentService `createBlogPost`** hardcodes `src/content/blog/` — luxury uses `src/content/writings/`. Needs future AgentService update.
2. **`personalizeSite` regex** won't match luxury content — harmless no-op, needs future template-aware logic.
3. **Apps frozen** — no changes to `apps/editor` or `apps/server` during Phase 1.
