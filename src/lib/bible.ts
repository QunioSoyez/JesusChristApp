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

/** Returns the verses of one chapter, or undefined if the book/chapter doesn't exist. */
export function getChapter(slug: string, chapter: number): string[] | undefined {
  const loader = BOOK_LOADERS[slug];
  if (!loader) return undefined;
  let text = textCache.get(slug);
  if (!text) {
    text = loader();
    textCache.set(slug, text);
  }
  return text.chapters[chapter - 1];
}

export function formatRef(slug: string, chapter: number, verse?: number): string {
  const name = getBookInfo(slug)?.name ?? slug;
  return verse ? `${name} ${chapter}:${verse}` : `${name} ${chapter}`;
}

export function randomQuote(exclude?: Quote): Quote {
  if (QUOTES.length < 2) return QUOTES[0];
  let q: Quote;
  do q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  while (q === exclude);
  return q;
}

export { BOOKS };
