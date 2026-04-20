import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const glyphPath = path.join(projectRoot, "public", "quran.json");
const unicodePath = path.join(projectRoot, "public", "quran_unicode.json");
const outputPath = path.join(projectRoot, "public", "quran_texts_both.json");

function assertSameWordFields(glyphWord, unicodeWord, key) {
  const fields = ["id", "surah", "ayah", "word", "location"];
  for (const field of fields) {
    if (glyphWord[field] !== unicodeWord[field]) {
      throw new Error(`Mismatch at ${key} for field "${field}"`);
    }
  }
}

async function mergeQuranTexts() {
  const [glyphRaw, unicodeRaw] = await Promise.all([
    readFile(glyphPath, "utf8"),
    readFile(unicodePath, "utf8"),
  ]);

  const glyphWords = JSON.parse(glyphRaw);
  const unicodeWords = JSON.parse(unicodeRaw);

  const glyphKeys = Object.keys(glyphWords);
  const unicodeKeys = Object.keys(unicodeWords);

  if (glyphKeys.length !== unicodeKeys.length) {
    throw new Error(
      `Different key counts: glyph=${glyphKeys.length}, unicode=${unicodeKeys.length}`,
    );
  }

  const merged = {};

  for (const key of glyphKeys) {
    const glyphWord = glyphWords[key];
    const unicodeWord = unicodeWords[key];

    if (!unicodeWord) {
      throw new Error(`Missing key "${key}" in unicode file`);
    }

    assertSameWordFields(glyphWord, unicodeWord, key);

    merged[key] = {
      id: glyphWord.id,
      surah: glyphWord.surah,
      ayah: glyphWord.ayah,
      word: glyphWord.word,
      location: glyphWord.location,
      textGlyph: glyphWord.text,
      textUnicode: unicodeWord.text,
    };
  }

  await writeFile(outputPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  console.log(`Created ${outputPath} with ${glyphKeys.length} entries.`);
}

mergeQuranTexts().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
