// Church Finder proxy for the Jesus Christ app.
// Phone -> Worker -> Overpass/Nominatim (with server-side hedging, retries, and cache).
//
// Endpoints:
//   GET /churches?lat=..&lon=..&radiusMi=10   -> { churches: Church[] }
//   GET /geocode?q=Dallas,TX                 -> { lat, lon, label } | null
//
// Why: public Overpass servers rate-limit mobile clients (HTTP 502 / timeouts).
// The Worker adds a proper User-Agent, tries 3 servers in order, and caches by
// rounded location so 100 users in one city share one upstream query.

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

// Two-phase search: nodes first (fast — covers the vast majority of mapped
// churches), then ways/relations only if the area is sparse. A single `nwr`
// query over a big city (e.g. Dallas at 10mi) returns thousands of building
// outlines and times out every public server; this keeps cities fast without
// losing building-mapped churches in rural areas.
async function searchUpstream(center: LatLon, radius: number): Promise<any[]> {
  const base = `["amenity"="place_of_worship"]["religion"="christian"]["name"](around:${radius},${center.lat},${center.lon})`;
  const nodeQuery = `[out:json][timeout:20];node${base};out tags;`;
  const nodes = await queryOverpass(nodeQuery);
  const elements: any[] = nodes.elements ?? [];
  if (elements.length >= 40) return elements; // dense area — nodes alone are plenty
  const wrQuery = `[out:json][timeout:20];(way${base};relation${base};);out center tags;`;
  try {
    const wr = await queryOverpass(wrQuery);
    return elements.concat(wr.elements ?? []);
  } catch {
    return elements; // building outlines failed — nodes are still a good answer
  }
}

async function queryOverpass(query: string): Promise<any> {
  const failures: string[] = [];
  for (const endpoint of OVERPASS_URLS) {
    const host = new URL(endpoint).host;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetchWithTimeout(`${endpoint}?data=${encodeURIComponent(query)}`,
          { headers: { Accept: 'application/json', 'User-Agent': UA } }, 25000);
        if (res.ok) return await res.json();
        if (![429, 502, 503, 504].includes(res.status)) throw new Error(`HTTP ${res.status}`);
        failures.push(`${host}: HTTP ${res.status}`);
        await new Promise((r) => setTimeout(r, 1200));
      } catch (e) {
        failures.push(`${host}: ${(e as Error)?.message ?? String(e)}`);
        break; // timeouts move to next server immediately
      }
    }
  }
  throw new Error(`All Overpass servers failed: ${failures.join('; ')}`);
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (data: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...cors, ...extra } });

export default {
  async fetch(req: Request, _env: unknown, ctx: { waitUntil(p: Promise<unknown>): void }): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    const url = new URL(req.url);

    if (url.pathname === '/churches') {
      const lat = Number(url.searchParams.get('lat')), lon = Number(url.searchParams.get('lon'));
      const radiusMi = Math.min(Math.max(Number(url.searchParams.get('radiusMi')) || 10, 1), 50);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return json({ error: 'lat/lon required' }, 400);

      // Round to ~1km grid so nearby users share cache entries.
      const keyLat = lat.toFixed(2), keyLon = lon.toFixed(2);
      const cacheKey = new Request(`https://church-finder/churches?lat=${keyLat}&lon=${keyLon}&r=${radiusMi}`, req);
      const cache = caches.default;
      const cached = await cache.match(cacheKey);
      if (cached) return new Response(cached.body, { headers: { ...cached.headers, ...cors, 'X-Cache': 'HIT' } });

      try {
        const center = { lat, lon };
        const radius = Math.round(radiusMi * METERS_PER_MILE);
        const elements = await searchUpstream(center, radius);
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
        seen.sort((a, b) => a.distanceMiles - b.distanceMiles);
        const res = json({ churches: seen.slice(0, MAX_RESULTS) }, 200,
          { 'Cache-Control': 'public, max-age=3600, s-maxage=86400', 'X-Cache': 'MISS' });
        // Clone into cache (don't block the response).
        ctx.waitUntil(cache.put(cacheKey, res.clone()));
        return res;
      } catch (e) {
        // Serve stale cache on total failure if we have one.
        if (cached) return new Response(cached.body, { headers: { ...cached.headers, ...cors, 'X-Cache': 'STALE' } });
        return json({ error: 'Church directory is busy, try again in a minute.', detail: String(e) }, 502);
      }
    }

    if (url.pathname === '/geocode') {
      const q = (url.searchParams.get('q') ?? '').trim();
      if (!q) return json(null);
      const cacheKey = new Request(`https://church-finder/geocode?q=${encodeURIComponent(q.toLowerCase())}`, req);
      const cache = caches.default;
      const cached = await cache.match(cacheKey);
      if (cached) return new Response(cached.body, { headers: { ...cached.headers, ...cors, 'X-Cache': 'HIT' } });
      try {
        const res = await fetchWithTimeout(`${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(q)}`,
          { headers: { 'User-Agent': UA, Accept: 'application/json' } }, 12000);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arr = (await res.json()) as { lat: string; lon: string; display_name: string }[];
        const first = arr[0];
        const out = first
          ? { lat: Number(first.lat), lon: Number(first.lon), label: first.display_name.split(',').slice(0, 3).join(',').trim() }
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
