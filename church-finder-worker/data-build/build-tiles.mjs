// Turns osmium's GeoJSON export of places of worship into the worker's tile files.
//
//   node data-build/build-tiles.mjs <places.geojsonseq> <output dir>
//
// Input: one GeoJSON Feature per line (osmium export -f geojsonseq -a type,id), possibly with
// the RS (0x1e) record-separator prefix. Keeps named Christian places of worship.
// Output:
//   <out>/tiles/<lat>_<lon>.json   records in each 1x1 degree square (key = south-west corner)
//   <out>/meta.json                { generated, source, license, attribution, churches, tiles }

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const [input, outDir] = process.argv.slice(2);
if (!input || !outDir) {
  console.error('usage: node data-build/build-tiles.mjs <places.geojsonseq> <output dir>');
  process.exit(1);
}

// Only the tags the worker uses (see toChurch in src/index.ts); keeps tiles small.
const KEEP_TAGS = [
  'name', 'denomination', 'religion',
  'addr:housenumber', 'addr:street', 'addr:city', 'addr:state', 'addr:postcode',
  'phone', 'contact:phone', 'website', 'contact:website', 'url', 'service_times',
];

/** Representative point: the feature itself for points, else the average of its outer coordinates. */
function centroid(geometry) {
  if (!geometry) return null;
  if (geometry.type === 'Point') return geometry.coordinates;
  let ring;
  switch (geometry.type) {
    case 'LineString': ring = geometry.coordinates; break;
    case 'MultiLineString': ring = geometry.coordinates.flat(); break;
    case 'Polygon': ring = geometry.coordinates[0]; break;
    case 'MultiPolygon': ring = geometry.coordinates.map((p) => p[0]).flat(); break;
    default: return null;
  }
  if (!ring?.length) return null;
  let x = 0, y = 0;
  for (const [lon, lat] of ring) { x += lon; y += lat; }
  return [x / ring.length, y / ring.length];
}

const round = (n) => Math.round(n * 1e6) / 1e6;

const tiles = new Map();
const seenIds = new Set(); // state extracts overlap at borders; keep each OSM object once
let lines = 0, kept = 0, skipped = 0;

const rl = readline.createInterface({ input: fs.createReadStream(input, 'utf8'), crlfDelay: Infinity });
for await (const raw of rl) {
  const line = raw.replace(/^\u001e/, '').trim();
  if (!line) continue;
  lines++;
  let f;
  try { f = JSON.parse(line); } catch { skipped++; continue; }
  const p = f.properties ?? {};
  if (p.amenity !== 'place_of_worship' || p.religion !== 'christian' || !p.name) continue;

  const type = p['@type'];
  const id = p['@id'];
  if (!type || id === undefined) { skipped++; continue; }
  const key = `${type}/${id}`;
  if (seenIds.has(key)) continue;
  seenIds.add(key);

  const c = centroid(f.geometry);
  if (!c) { skipped++; continue; }
  const [lon, lat] = c;

  const tags = {};
  for (const k of KEEP_TAGS) if (p[k] !== undefined) tags[k] = String(p[k]);

  const tileKey = `${Math.floor(lat)}_${Math.floor(lon)}`;
  if (!tiles.has(tileKey)) tiles.set(tileKey, []);
  tiles.get(tileKey).push({ type, id: Number(id), lat: round(lat), lon: round(lon), tags });
  kept++;
}

fs.rmSync(path.join(outDir, 'tiles'), { recursive: true, force: true });
fs.mkdirSync(path.join(outDir, 'tiles'), { recursive: true });
let biggest = 0;
for (const [key, records] of tiles) {
  const body = JSON.stringify(records);
  biggest = Math.max(biggest, body.length);
  fs.writeFileSync(path.join(outDir, 'tiles', `${key}.json`), body);
}
const meta = {
  generated: new Date().toISOString().slice(0, 10),
  source: 'OpenStreetMap contributors, via Geofabrik extracts',
  license: 'ODbL-1.0',
  attribution: '© OpenStreetMap contributors. Available under the Open Database License (ODbL): https://www.openstreetmap.org/copyright',
  churches: kept,
  tiles: tiles.size,
};
fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 2));

console.log(`Read ${lines} features, kept ${kept} churches in ${tiles.size} tiles (largest ${Math.round(biggest / 1024)} KB), skipped ${skipped}.`);
// Cloudflare static assets are limited to 25 MiB per file; 1-degree tiles are far below that.
if (biggest > 20 * 1024 * 1024) throw new Error('A tile is over 20 MB; use smaller tiles.');
if (kept === 0) throw new Error('No churches found — refusing to publish empty data.');
