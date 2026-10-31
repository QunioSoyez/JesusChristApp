// Bible versions the reader can show, and the user's remembered choice.
//
// To add a version: add it to VERSIONS in scripts/build-data.mjs and run `npm run build-data`
// (that writes src/data/bible/<id>/), then add an entry to BIBLE_VERSIONS below and credit its
// source in src/data/credits.ts and CREDITS.md. A version in another language can set
// `bookNames` (and `chapterLabel`) so the Bible screens show book names in that language;
// the rest of the app stays in English.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export type BibleVersion = {
  id: string;
  abbr: string;
  name: string;
  description: string;
  /** Book names in this version's language, by book slug. Missing ones fall back to English. */
  bookNames?: Record<string, string>;
  /** Heading over each chapter in the reader (e.g. "Chapter 3", "Psalm 23"). */
  chapterLabel?: { chapter: string; psalm: string };
  /**
   * Hide empty verse slots instead of marking them "Not included". For versions whose verse
   * numbering differs slightly from the KJV's (e.g. Spanish Bibles), where the empty slots are
   * numbering differences rather than omitted text.
   */
  hideEmptyVerses?: boolean;
};

// Book names as printed in Spanish Reina-Valera Bibles.
const SPANISH_BOOK_NAMES: Record<string, string> = {
  genesis: 'Génesis', exodus: 'Éxodo', leviticus: 'Levítico', numbers: 'Números', deuteronomy: 'Deuteronomio',
  joshua: 'Josué', judges: 'Jueces', ruth: 'Rut', '1-samuel': '1 Samuel', '2-samuel': '2 Samuel',
  '1-kings': '1 Reyes', '2-kings': '2 Reyes', '1-chronicles': '1 Crónicas', '2-chronicles': '2 Crónicas',
  ezra: 'Esdras', nehemiah: 'Nehemías', esther: 'Ester', job: 'Job', psalms: 'Salmos', proverbs: 'Proverbios',
  ecclesiastes: 'Eclesiastés', 'song-of-solomon': 'Cantares', isaiah: 'Isaías', jeremiah: 'Jeremías',
  lamentations: 'Lamentaciones', ezekiel: 'Ezequiel', daniel: 'Daniel', hosea: 'Oseas', joel: 'Joel', amos: 'Amós',
  obadiah: 'Abdías', jonah: 'Jonás', micah: 'Miqueas', nahum: 'Nahúm', habakkuk: 'Habacuc', zephaniah: 'Sofonías',
  haggai: 'Hageo', zechariah: 'Zacarías', malachi: 'Malaquías',
  matthew: 'Mateo', mark: 'Marcos', luke: 'Lucas', john: 'Juan', acts: 'Hechos', romans: 'Romanos',
  '1-corinthians': '1 Corintios', '2-corinthians': '2 Corintios', galatians: 'Gálatas', ephesians: 'Efesios',
  philippians: 'Filipenses', colossians: 'Colosenses', '1-thessalonians': '1 Tesalonicenses',
  '2-thessalonians': '2 Tesalonicenses', '1-timothy': '1 Timoteo', '2-timothy': '2 Timoteo', titus: 'Tito',
  philemon: 'Filemón', hebrews: 'Hebreos', james: 'Santiago', '1-peter': '1 Pedro', '2-peter': '2 Pedro',
  '1-john': '1 Juan', '2-john': '2 Juan', '3-john': '3 Juan', jude: 'Judas', revelation: 'Apocalipsis',
};

export const BIBLE_VERSIONS: BibleVersion[] = [
  {
    id: 'kjv',
    abbr: 'KJV',
    name: 'King James Version',
    description: 'The classic 1611 English translation, in its 1769 standard text. Public domain.',
  },
  {
    id: 'bsb',
    abbr: 'BSB',
    name: 'Berean Standard Bible',
    description: 'A modern translation in clear, everyday English. Public domain.',
  },
  {
    id: 'rv1909',
    abbr: 'RV1909',
    name: 'Reina-Valera 1909',
    description: 'La Santa Biblia en español: the classic Spanish translation, 1909 revision. Public domain.',
    bookNames: SPANISH_BOOK_NAMES,
    chapterLabel: { chapter: 'Capítulo', psalm: 'Salmo' },
    hideEmptyVerses: true,
  },
];

/** A book's name in the given version's language (English if the version doesn't set one). */
export function bookName(book: { slug: string; name: string }, version: BibleVersion): string {
  return version.bookNames?.[book.slug] ?? book.name;
}

export const DEFAULT_VERSION_ID = 'kjv';
const STORAGE_KEY = 'bible.version';

export function getVersion(id: string | null | undefined): BibleVersion {
  return BIBLE_VERSIONS.find((v) => v.id === id) ?? BIBLE_VERSIONS.find((v) => v.id === DEFAULT_VERSION_ID)!;
}

// Shared across screens so a change on the version picker shows up immediately elsewhere.
let current: string | null | undefined; // undefined = not loaded yet, null = never chosen
const listeners = new Set<(id: string | null) => void>();

async function loadSaved(): Promise<string | null> {
  if (current !== undefined) return current;
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    current = saved && BIBLE_VERSIONS.some((v) => v.id === saved) ? saved : null;
  } catch {
    current = null; // storage unavailable: behave as if never chosen
  }
  return current;
}

/**
 * The remembered Bible version.
 * `chosen` is null until the user has picked one (first visit); `loading` is true while reading storage.
 */
export function useBibleVersion() {
  const [chosen, setChosen] = useState<string | null | undefined>(current);

  useEffect(() => {
    let alive = true;
    loadSaved().then((id) => alive && setChosen(id));
    const listener = (id: string | null) => setChosen(id);
    listeners.add(listener);
    return () => {
      alive = false;
      listeners.delete(listener);
    };
  }, []);

  const choose = useCallback(async (id: string) => {
    current = id;
    listeners.forEach((l) => l(id));
    try {
      await AsyncStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Not fatal: the choice still applies for this session.
    }
  }, []);

  return {
    loading: chosen === undefined,
    chosen: chosen ?? null,
    version: getVersion(chosen),
    choose,
  };
}
