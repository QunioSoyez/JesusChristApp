// Church Finder proxy for the Jesus Christ app.
// Phone -> Worker -> Overpass/Nominatim (with server-side hedging, retries, and cache).
//
// Endpoints:
//   GET /churches?lat=..&lon=..&radiusMi=10   -> { churches: Church[], meta }
//   GET /geocode?q=Dallas,TX                 -> { lat, lon, label } | null
//
// Why: public Overpass servers rate-limit or refuse mobile clients (HTTP 406/502 / timeouts).
// The Worker adds a proper User-Agent, overlaps requests across 3 servers, treats Overpass
// "200 OK but query failed" answers as failures, and caches by ~1km grid cell so users in one
// area share one upstream query. Responses include a `meta` object (cache, upstream, failures)
// for troubleshooting; the app ignores it.

const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const UA = 'JesusChristApp/1.0 (+church-finder-worker; contact: church-finder)';
const MAX_RESULTS = 100;
const METERS_PER_MILE = 1609.344;

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
  /** Optional comma-separated override of the Overpass servers (used for local testing). */
  OVERPASS_URLS?: string;
};

type OverpassResult = { elements: any[]; host: string };

// Overpass sometimes answers HTTP 200 with an empty list plus a "remark" explaining that the
// query failed (timeout, out of memory, too busy). That is a failure, not "no churches".
function overpassRemarkError(data: any): string | null {
  const remark = typeof data?.remark === 'string' ? data.remark : '';
  return /error|timed out|timeout|out of memory|too busy|rate_limited/i.test(remark) ? remark.slice(0, 160) : null;
}

/**
 * Runs one Overpass query with overlapping requests: server 1 starts right away; if it hasn't
 * answered within HEDGE_MS (or fails sooner), server 2 starts, then server 3. The first valid
 * answer wins and the others are cancelled. Fails only when every server has failed.
 */
const HEDGE_MS = 4000;
const SERVER_TIMEOUT_MS = 18000; // whole search stays under ~26s, inside the app's wait
async function queryOverpass(query: string, urls: string[], failures: string[]): Promise<OverpassResult> {
  const winner = new AbortController();
  return new Promise<OverpassResult>((resolve, reject) => {
    let next = 0;
    let running = 0;
    let hedge: ReturnType<typeof setTimeout> | null = null;
    const clearHedge = () => { if (hedge !== null) clearTimeout(hedge); hedge = null; };

    const attempt = async (endpoint: string): Promise<OverpassResult> => {
      const host = new URL(endpoint).host;
      const c = new AbortController();
      const timer = setTimeout(() => c.abort(), SERVER_TIMEOUT_MS);
      const stop = () => c.abort();
      winner.signal.addEventListener('abort', stop);
      try {
        const res = await fetch(`${endpoint}?data=${encodeURIComponent(query)}`, {
          headers: { Accept: 'application/json', 'User-Agent': UA },
          signal: c.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as any;
        const remark = overpassRemarkError(data);
        if (remark) throw new Error(`server error: ${remark}`);
        return { elements: Array.isArray(data?.elements) ? data.elements : [], host };
      } catch (e) {
        const msg = c.signal.aborted && !winner.signal.aborted
          ? `no response after ${SERVER_TIMEOUT_MS / 1000}s`
          : (e as Error)?.message ?? String(e);
        if (!winner.signal.aborted) failures.push(`${host}: ${msg}`);
        throw e;
      } finally {
        clearTimeout(timer);
        winner.signal.removeEventListener('abort', stop);
      }
    };

    const launch = () => {
      clearHedge();
      if (winner.signal.aborted || next >= urls.length) return;
      const endpoint = urls[next++];
      running++;
      attempt(endpoint).then(
        (result) => {
          clearHedge();
          winner.abort();
          resolve(result);
        },
        () => {
          running--;
          if (next < urls.length) launch(); // a failure starts the next server right away
          else if (running === 0) reject(new Error('all servers failed'));
        },
      );
      if (next < urls.length) hedge = setTimeout(launch, HEDGE_MS);
    };
    launch();
  });
}

// Churches are mapped either as points (nodes) or as building outlines (ways/relations); many US
// churches are outlines only. Both searches run at the same time. A single combined query over a
// dense city can time out, so they are separate. If one half fails the result is marked partial.
async function searchUpstream(center: LatLon, radiusMeters: number, urls: string[]) {
  const base = `["amenity"="place_of_worship"]["religion"="christian"]["name"](around:${radiusMeters},${center.lat},${center.lon})`;
  const nodeFailures: string[] = [];
  const outlineFailures: string[] = [];
  const [nodes, outlines] = await Promise.allSettled([
    queryOverpass(`[out:json][timeout:15];node${base};out tags;`, urls, nodeFailures),
    queryOverpass(`[out:json][timeout:15];(way${base};relation${base};);out center tags;`, urls, outlineFailures),
  ]);
  const failures = [...nodeFailures.map((f) => `points ${f}`), ...outlineFailures.map((f) => `outlines ${f}`)];
  if (nodes.status === 'rejected' && outlines.status === 'rejected') {
    throw new Error(`All Overpass servers failed: ${failures.join('; ')}`);
  }
  const elements = [
    ...(nodes.status === 'fulfilled' ? nodes.value.elements : []),
    ...(outlines.status === 'fulfilled' ? outlines.value.elements : []),
  ];
  const upstream = [
    `points=${nodes.status === 'fulfilled' ? nodes.value.host : 'failed'}`,
    `outlines=${outlines.status === 'fulfilled' ? outlines.value.host : 'failed'}`,
  ].join(' ');
  return { elements, partial: nodes.status === 'rejected' || outlines.status === 'rejected', upstream, failures };
}

/** Converts raw Overpass elements to deduplicated churches (distance is filled in per request). */
function normalizeChurches(elements: any[], center: LatLon): Church[] {
  const seen: Church[] = [];
  for (const el of elements) {
    const c = toChurch(el, center);
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

/** Distances from this user's exact position, within the radius, nearest first. */
function forUser(churches: Church[], user: LatLon, radiusMi: number): Church[] {
  return churches
    .map((c) => ({ ...c, distanceMiles: milesBetween(user, c) }))
    .filter((c) => c.distanceMiles <= radiusMi)
    .sort((a, b) => a.distanceMiles - b.distanceMiles)
    .slice(0, MAX_RESULTS);
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

// Cache entries for /churches hold the normalized church list for a ~1km grid cell. "fresh" is
// used for 24h; "backup" is kept 7 days and only served when every Overpass server is failing.
// Bump CACHE_VERSION to discard everything cached by an older version of this worker.
const CACHE_VERSION = 'v3';
const FRESH_TTL = 86400;
const BACKUP_TTL = 604800;
const EMPTY_OR_PARTIAL_TTL = 600; // retry sooner when a result may be incomplete

export default {
  async fetch(req: Request, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    const url = new URL(req.url);

    if (url.pathname === '/churches') {
      const lat = Number(url.searchParams.get('lat')), lon = Number(url.searchParams.get('lon'));
      const radiusMi = Math.min(Math.max(Number(url.searchParams.get('radiusMi')) || 10, 1), 50);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return json({ error: 'lat/lon required' }, 400);
      const user = { lat, lon };

      // Search around the grid cell's center with a 1-mile buffer, so the cached list covers
      // every user in the cell; each user's distances are then computed from their own position.
      const grid = { lat: Number(lat.toFixed(2)), lon: Number(lon.toFixed(2)) };
      const cell = `lat=${grid.lat}&lon=${grid.lon}&r=${radiusMi}`;
      const freshKey = new Request(`https://church-finder/${CACHE_VERSION}/churches?${cell}`);
      const backupKey = new Request(`https://church-finder/${CACHE_VERSION}/churches-backup?${cell}`);
      const cache = caches.default;

      const cached = await cache.match(freshKey);
      if (cached) {
        const data = (await cached.json()) as { churches: Church[]; upstream?: string; partial?: boolean };
        return json(
          { churches: forUser(data.churches, user, radiusMi), meta: { cache: 'HIT', upstream: data.upstream, partial: !!data.partial } },
          200,
          { 'Cache-Control': 'public, max-age=300', 'X-Cache': 'HIT' },
        );
      }

      const urls = env.OVERPASS_URLS ? env.OVERPASS_URLS.split(',').map((s) => s.trim()).filter(Boolean) : OVERPASS_URLS;
      try {
        const radiusMeters = Math.round((radiusMi + 1) * METERS_PER_MILE);
        const { elements, partial, upstream, failures } = await searchUpstream(grid, radiusMeters, urls);
        const churches = normalizeChurches(elements, grid);
        const body = JSON.stringify({ churches, upstream, partial });
        const ttl = partial || churches.length === 0 ? EMPTY_OR_PARTIAL_TTL : FRESH_TTL;
        const put = (key: Request, seconds: number) =>
          cache.put(key, new Response(body, { headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, s-maxage=${seconds}` } }));
        ctx.waitUntil(put(freshKey, ttl));
        if (!partial && churches.length > 0) ctx.waitUntil(put(backupKey, BACKUP_TTL));
        return json(
          { churches: forUser(churches, user, radiusMi), meta: { cache: 'MISS', upstream, partial, failures } },
          200,
          { 'Cache-Control': 'public, max-age=300', 'X-Cache': 'MISS', 'X-Upstream': upstream },
        );
      } catch (e) {
        // Every server failed: fall back to the last good result for this area, if any.
        const backup = await cache.match(backupKey);
        if (backup) {
          const data = (await backup.json()) as { churches: Church[]; upstream?: string };
          return json(
            { churches: forUser(data.churches, user, radiusMi), meta: { cache: 'STALE', upstream: data.upstream, error: String(e) } },
            200,
            { 'Cache-Control': 'no-store', 'X-Cache': 'STALE' },
          );
        }
        return json({ error: 'Church directory is busy, try again in a minute.', detail: String(e) }, 502, { 'Cache-Control': 'no-store' });
      }
    }

    if (url.pathname === '/geocode') {
      const q = (url.searchParams.get('q') ?? '').trim();
      if (!q) return json(null);
      // v3: flush entries cached before the countrycodes=us fix (a backend that
      // ignored the old "USA" text hint cached a Lithuanian result for 28115).
      const cacheKey = new Request(`https://church-finder/geocode/v3?q=${encodeURIComponent(q.toLowerCase())}`, req);
      const cache = caches.default;
      const cached = await cache.match(cacheKey);
      console.log(`[geocode] q=${JSON.stringify(q)} cache=${cached ? 'HIT' : 'MISS'}`);
      if (cached) return fromCache(cached, { 'X-Cache': 'HIT' });
      try {
        // Bare US ZIPs are globally ambiguous: "28115" matches postcodes in
        // Lithuania and Ukraine with identical rank, so limit=1 is a coin flip.
        // countrycodes=us pins the search to the US deterministically (a text
        // "USA" hint is ignored by some Nominatim backends), with the
        // find-preference below as belt-and-braces.
        const isZip = /^\d{5}(-\d{4})?$/.test(q);
        const upstreamParams = isZip
          ? `format=json&limit=5&countrycodes=us&q=${encodeURIComponent(q)}`
          : `format=json&limit=5&q=${encodeURIComponent(q)}`;
        const res = await fetchWithTimeout(`${NOMINATIM_URL}?${upstreamParams}`,
          { headers: { 'User-Agent': UA, Accept: 'application/json' } }, 12000);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arr = (await res.json()) as { lat: string; lon: string; display_name: string }[];
        const first = isZip
          ? (arr.find((r) => /, United States$/.test(r.display_name)) ?? arr[0])
          : arr[0];
        console.log(`[geocode] q=${JSON.stringify(q)} upstream=${JSON.stringify(upstreamParams)} n=${arr.length} picked=${first?.display_name ?? '(none)'}`);
        const out = first
          ? { lat: Number(first.lat), lon: Number(first.lon), label: first.display_name.split(',').slice(0, 3).join(',').trim(), build: 'zipfix2' }
          : null;
        const response = json(out, 200, { 'Cache-Control': 'public, max-age=86400, s-maxage=604800', 'X-Cache': 'MISS' });
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
        return response;
      } catch (e) {
        return json({ error: 'Place lookup failed', detail: String(e) }, 502);
      }
    }

    return json({ ok: true, usage: 'GET /churches?lat=&lon=&radiusMi=  |  GET /geocode?q=' });
  },
};
