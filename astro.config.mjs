// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Static site, deployed to Cloudflare Pages.
// build.format: 'file' outputs /contact-us.html (served at /contact-us) so the
// live URLs exactly match the old Wix site's URLs — no redirect hop, SEO preserved.
export default defineConfig({
  site: 'https://www.polishedmidwest.com',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
