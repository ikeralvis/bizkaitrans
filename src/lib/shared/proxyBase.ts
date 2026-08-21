/**
 * Base URL of the standalone Cloudflare Worker (see worker/) that proxies the
 * two upstream feeds with no CORS headers (Bilbobus GTFS-RT, Renfe
 * trip_updates). The main site is 100% static, so this can't be a same-origin
 * Astro API route - set PUBLIC_TRANSIT_PROXY_URL once the worker is deployed
 * (e.g. in Cloudflare Pages' env vars). Defaults to the local `wrangler dev`
 * port for local development.
 */
export const PROXY_BASE = import.meta.env.PUBLIC_TRANSIT_PROXY_URL ?? "http://localhost:8787";
