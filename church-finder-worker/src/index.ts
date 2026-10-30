// Church Finder worker for the Jesus Christ app.
//
// Endpoints:
//   GET /churches?lat=..&lon=..&radiusMi=10   -> { churches: Church[], meta }
//   GET /geocode?q=Dallas,TX                 -> { lat, lon, label } | null
//
// Churches come from a prebuilt copy of OpenStreetMap data, not live Overpass queries (the public
// Overpass servers proved too overloaded to use live). A monthly GitHub Actions job
// (.github/workflows/church-data.yml) downloads the US extract from Geofabrik, keeps Christian
// places of worship, writes them as 1-degree tiles to ./data/tiles/<lat>_<lon>.json, and deploys
// them with this worker as static assets. See README.md.
//
// Place lookup (/geocode) still proxies Nominatim live, with a proper User-Agent and caching.

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const UA = 'JesusChristApp/1.0 (+church-finder-worker; contact: church-finder)';
const MAX_RESULTS = 100;

type LatLon = { lat: number; lon: number };
type Church = LatLon & {
  id: string;
  name: string;
  denomination: string;
  address?: string;
  phone?: string;
  website?: string;
  serviceTimes?: string;
  distanceMiles: number;
};

const DENOM_MAP: Record<string, string> = {
  catholic: 'Catholic', roman_catholic: 'Catholic',
  baptist: 'Baptist', southern_baptist: 'Baptist', american_baptist: 'Baptist', independent_baptist: 'Baptist',
  methodist: 'Methodist', united_methodist: 'Methodist', african_methodist_episcopal: 'Methodist',
  lutheran: 'Lutheran', evangelical_lutheran: 'Lutheran', missouri_synod: 'Lutheran',
  presbyterian: 'Presbyterian', presbyterian_usa: 'Presbyterian',
  pentecostal: 'Pentecostal', assemblies_of_god: 'Pentecostal', church_of_god_in_christ: 'Pentecostal', foursquare: 'Pentecostal',
  adventist: 'Adventist', seventh_day_adventist: 'Adventist',
  anglican: 'Anglican / Episcopal', episcopal: 'Anglican / Episcopal', church_of_england: 'Anglican / Episcopal',
  orthodox: 'Orthodox', greek_orthodox: 'Orthodox', russian_orthodox: 'Orthodox', eastern_orthodox: 'Orthodox',
  church_of_christ: 'Church of Christ', christian_church: 'Church of Christ', disciples_of_christ: 'Church of Christ',
  jehovahs_witness: "Jehovah's Witness", jehovah_witness: "Jehovah's Witness",
  latter_day_saints: 'Latter-day Saints', mormon: 'Latter-day Saints', lds: 'Latter-day Saints',
  church_of_jesus_christ_of_latter_day_saints: 'Latter-day Saints',
  nondenominational: 'Non-denominational', non_denominational: 'Non-denominational',
  independent: 'Non-denominational', evangelical: 'Non-denominational', evangelical_free: 'Non-denominational',
  community: 'Non-denominational', bible: 'Non-denominational',
};

function normalizeDenomination(value?: string): string {
  if (!value) return 'Unknown';
  const parts = value.toLowerCase().split(/[;,\/]/).map((s) => s.trim().replace(/[\s-]+/g, '_')).filter(Boolean);
  for (const p of parts) {
    if (DENOM_MAP[p]) return DENOM_MAP[p];
    for (const key of Object.keys(DENOM_MAP)) if (p.includes(key)) return DENOM_MAP[key];
  }
  return 'Other';
}

const DAYS: Record<string, string> = { Mo: 'Mon', Tu: 'Tue', We: 'Wed', Th: 'Thu', Fr: 'Fri', Sa: 'Sat', Su: 'Sun' };
function prettyServiceTimes(value?: string): string | undefined {
  if (!value) return undefined;
  return value.split(';').map((part) =>
    part.trim()
      .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su)\b/g, (d) => DAYS[d])
      .replace(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g, (_m, h: string, m: string) => {
        const hour = Number(h);
        return `${hour % 12 || 12}:${m} ${hour < 12 ? 'AM' : 'PM'}`;
      })
      .replace(/\s*,\s*/g, ', '),
  ).filter(Boolean).join(' · ');
}

function milesBetween(a: LatLon, b: LatLon): number {
  const R = 3958.8, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function formatAddress(tags: Record<string, string>): string | undefined {
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  const cityLine = [tags['addr:city'], [tags['addr:state'], tags['addr:postcode']].filter(Boolean).join(' ')]
    .filter(Boolean).join(', ');
  return [street, cityLine].filter(Boolean).join(', ') || undefined;
}

function normalizeUrl(url?: string): string | undefined {
  if (!url) return undefined;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function toChurch(el: any, from: LatLon): Church | null {
  const tags = el.tags ?? {};
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (!tags.name || lat === undefined || lon === undefined) return null;
  return {
    id: `${el.type}/${el.id}`, name: tags.name, lat, lon,
    denomination: normalizeDenomination(tags.denomination),
    address: formatAddress(tags),
    phone: tags.phone ?? tags['contact:phone'],
    website: normalizeUrl(tags.website ?? tags['contact:website'] ?? tags.url),
    serviceTimes: prettyServiceTimes(tags.service_times),
    distanceMiles: milesBetween(from, { lat, lon }),
  };
}

async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try { return await fetch(url, { ...init, signal: c.signal }); }
  catch (e) { throw new Error((e as Error)?.name === 'AbortError' ? `no response after ${Math.round(ms / 1000)}s` : String(e)); }
  finally { clearTimeout(t); }
}


type Env = {
  /** Static assets from ./data (tiles + meta.json), bound in wrangler.toml. */
  ASSETS: { fetch(input: Request | string): Promise<Response> };
};

/** One record in a tile file, as written by data-build/build-tiles.mjs. */
type TileRecord = { type: 'node' | 'way' | 'relation'; id: number; lat: number; lon: number; tags: Record<string, string> };
type DataMeta = { generated: string; source: string; license?: string; attribution?: string; churches: number; tiles: number };

/** Tile keys (south-west corner, whole degrees) covering a circle around `center`. */
function tilesForCircle(center: LatLon, radiusMi: number): string[] {
  const dLat = radiusMi / 69.0;
  const dLon = radiusMi / (69.172 * Math.max(Math.cos((center.lat * Math.PI) / 180), 0.01));
  const keys: string[] = [];
  for (let la = Math.floor(center.lat - dLat); la <= Math.floor(center.lat + dLat); la++) {
    for (let lo = Math.floor(center.lon - dLon); lo <= Math.floor(center.lon + dLon); lo++) keys.push(`${la}_${lo}`);
  }
  return keys;
}

async function readTile(env: Env, key: string): Promise<TileRecord[]> {
  const res = await env.ASSETS.fetch(`https://assets.local/tiles/${key}.json`);
  if (res.status === 404) return []; // no churches mapped in that square (or it's ocean)
  if (!res.ok) throw new Error(`tile ${key}: HTTP ${res.status}`);
  return (await res.json()) as TileRecord[];
}

let metaPromise: Promise<DataMeta | null> | null = null;
function readMeta(env: Env): Promise<DataMeta | null> {
  metaPromise ??= env.ASSETS.fetch('https://assets.local/meta.json')
    .then((r) => (r.ok ? (r.json() as Promise<DataMeta>) : null))
    .catch(() => null);
  return metaPromise;
}

/** Converts tile records to deduplicated churches (a church can be mapped as a point and a building). */
function normalizeChurches(records: TileRecord[], center: LatLon): Church[] {
  const seen: Church[] = [];
  for (const rec of records) {
    const c = toChurch(rec, center);
    if (!c) continue;
    const dup = seen.find((s) => s.name === c.name && milesBetween(s, c) < 0.1);
    if (dup) {
      dup.phone ??= c.phone; dup.website ??= c.website; dup.serviceTimes ??= c.serviceTimes;
      dup.address ??= c.address;
      if (dup.denomination === 'Unknown' || dup.denomination === 'Other') dup.denomination = c.denomination;
    } else seen.push(c);
  }
  return seen;
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (data: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...cors, ...extra } });

/** Re-sends a cached response with CORS + extra headers (Headers objects can't be spread). */
function fromCache(cached: Response, extra: Record<string, string>): Response {
  const headers = new Headers(cached.headers);
  for (const [k, v] of Object.entries({ ...cors, ...extra })) headers.set(k, v);
  return new Response(cached.body, { status: cached.status, headers });
}

export default {
  async fetch(req: Request, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    const url = new URL(req.url);

    if (url.pathname === '/churches') {
      const lat = Number(url.searchParams.get('lat')), lon = Number(url.searchParams.get('lon'));
      const radiusMi = Math.min(Math.max(Number(url.searchParams.get('radiusMi')) || 10, 1), 50);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        return json({ error: 'lat/lon required' }, 400);
      }
      const user = { lat, lon };
      try {
        const keys = tilesForCircle(user, radiusMi);
        const [tiles, meta] = await Promise.all([Promise.all(keys.map((k) => readTile(env, k))), readMeta(env)]);
        const churches = normalizeChurches(tiles.flat(), user)
          .filter((c) => c.distanceMiles <= radiusMi)
          .sort((a, b) => a.distanceMiles - b.distanceMiles)
          .slice(0, MAX_RESULTS);
        return json(
          {
            churches,
            meta: {
              source: 'OpenStreetMap extract',
              attribution: meta?.attribution ?? '© OpenStreetMap contributors (ODbL)',
              dataDate: meta?.generated ?? null,
              tiles: keys.length,
            },
          },
          200,
          { 'Cache-Control': 'public, max-age=3600' },
        );
      } catch (e) {
        return json({ error: 'Church search failed', detail: String(e) }, 500, { 'Cache-Control': 'no-store' });
      }
    }

    if (url.pathname === '/geocode') {
      const q = (url.searchParams.get('q') ?? '').trim();
      if (!q) return json(null);
      // Bump GEOCODE_CACHE_VERSION whenever lookup logic changes, so answers cached by an older
      // version (kept up to 7 days) are ignored. v4: earlier versions cached a Lithuanian match
      // for the US ZIP "28115".
      const GEOCODE_CACHE_VERSION = 'v4';
      const cacheKey = new Request(`https://church-finder/geocode/${GEOCODE_CACHE_VERSION}?q=${encodeURIComponent(q.toLowerCase())}`);
      const cache = caches.default;
      const cached = await cache.match(cacheKey);
      if (cached) return fromCache(cached, { 'X-Cache': 'HIT' });
      try {
        // A bare 5-digit number (or ZIP+4) is a US ZIP code. As free text, "28115" also matches
        // postcodes in Lithuania and Ukraine, so ZIPs use Nominatim's structured postal-code
        // search limited to the US.
        const zip = q.match(/^(\d{5})(?:-\d{4})?$/);
        const params = zip
          ? `format=json&limit=1&countrycodes=us&postalcode=${zip[1]}`
          : `format=json&limit=1&q=${encodeURIComponent(q)}`;
        const res = await fetchWithTimeout(`${NOMINATIM_URL}?${params}`,
          { headers: { 'User-Agent': UA, Accept: 'application/json' } }, 12000);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arr = (await res.json()) as { lat: string; lon: string; display_name: string }[];
        const first = arr[0];
        const out = first
          ? { lat: Number(first.lat), lon: Number(first.lon), label: first.display_name.split(',').slice(0, 3).join(',').trim() }
          : null;
        // Don't keep "not found" answers for long, in case it was a temporary lookup problem.
        const ttl = out ? 604800 : 3600;
        const response = json(out, 200, { 'Cache-Control': `public, max-age=86400, s-maxage=${ttl}`, 'X-Cache': 'MISS' });
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
        return response;
      } catch (e) {
        return json({ error: 'Place lookup failed', detail: String(e) }, 502);
      }
    }

    return json({ ok: true, usage: 'GET /churches?lat=&lon=&radiusMi=  |  GET /geocode?q=' });
  },
};
