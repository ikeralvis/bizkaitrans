// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';

import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  // Everything stays statically prerendered except the routes that opt out
  // with `export const prerender = false` (src/pages/api/**) - those need a
  // real server at request time to proxy CORS-blocked upstream feeds, which
  // is what this adapter provides once deployed to Cloudflare Pages.
  output: 'static',
  adapter: cloudflare(),

  integrations: [svelte()],

  vite: {
    plugins: [tailwindcss()]
  }
});