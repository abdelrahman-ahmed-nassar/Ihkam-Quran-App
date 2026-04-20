export type LocationKey = `${number}:${number}:${number}`;

export interface Word {

  id: number;

  surah: `${number}`;

  ayah: `${number}`;

  word: `${number}`;

  location: LocationKey;

  textGlyph: string; // glyph (QPC font char)

  textUnicode: string; // unicode Arabic text

}

export type WordsMap = {

  [key in LocationKey]: Word;

};