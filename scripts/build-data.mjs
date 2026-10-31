// Builds the app's bundled Bible data from public-domain translations.
//
//   node scripts/build-data.mjs [folder containing KJV.json, BSB.json, ...]
//
// With no argument it downloads each version's JSON from scrollmapper/bible_databases.
// Writes:
//   src/data/bible/<version>/<slug>.json   one file per book: { name, chapters: string[][] }
//   src/data/books.ts                      book list + loaders for every version
//   src/data/references.json               NT verses that mention Jesus by name or title (KJV)
//   src/data/quotes.json                   uplifting verses for the home screen (KJV)
//
// To add a version: add it to VERSIONS below (the source file name in scrollmapper's
// formats/json folder), run this script, then add it to src/lib/bible-versions.ts.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_BASE = 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master/formats/json/';

// Versions to bundle. The first one also drives Jesus in Scripture and the home-screen quotes.
// Every version must have the same 66 books in the same order (checked below).
const VERSIONS = [
  { id: 'kjv', file: 'KJV.json' }, // King James Version (1769), public domain
  { id: 'bsb', file: 'BSB.json' }, // Berean Standard Bible, public domain since 2023
  // Reina-Valera 1909 (Spanish), public domain. Its verse numbering follows Spanish Bibles, so a
  // few KJV verse slots are empty (the app hides them for this version).
  { id: 'rv1909', file: 'SpaRV.json', fixDropCaps: true },
];

// Printed Reina-Valera Bibles set the first word of each chapter in capitals ("EN el principio",
// "Y FUERON acabados", "Y JOSUÉ, hijo de Nun"). The source keeps those capitals; turn them back
// into normal case. Only the first run of all-caps words in verse 1 of each chapter is changed
// (Psalm titles come first, so the run can be mid-verse). A word starting a sentence gets a
// capital; any other word is lowercased unless the text usually capitalizes it (a name like
// Josué or Jehová), judged by how often it appears each way in the rest of the version.
const CAPS_WORD = /^([¿¡(]*)([A-ZÁÉÍÓÚÑÜ]{2,})([,.;:!?)]*)$/;
const capitalize = (w) => w[0].toUpperCase() + w.slice(1);

function wordCounts(source) {
  const counts = new Map();
  for (const b of source.books)
    for (const ch of b.chapters)
      for (const v of ch.verses)
        for (const raw of v.text.split(/\s+/)) {
          const w = raw.replace(/^[¿¡("']+|[,.;:!?)"']+$/g, '');
          if (w && w !== w.toUpperCase()) counts.set(w, (counts.get(w) ?? 0) + 1);
        }
  return counts;
}

function fixDropCaps(text, counts) {
  const words = text.split(' ');
  const start = words.findIndex((w) => CAPS_WORD.test(w));
  if (start < 0) return text;
  for (let i = start; i < words.length; i++) {
    const m = words[i].match(CAPS_WORD);
    if (!m) break;
    const lower = m[2].toLowerCase();
    const sentenceStart = i === 0 || /[.!?:]\)?$/.test(words[i - 1]);
    const usuallyCapital = (counts.get(capitalize(lower)) ?? 0) > (counts.get(lower) ?? 0);
    words[i] = m[1] + (sentenceStart || usuallyCapital ? capitalize(lower) : lower) + m[3];
  }
  return words.join(' ');
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'src', 'data');
const bibleDir = path.join(dataDir, 'bible');

// Source names -> display names (the source uses roman numerals).
const RENAME = {
  'I Samuel': '1 Samuel', 'II Samuel': '2 Samuel',
  'I Kings': '1 Kings', 'II Kings': '2 Kings',
  'I Chronicles': '1 Chronicles', 'II Chronicles': '2 Chronicles',
  'I Corinthians': '1 Corinthians', 'II Corinthians': '2 Corinthians',
  'I Thessalonians': '1 Thessalonians', 'II Thessalonians': '2 Thessalonians',
  'I Timothy': '1 Timothy', 'II Timothy': '2 Timothy',
  'I Peter': '1 Peter', 'II Peter': '2 Peter',
  'I John': '1 John', 'II John': '2 John', 'III John': '3 John',
  'Revelation of John': 'Revelation',
};

// Names and titles of Jesus, matched in the New Testament only.
// Patterns are case-sensitive on purpose: the KJV capitalizes titles of
// Christ ("Son of man", "the Lamb", "the Word"), which keeps false hits out.
const CATEGORIES = [
  { id: 'name', label: 'Jesus / Christ', patterns: [/\bJesus\b/, /\bChrist\b/, /\bMessias\b/, /\bEmmanuel\b/, /\bNazarene\b/] },
  { id: 'son-of-man', label: 'Son of man', patterns: [/\bSon of man\b/] },
  { id: 'son-of-god', label: 'Son of God', patterns: [/\bSon of God\b/, /\bSon of the living God\b/, /\bSon of the Highest\b/, /\bSon of the Blessed\b/] },
  { id: 'son-of-david', label: 'Son of David', patterns: [/\bSon of David\b/] },
  { id: 'lamb', label: 'Lamb of God', patterns: [/\bLamb\b/] },
  { id: 'word', label: 'The Word', patterns: [/\bthe Word\b/, /\bThe Word of God\b/] },
  { id: 'i-am', label: '"I am" sayings', patterns: [/I am the bread of life/, /I am the light of the world/, /I am the door/, /I am the good shepherd/, /I am the resurrection/, /I am the way/, /I am the true vine/, /I am the vine/] },
  { id: 'king', label: 'King', patterns: [/\bKing of the Jews\b/, /\bKING OF THE JEWS\b/, /\bKing of kings\b/, /\bKING OF KINGS\b/, /\bKing of Israel\b/] },
  { id: 'other', label: 'Other titles', patterns: [/\bHoly One of God\b/, /\bAlpha and Omega\b/, /\bLion of the tribe of Juda\b/, /\bRabboni\b/, /\bthe good shepherd\b/, /\bbright and morning star\b/] },
];

// Uplifting verses for the home screen (book, chapter, first verse, last verse).
const QUOTES = [
  ['John', 3, 16], ['John', 14, 27], ['John', 16, 33], ['John', 8, 12], ['John', 10, 10],
  ['John', 11, 25], ['John', 14, 6], ['John', 15, 13], ['Matthew', 11, 28, 29], ['Matthew', 5, 14],
  ['Matthew', 28, 20], ['Matthew', 6, 33], ['Matthew', 19, 26], ['Matthew', 7, 7],
  ['Psalms', 23, 1], ['Psalms', 46, 1], ['Psalms', 27, 1], ['Psalms', 118, 24], ['Psalms', 119, 105],
  ['Psalms', 34, 18], ['Psalms', 30, 5], ['Proverbs', 3, 5, 6], ['Isaiah', 40, 31], ['Isaiah', 41, 10],
  ['Isaiah', 9, 6], ['Jeremiah', 29, 11], ['Lamentations', 3, 22, 23], ['Joshua', 1, 9],
  ['Romans', 8, 28], ['Romans', 8, 38, 39], ['Romans', 15, 13], ['Romans', 5, 8],
  ['2 Corinthians', 5, 17], ['2 Corinthians', 12, 9], ['Philippians', 4, 13], ['Philippians', 4, 6, 7],
  ['Galatians', 2, 20], ['Ephesians', 2, 8], ['Hebrews', 13, 8], ['1 John', 4, 19], ['1 John', 1, 9],
  ['1 Peter', 5, 7], ['Revelation', 21, 4], ['Revelation', 3, 20],
];

const slugify = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function loadSource(file) {
  const dir = process.argv[2];
  if (dir) return JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8').replace(/^\uFEFF/, ''));
  console.log(`Downloading ${SOURCE_BASE}${file}`);
  const res = await fetch(SOURCE_BASE + file);
  if (!res.ok) throw new Error(`Download of ${file} failed: ${res.status}`);
  return JSON.parse((await res.text()).replace(/^\uFEFF/, ''));
}

const sources = [];
for (const v of VERSIONS) {
  const source = await loadSource(v.file);
  if (source.books.length !== 66) throw new Error(`${v.id}: expected 66 books, got ${source.books.length}`);
  sources.push({ ...v, source });
}

fs.rmSync(bibleDir, { recursive: true, force: true });

// Extra versions are written first (just the per-book text); the primary version below also
// builds the book list, Jesus in Scripture, and quotes.
const primary = sources[0];
for (const { id, source, fixDropCaps: dropCaps } of sources.slice(1)) {
  const counts = dropCaps ? wordCounts(source) : undefined;
  const dir = path.join(bibleDir, id);
  fs.mkdirSync(dir, { recursive: true });
  source.books.forEach((b, i) => {
    const primaryBook = primary.source.books[i];
    if (b.name !== primaryBook.name) throw new Error(`${id}: book ${i + 1} is ${b.name}, expected ${primaryBook.name}`);
    const name = RENAME[b.name] ?? b.name;
    // Empty strings are kept: some translations omit verses (e.g. Matthew 17:21 in the BSB).
    const chapters = b.chapters.map((ch) =>
      ch.verses.map((v, k) => (counts && k === 0 ? fixDropCaps(v.text.trim(), counts) : v.text.trim())),
    );
    fs.writeFileSync(path.join(dir, `${slugify(name)}.json`), JSON.stringify({ name, chapters }));
  });
}

const source = primary.source;
const primaryDir = path.join(bibleDir, primary.id);
fs.mkdirSync(primaryDir, { recursive: true });

const books = [];
const byName = new Map();
const references = [];

source.books.forEach((b, i) => {
  const name = RENAME[b.name] ?? b.name;
  const slug = slugify(name);
  const testament = i < 39 ? 'OT' : 'NT';
  const chapters = b.chapters.map((ch) => ch.verses.map((v) => v.text.trim()));
  fs.writeFileSync(path.join(primaryDir, `${slug}.json`), JSON.stringify({ name, chapters }));
  books.push({ slug, name, testament, chapters: chapters.length });
  byName.set(name, { slug, chapters });

  if (testament !== 'NT') return;
  chapters.forEach((verses, c) =>
    verses.forEach((text, v) => {
      const tags = CATEGORIES.filter((cat) => cat.patterns.some((p) => p.test(text))).map((cat) => cat.id);
      if (tags.length) references.push({ b: slug, c: c + 1, v: v + 1, t: text, tags });
    }),
  );
});

const quotes = QUOTES.map(([book, c, v1, v2 = v1]) => {
  const entry = byName.get(book);
  if (!entry) throw new Error(`Unknown book in QUOTES: ${book}`);
  const verses = entry.chapters[c - 1]?.slice(v1 - 1, v2);
  if (!verses || verses.length !== v2 - v1 + 1) throw new Error(`Bad quote ref ${book} ${c}:${v1}`);
  // The source merges Psalm headings ("A Psalm of David.", "נ NUN.") into verse 1;
  // drop them so the home-screen quote reads cleanly.
  const t = verses
    .join(' ')
    .replace(/^[֐-׿]\s+[A-Z]+\.\s*/, '')
    .replace(/^(A Psalm|A Song|To the chief Musician)[^.]*\.\s*/, '');
  return { b: entry.slug, c, v: v1, ref: `${book} ${c}:${v1}${v2 > v1 ? `–${v2}` : ''}`, t };
});

fs.writeFileSync(
  path.join(dataDir, 'references.json'),
  JSON.stringify({ categories: CATEGORIES.map(({ id, label }) => ({ id, label })), verses: references }),
);
fs.writeFileSync(path.join(dataDir, 'quotes.json'), JSON.stringify(quotes, null, 1));

// Static require() calls so the bundler includes every version's files.
const loaderBlock = (id) =>
  books.map((b) => `    '${b.slug}': () => require('./bible/${id}/${b.slug}.json'),`).join('\n');
const loaders = sources.map(({ id }) => `  ${id}: {\n${loaderBlock(id)}\n  },`).join('\n');
fs.writeFileSync(
  path.join(dataDir, 'books.ts'),
  `// Generated by scripts/build-data.mjs — do not edit by hand.
export type Testament = 'OT' | 'NT';
export type BookInfo = { slug: string; name: string; testament: Testament; chapters: number };
export type BookText = { name: string; chapters: string[][] };

export const BOOKS: BookInfo[] = ${JSON.stringify(books, null, 2)};

/** Book loaders per Bible version id: BOOK_LOADERS[version][bookSlug](). */
export const BOOK_LOADERS: Record<string, Record<string, () => BookText>> = {
${loaders}
};
`,
);

const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, references.filter((r) => r.tags.includes(c.id)).length]));
console.log(`Versions: ${sources.map((v) => v.id).join(', ')}  Books: ${books.length}  Reference verses: ${references.length}  Quotes: ${quotes.length}`);
console.log(counts);
