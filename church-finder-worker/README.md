# Church Finder Worker (Cloudflare)

Answers the app's "churches near me" searches from a prebuilt copy of OpenStreetMap data, and
proxies place lookups (city / ZIP) to Nominatim.

The public Overpass servers turned out to be too overloaded to query live (406/502 errors, 30+
second responses, and "200 OK" replies that were really timeouts). So church data is built ahead
of time, once a month, and shipped with the worker as static files. Searches take milliseconds and
never depend on an outside server.

Lives inside the `jesus_app` repo so it stays in sync with the app's `Church` shape, but deploys
on its own.

## How it works

```
GitHub Actions (monthly, .github/workflows/church-data.yml)
  data-build/build.sh
    for each US state in Geofabrik's index:
      download <state>-latest.osm.pbf  ->  osmium tags-filter amenity=place_of_worship
      ->  osmium export (GeoJSON lines)
    data-build/build-tiles.mjs  ->  data/tiles/<lat>_<lon>.json  +  data/meta.json
  wrangler deploy   (worker code + data/ as static assets)

App -> GET /churches?lat=&lon=&radiusMi=
  worker reads the 1-degree tiles around the user, keeps churches within the radius,
  merges duplicates (point + building outline), returns nearest 100
```

- `GET /churches?lat=&lon=&radiusMi=` returns `{ churches, meta: { source, dataDate, tiles } }`.
- `GET /geocode?q=` is a Nominatim proxy with a proper User-Agent, cached 7 days. Bare 5-digit
  ZIPs are pinned to the US.
- CORS is open (`*`) so Expo Web and native both work.

## One-time setup (GitHub secrets)

The monthly job deploys to your Cloudflare account, so it needs two repository secrets
(GitHub repo -> Settings -> Secrets and variables -> Actions -> New repository secret):

- `CLOUDFLARE_API_TOKEN`: Cloudflare dashboard -> My Profile -> API Tokens -> Create Token ->
  "Edit Cloudflare Workers" template.
- `CLOUDFLARE_ACCOUNT_ID`: shown on the Workers & Pages overview page in the Cloudflare dashboard.

Then run it once by hand: repo -> Actions -> "Church data" -> Run workflow.

## Deploying

Always deploy through the GitHub Actions workflow (Actions -> "Church data" -> Run workflow),
including for code-only changes. The `data/` folder only exists inside that job, so a local
`npx wrangler deploy` stops with an error about the missing assets directory. That's intentional,
so a local deploy can't publish a worker with no churches.

## Building data locally (optional)

Needs Linux or WSL with `osmium-tool`, `curl` and Node 20+. Downloads about 10 GB, one state at a
time:

```bash
bash church-finder-worker/data-build/build.sh
```

Then `npx wrangler dev` serves it at `http://localhost:8787/churches?lat=34.92&lon=-81.03&radiusMi=10`.

## Data and attribution

Church data © OpenStreetMap contributors, available under the Open Database License (ODbL),
downloaded from Geofabrik. The app credits OpenStreetMap on the Find a Church screen.
