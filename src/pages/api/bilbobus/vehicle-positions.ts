import type { APIRoute } from "astro";
import { fetchBilbobusVehiclePositions } from "../../../lib/bilbobus/realtime.server";

// Local dev-only proxy: bilbao.eus's GTFS-RT feed has no CORS headers, so the
// browser can't fetch it directly. This route exists so we can build/test the
// realtime UI now; it moves to a Cloudflare Worker (Pages Functions) at deploy
// time with the same fetchBilbobusVehiclePositions() call.
export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const vehicles = await fetchBilbobusVehiclePositions();
    return new Response(JSON.stringify(vehicles), {
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
