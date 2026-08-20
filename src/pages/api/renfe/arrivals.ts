import type { APIRoute } from "astro";
import { fetchRenfeBilbaoArrivals } from "../../../lib/renfe/realtime.server";

// Local dev-only proxy (see src/lib/bilbobus/realtime.server.ts for why): moves
// to a Cloudflare Worker at deploy time, same fetchRenfeBilbaoArrivals() call.
export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const updates = await fetchRenfeBilbaoArrivals();
    return new Response(JSON.stringify(updates), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
};
