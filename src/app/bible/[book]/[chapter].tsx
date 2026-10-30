import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Old single-chapter address (/bible/<book>/<chapter>?verse=N). The reader now shows whole books,
 * so this forwards to the book reader at the same chapter and verse.
 */
export default function ChapterRedirect() {
  const { book, chapter, verse } = useLocalSearchParams<{ book: string; chapter: string; verse?: string }>();
  return (
    <Redirect
      href={{ pathname: '/bible/[book]', params: verse ? { book, chapter, verse } : { book, chapter } }}
    />
  );
}
