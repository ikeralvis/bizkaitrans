// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
// Plain static output, no server adapter - deployable to Cloudflare Pages
// (or any static host) exactly like the rest of the site's Cloudflare
// projects. The two feeds with no CORS headers (Bilbobus GTFS-RT, Renfe
// trip_updates) are proxied by a separate small Cloudflare Worker in
// worker/ instead of an Astro API route - see worker/README.md.
export default defineConfig({
  integrations: [svelte()],

  vite: {
    plugins: [tailwindcss()]
  }
});
