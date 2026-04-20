import Dexie from "dexie";
import type { QuranData } from "./types/quran";
import type { WordsMap } from "./types/quran-words";
import type { QuranLayout } from "./types/quran-layout";

export interface QuranRecord {
  id: string;
  chaptersData: QuranData;
}

export interface QuranWordsRecord {
  id: string;
  wordsData: WordsMap;
}

export interface QuranPagesRecord {
  id: string;
  pagesData: QuranLayout;
}

export const db = new Dexie("IhkamDB");

db.version(2).stores({
  quranChapters: "id",
  quranWords: "id",
  quranPages: "id",
});

export const quranChaptersTable = db.table<QuranRecord, string>(
  "quranChapters",
);
export const quranWordsTable = db.table<QuranWordsRecord, string>(
  "quranWords",
);


export const quranPagesTable = db.table<QuranPagesRecord, string>(
  "quranPages",
);

async function ensureDbOpen() {
  if (!db.isOpen()) {
    await db.open();
  }
}

export async function initQuranData() {
  await ensureDbOpen();
  const existing = await quranChaptersTable.get("quranChapters");
  if (existing) {
    return existing.chaptersData;
  }

  const url = new URL("/quran_chapters.json", import.meta.url);
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Unable to load quran_chapters.json");
  }

  const data = (await response.json()) as QuranData;
  await quranChaptersTable.put({ id: "quranChapters", chaptersData: data });
  return data;
}

export async function getQuranData() {
  await ensureDbOpen();
  const record = await quranChaptersTable.get("quranChapters");
  return record?.chaptersData ?? null;
}

export async function initQuranWordsData() {
  await ensureDbOpen();
  const existing = await quranWordsTable.get("quranWords");
  if (existing) {
    return existing.wordsData;
  }

  const url = new URL("/quran.json", import.meta.url);
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Unable to load quran.json");
  }

  const data = (await response.json()) as WordsMap;
  await quranWordsTable.put({ id: "quranWords", wordsData: data });
  return data;
}

export async function getQuranWordsData() {
  await ensureDbOpen();
  const record = await quranWordsTable.get("quranWords");
  return record?.wordsData ?? null;
}

export async function initQuranPagesData() {
  await ensureDbOpen();
  const existing = await quranPagesTable.get("quranPages");
  if (existing) {
    return existing.pagesData;
  }

  const url = new URL("/quran_pages.json", import.meta.url);
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Unable to load quran_pages.json");
  }

  const data = (await response.json()) as QuranLayout;
  await quranPagesTable.put({ id: "quranPages", pagesData: data });
  return data;
}

export async function getQuranPagesData() {
  await ensureDbOpen();
  const record = await quranPagesTable.get("quranPages");
  return record?.pagesData ?? null;
}

export async function dropCurrentDb() {
  await db.delete();
  await db.open();
}
