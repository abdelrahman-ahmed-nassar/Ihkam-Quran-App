/**
 * rebuild-mushaf-pages.mjs
 *
 * Rebuilds all 604 mushaf JSON files so that each word is placed
 * on the correct line, as defined by public/qpc-v2-15-lines/pages.csv.
 *
 * How word IDs work in the CSV:
 *   Each Word object in the JSON has a `qpcV2` field that may contain
 *   one or more space-separated glyphs (e.g. "ﱄ ﱅ" = 2 glyphs).
 *   The CSV's first_word_id / last_word_id are 1-based sequential glyph
 *   indices counted across the entire Quran in reading order.
 *   Surah-header and basmala lines always have first=0 / last=0.
 *
 * Run from your project root:
 *   node rebuild-mushaf-pages.mjs
 */

import fs from "fs";
import path from "path";

// ─── Paths ────────────────────────────────────────────────────────────────────
const MUSHAF_DIR = path.resolve("public/mushaf");
const CSV_PATH = path.resolve("public/qpc-v2-15-lines/pages.csv");
const TOTAL_PAGES = 604;

// ─── 1. Parse CSV ─────────────────────────────────────────────────────────────

/**
 * @typedef {{ line: number, lineType: string, isCentered: boolean,
 *             firstWordId: number, lastWordId: number, surahNumber: number }} CsvLine
 */

/** @type {Map<number, CsvLine[]>} pageNum → sorted array of line defs */
const csvPageMap = new Map();

const csvRaw = fs.readFileSync(CSV_PATH, "utf-8");
const csvRows = csvRaw.trim().split("\n").slice(1); // skip header

for (const row of csvRows) {
  // Format: "1","1",surah_name,"1","0","0","1"
  // The line_type column is NOT quoted; all others are.
  const m = row.match(
    /^"(\d+)","(\d+)",([^,]+),"(\d+)","(\d+)","(\d+)","(\d+)"$/
  );
  if (!m) {
    console.warn("Could not parse CSV row:", row);
    continue;
  }
  const [, pageStr, lineStr, lineType, centeredStr, firstStr, lastStr, surahStr] = m;

  const pageNum = parseInt(pageStr, 10);
  const entry = {
    line: parseInt(lineStr, 10),
    lineType: lineType.trim(),
    isCentered: centeredStr === "1",
    firstWordId: parseInt(firstStr, 10),
    lastWordId: parseInt(lastStr, 10),
    surahNumber: parseInt(surahStr, 10),
  };

  if (!csvPageMap.has(pageNum)) csvPageMap.set(pageNum, []);
  csvPageMap.get(pageNum).push(entry);
}

// Sort each page's lines by line number (they should already be sorted)
for (const lines of csvPageMap.values()) {
  lines.sort((a, b) => a.line - b.line);
}

console.log(`✔ Parsed CSV — ${csvRows.length} rows across ${csvPageMap.size} pages`);

// ─── 2. Build global glyph-indexed word list ───────────────────────────────────
//
// We iterate every page in order, collect all Word objects from TextLines,
// and assign each word a [startGlyphId, endGlyphId] based on how many
// space-separated tokens its qpcV2 field contains.

/** @type {{ word: object, startGlyphId: number, endGlyphId: number }[]} */
const globalWords = [];
let currentGlyphId = 1;

for (let pageNum = 1; pageNum <= TOTAL_PAGES; pageNum++) {
  const pageStr = String(pageNum).padStart(3, "0");
  const pagePath = path.join(MUSHAF_DIR, `page-${pageStr}.json`);

  let pageData;
  try {
    pageData = JSON.parse(fs.readFileSync(pagePath, "utf-8"));
  } catch (e) {
    console.error(`Could not read ${pagePath}:`, e.message);
    process.exit(1);
  }

  for (const line of pageData.lines) {
    if (line.type !== "text" || !Array.isArray(line.words)) continue;

    for (const word of line.words) {
      const glyphCount = word.qpcV2
        ? word.qpcV2.trim().split(/\s+/).filter(Boolean).length
        : 1;

      globalWords.push({
        word,
        startGlyphId: currentGlyphId,
        endGlyphId: currentGlyphId + glyphCount - 1,
      });

      currentGlyphId += glyphCount;
    }
  }
}

const totalGlyphs = currentGlyphId - 1;
console.log(
  `✔ Indexed ${globalWords.length} word objects spanning ${totalGlyphs} glyphs`
);

// Build a direct map: glyphId → index in globalWords (for O(1) lookup)
// We only need startGlyphId since words don't split across lines.
const glyphStartToIdx = new Map();
for (let i = 0; i < globalWords.length; i++) {
  glyphStartToIdx.set(globalWords[i].startGlyphId, i);
}

/**
 * Returns all Word objects whose glyphs fall within [firstWordId, lastWordId].
 * Words are returned in their original reading order.
 */
function getWordsInRange(firstWordId, lastWordId) {
  const words = [];
  // Walk forward from firstWordId, collecting words until we exceed lastWordId
  let g = firstWordId;
  while (g <= lastWordId) {
    const idx = glyphStartToIdx.get(g);
    if (idx === undefined) {
      // No word starts at this glyph — advance one step
      g++;
      continue;
    }
    const entry = globalWords[idx];
    words.push(entry.word);
    g = entry.endGlyphId + 1;
  }
  return words;
}

// ─── 3. Rebuild every page ────────────────────────────────────────────────────

let rebuiltCount = 0;

for (let pageNum = 1; pageNum <= TOTAL_PAGES; pageNum++) {
  const pageStr = String(pageNum).padStart(3, "0");
  const pagePath = path.join(MUSHAF_DIR, `page-${pageStr}.json`);

  const csvLines = csvPageMap.get(pageNum);
  if (!csvLines) {
    console.warn(`No CSV data for page ${pageNum}, skipping.`);
    continue;
  }

  // Read original page for surah-header / basmala data
  const originalData = JSON.parse(fs.readFileSync(pagePath, "utf-8"));

  // Collect special lines from original (preserving their metadata)
  const originalHeaders = originalData.lines.filter(
    (l) => l.type === "surah-header"
  );
  const originalBasmalas = originalData.lines.filter(
    (l) => l.type === "basmala"
  );
  let headerIdx = 0;
  let basmalaIdx = 0;

  const newLines = [];

  for (const csvLine of csvLines) {
    const { line, lineType, surahNumber, firstWordId, lastWordId } = csvLine;

    // ── Surah Header ──────────────────────────────────────────────────────────
    if (lineType === "surah_name") {
      const orig = originalHeaders[headerIdx++];
      newLines.push({
        line,
        type: "surah-header",
        text: orig?.text ?? "",
        surah: String(surahNumber).padStart(3, "0"),
      });
      continue;
    }

    // ── Basmala ───────────────────────────────────────────────────────────────
    if (lineType === "basmallah") {
      const orig = originalBasmalas[basmalaIdx++];
      newLines.push({
        line,
        type: "basmala",
        qpcV2: orig?.qpcV2 ?? "",
        qpcV1: orig?.qpcV1 ?? "",
      });
      continue;
    }

    // ── Text (ayah) ───────────────────────────────────────────────────────────
    if (lineType === "ayah") {
      const words = getWordsInRange(firstWordId, lastWordId);

      // Build text: join each word's display text with spaces
      const text = words.map((w) => w.word).join(" ");

      // Build verseRange from first and last word locations ("surah:ayah:word")
      let verseRange = "";
      if (words.length > 0) {
        const [fSurah, fAyah] = words[0].location.split(":");
        const [lSurah, lAyah] = words[words.length - 1].location.split(":");
        verseRange = `${fSurah}:${fAyah}-${lSurah}:${lAyah}`;
      }

      newLines.push({
        line,
        type: "text",
        text,
        verseRange,
        words,
      });
      continue;
    }

    console.warn(
      `Unknown lineType "${lineType}" on page ${pageNum} line ${line} — skipping`
    );
  }

  const newPageData = { page: pageNum, lines: newLines };
  fs.writeFileSync(pagePath, JSON.stringify(newPageData, null, 2), "utf-8");
  rebuiltCount++;

  if (pageNum % 50 === 0 || pageNum === TOTAL_PAGES) {
    console.log(`  … rebuilt page ${pageStr}`);
  }
}

console.log(`\n✅ Done — rebuilt ${rebuiltCount} pages.`);
