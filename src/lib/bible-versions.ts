// Bible versions the reader can show, and the user's remembered choice.
//
// To add a version: put its data in src/data/<id>/ (same shape as the KJV data), add an entry to
// BIBLE_VERSIONS, and teach getBookText in src/lib/bible.ts to load it.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export type BibleVersion = {
  id: string;
  abbr: string;
  name: string;
  description: string;
};

export const BIBLE_VERSIONS: BibleVersion[] = [
  {
    id: 'kjv',
    abbr: 'KJV',
    name: 'King James Version',
    description: 'The classic 1611 English translation, in its 1769 standard text. Public domain.',
  },
];

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
