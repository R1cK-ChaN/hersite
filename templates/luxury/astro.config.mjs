import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import { siteConfig } from './personal/site.config.ts';

export default defineConfig({
  site: siteConfig.siteUrl,
  publicDir: './personal/public',
  integrations: [mdx(), sitemap(), tailwind()],
});
