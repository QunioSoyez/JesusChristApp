# Church Finder Worker (Cloudflare)

Thin proxy + cache in front of free OpenStreetMap services. Fixes the
`HTTP 502 / timeouts on every server` problem when phones call Overpass directly.

Lives inside the `jesus_app` repo (monorepo) so it stays in sync with the app's
`Church` contract, but deploys independently via Wrangler.

## Setup

```bash
cd jesus_app/church-finder-worker
npm install
npx wrangler login            # once per machine
npx wrangler dev              # test: http://localhost:8787/churches?lat=32.78&lon=-96.8&radiusMi=10
npx wrangler deploy
```

After deploy, Wrangler prints your URL like:
`https://church-finder.<you>.workers.dev`

## Connect the app

Put this in `jesus_app/.env` (already done — just restart `expo start`):

```
EXPO_PUBLIC_CHURCH_WORKER_URL=https://church-finder.<you>.workers.dev
```

The app tries the Worker first and falls back to direct Overpass if the Worker
is unreachable — so it works before/after deploy.

## What it does

- `GET /churches?lat=&lon=&radiusMi=` — two-phase Overpass search (fast nodes
  first, building outlines only in sparse areas), normalized
  denomination/service-times, deduped, sorted nearest-first, cached 1h browser /
  24h edge keyed to a ~1km grid.
- `GET /geocode?q=` — Nominatim proxy with proper User-Agent, cached 7 days.
- CORS open (`*`) so Expo Web + native both work.
- On total Overpass outage, serves last cached result with `X-Cache: STALE`
  instead of an error screen.
