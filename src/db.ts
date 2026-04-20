import Dexie from "dexie";
import type { QuranData } from "./types/quran";

export interface QuranRecord {
  id: string;
  data: QuranData;
}

export const db = new Dexie("IhkamDB");

db.version(1).stores({
  quran: "id",
});

export const quranTable = db.table<QuranRecord, string>("quran");

async function ensureDbOpen() {
  if (!db.isOpen()) {
    await db.open();
  }
}

export async function initQuranData() {
  await ensureDbOpen();
  const existing = await quranTable.get("quran");
  if (existing) {
    return existing.data;
  }

  const url = new URL("/quran.json", import.meta.url);
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Unable to load quran.json");
  }

  const data = (await response.json()) as QuranData;
  await quranTable.put({ id: "quran", data });
  return data;
}

export async function getQuranData() {
  await ensureDbOpen();
  const record = await quranTable.get("quran");
  return record?.data ?? null;
}

export async function dropCurrentDb() {
  await db.delete();
  await db.open();
}
