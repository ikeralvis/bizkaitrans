# bizkaitrans-proxy

Small standalone Cloudflare Worker that proxies the two upstream feeds with
no CORS headers, so the (fully static) main site can call them from the
browser:

- `GET /bilbobus/vehicle-positions` - GTFS-RT vehicle positions from bilbao.eus
- `GET /renfe/arrivals` - Cercanías trip updates from gtfsrt.renfe.com

This is deployed as its own project - it does **not** run through the main
Astro build. It has its own `wrangler.toml`, its own dependencies, and its
own free-tier request quota (static asset serving on the main site stays
free/unlimited either way - see the deploy discussion in the project history).

## First deploy

```bash
cd worker
npm install
npx wrangler login   # once, opens a browser to authorize
npm run deploy
```

This prints the Worker's URL (something like
`https://bizkaitrans-proxy.<your-subdomain>.workers.dev`). Copy it.

## Wire it into the main site

Set `PUBLIC_TRANSIT_PROXY_URL` to that URL in the main site's environment
(Cloudflare Pages project settings -> Environment variables), then redeploy
the main site. Locally, `npm run dev` inside `worker/` serves the same
routes on `http://localhost:8787`, which is the default the main app falls
back to in dev.

## Updating

`routeIdToShortName.json` and `renfeStopCodes.json` are snapshots copied from
`src/data/` in the main app. If those regenerate with different route IDs or
station codes (see the main app's `data:*` scripts), re-copy them here too.
