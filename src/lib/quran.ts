import type { QuranRecord } from "../db";
import type { Chapter, ChapterId } from "../types/quran";

export function getSortedChapters(
  quranRecord?: QuranRecord,
): [string, Chapter][] {
  if (!quranRecord?.chaptersData?.chapters) return [];
  return Object.entries(quranRecord.chaptersData.chapters).sort(
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
  if (!quranRecord?.chaptersData?.chapters) return 0;

  return Object.values(quranRecord.chaptersData.chapters).reduce(
    (sum, chapter) => sum + chapter.verses_count,
    0,
  );
}

export function getChapterById(
  quranRecord?: QuranRecord,
  chapterId?: string,
): Chapter | undefined {
  if (!chapterId || !quranRecord?.chaptersData?.chapters) return undefined;
  return quranRecord.chaptersData.chapters[chapterId as ChapterId];
}
