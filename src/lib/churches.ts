// Church search using free OpenStreetMap services:
//  - Overpass API: places tagged amenity=place_of_worship + religion=christian
//  - Nominatim: turns a city or ZIP code into coordinates
// Nothing about the user's location is stored; it is only sent with each search request.
import { Platform } from 'react-native';

export const RADIUS_OPTIONS_MILES = [5, 10, 25] as const;
export const DEFAULT_RADIUS_MILES = 10;
const MAX_RESULTS = 100;
const METERS_PER_MILE = 1609.344;

// Public Overpass servers, tried in order (see wiki.openstreetmap.org/wiki/Overpass_API#Public_Overpass_API_instances).
const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
// Temporary server errors worth one retry on the same server.
const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);
// Each server gets up to 30s (the query itself asks the server to stop after 25s).
const OVERPASS_TIMEOUT_MS = 30000;
// If a server hasn't answered after this long, also ask the next one; the first good answer wins.
const OVERPASS_HEDGE_MS = 6000;
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const APP_USER_AGENT = 'JesusChristApp/1.0 (+https://github.com/QunioSoyez/JesusChristApp)';

export type LatLon = { lat: number; lon: number };

export type Church = LatLon & {
  id: string;
  name: string;
  denomination: string;
  address?: string;
  phone?: string;
  website?: string;
  serviceTimes?: string;
  distanceMiles: number;
};

// Fixed taxonomy for the denomination selector chips (mobile-friendly, ~16 items max).
// 'All' = no filter. 'Unknown' = OSM had no denomination tag — always kept visible per owner decision.
// "Jehovah's Witness" and "Latter-day Saints" are separate (not grouped under Other).
export const DENOMINATIONS = [
  'All',
  'Baptist',
  'Catholic',
  'Methodist',
  'Lutheran',
  'Presbyterian',
  'Pentecostal',
  'Adventist',
  'Anglican / Episcopal',
  'Orthodox',
  'Church of Christ',
  "Jehovah's Witness",
  'Latter-day Saints',
  'Non-denominational',
  'Other',
  'Unknown',
] as const;

export type DenominationFilter = (typeof DENOMINATIONS)[number];

// Optional Cloudflare Worker proxy (see /church-finder-worker). When
// EXPO_PUBLIC_CHURCH_WORKER_URL is set, the app uses it instead of calling
// public Overpass servers directly — it adds server-side caching + retries.
const WORKER_URL = process.env.EXPO_PUBLIC_CHURCH_WORKER_URL?.replace(/\/$/, '');

type OverpassElement = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: LatLon;
  tags?: Record<string, string>;
};

export class SearchError extends Error {}

// OSM services require apps to identify themselves: overpass-api.de answers generic User-Agents
// (curl, Android's okhttp) with 406 Not Acceptable. Browsers don't allow setting User-Agent and
// already send a normal browser one, so web skips it.
const osmHeaders = (): Record<string, string> => (Platform.OS === 'web' ? {} : { 'User-Agent': APP_USER_AGENT });

/**
 * Runs an Overpass query against the public servers in OVERPASS_URLS. Public servers are often busy,
 * so requests overlap: the first server is asked right away, the next one OVERPASS_HEDGE_MS later
 * (or as soon as an earlier one fails), and so on. The first good answer wins and the rest are
 * cancelled. If all fail, the error lists what happened on each server.
 */
async function queryOverpass(query: string): Promise<{ elements?: OverpassElement[] }> {
  const init: RequestInit = { headers: { Accept: 'application/json', ...osmHeaders() } };
  const url = (endpoint: string) => `${endpoint}?data=${encodeURIComponent(query)}`;
  const done = new AbortController(); // aborted once we have an answer, cancelling the others
  const failures: string[] = [];
  let busy = false;

  const attempt = async (endpoint: string): Promise<{ elements?: OverpassElement[] }> => {
    const host = new URL(endpoint).host;
    try {
      let res = await fetchWithTimeout(url(endpoint), init, OVERPASS_TIMEOUT_MS, done.signal);
      if (RETRYABLE_STATUS.has(res.status) && !done.signal.aborted) {
        await new Promise((r) => setTimeout(r, 1500));
        res = await fetchWithTimeout(url(endpoint), init, OVERPASS_TIMEOUT_MS, done.signal);
      }
      if (res.ok) return (await res.json()) as { elements?: OverpassElement[] };
      if (RETRYABLE_STATUS.has(res.status)) busy = true;
      throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      if (!done.signal.aborted) failures.push(`${host}: ${(e as Error)?.message ?? String(e)}`);
      throw e;
    }
  };

  try {
    return await new Promise((resolve, reject) => {
      let next = 0;
      let running = 0;
      let hedgeTimer: ReturnType<typeof setTimeout> | undefined;

      const launch = () => {
        clearTimeout(hedgeTimer);
        if (done.signal.aborted || next >= OVERPASS_URLS.length) return;
        const endpoint = OVERPASS_URLS[next++];
        running++;
        attempt(endpoint).then(
          (data) => {
            clearTimeout(hedgeTimer);
            resolve(data);
          },
          () => {
            running--;
            if (next < OVERPASS_URLS.length) launch(); // a failure starts the next server right away
            else if (running === 0) reject(new Error('all servers failed'));
          },
        );
        if (next < OVERPASS_URLS.length) hedgeTimer = setTimeout(launch, OVERPASS_HEDGE_MS);
      };
      launch();
    });
  } catch {
    if (__DEV__) console.warn('Church search failed on every server:', failures);
    const detail = `\n\nDetails: ${failures.join('; ')}`;
    throw new SearchError(
      busy
        ? `The church directory is busy right now. Please try again in a minute.${detail}`
        : `Could not reach the church directory. Check your connection and try again.${detail}`,
    );
  } finally {
    done.abort();
  }
}

/**
 * fetch with a time limit. Also cancels if `cancel` fires. Expo's fetch reports a cancelled request
 * as "Fetch request has been canceled", so a timeout is re-thrown with a clearer message.
 */
async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 30000, cancel?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, ms);
  const onCancel = () => controller.abort();
  cancel?.addEventListener('abort', onCancel);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (e) {
    if (timedOut) throw new Error(`no response after ${Math.round(ms / 1000)}s`);
    throw e;
  } finally {
    clearTimeout(timer);
    cancel?.removeEventListener('abort', onCancel);
  }
}

/** Finds named Christian places of worship within `radiusMiles`, nearest first. */
export async function searchChurches(center: LatLon, radiusMiles: number): Promise<Church[]> {
  // 1) Preferred path: Cloudflare Worker proxy (cached, retried server-side).
  if (WORKER_URL) {
    try {
      const url = `${WORKER_URL}/churches?lat=${center.lat}&lon=${center.lon}&radiusMi=${radiusMiles}`;
      const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 25000);
      if (res.ok) {
        const data = (await res.json()) as { churches?: Church[] };
        if (Array.isArray(data.churches)) return data.churches.slice(0, MAX_RESULTS);
      }
      // Non-OK from worker: fall through to direct Overpass below.
      if (__DEV__) console.warn('Church worker non-OK, falling back to direct Overpass:', res.status);
    } catch (e) {
      if (__DEV__) console.warn('Church worker failed, falling back to direct Overpass:', e);
      // Fall through — direct Overpass is the offline fallback.
    }
  }

  const radius = Math.round(radiusMiles * METERS_PER_MILE);
  const query = `[out:json][timeout:25];
nwr["amenity"="place_of_worship"]["religion"="christian"]["name"](around:${radius},${center.lat},${center.lon});
out center tags;`;

  const data = await queryOverpass(query);
  const churches = (data.elements ?? [])
    .map((el) => toChurch(el, center))
    .filter((c): c is Church => c !== null)
    .sort((a, b) => a.distanceMiles - b.distanceMiles);

  return dedupe(churches).slice(0, MAX_RESULTS);
}

/** Turns a city, address or ZIP code into coordinates. Returns null if nothing matched. */
export async function geocode(place: string): Promise<(LatLon & { label: string }) | null> {
  if (__DEV__) console.log('[geocode] query:', JSON.stringify(place), '| worker:', WORKER_URL ?? '(not set)');
  if (WORKER_URL) {
    try {
      // `v` changes the URL whenever the worker's lookup logic changes, so phones don't reuse an
      // answer they saved from an older worker (worker responses may be kept for up to a day).
      // v=2: older answers for some US ZIPs pointed to Lithuania.
      const url = `${WORKER_URL}/geocode?v=2&q=${encodeURIComponent(place.trim())}`;
      const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 15000);
      if (res.ok) {
        const data = (await res.json()) as { lat?: number; lon?: number; label?: string } | null;
        if (__DEV__) console.log('[geocode] via worker:', JSON.stringify(data));
        if (data && typeof data.lat === 'number' && typeof data.lon === 'number') {
          return { lat: data.lat, lon: data.lon, label: data.label ?? shortLabel(place) };
        }
        return null;
      }
    } catch {
      // Fall through to direct Nominatim below.
    }
  }
  // Direct fallback: bare US ZIPs are globally ambiguous ("28115" also matches
  // Lithuania/Ukraine at equal rank), so fetch several and prefer the US one.
  const q = place.trim();
  const isZip = /^\d{5}(-\d{4})?$/.test(q);
  const url = `${NOMINATIM_URL}?format=json&limit=5&q=${encodeURIComponent(isZip ? `${q} USA` : q)}`;
  let res: Response;
  try {
    res = await fetchWithTimeout(url, { headers: osmHeaders() }, 15000);
  } catch {
    throw new SearchError('Could not look up that place. Check your connection and try again.');
  }
  if (!res.ok) throw new SearchError(`Place lookup failed (error ${res.status}).`);
  const results = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  const first = isZip
    ? (results.find((r) => /, United States$/.test(r.display_name)) ?? results[0])
    : results[0];
  if (__DEV__) console.log('[geocode] via direct Nominatim:', first?.display_name ?? '(none)');
  if (!first) return null;
  return { lat: Number(first.lat), lon: Number(first.lon), label: shortLabel(first.display_name) };
}

/** Opens turn-by-turn directions: Apple Maps on iOS, Google Maps everywhere else. */
export function directionsUrl(church: Church): string {
  const dest = `${church.lat},${church.lon}`;
  if (Platform.OS === 'ios') return `https://maps.apple.com/?daddr=${dest}&q=${encodeURIComponent(church.name)}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
}

export function formatMiles(miles: number): string {
  return miles < 10 ? `${miles.toFixed(1)} mi` : `${Math.round(miles)} mi`;
}

function toChurch(el: OverpassElement, from: LatLon): Church | null {
  const tags = el.tags ?? {};
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (!tags.name || lat === undefined || lon === undefined) return null;

  return {
    id: `${el.type}/${el.id}`,
    name: tags.name,
    lat,
    lon,
    denomination: normalizeDenomination(tags.denomination),
    address: formatAddress(tags),
    phone: tags.phone ?? tags['contact:phone'],
    website: normalizeUrl(tags.website ?? tags['contact:website'] ?? tags.url),
    serviceTimes: prettyServiceTimes(tags.service_times),
    distanceMiles: milesBetween(from, { lat, lon }),
  };
}

// OSM sometimes has the same church as both a building outline and a point.
function dedupe(list: Church[]): Church[] {
  const seen: Church[] = [];
  for (const c of list) {
    const dup = seen.find((s) => s.name === c.name && milesBetween(s, c) < 0.1);
    if (dup) {
      dup.phone ??= c.phone;
      dup.website ??= c.website;
      dup.serviceTimes ??= c.serviceTimes;
      dup.address ??= c.address;
      // Prefer a known denomination over Unknown/Other when merging duplicates.
      if (dup.denomination === 'Unknown' || dup.denomination === 'Other') dup.denomination = c.denomination;
    } else {
      seen.push(c);
    }
  }
  return seen;
}

function formatAddress(tags: Record<string, string>): string | undefined {
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  const cityLine = [tags['addr:city'], [tags['addr:state'], tags['addr:postcode']].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');
  return [street, cityLine].filter(Boolean).join(', ') || undefined;
}

const DENOM_MAP: Record<string, Exclude<DenominationFilter, 'All' | 'Unknown' | 'Other'>> = {
  catholic: 'Catholic',
  roman_catholic: 'Catholic',
  baptist: 'Baptist',
  southern_baptist: 'Baptist',
  american_baptist: 'Baptist',
  independent_baptist: 'Baptist',
  methodist: 'Methodist',
  united_methodist: 'Methodist',
  african_methodist_episcopal: 'Methodist',
  lutheran: 'Lutheran',
  evangelical_lutheran: 'Lutheran',
  missouri_synod: 'Lutheran',
  presbyterian: 'Presbyterian',
  presbyterian_usa: 'Presbyterian',
  pentecostal: 'Pentecostal',
  assemblies_of_god: 'Pentecostal',
  church_of_god_in_christ: 'Pentecostal',
  foursquare: 'Pentecostal',
  adventist: 'Adventist',
  seventh_day_adventist: 'Adventist',
  anglican: 'Anglican / Episcopal',
  episcopal: 'Anglican / Episcopal',
  church_of_england: 'Anglican / Episcopal',
  orthodox: 'Orthodox',
  greek_orthodox: 'Orthodox',
  russian_orthodox: 'Orthodox',
  eastern_orthodox: 'Orthodox',
  church_of_christ: 'Church of Christ',
  christian_church: 'Church of Christ',
  disciples_of_christ: 'Church of Christ',
  jehovahs_witness: "Jehovah's Witness",
  jehovah_witness: "Jehovah's Witness",
  latter_day_saints: 'Latter-day Saints',
  mormon: 'Latter-day Saints',
  lds: 'Latter-day Saints',
  church_of_jesus_christ_of_latter_day_saints: 'Latter-day Saints',
  nondenominational: 'Non-denominational',
  non_denominational: 'Non-denominational',
  independent: 'Non-denominational',
  evangelical: 'Non-denominational',
  evangelical_free: 'Non-denominational',
  community: 'Non-denominational',
  bible: 'Non-denominational',
};

/** Maps messy OSM denomination tags to the fixed DENOMINATIONS taxonomy. Missing -> 'Unknown', unrecognized -> 'Other'. */
export function normalizeDenomination(value?: string): Exclude<DenominationFilter, 'All'> {
  if (!value) return 'Unknown';
  const parts = value
    .toLowerCase()
    .split(/[;,\/]/)
    .map((s) => s.trim().replace(/[\s-]+/g, '_'))
    .filter(Boolean);
  for (const p of parts) {
    if (DENOM_MAP[p]) return DENOM_MAP[p];
    for (const key of Object.keys(DENOM_MAP)) {
      if (p.includes(key)) return DENOM_MAP[key as keyof typeof DENOM_MAP];
    }
  }
  // Beautified fallback counts as Other (had a tag, just not in taxonomy).
  return 'Other';
}

/** Returns true if a church passes the denomination filter. Unknown is always kept visible. */
export function matchesDenomination(church: Church, filter: DenominationFilter): boolean {
  if (filter === 'All') return true;
  if (church.denomination === filter) return true;
  // Per owner decision: never hide Unknown — better to show than hide.
  if (church.denomination === 'Unknown') return true;
  return false;
}

const DAYS: Record<string, string> = { Mo: 'Mon', Tu: 'Tue', We: 'Wed', Th: 'Thu', Fr: 'Fri', Sa: 'Sat', Su: 'Sun' };

/** "Su 09:00,11:00; We 18:30" -> "Sun 9:00 AM, 11:00 AM · Wed 6:30 PM". Unrecognized text passes through. */
export function prettyServiceTimes(value?: string): string | undefined {
  if (!value) return undefined;
  return value
    .split(';')
    .map((part) =>
      part
        .trim()
        .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su)\b/g, (d) => DAYS[d])
        .replace(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g, (_, h: string, m: string) => {
          const hour = Number(h);
          return `${hour % 12 || 12}:${m} ${hour < 12 ? 'AM' : 'PM'}`;
        })
        .replace(/\s*,\s*/g, ', '),
    )
    .filter(Boolean)
    .join(' · ');
}

function normalizeUrl(url?: string): string | undefined {
  if (!url) return undefined;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function shortLabel(displayName: string): string {
  return displayName.split(',').slice(0, 3).join(',').trim();
}

export function milesBetween(a: LatLon, b: LatLon): number {
  const R = 3958.8; // Earth radius in miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
