import fs from "fs";
import path from "path";

type ChapterId = `${number}`;

interface Chapter {
  id: number;
  name_arabic: string;
  verses_count: number;
  startPage?: number;
}

type Chapters = Record<ChapterId, Chapter>;

const PAGES_DIR = "../public/mushaf"; // folder of page-XXX.json
const QURAN_PATH = "../public/quran.json";

// helper to extract surah from verseRange like "2:1-2:2"
function getSurahFromVerseRange(range: string): number | null {
  const match = range.match(/^(\d+):/);
  return match ? Number(match[1]) : null;
}

function main() {
  const quran = JSON.parse(fs.readFileSync(QURAN_PATH, "utf-8"));
  const chapters: Chapters = quran.chapters;

  const surahStartPages: Record<number, number> = {};

  for (let i = 1; i <= 604; i++) {
    const pageNumber = i.toString().padStart(3, "0");
    const filePath = path.join(PAGES_DIR, `page-${pageNumber}.json`);

    const page = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    for (const line of page.lines) {
      let surah: number | null = null;

      if (line.type === "surah-header") {
        surah = Number(line.surah);
      } else if (line.type === "text" && line.verseRange) {
        surah = getSurahFromVerseRange(line.verseRange);
      }

      if (surah && !(surah in surahStartPages)) {
        surahStartPages[surah] = i;
      }
    }
  }

  // inject into chapters
  for (const key in chapters) {
    const id = Number(key);
    if (surahStartPages[id]) {
      chapters[key].startPage = surahStartPages[id];
    }
  }

  fs.writeFileSync(QURAN_PATH, JSON.stringify(quran, null, 2), "utf-8");

  console.log("✅ startPage added to all chapters");
}

main();