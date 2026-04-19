import type { QuranRecord } from "../db";
import type { Chapter, ChapterId } from "../types/quran";

export function getSortedChapters(
  quranRecord?: QuranRecord,
): [string, Chapter][] {
  if (!quranRecord?.data?.chapters) return [];
  return Object.entries(quranRecord.data.chapters).sort(
    ([a], [b]) => Number(a) - Number(b),
  );
}

export function filterChaptersByName(
  chapters: [string, Chapter][],
  query: string,
): [string, Chapter][] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return chapters;

  return chapters.filter(([, chapter]) =>
    chapter.name_arabic.toLowerCase().includes(normalizedQuery),
  );
}

export function getTotalVerses(quranRecord?: QuranRecord): number {
  if (!quranRecord?.data?.chapters) return 0;

  return Object.values(quranRecord.data.chapters).reduce(
    (sum, chapter) => sum + chapter.verses_count,
    0,
  );
}

export function getChapterById(
  quranRecord?: QuranRecord,
  chapterId?: string,
): Chapter | undefined {
  if (!chapterId || !quranRecord?.data?.chapters) return undefined;
  return quranRecord.data.chapters[chapterId as ChapterId];
}

export function getChapterVerses(
  quranRecord?: QuranRecord,
  chapterId?: string,
  searchQuery = "",
): Array<{ verseNumber: number; text: string }> {
  if (!chapterId || !quranRecord?.data?.verses) return [];

  const normalizedQuery = searchQuery.trim().toLowerCase();

  return Object.entries(quranRecord.data.verses)
    .filter(([key]) => key.startsWith(`${chapterId}:`))
    .map(([key, text]) => ({
      verseNumber: Number(key.split(":")[1]),
      text,
    }))
    .filter((verse) =>
      !normalizedQuery
        ? true
        : verse.text.toLowerCase().includes(normalizedQuery),
    )
    .sort((a, b) => a.verseNumber - b.verseNumber);
}
