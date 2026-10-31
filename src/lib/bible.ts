import { BOOK_LOADERS, BOOKS, type BookInfo, type BookText } from '@/data/books';
import quotesData from '@/data/quotes.json';
import referencesData from '@/data/references.json';

export type Quote = { b: string; c: number; v: number; ref: string; t: string };
export type ReferenceVerse = { b: string; c: number; v: number; t: string; tags: string[] };
export type ReferenceCategory = { id: string; label: string };

export const TRANSLATION = 'KJV';

export const QUOTES = quotesData as Quote[];
export const REFERENCE_CATEGORIES = referencesData.categories as ReferenceCategory[];
export const REFERENCE_VERSES = referencesData.verses as ReferenceVerse[];

const bookMap = new Map(BOOKS.map((b) => [b.slug, b]));
const textCache = new Map<string, BookText>();

export function getBookInfo(slug: string): BookInfo | undefined {
  return bookMap.get(slug);
}

/**
 * Returns a whole book's text (chapters of verses) in a Bible version, or undefined if the book
 * doesn't exist. Unknown version ids fall back to the KJV. Some translations leave a verse empty
 * where they omit it (e.g. Matthew 17:21 in the BSB); verse numbering is the same in all versions.
 */
export function getBookText(slug: string, versionId = 'kjv'): BookText | undefined {
  const loaders = BOOK_LOADERS[versionId] ?? BOOK_LOADERS.kjv;
  const loader = loaders?.[slug];
  if (!loader) return undefined;
  const key = `${versionId}/${slug}`;
  let text = textCache.get(key);
  if (!text) {
    text = loader();
    textCache.set(key, text);
  }
  return text;
}

/** Book after (+1) or before (-1) this one in Bible order, if any. */
export function adjacentBook(slug: string, step: 1 | -1): BookInfo | undefined {
  const i = BOOKS.findIndex((b) => b.slug === slug);
  return i < 0 ? undefined : BOOKS[i + step];
}

export function formatRef(slug: string, chapter: number, verse?: number): string {
  // A single psalm is "Psalm 23", not "Psalms 23".
  const name = slug === 'psalms' ? 'Psalm' : (getBookInfo(slug)?.name ?? slug);
  return verse ? `${name} ${chapter}:${verse}` : `${name} ${chapter}`;
}

/** A passage like "John 2:1–11" (or "John 2:1" when there's no end verse). */
export function formatPassage(ref: { b: string; c: number; v: number; to?: number }): string {
  return `${formatRef(ref.b, ref.c, ref.v)}${ref.to ? `–${ref.to}` : ''}`;
}

export function randomQuote(exclude?: Quote): Quote {
  if (QUOTES.length < 2) return QUOTES[0];
  let q: Quote;
  do q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  while (q === exclude);
  return q;
}

export { BOOKS };
