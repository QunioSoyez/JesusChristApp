// Church search for Find a Church. All lookups go through the church-finder worker
// (see /church-finder-worker), which serves churches from a monthly OpenStreetMap extract and
// proxies city / ZIP lookups to Nominatim. The app never calls OpenStreetMap servers directly.
// Nothing about the user's location is stored; it is only sent with each search request.
import { Platform } from 'react-native';

export const RADIUS_OPTIONS_MILES = [5, 10, 25] as const;
export const DEFAULT_RADIUS_MILES = 10;
const MAX_RESULTS = 100;
const CHURCHES_TIMEOUT_MS = 20000;
const GEOCODE_TIMEOUT_MS = 15000;

// Set in .env (EXPO_PUBLIC_CHURCH_WORKER_URL). Read when the app is bundled, so restart Expo
// after changing it.
const WORKER_URL = process.env.EXPO_PUBLIC_CHURCH_WORKER_URL?.replace(/\/$/, '');

// Bump when the worker's place-lookup logic changes, so phones don't reuse an answer they saved
// from an older worker (responses may be kept for up to a day).
// v=2: older answers for some US ZIPs pointed to Lithuania.
const GEOCODE_VERSION = 2;

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
// The worker maps OpenStreetMap's denomination tags onto these names.
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

/** An error with a message that's safe to show to the user. */
export class SearchError extends Error {}

/** fetch with a time limit; a timeout is reported as "no response after Ns". */
async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, ms);
  try {
    return await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
  } catch (e) {
    // Expo's fetch reports a cancelled request as "Fetch request has been canceled".
    throw new Error(timedOut ? `no response after ${Math.round(ms / 1000)}s` : String((e as Error)?.message ?? e));
  } finally {
    clearTimeout(timer);
  }
}

/** Calls the church-finder worker and returns its JSON, or throws a SearchError for the user. */
async function callWorker<T>(pathAndQuery: string, timeoutMs: number, what: string): Promise<T> {
  if (!WORKER_URL) {
    throw new SearchError(
      `${what} isn't set up in this build (EXPO_PUBLIC_CHURCH_WORKER_URL is missing from .env).`,
    );
  }
  let res: Response;
  try {
    res = await fetchWithTimeout(`${WORKER_URL}${pathAndQuery}`, timeoutMs);
  } catch (e) {
    if (__DEV__) console.warn(`[church-finder] ${pathAndQuery} failed:`, (e as Error).message);
    throw new SearchError(`Could not reach the church directory. Check your connection and try again.`);
  }
  if (!res.ok) {
    if (__DEV__) console.warn(`[church-finder] ${pathAndQuery} -> HTTP ${res.status}:`, await res.text().catch(() => ''));
    throw new SearchError(`${what} failed (error ${res.status}). Please try again in a minute.`);
  }
  return (await res.json()) as T;
}

/** Finds named Christian places of worship within `radiusMiles`, nearest first. */
export async function searchChurches(center: LatLon, radiusMiles: number): Promise<Church[]> {
  const data = await callWorker<{ churches?: Church[] }>(
    `/churches?lat=${center.lat}&lon=${center.lon}&radiusMi=${radiusMiles}`,
    CHURCHES_TIMEOUT_MS,
    'Church search',
  );
  if (!Array.isArray(data.churches)) throw new SearchError('Church search returned an unexpected answer.');
  return data.churches.slice(0, MAX_RESULTS);
}

/** Turns a city, address or ZIP code into coordinates. Returns null if nothing matched. */
export async function geocode(place: string): Promise<(LatLon & { label: string }) | null> {
  const q = place.trim();
  const data = await callWorker<{ lat?: number; lon?: number; label?: string } | null>(
    `/geocode?v=${GEOCODE_VERSION}&q=${encodeURIComponent(q)}`,
    GEOCODE_TIMEOUT_MS,
    'Place lookup',
  );
  if (!data || typeof data.lat !== 'number' || typeof data.lon !== 'number') return null;
  return { lat: data.lat, lon: data.lon, label: data.label ?? q };
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

/** Returns true if a church passes the denomination filter. Unknown is always kept visible. */
export function matchesDenomination(church: Church, filter: DenominationFilter): boolean {
  if (filter === 'All') return true;
  if (church.denomination === filter) return true;
  // Per owner decision: never hide Unknown — better to show than hide.
  if (church.denomination === 'Unknown') return true;
  return false;
}
