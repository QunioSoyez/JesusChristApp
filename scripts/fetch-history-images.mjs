// Downloads the photos for the History screens from Wikimedia Commons and writes their credits.
//
//   node scripts/fetch-history-images.mjs           download any missing photos, refresh credits
//   node scripts/fetch-history-images.mjs --force   download every photo again
//
// For each entry in src/data/history.ts it uses, in order: the entry's `image` (a Commons file
// name), else the first matching photo from a Commons search for `imageSearch`, else the free
// lead image of its Wikipedia article (`wiki`). Only public-domain,
// CC0, CC BY and CC BY-SA images are accepted. Photos are saved ~960px wide to
// assets/history/<id>.<ext>, and src/data/history-images.ts is regenerated with each photo's
// author, license and source page, which the app shows under the photo and in About & Credits.
//
// Run it again whenever you add an entry or change an `image`. Needs internet; Node 18+.
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'src/data/history.ts');
const OUT_DIR = join(ROOT, 'assets/history');
const OUT_TS = join(ROOT, 'src/data/history-images.ts');
const WIDTH = 960;
const API = 'https://en.wikipedia.org/w/api.php';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
// Wikimedia asks every tool to identify itself: https://meta.wikimedia.org/wiki/User-Agent_policy
const HEADERS = { 'User-Agent': 'JesusChristApp-image-fetch/1.0 (https://github.com/QunioSoyez/JesusChristApp)' };
const ALLOWED_LICENSE = /^(public domain|pd\b|cc0|cc[ -]by(-sa)?\b|attribution\b)/i;
const force = process.argv.includes('--force');

/** Pulls { id, wiki, image } out of history.ts without needing TypeScript. */
function readEntries() {
  const src = readFileSync(DATA, 'utf8');
  const start = src.indexOf('export const HISTORY');
  return src
    .slice(start)
    .split(/\n  \{\n/)
    .slice(1)
    .map((block) => ({
      id: block.match(/^\s*id: '([^']+)'/m)?.[1],
      wiki: block.match(/^\s*wiki: '([^']+)'/m)?.[1],
      image: block.match(/^\s*image: '([^']+)'/m)?.[1],
      imageSearch: block.match(/^\s*imageSearch: '([^']+)'/m)?.[1],
    }))
    .filter((e) => e.id && e.wiki);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, as = 'json') {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: HEADERS });
    if (res.ok) return as === 'json' ? res.json() : Buffer.from(await res.arrayBuffer());
    if ((res.status === 429 || res.status >= 500) && attempt < 5) {
      await sleep(2000 * attempt); // rate-limited or busy: wait and retry
      continue;
    }
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
}

const api = (params, base = API) =>
  get(`${base}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`);

/** Which Commons file each entry used last time (from the generated file), so a changed pick is re-downloaded. */
function previousFiles() {
  if (!existsSync(OUT_TS)) return {};
  const src = readFileSync(OUT_TS, 'utf8');
  const out = {};
  for (const m of src.matchAll(/^  ("[^"]+"): \{[\s\S]*?^    file: ("(?:[^"\\]|\\.)*"),/gm)) out[JSON.parse(m[1])] = JSON.parse(m[2]);
  return out;
}

/** First Commons search result for `query` that is a photo (JPEG) with an allowed license. */
async function searchImage(query) {
  const data = await api({ action: 'query', list: 'search', srsearch: query, srnamespace: '6', srlimit: '15' }, COMMONS_API);
  for (const hit of data.query?.search ?? []) {
    const file = hit.title.replace(/^File:/, '');
    if (!/\.jpe?g$/i.test(file)) continue;
    const info = await fileInfo(file);
    if (info && ALLOWED_LICENSE.test(info.license)) return file;
  }
  return undefined;
}

/** The article's free lead image file name, e.g. "Pilate stone.jpg". */
async function leadImage(article) {
  const data = await api({ action: 'query', prop: 'pageimages', piprop: 'name', pilicense: 'free', redirects: '1', titles: article });
  return data.query?.pages?.[0]?.pageimage?.replace(/_/g, ' ');
}

/** Download URL, size and license details for a Commons file. */
async function fileInfo(file) {
  const data = await api({
    action: 'query',
    prop: 'imageinfo',
    iiprop: 'url|size|extmetadata',
    iiurlwidth: String(WIDTH),
    titles: `File:${file}`,
  });
  const info = data.query?.pages?.[0]?.imageinfo?.[0];
  if (!info) return undefined;
  const meta = info.extmetadata ?? {};
  const plain = (html) =>
    String(html ?? '')
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#0?39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  return {
    url: info.thumburl ?? info.url,
    width: info.thumbwidth ?? info.width,
    height: info.thumbheight ?? info.height,
    pageUrl: info.descriptionurl,
    author: plain(meta.Artist?.value).slice(0, 160) || 'Unknown author',
    license: plain(meta.LicenseShortName?.value) || 'Unknown license',
    licenseUrl: meta.LicenseUrl?.value,
  };
}

const entries = readEntries();
const previous = previousFiles();
mkdirSync(OUT_DIR, { recursive: true });
const results = [];
let failed = 0;

for (const entry of entries) {
  const label = entry.id.padEnd(20);
  try {
    const file =
      entry.image ?? (entry.imageSearch ? await searchImage(entry.imageSearch) : undefined) ?? (await leadImage(entry.wiki));
    if (!file) throw new Error(`no free image found for "${entry.imageSearch ?? entry.wiki}" — set image: in history.ts`);
    const info = await fileInfo(file);
    if (!info) throw new Error(`Commons file not found: ${file}`);
    if (!ALLOWED_LICENSE.test(info.license)) throw new Error(`license "${info.license}" not allowed for ${file}`);

    const ext = (info.url.match(/\.(jpe?g|png|gif|webp)$/i)?.[1] ?? 'jpg').toLowerCase().replace('jpeg', 'jpg');
    const name = `${entry.id}.${ext}`;
    const path = join(OUT_DIR, name);
    // Drop an old copy with a different extension so only one file per entry is bundled.
    for (const f of readdirSync(OUT_DIR)) if (f.startsWith(`${entry.id}.`) && f !== name) unlinkSync(join(OUT_DIR, f));
    let note = 'kept';
    if (force || !existsSync(path) || previous[entry.id] !== file) {
      writeFileSync(path, await get(info.url, 'buffer'));
      note = 'downloaded';
      await sleep(500); // be gentle with Wikimedia
    }
    results.push({ id: entry.id, name, file, ...info });
    console.log(`ok    ${label} ${note.padEnd(10)} ${file}  [${info.license}]`);
  } catch (err) {
    failed++;
    console.log(`FAIL  ${label} ${err.message}`);
  }
}

const q = JSON.stringify;
const body = results
  .map(
    (r) => `  ${q(r.id)}: {
    source: require('../../assets/history/${r.name}'),
    width: ${r.width},
    height: ${r.height},
    file: ${q(r.file)},
    author: ${q(r.author)},
    license: ${q(r.license)},${r.licenseUrl ? `\n    licenseUrl: ${q(r.licenseUrl)},` : ''}
    pageUrl: ${q(r.pageUrl)},
  },`,
  )
  .join('\n');

writeFileSync(
  OUT_TS,
  `// Generated by scripts/fetch-history-images.mjs — do not edit by hand.
import type { ImageSourcePropType } from 'react-native';

export type HistoryImage = {
  source: ImageSourcePropType;
  width: number;
  height: number;
  /** Wikimedia Commons file name. */
  file: string;
  author: string;
  license: string;
  licenseUrl?: string;
  /** Commons page for the file (credit link). */
  pageUrl: string;
};

export const HISTORY_IMAGES: Partial<Record<string, HistoryImage>> = {
${body}
};
`,
);

console.log(`\n${results.length} of ${entries.length} photos ready in assets/history; credits written to src/data/history-images.ts.`);
if (failed) {
  console.log(`${failed} failed — those entries show a placeholder until fixed.`);
  process.exitCode = 1;
}
